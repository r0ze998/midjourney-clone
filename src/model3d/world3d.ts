// Wylls の世界の模型（3D）。すべてコードで組み立てる。形と位置は world.ts の見本の世界から、
// 毎フレームの姿は state(turn) から決まる。手で付けた動きはない（teardown の「入力は 1 つ」）。
//
// 座標：ヘックスの半径を 1 とした x（右）・z（手前）・y（上）。軸座標 (q, r) の中心は (√3·(q + r/2), 1.5·r)。

import * as THREE from 'three';
import { DIRS, R as R2D, TOP_LIFT, FLATTEN, distance, disc, rng, type Hex } from '../model/hex';
import {
  DEPOTS,
  FENCE,
  RADIUS,
  ROUTES,
  SETTLEMENTS,
  TILES,
  TOWERS,
  ownerAt,
  settlement,
  tileAt,
  type Kind,
  type Terrain,
} from '../model/world';
import type { ModelState } from '../model/state';

export const SQ3 = Math.sqrt(3);
export const centerXZ = (q: number, r: number): [number, number] => [SQ3 * (q + r / 2), 1.5 * r];

// Wylls のクライアントの地形の色（map/sprites.mjs の FLAT）
const TERRAIN_COLOR: Record<Terrain, [string, string]> = {
  grassland: ['#7d9651', '#6d8546'],
  plains: ['#bfae6c', '#a8985c'],
  forest: ['#4d6a3b', '#3c5530'],
  hills: ['#8e9a5c', '#737d49'],
  mountain: ['#8a847a', '#6c675f'],
  water: ['#467f8c', '#3a6c78'],
};
const TERRAIN_HEIGHT: Record<Terrain, number> = {
  water: 0.16,
  plains: 0.34,
  grassland: 0.36,
  forest: 0.38,
  hills: 0.6,
  mountain: 0.74,
};

export const PALETTE = {
  human: new THREE.Color('#e0704f'),
  humanRoof: new THREE.Color('#b8492f'),
  ai: new THREE.Color('#9b7bff'),
  aiRoof: new THREE.Color('#5d4bb8'),
  warm: new THREE.Color('#ffb25c'),
  signal: new THREE.Color('#3ef08c'),
  road: new THREE.Color('#c8a679'),
  soil: new THREE.Color('#3b2c1e'),
  wood: new THREE.Color('#6b4a2b'),
  wall: new THREE.Color('#d9d1bf'),
  cargo: { food: new THREE.Color('#d9b44a'), ore: new THREE.Color('#9aa1a8'), wood: new THREE.Color('#a8743f') },
};

/** タイルの上面の高さ */
export function topY(q: number, r: number): number {
  const t = tileAt(q, r);
  if (!t) return 0;
  return TERRAIN_HEIGHT[t.terrain] + (t.variant - 2) * 0.015;
}

/** state.ts の 2D 座標（タイル画像の px）を、3D の x・z に直す */
export const from2D = (x: number, y: number): [number, number] => [x / R2D, (y + TOP_LIFT) / (R2D * FLATTEN)];

/** 任意の点の地面の高さ：近いマスの上面の高さを距離で混ぜる */
export function groundAt(x: number, z: number): number {
  const r = z / 1.5;
  const q = x / SQ3 - r / 2;
  let sum = 0;
  let wsum = 0;
  for (const dq of [-1, 0, 1])
    for (const dr of [-1, 0, 1]) {
      const qq = Math.round(q) + dq;
      const rr = Math.round(r) + dr;
      if (!tileAt(qq, rr)) continue;
      const [cx, cz] = centerXZ(qq, rr);
      const d = Math.hypot(cx - x, cz - z);
      const w = Math.max(0, 1.25 - d) ** 2;
      sum += topY(qq, rr) * w;
      wsum += w;
    }
  return wsum ? sum / wsum : 0;
}

export type Group = 'base' | 'logistics' | 'defense' | 'ai';
type Tracked = { mat: THREE.Material & { color?: THREE.Color; opacity: number }; group: Group; base: THREE.Color | null; opacity: number };

