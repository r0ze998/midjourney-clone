// 「ワールド・ゲーム」の球体（3D）。すべてコードで組み立てる。
// 形は globe.ts の輪郭から、毎フレームの姿は globeState(t) から決まる。ヘックスの模型と同じ作法：
// 平らな陰影のローポリ、同じ地形の色、在庫は箱の数、荷は道の上を動く。

import * as THREE from 'three';
import { GLOBE_EVENT_SPAN, GLOBE_ROUTES, LANDS, NATIONS, isLand, type GlobeState } from '../model/globe';
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
  plains: new THREE.Color('#aa9b6c'),
  desert: new THREE.Color('#b7a373'),
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

// 輪郭の線分までの距離。岸を海面に向けてなだらかに沈めるために使う。
// 度数を緯度で補正するので、高緯度の海岸もほぼ同じ幅に見える。
const coastSegments = LANDS.flatMap((poly) => poly.map(([x, y], i) => {
  const [x2, y2] = poly[(i + 1) % poly.length];
  return { x, y, x2, y2, mid: (x + x2) / 2, minX: Math.min(x, x2), maxX: Math.max(x, x2), minY: Math.min(y, y2), maxY: Math.max(y, y2) };
}));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const coastDistance = (lat: number, lon: number) => {
  let best = 8 * 8;
  const cos = Math.max(0.25, Math.cos(lat * DEG));
  for (const s of coastSegments) {
    if (lat < s.minY - 8 || lat > s.maxY + 8) continue;
    const shift = 360 * Math.round((lon - s.mid) / 360);
    if ((s.minX + shift - lon) * cos > 8 || (lon - s.maxX - shift) * cos > 8) continue;
    const ax = (s.x + shift - lon) * cos, ay = s.y - lat;
    const bx = (s.x2 + shift - lon) * cos, by = s.y2 - lat;
    const dx = bx - ax, dy = by - ay;
    const t = clamp01(-(ax * dx + ay * dy) / (dx * dx + dy * dy || 1));
    const px = ax + t * dx, py = ay + t * dy;
    best = Math.min(best, px * px + py * py);
  }
  return Math.sqrt(best);
};

// 乾燥地は矩形ではなく、ゆるい楕円と球面ノイズの等高線にする。
const DRY_REGIONS = [
  { lat: 22, lon: 3, ry: 9, rx: 20 }, // 北アフリカ西部
  { lat: 20, lon: 27, ry: 8, rx: 19 }, // 北アフリカ東部
  { lat: 24, lon: 48, ry: 9, rx: 18 }, // 西アジア
  { lat: 39, lon: 84, ry: 7, rx: 23 }, // 中央アジア
  { lat: -24, lon: 133, ry: 9, rx: 18 }, // 南東の大陸
  { lat: 32, lon: -111, ry: 8, rx: 15 }, // 北西の乾燥地
];
const dryness = (lat: number, lon: number, p: THREE.Vector3) => {
  const warp = (fbm(p, 8) - 0.5) * 0.32;
  let strongest = 0;
  for (const r of DRY_REGIONS) {
    const dx = ((lon - r.lon + 540) % 360 - 180) / r.rx;
    const dy = (lat - r.lat) / r.ry;
    strongest = Math.max(strongest, clamp01((1.18 - Math.hypot(dx, dy) + warp) / 0.34));
  }
  return strongest;
};

export type Globe3D = ReturnType<typeof buildGlobe>;

