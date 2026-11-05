// 「ワールド・ゲーム」の球体（3D）。すべてコードで組み立てる。
// 形は globe.ts の輪郭から、毎フレームの姿は globeState(t) から決まる。ヘックスの模型と同じ作法：
// 平らな陰影のローポリ、同じ地形の色、在庫は箱の数、荷は道の上を動く。

import * as THREE from 'three';
import { GLOBE_ROUTES, LANDS, NATIONS, isLand, type GlobeState } from '../model/globe';
import { rng } from '../model/hex';

const DEG = Math.PI / 180;
export const SEA = 1; // 海面の半径

/** 緯度・経度 → 単位球の点（経度 0 が +z、東が +x） */
export const geo = (lat: number, lon: number, r = 1) =>
  new THREE.Vector3(r * Math.cos(lat * DEG) * Math.sin(lon * DEG), r * Math.sin(lat * DEG), r * Math.cos(lat * DEG) * Math.cos(lon * DEG));
const toLatLon = (p: THREE.Vector3) => {
  const n = p.clone().normalize();
  return { lat: Math.asin(n.y) / DEG, lon: Math.atan2(n.x, n.z) / DEG };
};

// 値ノイズ（決まった値を返す。乱数の状態を持たない）
const hash = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let out = 0;
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++)
      for (let dz = 0; dz < 2; dz++)
        out += hash(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  return out;
}
const fbm = (p: THREE.Vector3, f: number) => noise3(p.x * f, p.y * f, p.z * f) * 0.6 + noise3(p.x * f * 2.3, p.y * f * 2.3, p.z * f * 2.3) * 0.4;

// 山脈（素材の 3 つの山脈に、少し足す）
const RANGES: { lat: number; lon: number; sl: number; so: number; h: number }[] = [
  { lat: 31, lon: 84, sl: 4.5, so: 16, h: 0.042 }, // 高い山脈（アジア）。細く、雪は峰だけ
  { lat: -16, lon: -72, sl: 33, so: 5, h: 0.045 }, // 南の長い山脈
  { lat: 47, lon: -113, sl: 19, so: 9, h: 0.032 }, // 北の山脈
  { lat: 46, lon: 10, sl: 3, so: 7, h: 0.022 },
  { lat: 63, lon: 15, sl: 6, so: 4, h: 0.018 },
  { lat: -2, lon: 36, sl: 6, so: 5, h: 0.016 },
];
const mountainAt = (lat: number, lon: number) => {
  let m = 0;
  for (const r of RANGES) m += r.h * Math.exp(-(((lat - r.lat) / r.sl) ** 2) - ((lon - r.lon) / r.so) ** 2);
  return m;
};

// 地形の色（ヘックスの模型と同じ、Wylls のクライアントの色）
const C = {
  grass: new THREE.Color('#7d9651'),
  grass2: new THREE.Color('#6d8546'),
  plains: new THREE.Color('#bfae6c'),
  desert: new THREE.Color('#c9b27a'),
  forest: new THREE.Color('#4d6a3b'),
  hills: new THREE.Color('#8e9a5c'),
  rock: new THREE.Color('#8a847a'),
  snow: new THREE.Color('#e4e8ea'),
  tundra: new THREE.Color('#9aa58c'),
  beach: new THREE.Color('#a99d72'),
  shelf: new THREE.Color('#3f7f80'),
  deep: new THREE.Color('#0c2430'),
  soil: new THREE.Color('#3b2c1e'),
};

/** 乾いた帯（模式図。砂漠に見せる場所） */
const dry = (lat: number, lon: number) =>
  (lat > 14 && lat < 33 && lon > -17 && lon < 62) || (lat > 20 && lat < 45 && lon > 62 && lon < 110 && lat > 36) || (lat < -19 && lat > -32 && lon > 118 && lon < 142) || (lat > 26 && lat < 37 && lon > -117 && lon < -104);

export type Globe3D = ReturnType<typeof buildGlobe>;