export type Look = {
  layers: { logistics: number; defense: number; ai: number };
  verify: number;
  dim: number;
  turn: number;
};

function radialTexture(inner: string, outer: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  gr.addColorStop(0, inner);
  gr.addColorStop(1, outer);
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type World3D = ReturnType<typeof buildWorld>;

export function buildWorld(opts: { rich: boolean }) {
  const root = new THREE.Group();
  const tracked: Tracked[] = [];
  const track = <M extends THREE.Material>(mat: M, group: Group): M => {
    const m = mat as unknown as Tracked['mat'];
    tracked.push({ mat: m, group, base: m.color ? m.color.clone() : null, opacity: m.opacity });
    return mat;
  };
  const rand = rng(998);

  // ---- 地形：土の柱と、地形の色の上面 ----
  const prism = new THREE.CylinderGeometry(0.985, 0.985, 1, 6, 1);
  prism.translate(0, 0.5, 0);
  const cap = new THREE.CylinderGeometry(0.985, 0.985, 0.06, 6, 1);
  cap.translate(0, -0.03, 0);
  const soilMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.soil, roughness: 1, flatShading: true }), 'base');
  const capMat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, flatShading: true }), 'base');
  const soil = new THREE.InstancedMesh(prism, soilMat, TILES.length);
  const caps = new THREE.InstancedMesh(cap, capMat, TILES.length);
  soil.receiveShadow = caps.receiveShadow = true;
  caps.castShadow = false;
  const m4 = new THREE.Matrix4();
  const capBase: THREE.Color[] = [];
  TILES.forEach((t, i) => {
    const [x, z] = centerXZ(t.q, t.r);
    const h = topY(t.q, t.r);
    m4.makeScale(1, h - 0.06, 1).setPosition(x, 0, z);
    soil.setMatrixAt(i, m4);
    m4.makeTranslation(x, h, z);
    caps.setMatrixAt(i, m4);
    const [a, b] = TERRAIN_COLOR[t.terrain];
    const col = new THREE.Color(t.variant === 2 ? b : a);
    capBase.push(col);
    caps.setColorAt(i, col);
  });
  root.add(soil, caps);

  // 水面：少し低く、光を返す
  const waterTiles = TILES.filter((t) => t.terrain === 'water');
  const waterMat = track(new THREE.MeshStandardMaterial({ color: '#3a7d8f', roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.9 }), 'base');
  const water = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.93, 0.93, 0.02, 6, 1), waterMat, waterTiles.length);
  waterTiles.forEach((t, i) => {
    const [x, z] = centerXZ(t.q, t.r);
    water.setMatrixAt(i, m4.makeTranslation(x, topY(t.q, t.r) + 0.012, z));
  });
  root.add(water);

  // 森の木・丘のこぶ・山
  const treeSpots: [number, number, number, number][] = [];
  const moundSpots: [number, number, number][] = [];
  const peakSpots: [number, number, number, number][] = [];
  const busy = new Set([...SETTLEMENTS, ...DEPOTS, ...TOWERS].map((s) => `${s.hex[0]},${s.hex[1]}`));
  for (const t of TILES) {
    const [x, z] = centerXZ(t.q, t.r);
    const y = topY(t.q, t.r);
    const k = `${t.q},${t.r}`;
    if (t.terrain === 'forest') {
      const n = opts.rich ? 7 : 4;
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2;
        const d = 0.15 + rand() * 0.62;
        treeSpots.push([x + Math.cos(a) * d, y, z + Math.sin(a) * d, 0.75 + rand() * 0.5]);
      }
    } else if (t.terrain === 'grassland' && !busy.has(k) && rand() < 0.45) {
      treeSpots.push([x + (rand() - 0.5) * 1.1, y, z + (rand() - 0.5) * 1.1, 0.7 + rand() * 0.3]);
    } else if (t.terrain === 'hills') {
      moundSpots.push([x + (rand() - 0.5) * 0.3, y, z + (rand() - 0.5) * 0.3]);
    } else if (t.terrain === 'mountain') {
      peakSpots.push([x, y, z, 1]);
      peakSpots.push([x + 0.42, y, z + 0.25, 0.62]);
    }
  }
  const treeMat = track(new THREE.MeshStandardMaterial({ color: '#36532e', roughness: 0.9, flatShading: true }), 'base');
  const trees = new THREE.InstancedMesh(new THREE.ConeGeometry(0.13, 0.38, 6, 1).translate(0, 0.19, 0), treeMat, treeSpots.length);
  treeSpots.forEach(([x, y, z, s], i) => trees.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(x, y, z)));
  trees.castShadow = true;
  const moundMat = track(new THREE.MeshStandardMaterial({ color: '#7d8a52', roughness: 1, flatShading: true }), 'base');
  const mounds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.42, 1), moundMat, moundSpots.length);
  moundSpots.forEach(([x, y, z], i) => mounds.setMatrixAt(i, m4.makeTranslation(x, y, z)));
  const peakMat = track(new THREE.MeshStandardMaterial({ color: '#77716a', roughness: 0.95, flatShading: true }), 'base');
  const snowMat = track(new THREE.MeshStandardMaterial({ color: '#e7e9ee', roughness: 0.8, flatShading: true }), 'base');
  const peaks = new THREE.InstancedMesh(new THREE.ConeGeometry(0.62, 1.05, 5, 1).translate(0, 0.52, 0), peakMat, peakSpots.length);
  const snows = new THREE.InstancedMesh(new THREE.ConeGeometry(0.22, 0.36, 5, 1).translate(0, 0.87, 0), snowMat, peakSpots.length);
  peakSpots.forEach(([x, y, z, s], i) => {
    m4.makeScale(s, s, s).setPosition(x, y, z);
    peaks.setMatrixAt(i, m4);
    snows.setMatrixAt(i, m4);
  });
  peaks.castShadow = mounds.castShadow = true;
  root.add(trees, mounds, peaks, snows);

  // ---- 村：家並み（屋根の色で人とAI）と柵の輪 ----
  const houses: { x: number; y: number; z: number; s: number; rot: number; kind: Kind }[] = [];
  for (const s of SETTLEMENTS) {
    const [cx, cz] = centerXZ(...s.hex);
    const y = topY(...s.hex);
    const n = s.size === 'city' ? 13 : s.size === 'town' ? 9 : 5;
    const r0 = rng(s.id.length * 131 + s.hex[0] * 17 + s.hex[1]);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r0() * 0.4;
      const d = i === 0 ? 0 : 0.34 + r0() * (s.size === 'hamlet' ? 0.22 : 0.36);
      houses.push({ x: cx + Math.cos(a) * d, y, z: cz + Math.sin(a) * d, s: (i === 0 ? 1.9 : 1.2 + r0() * 0.45) * (s.size === 'city' ? 1.1 : 1), rot: r0() * Math.PI, kind: s.kind });
    }
  }
  const houseGeo = new THREE.BoxGeometry(0.17, 0.12, 0.13).translate(0, 0.06, 0);
  const roofGeo = new THREE.ConeGeometry(0.135, 0.11, 4, 1).rotateY(Math.PI / 4).translate(0, 0.175, 0);
  const wallMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.wall, roughness: 0.85, flatShading: true, emissive: '#ffb25c', emissiveIntensity: 0.08 }), 'base');
  const houseMesh = new THREE.InstancedMesh(houseGeo, wallMat, houses.length);
  const roofHuman = track(new THREE.MeshStandardMaterial({ color: PALETTE.humanRoof, roughness: 0.7, flatShading: true }), 'base');
  const roofAi = track(new THREE.MeshStandardMaterial({ color: PALETTE.aiRoof, roughness: 0.55, flatShading: true, emissive: PALETTE.ai, emissiveIntensity: 0.35 }), 'ai');
  const hh = houses.filter((h) => h.kind === 'human');
  const ha = houses.filter((h) => h.kind === 'ai');
  const roofsH = new THREE.InstancedMesh(roofGeo, roofHuman, hh.length);
  const roofsA = new THREE.InstancedMesh(roofGeo, roofAi, ha.length);
  const q4 = new THREE.Quaternion();
  const put = (mesh: THREE.InstancedMesh, i: number, h: (typeof houses)[number]) => {
    q4.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h.rot);
    m4.compose(new THREE.Vector3(h.x, h.y, h.z), q4, new THREE.Vector3(h.s, h.s, h.s));
    mesh.setMatrixAt(i, m4);
  };
  houses.forEach((h, i) => put(houseMesh, i, h));
  hh.forEach((h, i) => put(roofsH, i, h));
  ha.forEach((h, i) => put(roofsA, i, h));
  houseMesh.castShadow = roofsH.castShadow = roofsA.castShadow = true;
  root.add(houseMesh, roofsH, roofsA);
  for (const s of SETTLEMENTS) {
    if (s.size === 'hamlet') continue;
    const [cx, cz] = centerXZ(...s.hex);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(s.size === 'city' ? 0.86 : 0.78, 0.035, 4, 24),
      track(new THREE.MeshStandardMaterial({ color: '#8b7d66', roughness: 1, flatShading: true }), 'base'),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(cx, topY(...s.hex) + 0.03, cz);
    root.add(ring);
  }

  // ---- 灯り（光の板）：人の村は暖かい灯、AIの村は紫の光 ----
  const warmTex = radialTexture('rgba(255,178,92,0.9)', 'rgba(255,178,92,0)');
  const aiTex = radialTexture('rgba(155,123,255,0.95)', 'rgba(155,123,255,0)');
  const glows: { sprite: THREE.Sprite; kind: Kind; id: string; size: number }[] = [];
  for (const s of SETTLEMENTS) {
    const mat = track(
      new THREE.SpriteMaterial({ map: s.kind === 'ai' ? aiTex : warmTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: s.kind === 'ai' ? 0.42 : 0.26 }),
      s.kind === 'ai' ? 'ai' : 'base',
    );
    const sp = new THREE.Sprite(mat);
    const [cx, cz] = centerXZ(...s.hex);
    const size = s.kind === 'ai' ? (s.size === 'city' ? 4.2 : 3.4) : s.size === 'town' ? 3 : 2.3;
    sp.position.set(cx, topY(...s.hex) + 0.35, cz);
    sp.scale.setScalar(size);
    sp.renderOrder = 5;
    glows.push({ sprite: sp, kind: s.kind, id: s.id, size });
    root.add(sp);
  }

  // AIの判断の光の柱
  const beamMat = track(new THREE.MeshBasicMaterial({ color: PALETTE.ai, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }), 'ai');
  const beams = new Map<string, THREE.Mesh>();
  for (const s of SETTLEMENTS.filter((x) => x.kind === 'ai')) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 3.2, 10, 1, true).translate(0, 1.6, 0), beamMat.clone());
    track(m.material as THREE.Material, 'ai');
    const [cx, cz] = centerXZ(...s.hex);
    m.position.set(cx, topY(...s.hex), cz);
    beams.set(s.id, m);
    root.add(m);
  }

  // ---- 道：マスの中心どうしを結ぶ帯 ----
  {
    const pos: number[] = [];
    const seen = new Set<string>();
    for (const r of ROUTES) {
      const pts = r.points.map(([x, y]) => from2D(x, y));
      for (let i = 1; i < pts.length; i++) {
        const k = [pts[i - 1], pts[i]].map((p) => p.map((v) => v.toFixed(2)).join(',')).sort().join('|');
        if (seen.has(k)) continue;
        seen.add(k);
        const [ax, az] = pts[i - 1];
        const [bx, bz] = pts[i];
        const steps = 8;
        for (let j = 0; j < steps; j++) {
          const f0 = j / steps;
          const f1 = (j + 1) / steps;
          const p0 = [ax + (bx - ax) * f0, az + (bz - az) * f0];
          const p1 = [ax + (bx - ax) * f1, az + (bz - az) * f1];
          const dx = p1[0] - p0[0];
          const dz = p1[1] - p0[1];
          const len = Math.hypot(dx, dz) || 1;
          const nx = (-dz / len) * 0.06;
          const nz = (dx / len) * 0.06;
          const y0 = groundAt(p0[0], p0[1]) + 0.012;
          const y1 = groundAt(p1[0], p1[1]) + 0.012;
          pos.push(p0[0] - nx, y0, p0[1] - nz, p0[0] + nx, y0, p0[1] + nz, p1[0] + nx, y1, p1[1] + nz);
          pos.push(p0[0] - nx, y0, p0[1] - nz, p1[0] + nx, y1, p1[1] + nz, p1[0] - nx, y1, p1[1] - nz);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const roadMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.road, roughness: 1, emissive: PALETTE.road, emissiveIntensity: 0.08, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }), 'logistics');
    const roads = new THREE.Mesh(g, roadMat);
    roads.receiveShadow = true;
    root.add(roads);
  }

  // ---- 倉庫と、在庫の木箱（在庫がそのまま箱の数になる） ----
  const depotMat = track(new THREE.MeshStandardMaterial({ color: '#a37d4f', roughness: 0.9, flatShading: true }), 'logistics');
  const depotRoof = track(new THREE.MeshStandardMaterial({ color: '#6a4a2c', roughness: 0.9, flatShading: true }), 'logistics');
  for (const d of DEPOTS) {
    const [cx, cz] = centerXZ(...d.hex);
    const y = topY(...d.hex);
    const barn = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.42).translate(0, 0.18, 0), depotMat);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.3, 0.66, 3, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 6).translate(0, 0.46, 0), depotRoof);
    barn.position.set(cx - 0.12, y, cz - 0.1);
    roof.position.copy(barn.position);
    barn.castShadow = roof.castShadow = true;
    root.add(barn, roof);
  }
  const CRATE_CAP = 18;
  const placesForCrates = [
    ...SETTLEMENTS.map((s) => ({ id: s.id, hex: s.hex, per: 55, dx: 0.62, dz: 0.48 })),
    ...DEPOTS.map((d) => ({ id: d.id, hex: d.hex, per: 25, dx: 0.3, dz: 0.22 })),
  ];
  const crateMat = track(new THREE.MeshStandardMaterial({ color: '#b98a52', roughness: 0.85, flatShading: true }), 'logistics');
  const crates = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.13, 0.13).translate(0, 0.065, 0), crateMat, placesForCrates.length * CRATE_CAP);
  crates.castShadow = true;
  root.add(crates);
  const crateSlot = (k: number): [number, number, number] => {
    const layer = Math.floor(k / 6);
    const j = k % 6;
    return [(j % 3) * 0.145, layer * 0.135, Math.floor(j / 3) * 0.145];
  };

  // ---- 荷車 ----
  const CS = 1.7; // 荷車は遠くからも読めるよう、実寸より大きく
  const cartBody = new THREE.BoxGeometry(0.24 * CS, 0.08 * CS, 0.14 * CS).translate(0, 0.09 * CS, 0);
  const cartLoad = new THREE.BoxGeometry(0.18 * CS, 0.09 * CS, 0.1 * CS).translate(0, 0.17 * CS, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.05 * CS, 0.05 * CS, 0.02 * CS, 10).rotateX(Math.PI / 2);
  const oxGeo = new THREE.BoxGeometry(0.14 * CS, 0.09 * CS, 0.08 * CS).translate(0.22 * CS, 0.08 * CS, 0);
  const ringGeo = new THREE.RingGeometry(0.34, 0.4, 28).rotateX(-Math.PI / 2);
  const wheelMat = track(new THREE.MeshStandardMaterial({ color: '#2c2219', roughness: 1 }), 'logistics');
  const oxMat = track(new THREE.MeshStandardMaterial({ color: '#7a5a3e', roughness: 1, flatShading: true }), 'logistics');
  const carts = new Map<string, { g: THREE.Group; load: THREE.Mesh; loadMat: THREE.MeshStandardMaterial }>();
  for (const r of ROUTES) {
    const g = new THREE.Group();
    const ai = r.kind === 'ai';
    const bodyMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.wood, roughness: 0.9, flatShading: true }), ai ? 'ai' : 'logistics');
    const loadMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.cargo[r.cargo], roughness: 0.8, flatShading: true }), ai ? 'ai' : 'logistics') as THREE.MeshStandardMaterial;
    const body = new THREE.Mesh(cartBody, bodyMat);
    const load = new THREE.Mesh(cartLoad, loadMat);
    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.position.set(-0.05 * CS, 0.05 * CS, 0.08 * CS);
    w2.position.set(-0.05 * CS, 0.05 * CS, -0.08 * CS);
    const ox = new THREE.Mesh(oxGeo, oxMat);
    g.add(body, load, w1, w2, ox);
    if (ai) {
      const ringMat = track(new THREE.MeshBasicMaterial({ color: PALETTE.ai, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }), 'ai');
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.015;
      g.add(ring);
    }
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
    });
    carts.set(r.id, { g, load, loadMat });
    root.add(g);
  }

  // ---- 見張り塔・視界・柵 ----
  const stoneMat = track(new THREE.MeshStandardMaterial({ color: '#b9b2a3', roughness: 0.9, flatShading: true }), 'defense');
  for (const t of TOWERS) {
    const kind = settlement(t.by)!.kind;
    const [cx, cz] = centerXZ(...t.hex);
    const y = topY(...t.hex);
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.6, 7).translate(0, 0.3, 0), stoneMat);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.08, 7).translate(0, 0.64, 0), stoneMat);
    const flagMat = track(new THREE.MeshBasicMaterial({ color: kind === 'ai' ? PALETTE.ai : PALETTE.human, side: THREE.DoubleSide }), 'defense');
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.09).translate(0.08, 0.82, 0), flagMat);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24).translate(0, 0.8, 0), stoneMat);
    g.add(shaft, crown, flag, pole);
    g.position.set(cx + 0.45, y, cz - 0.2);
    g.scale.setScalar(1.5);
    shaft.castShadow = true;
    root.add(g);
  }
  const domeFor = new Map<string, THREE.Mesh>();
  for (const t of TOWERS) {
    const kind = settlement(t.by)!.kind;
    const [cx, cz] = centerXZ(...t.hex);
    const mat = track(new THREE.MeshBasicMaterial({ color: kind === 'ai' ? PALETTE.ai : PALETTE.human, transparent: true, opacity: 0, wireframe: true, depthWrite: false }), 'defense');
    const dome = new THREE.Mesh(new THREE.SphereGeometry(t.radius * SQ3 + 0.3, 18, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    dome.position.set(cx, topY(...t.hex), cz);
    domeFor.set(t.id, dome);
    root.add(dome);
  }
  const postMat = track(new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 1 }), 'defense');
  const fencePosts: [number, number, number][] = [];
  {
    const [fq, fr] = FENCE.hex;
    const [cx, cz] = centerXZ(fq, fr);
    const y = topY(fq, fr);
    for (const k of FENCE.edges) {
      const a0 = (Math.PI / 180) * (-90 - 60 * k);
      const a1 = (Math.PI / 180) * (-90 - 60 * (k + 1));
      for (let i = 0; i <= 6; i++) {
        const f = i / 6;
        const ax = Math.cos(a0) * (1 - f) + Math.cos(a1) * f;
        const az = Math.sin(a0) * (1 - f) + Math.sin(a1) * f;
        // 2D の頂点の向き（y が下）を 3D の z に合わせる
        fencePosts.push([cx + ax * 0.95, y, cz + az * 0.95]);
      }
    }
  }
  const fence = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.18, 0.035).translate(0, 0.09, 0), postMat, fencePosts.length);
  fencePosts.forEach(([x, y, z], i) => fence.setMatrixAt(i, m4.makeTranslation(x, y, z)));
  root.add(fence);

  // ---- 領域の境（線）と、上面の色のにじみ ----
  const borderGroup = new THREE.Group();
  root.add(borderGroup);
  const borderMats = {
    human: track(new THREE.LineBasicMaterial({ color: PALETTE.human, transparent: true, opacity: 0.95 }), 'defense'),
    ai: track(new THREE.LineDashedMaterial({ color: PALETTE.ai, transparent: true, opacity: 0.95, dashSize: 0.14, gapSize: 0.09 }), 'defense'),
  };
  let borderStage = '';
  const rebuildBorders = (turn: number) => {
    const stage = SETTLEMENTS.map((s) => (turn >= s.grow ? 1 : 0)).join('');
    if (stage === borderStage) return;
    borderStage = stage;
    borderGroup.clear();
    const seg = { human: [] as number[], ai: [] as number[] };
    for (const [q, r] of disc(RADIUS)) {
      const own = ownerAt(q, r, turn);
      if (!own) continue;
      const kind = settlement(own)!.kind;
      const [cx, cz] = centerXZ(q, r);
      const y = topY(q, r) + 0.02;
      DIRS.forEach(([dq, dr], k) => {
        if (ownerAt(q + dq, r + dr, turn) === own) return;
        // 辺 k は頂点 k と k+1。頂点 k は真上（-z）から反時計回り
        const a0 = (Math.PI / 180) * (-90 - 60 * k);
        const a1 = (Math.PI / 180) * (-90 - 60 * (k + 1));
        seg[kind].push(cx + Math.cos(a0) * 0.95, y, cz + Math.sin(a0) * 0.95, cx + Math.cos(a1) * 0.95, y, cz + Math.sin(a1) * 0.95);
      });
    }
    for (const kind of ['human', 'ai'] as const) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(seg[kind], 3));
      const line = new THREE.LineSegments(g, borderMats[kind]);
      if (kind === 'ai') line.computeLineDistances();
      borderGroup.add(line);
    }
    // 上面：領域の色を少し混ぜる
    TILES.forEach((t, i) => {
      const own = ownerAt(t.q, t.r, turn);
      const c = capBase[i].clone();
      if (own) c.lerp(settlement(own)!.kind === 'ai' ? PALETTE.ai : PALETTE.human, 0.16);
      caps.setColorAt(i, c);
    });
    if (caps.instanceColor) caps.instanceColor.needsUpdate = true;
  };

  // ---- 着いた荷の「verified」の輪 ----
  const pulseMat = new THREE.MeshBasicMaterial({ color: PALETTE.signal, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const pulses: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.42, 32).rotateX(-Math.PI / 2), pulseMat.clone());
    m.visible = false;
    pulses.push(m);
    root.add(m);
  }

  // 位置を知りたい場所（コールアウトの付け根）
  const anchors = new Map<string, THREE.Vector3>();
  for (const s of [...SETTLEMENTS, ...DEPOTS]) {
    const [cx, cz] = centerXZ(...s.hex);
    anchors.set(s.id, new THREE.Vector3(cx, topY(...s.hex) + 0.45, cz));
  }
  for (const t of TOWERS) {
    const [cx, cz] = centerXZ(...t.hex);
    anchors.set(t.id, new THREE.Vector3(cx + 0.45, topY(...t.hex) + 1.3, cz - 0.2));
  }

  const emphasis = (group: Group, look: Look) => {
    const L = look.layers;
    const focus = Math.min(1, L.logistics + L.defense + L.ai);
    if (group === 'base') return 1 - focus * 0.62;
    const w = L[group];
    return focus <= 0 ? 1 : 1 - focus * 0.78 * (1 - Math.min(1, w / focus));
  };

  const dirV = new THREE.Vector3();

  /** state(turn) と見え方から、この 1 フレームの姿を作る（純粋：前のフレームを使わない） */
  function update(st: ModelState, look: Look) {
    rebuildBorders(st.turn);
    const dimK = 1 - Math.min(0.9, look.dim);
    for (const t of tracked) {
      const k = emphasis(t.group, look) * dimK;
      if ((t.mat as THREE.Material).transparent) t.mat.opacity = t.opacity * k;
      if (t.base && t.mat.color && !(t.mat as THREE.Material).transparent) t.mat.color.copy(t.base).multiplyScalar(k);
    }
    // 光の板
    for (const g of glows) {
      const pulse = g.kind === 'ai' ? 0.85 + 0.15 * Math.sin(st.turn * 0.9 + g.size) : 1;
      g.sprite.scale.setScalar(g.size * pulse * (g.kind === 'ai' ? 1 + 0.15 * look.layers.ai : 1));
    }
    // 判断の光の柱：各AIの村の直近の判断が新しいほど明るい
    const latest = new Map<string, number>();
    for (const tr of st.traces) latest.set(tr.by, Math.min(latest.get(tr.by) ?? 99, tr.age));
    for (const [id, beam] of beams) {
      const age = latest.get(id);
      const a = age === undefined ? 0 : Math.max(0, 1 - age / 6);
      (beam.material as THREE.MeshBasicMaterial).opacity = a * 0.55 * (0.35 + 0.65 * look.layers.ai) * dimK;
      beam.visible = a > 0.01;
    }
    // 視界の丸屋根と柵
    for (const d of domeFor.values()) {
      (d.material as THREE.MeshBasicMaterial).opacity = 0.22 * look.layers.defense * dimK;
      d.visible = look.layers.defense > 0.02;
    }
    fence.visible = st.fence;
    // 木箱
    let n = 0;
    for (const p of placesForCrates) {
      const c = Math.min(CRATE_CAP, Math.round((st.stocks[p.id] ?? 0) / p.per));
      const [cx, cz] = centerXZ(...p.hex);
      const y = topY(...p.hex);
      for (let k = 0; k < c; k++) {
        const [ox, oy, oz] = crateSlot(k);
        crates.setMatrixAt(n++, m4.makeTranslation(cx + p.dx + ox - 0.11, y + oy, cz + p.dz + oz - 0.05));
      }
    }
    crates.count = n;
    crates.instanceMatrix.needsUpdate = true;
    // 荷車
    for (const c of st.carts) {
      const cart = carts.get(c.route)!;
      const [x, z] = from2D(c.x, c.y);
      // 進む向き（2D の向きを 3D に。y が下 → z が手前で同じ向き）
      dirV.set(c.hx, 0, c.hy / FLATTEN).normalize();
      const heading = Math.atan2(-dirV.z, dirV.x);
      cart.g.position.set(x, groundAt(x, z), z);
      cart.g.rotation.set(0, heading, 0);
      cart.load.visible = c.loaded;
    }
    // verified
    pulses.forEach((p) => (p.visible = false));
    if (look.verify > 0.01) {
      st.arrivals.slice(0, pulses.length).forEach((a, i) => {
        const place = SETTLEMENTS.find((s) => s.id === a.at) ?? DEPOTS.find((d) => d.id === a.at);
        if (!place) return;
        const [cx, cz] = centerXZ(...place.hex);
        const p = pulses[i];
        p.visible = true;
        p.position.set(cx, topY(...place.hex) + 0.03, cz);
        p.scale.setScalar(1 + a.age * 0.45);
        (p.material as THREE.MeshBasicMaterial).opacity = look.verify * Math.max(0, 1 - a.age / 4) * 0.9;
      });
    }
  }

  return { root, update, anchors, cartGroup: (id: string) => carts.get(id)?.g };
}

export { distance, type Hex };