export function buildGlobe(opts: { rich: boolean }) {
  const root = new THREE.Group();
  const rand = rng(1117);

  // ---- 地形：細かい正二十面体を、陸は持ち上げ、海は沈める ----
  const detail = opts.rich ? 34 : 24;
  const ico = new THREE.IcosahedronGeometry(1, detail); // 面は独立（index なし）
  const pos = ico.getAttribute('position');
  const landCache = new Map<number, { land: boolean; h: number; shore: number }>();
  const v = new THREE.Vector3();
  const noisePoint = new THREE.Vector3();
  const info = (x: number, y: number, z: number) => {
    // 同じ点は同じ値に（面ごとに頂点が別でも、つなぎ目が割れないように）
    const k = Math.round((x + 2) * 2e4) * 1e10 + Math.round((y + 2) * 2e4) * 1e5 + Math.round((z + 2) * 2e4);
    let c = landCache.get(k);
    if (!c) {
      v.set(x, y, z);
      const { lat, lon } = toLatLon(v);
      // 広い波長のゆらぎだけを輪郭に足し、三角形ごとのギザギザを抑える。
      const sampleLat = lat + (fbm(v, 7) - 0.5) * 1.5;
      const sampleLon = lon + (fbm(noisePoint.copy(v).addScalar(1.7), 7) - 0.5) * 1.5 / Math.max(0.45, Math.cos(lat * DEG));
      const land = isLand(sampleLon, sampleLat);
      const shore = coastDistance(sampleLat, sampleLon);
      const n = fbm(v, 3.2);
      // 岸では水面を横切るように高さを連続させる。急な段差は水面下へ隠れる。
      const fade = clamp01(shore / 2.6);
      const h = land
        ? SEA - 0.002 + fade * (0.012 + n * 0.016 + mountainAt(lat, lon))
        : SEA - 0.002 - clamp01(shore / 4) * (0.006 + n * 0.016);
      c = { land, h, shore };
      landCache.set(k, c);
    }
    return c;
  };
  const colors: number[] = [];
  const treeSpots: THREE.Vector3[] = [];
  const centroid = new THREE.Vector3();
  const tint = new THREE.Color();
  const dryTint = new THREE.Color();
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
    const shore = (vs[0].shore + vs[1].shore + vs[2].shore) / 3;
    if (lands === 0) {
      // 海底：岸に近いほど明るい（水面ごしに浅瀬が見える）
      tint.copy(C.deep).lerp(C.shelf, 0.9 * (1 - clamp01(shore / 4)));
    } else if (lands < 3) {
      // 岸の斜面：砂と土のあいだの色（明るい崖が立たないように）
      tint.copy(C.beach).lerp(C.soil, lands === 1 ? 0.55 : 0.3);
    } else {
      const alt = h - SEA;
      const al = Math.abs(lat);
      const dry = dryness(lat, lon, noisePoint.copy(centroid).normalize());
      if (alt > 0.046) tint.copy(C.snow);
      else if (alt > 0.03) tint.copy(C.rock);
      else if (al > 66) tint.copy(n > 0.5 ? C.snow : C.tundra);
      else if (al > 56) tint.copy(C.tundra).lerp(C.forest, n * 0.6);
      else if (n > 0.57) {
        tint.copy(C.forest);
        if (dry < 0.3 && shore > 2.6 && (opts.rich ? rand() < 0.55 : rand() < 0.25)) treeSpots.push(centroid.clone());
      } else if (alt > 0.024) tint.copy(C.hills);
      else tint.copy(n > 0.45 ? C.grass2 : C.grass);
      dryTint.copy(C.plains).lerp(C.desert, clamp01((n - 0.25) * 1.6));
      tint.lerp(dryTint, dry * 0.9);
      tint.lerp(C.beach, 0.55 * (1 - clamp01(shore / 2.6)));
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
  const walls = new THREE.MeshStandardMaterial({ color: '#e6dfce', roughness: 0.85, flatShading: true, emissive: '#ffb25c', emissiveIntensity: 0.12 });
  const roofs = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true });
  const roofColors = ['#557344', '#4c8380', '#7e858e', '#bb9453', '#5a8b9b', '#b36a4a'].map((c) => new THREE.Color(c));
  const crateMat = new THREE.MeshStandardMaterial({ color: '#c89a5a', roughness: 0.8, flatShading: true });
  const HOUSES = 7;
  const CRATES = 20; // 1 箱 = 5 単位。100 単位まで見える
  const houseMesh = new THREE.InstancedMesh(houseGeo, walls, NATIONS.length * HOUSES);
  const roofMesh = new THREE.InstancedMesh(roofGeo, roofs, NATIONS.length * HOUSES);
  const crates = new THREE.InstancedMesh(crateGeo, crateMat, NATIONS.length * CRATES);
  houseMesh.castShadow = roofMesh.castShadow = crates.castShadow = true;
  const frames: { pos: THREE.Vector3; q: THREE.Quaternion; east: THREE.Vector3; north: THREE.Vector3; normal: THREE.Vector3 }[] = [];
  // 名前に対応する小さなランドマーク。地理や建築の再現ではなく模型上の目印。
  const landmarkMat = {
    pine: new THREE.MeshStandardMaterial({ color: '#345934', roughness: 0.95, flatShading: true }),
    stream: new THREE.MeshStandardMaterial({ color: '#5ca9b2', roughness: 0.42, metalness: 0.08, flatShading: true }),
    stone: new THREE.MeshStandardMaterial({ color: '#aaa59a', roughness: 0.95, flatShading: true }),
    wood: new THREE.MeshStandardMaterial({ color: '#9f794e', roughness: 0.88, flatShading: true }),
    ochre: new THREE.MeshStandardMaterial({ color: '#c6a46c', roughness: 0.9, flatShading: true }),
    beacon: new THREE.MeshStandardMaterial({ color: '#e4d7b9', roughness: 0.8, flatShading: true, emissive: '#ffc976', emissiveIntensity: 0.18 }),
    clay: new THREE.MeshStandardMaterial({ color: '#ae674b', roughness: 0.88, flatShading: true }),
  };
  const windmillRotors: THREE.Group[] = [];
  const addBox = (group: THREE.Group, x: number, z: number, w: number, d: number, h: number, mat: THREE.Material, y = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    group.add(mesh);
  };
  const landmark = (ni: number, pos0: THREE.Vector3, normal: THREE.Vector3, qn: THREE.Quaternion) => {
    const group = new THREE.Group();
    group.position.copy(pos0).addScaledVector(normal, 0.003);
    group.quaternion.copy(qn);
    group.scale.setScalar(1.28);
    root.add(group);
    if (ni === 0) { // Woodland: 一段高い針葉樹の群れ
      for (const [x, z, h] of [[-0.034, -0.014, 0.038], [-0.04, 0.018, 0.031], [0.033, 0.026, 0.034]]) {
        const tree = new THREE.Mesh(new THREE.ConeGeometry(0.010, h, 5), landmarkMat.pine);
        tree.position.set(x, h / 2, z);
        group.add(tree);
      }
    } else if (ni === 1) { // Riverside: 流れと渡し橋
      addBox(group, -0.035, 0, 0.009, 0.077, 0.0007, landmarkMat.stream);
      addBox(group, -0.035, 0.004, 0.027, 0.006, 0.004, landmarkMat.wood, 0.003);
    } else if (ni === 2) { // Highland: 石の段と見張り塔
      addBox(group, -0.031, -0.006, 0.032, 0.028, 0.008, landmarkMat.stone);
      addBox(group, -0.031, -0.006, 0.017, 0.017, 0.043, landmarkMat.stone, 0.008);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.012, 4), landmarkMat.clay);
      cap.position.set(-0.031, 0.057, -0.006);
      cap.rotation.y = Math.PI / 4;
      group.add(cap);
    } else if (ni === 3) { // Grassland: 風車の羽根
      addBox(group, 0.034, 0.008, 0.012, 0.012, 0.04, landmarkMat.ochre);
      const rotor = new THREE.Group();
      rotor.position.set(0.034, 0.044, 0.008);
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.0015, 0.026), landmarkMat.beacon);
        blade.position.z = 0.016;
        const arm = new THREE.Group();
        arm.rotation.y = (i * Math.PI) / 2;
        arm.add(blade);
        rotor.add(arm);
      }
      rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 4), landmarkMat.wood));
      group.add(rotor);
      windmillRotors.push(rotor);
    } else if (ni === 4) { // Coastland: 灯台と桟橋
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.010, 0.047, 7), landmarkMat.beacon);
      tower.position.set(-0.033, 0.0235, 0.008);
      group.add(tower);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.009, 7), landmarkMat.stream);
      top.position.set(-0.033, 0.052, 0.008);
      group.add(top);
      addBox(group, 0.029, -0.01, 0.013, 0.048, 0.005, landmarkMat.wood);
    } else { // Southland: 赤土の塔と日除け
      for (const [x, z, h] of [[-0.033, -0.008, 0.034], [-0.023, 0.018, 0.026], [0.036, 0.008, 0.035]]) {
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.009, h, 5), landmarkMat.clay);
        spire.position.set(x, h / 2, z);
        group.add(spire);
      }
      addBox(group, 0.006, -0.028, 0.033, 0.013, 0.005, landmarkMat.ochre, 0.021);
    }
  };
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
  const eventRings: THREE.Mesh[] = [];
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
      const k = i === 0 ? 1.65 : 1.02 + r0() * 0.45;
      m4.compose(p, qi, s3.set(k, k, k));
      houseMesh.setMatrixAt(ni * HOUSES + i, m4);
      roofMesh.setMatrixAt(ni * HOUSES + i, m4);
      roofMesh.setColorAt(ni * HOUSES + i, roofColors[ni]);
    }
    landmark(ni, pos0, normal, qn);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
    glow.position.copy(pos0.clone().addScaledVector(normal, 0.012));
    glow.scale.setScalar(0.08);
    glows.push(glow);
    root.add(glow);
    // 選んだ集落の輪
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.064, 0.068, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#3ef08c', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.copy(pos0.clone().addScaledVector(normal, 0.002));
    ring.quaternion.copy(qn);
    rings.push(ring);
    root.add(ring);
    const eventRing = new THREE.Mesh(
      new THREE.RingGeometry(0.073, 0.078, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#ffc976', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    eventRing.position.copy(pos0.clone().addScaledVector(normal, 0.006));
    eventRing.quaternion.copy(qn);
    eventRing.visible = false;
    eventRings.push(eventRing);
    root.add(eventRing);
  });
  roofMesh.instanceColor!.needsUpdate = true;
  root.add(houseMesh, roofMesh, crates);
  // 箱は在庫が変わった時だけ行列を差し替える。毎フレーム 120 個の Vector3 を作らない。
  const crateMatrices = frames.map((f) => Array.from({ length: CRATES }, (_, i) => {
    const layer = Math.floor(i / 6);
    const k = i % 6;
    const p = f.pos.clone()
      .addScaledVector(f.east, 0.034 + (k % 3) * 0.0082)
      .addScaledVector(f.north, -0.008 + Math.floor(k / 3) * 0.0082)
      .addScaledVector(f.normal, layer * 0.0076);
    return new THREE.Matrix4().compose(p, f.q, new THREE.Vector3(1, 1, 1));
  }));
  const hiddenCrate = new THREE.Matrix4().makeScale(0, 0, 0);
  const visibleCrates = NATIONS.map(() => -1);

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
  const cargoGeo = new THREE.BoxGeometry(0.014, 0.014, 0.021); // 長い辺が進む向き（lookAt の +z）
  const cargoMat = new THREE.MeshStandardMaterial({ color: '#e7b768', roughness: 0.6, flatShading: true, emissive: '#ffb25c', emissiveIntensity: 0.55 });
  const cargo = GLOBE_ROUTES.map(() => {
    const g = new THREE.Group();
    const box = new THREE.Mesh(cargoGeo, cargoMat);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    glow.scale.setScalar(0.078);
    g.add(box, glow);
    g.visible = false;
    root.add(g);
    return g;
  });

  /** 状態に合わせる。selected は選んだ集落（なければ -1）、t は時刻（灯りのゆらぎに使う） */
  function update(st: GlobeState, selected: number, t: number) {
    // 在庫の箱：1 箱 5 単位を、集落の脇に積む
    let cratesChanged = false;
    NATIONS.forEach((_, ni) => {
      const n = Math.min(CRATES, Math.round(st.stocks[ni] / 5));
      if (n !== visibleCrates[ni]) {
        for (let i = 0; i < CRATES; i++)
          crates.setMatrixAt(ni * CRATES + i, i < n ? crateMatrices[ni][i] : hiddenCrate);
        visibleCrates[ni] = n;
        cratesChanged = true;
      }
      const sel = ni === selected;
      (rings[ni].material as THREE.MeshBasicMaterial).opacity = sel ? 0.32 + 0.1 * Math.sin(t * 3) : 0;
      (glows[ni].material as THREE.SpriteMaterial).opacity = sel ? 0.52 : 0.36;
      glows[ni].scale.setScalar(sel ? 0.065 : 0.08);
    });
    if (cratesChanged) crates.instanceMatrix.needsUpdate = true;
    windmillRotors.forEach((rotor) => { rotor.rotation.y = t * 0.45; });

    // 出発と到着は、globeState の時刻から作られたイベントだけで光らせる。
    const eventAge = NATIONS.map(() => Infinity);
    const eventKind: ('depart' | 'arrive')[] = NATIONS.map(() => 'depart');
    for (const e of st.events) {
      const endpoint = e.kind === 'depart' ? GLOBE_ROUTES[e.route].from : GLOBE_ROUTES[e.route].to;
      if (e.age < eventAge[endpoint]) {
        eventAge[endpoint] = e.age;
        eventKind[endpoint] = e.kind;
      }
    }
    eventRings.forEach((ring, ni) => {
      const age = eventAge[ni];
      ring.visible = age < GLOBE_EVENT_SPAN;
      if (!ring.visible) return;
      ring.scale.setScalar(0.82 + 0.65 * age / GLOBE_EVENT_SPAN);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.color.set(eventKind[ni] === 'depart' ? '#ffc976' : '#67e4b2');
      mat.opacity = 0.7 * (1 - age / GLOBE_EVENT_SPAN);
      (glows[ni].material as THREE.SpriteMaterial).opacity = 0.65;
    });

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