export function buildGlobe(opts: { rich: boolean }) {
  const root = new THREE.Group();
  const rand = rng(1117);

  // ---- 地形：細かい正二十面体を、陸は持ち上げ、海は沈める ----
  const detail = opts.rich ? 34 : 24;
  const ico = new THREE.IcosahedronGeometry(1, detail); // 面は独立（index なし）
  const pos = ico.getAttribute('position');
  const landCache = new Map<number, { land: boolean; h: number; lat: number; lon: number }>();
  const v = new THREE.Vector3();
  const info = (x: number, y: number, z: number) => {
    // 同じ点は同じ値に（面ごとに頂点が別でも、つなぎ目が割れないように）
    const k = Math.round((x + 2) * 2e4) * 1e10 + Math.round((y + 2) * 2e4) * 1e5 + Math.round((z + 2) * 2e4);
    let c = landCache.get(k);
    if (!c) {
      v.set(x, y, z);
      const { lat, lon } = toLatLon(v);
      const land = isLand(lon, lat);
      const n = fbm(v, 3.2);
      // 陸は海面より少し上に、ノイズと山脈で起伏を付ける。海は沈めて、浅いところと深いところを分ける
      const h = land ? SEA + 0.006 + n * 0.016 + mountainAt(lat, lon) : SEA - 0.006 - n * 0.016;
      c = { land, h, lat, lon };
      landCache.set(k, c);
    }
    return c;
  };
  const colors: number[] = [];
  const treeSpots: THREE.Vector3[] = [];
  const centroid = new THREE.Vector3();
  const tint = new THREE.Color();
  for (let f = 0; f < pos.count; f += 3) {
    const vs = [0, 1, 2].map((k) => info(pos.getX(f + k), pos.getY(f + k), pos.getZ(f + k)));
    vs.forEach((c, k) => {
      v.set(pos.getX(f + k), pos.getY(f + k), pos.getZ(f + k)).setLength(c.h);
      pos.setXYZ(f + k, v.x, v.y, v.z);
    });
    const lands = vs.filter((c) => c.land).length;
    centroid.set(0, 0, 0);
    for (let k = 0; k < 3; k++) centroid.add(v.set(pos.getX(f + k), pos.getY(f + k), pos.getZ(f + k)));
    centroid.multiplyScalar(1 / 3);
    const { lat, lon } = toLatLon(centroid);
    const h = centroid.length();
    const n = fbm(centroid, 5.5);
    if (lands === 0) {
      // 海底：岸に近いほど明るい（水面ごしに浅瀬が見える）
      tint.copy(C.deep).lerp(C.shelf, Math.max(0, Math.min(1, (h - (SEA - 0.022)) / 0.016)));
    } else if (lands < 3) {
      // 岸の斜面：砂と土のあいだの色（明るい崖が立たないように）
      tint.copy(C.beach).lerp(C.soil, lands === 1 ? 0.55 : 0.3);
    } else {
      const alt = h - SEA;
      const al = Math.abs(lat);
      if (alt > 0.046) tint.copy(C.snow);
      else if (alt > 0.03) tint.copy(C.rock);
      else if (al > 66) tint.copy(n > 0.5 ? C.snow : C.tundra);
      else if (al > 56) tint.copy(C.tundra).lerp(C.forest, n * 0.6);
      else if (dry(lat, lon)) tint.copy(n > 0.62 ? C.plains : C.desert);
      else if (n > 0.57) {
        tint.copy(C.forest);
        if (opts.rich ? rand() < 0.55 : rand() < 0.25) treeSpots.push(centroid.clone());
      } else if (alt > 0.024) tint.copy(C.hills);
      else tint.copy(n > 0.45 ? C.grass2 : C.grass);
    }
    // 面ごとに少しだけ明るさをゆらす（削り出したような面に）
    tint.offsetHSL(0, 0, (hash(f, 3, 7) - 0.5) * 0.035);
    for (let k = 0; k < 3; k++) colors.push(tint.r, tint.g, tint.b);
  }
  ico.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  ico.computeVertexNormals();
  const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92 });
  const terrain = new THREE.Mesh(ico, terrainMat);
  terrain.receiveShadow = true;
  root.add(terrain);

  // 水面：少し透けて浅瀬が見える。光をやわらかく返す
  const water = new THREE.Mesh(
    new THREE.SphereGeometry(SEA, 96, 64),
    new THREE.MeshStandardMaterial({ color: '#1c4b57', roughness: 0.52, metalness: 0.06, transparent: true, opacity: 0.8 }),
  );
  root.add(water);

  // 大気：縁だけ淡く光る
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { color: { value: new THREE.Color('#7fd8c4') }, strength: { value: 0.55 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; uniform float strength; varying vec3 vN; varying vec3 vV;
      void main(){ float f = clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0); float a = pow(f, 3.0) * strength; gl_FragColor = vec4(color * a, a); }`,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.085, 64, 48), atmoMat);
  root.add(atmo);
  // 前側の縁にも、ごく薄く
  const rimMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { color: { value: new THREE.Color('#9fe7d2') } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; varying vec3 vN; varying vec3 vV;
      void main(){ float f = clamp(1.0 - dot(vN, vV), 0.0, 1.0); float a = pow(f, 4.0) * 0.32; gl_FragColor = vec4(color * a, a); }`,
  });
  root.add(new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 48), rimMat));

  // 緯線・経線（ごく薄く。模式図であることを静かに示す）
  const grid: number[] = [];
  for (let lat = -60; lat <= 60; lat += 30)
    for (let lon = -180; lon < 180; lon += 4) {
      const a = geo(lat, lon, 1.004), b = geo(lat, lon + 4, 1.004);
      grid.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  for (let lon = -180; lon < 180; lon += 30)
    for (let lat = -84; lat < 84; lat += 4) {
      const a = geo(lat, lon, 1.004), b = geo(lat + 4, lon, 1.004);
      grid.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  root.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: '#cfe8dc', transparent: true, opacity: 0.07, depthWrite: false })));

  // ---- 森の木（とても小さい円錐） ----
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const m4 = new THREE.Matrix4();
  const s3 = new THREE.Vector3();
  const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(0.006, 0.02, 5, 1).translate(0, 0.01, 0), new THREE.MeshStandardMaterial({ color: '#2f4a28', roughness: 0.9, flatShading: true }), Math.max(1, treeSpots.length));
  trees.count = treeSpots.length;
  treeSpots.forEach((p, i) => {
    q.setFromUnitVectors(up, p.clone().normalize());
    const k = 0.7 + hash(i, 1, 2) * 0.7;
    m4.compose(p, q, s3.set(k, k, k));
    trees.setMatrixAt(i, m4);
  });
  trees.castShadow = true;
  root.add(trees);

  // ---- 6 つの集落：家の群れ、灯り、在庫の箱 ----
  const surface = (lat: number, lon: number) => {
    // 集落のまわりの地面の高さ（その点の頂点の高さに近い値）
    const p = geo(lat, lon);
    const { h } = info(p.x, p.y, p.z);
    return Math.max(SEA + 0.008, h);
  };
  const houseGeo = new THREE.BoxGeometry(0.012, 0.009, 0.012).translate(0, 0.0045, 0);
  const roofGeo = new THREE.ConeGeometry(0.0105, 0.009, 4, 1).rotateY(Math.PI / 4).translate(0, 0.0135, 0);
  const crateGeo = new THREE.BoxGeometry(0.0075, 0.0075, 0.0075).translate(0, 0.00375, 0);
  const walls = new THREE.MeshStandardMaterial({ color: '#d9d1bf', roughness: 0.85, flatShading: true, emissive: '#ffb25c', emissiveIntensity: 0.12 });
  const roofs = new THREE.MeshStandardMaterial({ color: '#b8492f', roughness: 0.7, flatShading: true });
  const crateMat = new THREE.MeshStandardMaterial({ color: '#c89a5a', roughness: 0.8, flatShading: true });
  const HOUSES = 7;
  const CRATES = 20; // 1 箱 = 5 単位。100 単位まで見える
  const houseMesh = new THREE.InstancedMesh(houseGeo, walls, NATIONS.length * HOUSES);
  const roofMesh = new THREE.InstancedMesh(roofGeo, roofs, NATIONS.length * HOUSES);
  const crates = new THREE.InstancedMesh(crateGeo, crateMat, NATIONS.length * CRATES);
  houseMesh.castShadow = roofMesh.castShadow = crates.castShadow = true;
  const frames: { pos: THREE.Vector3; q: THREE.Quaternion; east: THREE.Vector3; north: THREE.Vector3; normal: THREE.Vector3 }[] = [];
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(32, 32, 1, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,214,150,1)');
    gr.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const glows: THREE.Sprite[] = [];
  const rings: THREE.Mesh[] = [];
  NATIONS.forEach((n, ni) => {
    const normal = geo(n.lat, n.lon).normalize();
    const pos0 = normal.clone().multiplyScalar(surface(n.lat, n.lon));
    const qn = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const east = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
    const north = normal.clone().cross(east).normalize();
    frames.push({ pos: pos0, q: qn, east, north, normal });
    const r0 = rng(40 + ni);
    for (let i = 0; i < HOUSES; i++) {
      const a = (i / HOUSES) * Math.PI * 2 + r0() * 0.5;
      const d = i === 0 ? 0 : 0.012 + r0() * 0.012;
      const p = pos0.clone().addScaledVector(east, Math.cos(a) * d).addScaledVector(north, Math.sin(a) * d);
      const qi = qn.clone().multiply(new THREE.Quaternion().setFromAxisAngle(up, r0() * 6.28));
      const k = i === 0 ? 1.35 : 0.8 + r0() * 0.4;
      m4.compose(p, qi, s3.set(k, k, k));
      houseMesh.setMatrixAt(ni * HOUSES + i, m4);
      roofMesh.setMatrixAt(ni * HOUSES + i, m4);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    glow.position.copy(pos0.clone().addScaledVector(normal, 0.012));
    glow.scale.setScalar(0.09);
    glows.push(glow);
    root.add(glow);
    // 選んだ集落の輪
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.036, 0.041, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#3ef08c', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.copy(pos0.clone().addScaledVector(normal, 0.002));
    ring.quaternion.copy(qn);
    rings.push(ring);
    root.add(ring);
  });
  root.add(houseMesh, roofMesh, crates);

  // ---- 道：大円の弧を、距離に応じて浮かせる ----
  const arcPoint = (a: THREE.Vector3, b: THREE.Vector3, s: number, lift: number) => {
    const angle = a.angleTo(b);
    const sinA = Math.sin(angle);
    const p = a.clone().multiplyScalar(Math.sin((1 - s) * angle) / sinA).add(b.clone().multiplyScalar(Math.sin(s * angle) / sinA));
    return p.normalize().multiplyScalar(SEA + 0.02 + lift * Math.sin(Math.PI * s));
  };
  const arcs = GLOBE_ROUTES.map((r) => {
    const a = frames[r.from].normal, b = frames[r.to].normal;
    const lift = 0.06 + a.angleTo(b) * 0.09;
    const pts = Array.from({ length: 97 }, (_, i) => arcPoint(a, b, i / 96, lift));
    return { a, b, lift, pts };
  });
  const roadMat = new THREE.LineBasicMaterial({ color: '#e2c48f', transparent: true, opacity: 0.42, depthWrite: false });
  const roadHot = new THREE.LineBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const roads = arcs.map((arc) => {
    const g = new THREE.BufferGeometry().setFromPoints(arc.pts);
    const line = new THREE.Line(g, roadMat);
    root.add(line);
    // 荷の後ろに伸びる明るい尾（描く範囲だけを毎フレーム変える）
    const hot = new THREE.Line(g.clone(), roadHot);
    hot.geometry.setDrawRange(0, 0);
    root.add(hot);
    return { line, hot };
  });

  // ---- 荷：箱と灯り。道の上を、時刻どおりに動く ----
  const cargoGeo = new THREE.BoxGeometry(0.011, 0.011, 0.016); // 長い辺が進む向き（lookAt の +z）
  const cargoMat = new THREE.MeshStandardMaterial({ color: '#e7b768', roughness: 0.6, flatShading: true, emissive: '#ffb25c', emissiveIntensity: 0.55 });
  const cargo = GLOBE_ROUTES.map(() => {
    const g = new THREE.Group();
    const box = new THREE.Mesh(cargoGeo, cargoMat);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    glow.scale.setScalar(0.06);
    g.add(box, glow);
    g.visible = false;
    root.add(g);
    return g;
  });

  /** 状態に合わせる。selected は選んだ集落（なければ -1）、t は時刻（灯りのゆらぎに使う） */
  function update(st: GlobeState, selected: number, t: number) {
    // 在庫の箱：1 箱 5 単位を、集落の脇に積む
    NATIONS.forEach((_, ni) => {
      const f = frames[ni];
      const n = Math.min(CRATES, Math.round(st.stocks[ni] / 5));
      for (let i = 0; i < CRATES; i++) {
        if (i < n) {
          const layer = Math.floor(i / 6);
          const k = i % 6;
          const p = f.pos
            .clone()
            .addScaledVector(f.east, 0.034 + (k % 3) * 0.0082)
            .addScaledVector(f.north, -0.008 + Math.floor(k / 3) * 0.0082)
            .addScaledVector(f.normal, layer * 0.0076);
          m4.compose(p, f.q, s3.set(1, 1, 1));
        } else m4.makeScale(0, 0, 0);
        crates.setMatrixAt(ni * CRATES + i, m4);
      }
      const sel = ni === selected;
      (rings[ni].material as THREE.MeshBasicMaterial).opacity = sel ? 0.55 + 0.25 * Math.sin(t * 3) : 0;
      (glows[ni].material as THREE.SpriteMaterial).opacity = sel ? 0.85 : 0.5;
    });
    crates.instanceMatrix.needsUpdate = true;

    // 荷
    cargo.forEach((g) => (g.visible = false));
    roads.forEach((r) => r.hot.geometry.setDrawRange(0, 0));
    for (const sh of st.shipments) {
      const arc = arcs[sh.route];
      const g = cargo[sh.route];
      const p = arcPoint(arc.a, arc.b, sh.progress, arc.lift);
      const ahead = arcPoint(arc.a, arc.b, Math.min(1, sh.progress + 0.01), arc.lift);
      g.position.copy(p);
      g.up.copy(p).normalize();
      g.lookAt(ahead);
      g.visible = true;
      // 尾：荷の後ろ 18% を明るく
      const end = Math.round(sh.progress * 96);
      const start = Math.max(0, end - 18);
      roads[sh.route].hot.geometry.setDrawRange(start, Math.max(0, end - start + 1));
    }
  }

  return { root, update, frames, land: LANDS.length };
}
