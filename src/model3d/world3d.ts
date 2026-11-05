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
import * as P from './props';

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
type Tracked = { mat: THREE.Material & { color?: THREE.Color; opacity: number; emissiveIntensity?: number }; group: Group; base: THREE.Color | null; opacity: number; ei: number | null };

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

/** 点 (x, z) のあるマスの "q,r"（立方座標で丸める） */
function hexKeyAt(x: number, z: number): string {
  const r = z / 1.5;
  const q = x / SQ3 - r / 2;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return `${rq},${rr}`;
}

/** 六角形の角 k（0..5）。CylinderGeometry と同じ向き（角が ±z） */
const corner3 = (k: number, rad: number, y: number): [number, number, number] => [rad * Math.sin((k * Math.PI) / 3), y, rad * Math.cos((k * Math.PI) / 3)];

/** 三角形の並びと色から、面ごとの法線を持つ形を作る */
function facets(tris: [number, number, number][][], cols: number[]) {
  const pos: number[] = [];
  const col: number[] = [];
  tris.forEach((tri, i) => {
    // 外向き・上向きになるように並びを揃える
    const [a, b, c] = tri;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3 + 0.5, (a[2] + b[2] + c[2]) / 3];
    const ok = n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0;
    for (const p of ok ? [a, b, c] : [a, c, b]) {
      pos.push(...p);
      col.push(cols[i], cols[i], cols[i]);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** 面取りしたマスの上面（上面の高さが y = 0） */
function bevelCap(r: () => number) {
  const tris: [number, number, number][][] = [];
  const cols: number[] = [];
  const center: [number, number, number] = [0, 0.018, 0];
  const RI = 0.86, RO = 0.985, YB = -0.045, YL = -0.11;
  for (let k = 0; k < 6; k++) {
    const i0 = corner3(k, RI, 0), i1 = corner3(k + 1, RI, 0);
    const o0 = corner3(k, RO, YB), o1 = corner3(k + 1, RO, YB);
    const l0 = corner3(k, RO, YL), l1 = corner3(k + 1, RO, YL);
    // 上面は 1 辺を 2 枚に分ける（中点を少し下げる）
    const mid = corner3(k + 0.5, RI * 0.93, -0.004);
    const m: [number, number, number] = [mid[0], mid[1], mid[2]];
    tris.push([center, i0, m], [center, m, i1]);
    cols.push(0.95 + r() * 0.09, 0.95 + r() * 0.09);
    tris.push([i0, o0, i1], [i1, o0, o1]);
    cols.push(0.82, 0.82);
    tris.push([o0, l0, o1], [o1, l0, l1]);
    cols.push(0.62, 0.62);
  }
  return facets(tris, cols);
}

/** 土の柱（高さ 1、上ほど明るい） */
function soilPrism() {
  const g = new THREE.CylinderGeometry(0.97, 0.94, 1, 6, 3);
  g.translate(0, 0.5, 0);
  const p = g.getAttribute('position');
  const col: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // 地層の帯：上 1/3 は明るく、真ん中に一本暗い筋
    const v = y > 0.67 ? 1.25 : y > 0.34 ? 0.85 : 0.6;
    col.push(v, v, v);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g.toNonIndexed();
}

/** 複数の形を一つにまとめ、部品ごとの明るさを頂点の色に入れる（幹は暗く、葉は明るく） */
function mergeGeos(parts: THREE.BufferGeometry[], shade: number[]) {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  parts.forEach((g0, i) => {
    const g = g0.index ? g0.toNonIndexed() : g0;
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    for (let j = 0; j < p.count; j++) {
      pos.push(p.getX(j), p.getY(j), p.getZ(j));
      nor.push(n.getX(j), n.getY(j), n.getZ(j));
      // 幹は茶色に寄せる（インスタンスの緑と掛け合わせても茶に見えるよう、赤を強める）
      if (i === 0) col.push(1.6 * shade[i], 0.75 * shade[i], 0.45 * shade[i]);
      else col.push(shade[i], shade[i], shade[i]);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

export type World3D = ReturnType<typeof buildWorld>;

export function buildWorld(opts: { rich: boolean }) {
  const root = new THREE.Group();
  const tracked: Tracked[] = [];
  const track = <M extends THREE.Material>(mat: M, group: Group): M => {
    const m = mat as unknown as Tracked['mat'];
    tracked.push({ mat: m, group, base: m.color ? m.color.clone() : null, opacity: m.opacity, ei: m.emissiveIntensity ?? null });
    return mat;
  };
  const rand = rng(998);

  // ---- 地形：土の柱と、地形の色の上面 ----
  // 上面は「面取りした六角形」：中心を少し持ち上げた 6 枚の三角形＋斜めの縁＋縦の縁。
  // 面ごとに色を少しゆらし、平らな塗りではなく、削り出した駒のように見せる。
  const capGeo = bevelCap(rng(4242));
  const prism = soilPrism();
  const soilMat = track(new THREE.MeshStandardMaterial({ color: PALETTE.soil, roughness: 1, flatShading: true, vertexColors: true }), 'base');
  const capMat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true, vertexColors: true }), 'base');
  const soil = new THREE.InstancedMesh(prism, soilMat, TILES.length);
  const caps = new THREE.InstancedMesh(capGeo, capMat, TILES.length);
  soil.receiveShadow = caps.receiveShadow = true;
  caps.castShadow = false;
  const m4 = new THREE.Matrix4();
  const qt = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const v3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  const capBase: THREE.Color[] = [];
  const tint = rng(77);
  TILES.forEach((t, i) => {
    const [x, z] = centerXZ(t.q, t.r);
    const h = topY(t.q, t.r);
    m4.makeScale(1, h - 0.08, 1).setPosition(x, 0, z);
    soil.setMatrixAt(i, m4);
    m4.makeTranslation(x, h, z);
    caps.setMatrixAt(i, m4);
    const [ca, cb] = TERRAIN_COLOR[t.terrain];
    // マスごとに明るさと色味を少しずらす（同じ地形が並んでも単調にならない）
    const col = new THREE.Color(t.variant === 2 ? cb : ca).offsetHSL((tint() - 0.5) * 0.018, (tint() - 0.5) * 0.06, (tint() - 0.5) * 0.045);
    if (t.terrain === 'water') col.set('#2c5b66');
    capBase.push(col);
    caps.setColorAt(i, col);
  });
  root.add(soil, caps);

  // 道の通るマス（飾りを置かない）と、建物のあるマス
  const busy = new Set([...SETTLEMENTS, ...DEPOTS, ...TOWERS].map((s) => `${s.hex[0]},${s.hex[1]}`));
  const roadTiles = new Set<string>();
  for (const r of ROUTES) for (const [px, py] of r.points) roadTiles.add(hexKeyAt(...from2D(px, py)));

  // 水面：マスいっぱいに張り、隣の水のマスとつながって見えるように。
  // 岸の砂と浅瀬は、陸に面した辺にだけ置く
  const waterTiles = TILES.filter((t) => t.terrain === 'water');
  const waterMat = track(new THREE.MeshStandardMaterial({ color: '#3f8ea0', roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.88, flatShading: true }), 'base');
  const water = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.0, 1.0, 0.02, 6, 1), waterMat, waterTiles.length);
  const shoreTris: [number, number, number][][] = [];
  const shallowTris: [number, number, number][][] = [];
  waterTiles.forEach((t, i) => {
    const [x, z] = centerXZ(t.q, t.r);
    const y = topY(t.q, t.r);
    water.setMatrixAt(i, m4.makeTranslation(x, y + 0.014, z));
    for (const [dq, dr] of DIRS) {
      const n = tileAt(t.q + dq, t.r + dr);
      if (!n || n.terrain === 'water') continue;
      // 隣のマスの方向にある辺（角 k と k+1 のあいだ）
      const [nx, nz] = centerXZ(t.q + dq, t.r + dr);
      const ang = Math.atan2(nx - x, nz - z);
      const k = Math.round(ang / (Math.PI / 3) - 0.5);
      const at = (kk: number, rad: number, h: number): [number, number, number] => {
        const c = corner3(kk, rad, h);
        return [c[0] + x, c[1] + y, c[2] + z];
      };
      shoreTris.push([at(k, 0.8, 0.03), at(k, 0.99, 0.03), at(k + 1, 0.8, 0.03)], [at(k + 1, 0.8, 0.03), at(k, 0.99, 0.03), at(k + 1, 0.99, 0.03)]);
      shallowTris.push([at(k, 0.62, 0.027), at(k, 0.8, 0.027), at(k + 1, 0.62, 0.027)], [at(k + 1, 0.62, 0.027), at(k, 0.8, 0.027), at(k + 1, 0.8, 0.027)]);
    }
  });
  const shoreGeo = facets(shoreTris.map((tr) => tr.map((p) => [p[0], p[1] + 10, p[2]] as [number, number, number])), shoreTris.map(() => 1));
  shoreGeo.translate(0, -10, 0);
  const shallowGeo = facets(shallowTris.map((tr) => tr.map((p) => [p[0], p[1] + 10, p[2]] as [number, number, number])), shallowTris.map(() => 1));
  shallowGeo.translate(0, -10, 0);
  const shore = new THREE.Mesh(shoreGeo, track(new THREE.MeshStandardMaterial({ color: '#b9a77a', roughness: 1, flatShading: true, vertexColors: true }), 'base'));
  const shallow = new THREE.Mesh(shallowGeo, track(new THREE.MeshStandardMaterial({ color: '#6fb6bb', roughness: 0.3, transparent: true, opacity: 0.45, depthWrite: false }), 'base'));
  shore.receiveShadow = true;
  root.add(water, shore, shallow);

  // ---- 地形の飾り：木（幹と二段の葉）、広葉樹、草、花、畑、岩、丘、山 ----
  type Spot = { x: number; y: number; z: number; s: number; rot: number; c: THREE.Color };
  const conifers: Spot[] = [];
  const broadleaf: Spot[] = [];
  const tufts: Spot[] = [];
  const flowers: Spot[] = [];
  const furrows: Spot[] = [];
  const rocks: Spot[] = [];
  const moundSpots: Spot[] = [];
  const peakSpots: Spot[] = [];
  const C = (hex: string, j = 0.05) => new THREE.Color(hex).offsetHSL((rand() - 0.5) * 0.03, 0, (rand() - 0.5) * j);
  const inHex = (x: number, z: number, d: number) => {
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * d;
    return [x + Math.cos(a) * rr, z + Math.sin(a) * rr] as const;
  };
  const rich = opts.rich;
  for (const t of TILES) {
    const [x, z] = centerXZ(t.q, t.r);
    const y = topY(t.q, t.r);
    const k = `${t.q},${t.r}`;
    const free = !busy.has(k) && !roadTiles.has(k);
    if (t.terrain === 'forest') {
      const n = rich ? 9 : 5;
      for (let i = 0; i < n; i++) {
        const [px, pz] = inHex(x, z, 0.72);
        (rand() < 0.78 ? conifers : broadleaf).push({ x: px, y, z: pz, s: 0.7 + rand() * 0.55, rot: rand() * 6.28, c: C(rand() < 0.5 ? '#35522c' : '#2c4626', 0.08) });
      }
      if (rich) for (let i = 0; i < 4; i++) {
        const [px, pz] = inHex(x, z, 0.8);
        tufts.push({ x: px, y, z: pz, s: 0.8 + rand() * 0.5, rot: rand() * 6.28, c: C('#4f6e3a') });
      }
    } else if (t.terrain === 'grassland') {
      if (free && rand() < 0.5) {
        const [px, pz] = inHex(x, z, 0.55);
        broadleaf.push({ x: px, y, z: pz, s: 0.75 + rand() * 0.35, rot: rand() * 6.28, c: C('#4c7034', 0.08) });
      }
      if (free || !busy.has(k)) {
        const n = rich ? 9 : 4;
        for (let i = 0; i < n; i++) {
          const [px, pz] = inHex(x, z, 0.8);
          if (!free && Math.hypot(px - x, pz - z) < 0.5) continue;
          tufts.push({ x: px, y, z: pz, s: 0.7 + rand() * 0.6, rot: rand() * 6.28, c: C('#93ad5b', 0.08) });
        }
      }
      if (free && rich) for (let i = 0; i < 3; i++) {
        const [px, pz] = inHex(x, z, 0.75);
        flowers.push({ x: px, y, z: pz, s: 0.8 + rand() * 0.5, rot: 0, c: new THREE.Color(['#efe2a0', '#e8edf2', '#d88f73'][Math.floor(rand() * 3)]) });
      }
    } else if (t.terrain === 'plains') {
      if (free && rand() < 0.6) {
        // 畑：同じ向きの畝を 5 本。向きはヘックスの辺に合わせる
        const rot = (Math.floor(rand() * 3) * Math.PI) / 3;
        const gold = rand() < 0.5 ? '#d2b866' : '#b9a25a';
        for (let i = 0; i < 5; i++) {
          const off = (i - 2) * 0.2;
          furrows.push({ x: x + Math.cos(rot + Math.PI / 2) * off, y, z: z - Math.sin(rot + Math.PI / 2) * off, s: 1 - Math.abs(i - 2) * 0.18, rot, c: C(gold, 0.06) });
        }
      } else if (!busy.has(k)) {
        const n = rich ? 5 : 2;
        for (let i = 0; i < n; i++) {
          const [px, pz] = inHex(x, z, 0.8);
          if (roadTiles.has(k) && Math.hypot(px - x, pz - z) < 0.5) continue;
          tufts.push({ x: px, y, z: pz, s: 0.6 + rand() * 0.4, rot: rand() * 6.28, c: C('#c9b56d', 0.06) });
        }
      }
      if (free && rand() < 0.4) {
        const [px, pz] = inHex(x, z, 0.7);
        rocks.push({ x: px, y, z: pz, s: 0.6 + rand() * 0.5, rot: rand() * 6.28, c: C('#8c8678', 0.08) });
      }
    } else if (t.terrain === 'hills') {
      const n = rich ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const [px, pz] = inHex(x, z, i === 0 ? 0.15 : 0.5);
        moundSpots.push({ x: px, y, z: pz, s: i === 0 ? 1 : 0.45 + rand() * 0.25, rot: rand() * 6.28, c: C('#7f8c53', 0.06) });
      }
      for (let i = 0; i < (rich ? 4 : 2); i++) {
        const [px, pz] = inHex(x, z, 0.8);
        rocks.push({ x: px, y, z: pz, s: 0.5 + rand() * 0.6, rot: rand() * 6.28, c: C('#8a8577', 0.08) });
      }
    } else if (t.terrain === 'mountain') {
      peakSpots.push({ x, y, z, s: 1, rot: rand() * 6.28, c: C('#77716a', 0.05) });
      peakSpots.push({ x: x + 0.42, y, z: z + 0.25, s: 0.62, rot: rand() * 6.28, c: C('#6f6a63', 0.05) });
      peakSpots.push({ x: x - 0.38, y, z: z + 0.3, s: 0.48, rot: rand() * 6.28, c: C('#7c766e', 0.05) });
      for (let i = 0; i < (rich ? 5 : 2); i++) {
        const [px, pz] = inHex(x, z, 0.85);
        rocks.push({ x: px, y, z: pz, s: 0.6 + rand() * 0.7, rot: rand() * 6.28, c: C('#6e6962', 0.08) });
      }
    }
  }

  const place = (geo: THREE.BufferGeometry, mat: THREE.Material, spots: Spot[], opts2: { shadow?: boolean; sy?: number } = {}) => {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, spots.length));
    mesh.count = spots.length;
    spots.forEach((p, i) => {
      qt.setFromAxisAngle(up, p.rot);
      m4.compose(v3.set(p.x, p.y, p.z), qt, s3.set(p.s, p.s * (opts2.sy ?? 1), p.s));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, p.c);
    });
    mesh.castShadow = !!opts2.shadow;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  const leaf = () => track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }), 'base');
  // 針葉樹：幹＋二段の葉
  const conGeo = mergeGeos([
    new THREE.CylinderGeometry(0.025, 0.035, 0.12, 5, 1).translate(0, 0.06, 0),
    new THREE.ConeGeometry(0.15, 0.26, 6, 1).translate(0, 0.21, 0),
    new THREE.ConeGeometry(0.11, 0.22, 6, 1).translate(0, 0.36, 0),
  ], [0.55, 1, 1.12]);
  // 広葉樹：幹＋丸い葉
  const broadGeo = mergeGeos([
    new THREE.CylinderGeometry(0.025, 0.035, 0.16, 5, 1).translate(0, 0.08, 0),
    new THREE.IcosahedronGeometry(0.15, 0).scale(1, 0.9, 1).translate(0, 0.26, 0),
    new THREE.IcosahedronGeometry(0.1, 0).translate(0.07, 0.33, 0.03),
  ], [0.55, 1, 1.12]);
  const vc = () => track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true, vertexColors: true }), 'base');
  place(conGeo, vc(), conifers, { shadow: true });
  place(broadGeo, vc(), broadleaf, { shadow: true });
  place(new THREE.ConeGeometry(0.03, 0.1, 4, 1).translate(0, 0.05, 0), leaf(), tufts);
  place(new THREE.IcosahedronGeometry(0.022, 0).translate(0, 0.03, 0), track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.05 }), 'base'), flowers);
  place(new THREE.BoxGeometry(0.95, 0.035, 0.09).translate(0, 0.017, 0), leaf(), furrows);
  place(new THREE.DodecahedronGeometry(0.06, 0).scale(1, 0.7, 1).translate(0, 0.025, 0), leaf(), rocks, { shadow: rich });
  place(new THREE.SphereGeometry(0.5, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.42, 1), leaf(), moundSpots, { shadow: true });
  place(new THREE.ConeGeometry(0.62, 1.05, 5, 1).translate(0, 0.52, 0), leaf(), peakSpots, { shadow: true });
  place(new THREE.ConeGeometry(0.22, 0.36, 5, 1).translate(0, 0.87, 0), track(new THREE.MeshStandardMaterial({ color: '#e7e9ee', roughness: 0.8, flatShading: true }), 'base'), peakSpots.map((p) => ({ ...p, c: new THREE.Color('#ffffff') })));

  // ---- 村 ----
  // 人の村：漆喰と木の家、切妻屋根、灯った窓、広場・井戸・市場、町には石垣と門。
  // AIの村：六角の住まいに紫に光る帯、中心の尖塔、受ける板とアンテナ。
  // 家は道の出る向きと、在庫の箱を積む場所を空けて並べる。
  type Place = { x: number; y: number; z: number; rot: number; s: number; sx?: number };
  const placed = new Map<string, Place[]>();
  const add = (key: string, p: Place) => {
    if (!placed.has(key)) placed.set(key, []);
    placed.get(key)!.push(p);
  };
  // 村から道が出る向き（ラジアン、x-z 平面）
  const roadAngles = (hex: Hex) => {
    const [cx, cz] = centerXZ(...hex);
    const out: number[] = [];
    for (const r of ROUTES) {
      const pts = r.points.map(([x, y]) => from2D(x, y));
      pts.forEach(([x, z], i) => {
        if (Math.hypot(x - cx, z - cz) > 0.05) return;
        for (const j of [i - 1, i + 1]) {
          const q = pts[j];
          if (q) out.push(Math.atan2(q[1] - cz, q[0] - cx));
        }
      });
    }
    return out;
  };
  const angDiff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const facing = (x: number, z: number, tx: number, tz: number) => Math.atan2(-(tz - z), tx - x); // +x を (tx, tz) に向ける
  const CRATE_ANGLE = Math.atan2(0.48, 0.62);

  for (const s of SETTLEMENTS) {
    const [cx, cz] = centerXZ(...s.hex);
    const y = topY(...s.hex);
    const r0 = rng(s.id.length * 131 + s.hex[0] * 17 + s.hex[1]);
    const roadsOut = roadAngles(s.hex);
    const free = (a: number, pad = 0.42) => roadsOut.every((ra) => angDiff(a, ra) > pad) && angDiff(a, CRATE_ANGLE) > 0.5;
    // 環状に、空いている向きへ並べる
    const ring = (n: number, rad: number, jitter: number, cb: (x: number, z: number, a: number, i: number) => void) => {
      let i = 0;
      for (let k = 0; k < n * 3 && i < n; k++) {
        const a = (k / (n * 3)) * Math.PI * 2 + r0() * 0.15 + (s.hex[0] + s.hex[1]) * 0.7;
        if (!free(a)) continue;
        if (k % 3 !== 0) continue;
        const rr = rad + (r0() - 0.5) * jitter;
        cb(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, a, i++);
      }
    };
    if (s.kind === 'human') {
      const town = s.size !== 'hamlet';
      // 広場と井戸
      add('plaza', { x: cx, y, z: cz, rot: 0, s: town ? 1 : 0.7 });
      add('well', { x: cx + 0.05, y: y + 0.012, z: cz - 0.04, rot: r0() * 6, s: 1.1 });
      if (town) {
        add('hall', { x: cx - 0.02, y: y + 0.012, z: cz + 0.2, rot: facing(cx, cz + 0.2, cx, cz), s: 1.05 });
        add('stall-a', { x: cx + 0.18, y: y + 0.012, z: cz + 0.06, rot: facing(cx + 0.18, cz + 0.06, cx, cz), s: 1 });
        add('stall-b', { x: cx - 0.17, y: y + 0.012, z: cz - 0.1, rot: facing(cx - 0.17, cz - 0.1, cx, cz), s: 1 });
      }
      // 家並み
      const houseAngles: number[] = [];
      ring(town ? 9 : 5, town ? 0.56 : 0.42, 0.12, (x, z, a, i) => {
        houseAngles.push(a);
        const kind = i % 4 === 2 ? 'longhouse' : 'cottage';
        add(kind, { x, y, z, rot: facing(x, z, cx, cz) + (r0() - 0.5) * 0.3, s: 0.95 + r0() * 0.25 });
      });
      // 干し草と村人
      ring(town ? 3 : 2, town ? 0.78 : 0.66, 0.06, (x, z) => add('hay', { x, y, z, rot: r0() * 6, s: 0.9 + r0() * 0.4 }));
      for (let i = 0; i < (town ? 6 : 3); i++) {
        const a = r0() * Math.PI * 2;
        const d = 0.12 + r0() * 0.12;
        add(i % 2 ? 'person-a' : 'person-b', { x: cx + Math.cos(a) * d, y: y + 0.012, z: cz + Math.sin(a) * d, rot: r0() * 6, s: 1.4 });
      }
      // 町の石垣：道の出る向きに門
      if (town) {
        const R = 0.84;
        const STEPS = 36;
        for (let k = 0; k < STEPS; k++) {
          const a0 = (k / STEPS) * Math.PI * 2;
          const a1 = ((k + 1) / STEPS) * Math.PI * 2;
          const mid = (a0 + a1) / 2;
          if (!roadsOut.every((ra) => angDiff(mid, ra) > 0.2)) continue;
          const x0 = cx + Math.cos(a0) * R, z0 = cz + Math.sin(a0) * R;
          const x1 = cx + Math.cos(a1) * R, z1 = cz + Math.sin(a1) * R;
          add('wall', { x: (x0 + x1) / 2, y: groundAt((x0 + x1) / 2, (z0 + z1) / 2), z: (z0 + z1) / 2, rot: facing(x0, z0, x1, z1), s: 1, sx: Math.hypot(x1 - x0, z1 - z0) * 1.04 });
        }
        for (const ra of roadsOut)
          for (const side of [-1, 1]) {
            const a = ra + side * 0.24;
            const x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
            add('gate', { x, y: groundAt(x, z), z, rot: a, s: 1 });
          }
      }
      // 風車（村ごとに一つ。羽根はターンで回る）
      if (s.size === 'hamlet' || s.id === 'lamar') {
        let wa = 0;
        // 道からも家からもいちばん離れた向きに
        let bestGap = -1;
        for (let k = 0; k < 48; k++) {
          const a = (k / 48) * Math.PI * 2;
          if (!free(a, 0.6)) continue;
          const gap = Math.min(...houseAngles.map((h) => angDiff(a, h)), ...roadsOut.map((r) => angDiff(a, r)));
          if (gap > bestGap) {
            bestGap = gap;
            wa = a;
          }
        }
        const rr = s.id === 'lamar' ? 1.25 : 0.8;
        const x = cx + Math.cos(wa) * rr, z = cz + Math.sin(wa) * rr;
        add('mill', { x, y: groundAt(x, z), z, rot: 0.6, s: 1.2 });
      }
    } else {
      const city = s.size === 'city';
      add('ai-plate', { x: cx, y, z: cz, rot: 0, s: city ? 1 : 0.72 });
      if (city) add('spire', { x: cx, y: y + 0.012, z: cz, rot: 0, s: 1 });
      ring(city ? 8 : 4, city ? 0.5 : 0.36, 0.1, (x, z, _a, i) => {
        add(i % 3 === 0 ? 'pod-tall' : 'pod', { x, y, z, rot: r0() * 6, s: (city ? 1 : 0.95) + r0() * 0.2 });
      });
      if (!city) add('pod-tall', { x: cx, y: y + 0.012, z: cz, rot: 0.3, s: 1.05 });
      ring(city ? 4 : 2, city ? 0.8 : 0.62, 0.06, (x, z) => add('panel', { x, y: groundAt(x, z), z, rot: r0() * 6, s: 1.2 }));
      ring(city ? 2 : 1, city ? 0.72 : 0.55, 0.04, (x, z) => add('mast', { x, y: groundAt(x, z), z, rot: 0, s: 1.3 }));
    }
  }

  const propHuman = track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.86, flatShading: true }), 'base');
  const propAi = track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.6, metalness: 0.08, flatShading: true }), 'ai');
  const windowMat = track(new THREE.MeshStandardMaterial({ color: '#3a2a18', emissive: '#ffc37a', emissiveIntensity: 1.35, roughness: 1 }), 'base');
  const aiGlowMat = track(new THREE.MeshStandardMaterial({ color: '#2a2147', emissive: PALETTE.ai, emissiveIntensity: 1.6, roughness: 1 }), 'ai');
  const qy = new THREE.Quaternion();
  const vy = new THREE.Vector3(0, 1, 0);
  const instance = (key: string, geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true) => {
    const list = placed.get(key) ?? [];
    if (!list.length) return null;
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => {
      qy.setFromAxisAngle(vy, p.rot);
      // 石垣は長さ（x）だけを区画に合わせ、高さと厚みは変えない
      m4.compose(new THREE.Vector3(p.x, p.y, p.z), qy, new THREE.Vector3(p.sx ?? p.s, p.s, p.s));
      mesh.setMatrixAt(i, m4);
    });
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  instance('cottage', P.cottage(), propHuman);
  instance('cottage', P.windowsOf('cottage'), windowMat, false);
  instance('longhouse', P.longhouse(), propHuman);
  instance('longhouse', P.windowsOf('longhouse'), windowMat, false);
  instance('hall', P.hall(), propHuman);
  instance('hall', P.windowsOf('hall'), windowMat, false);
  instance('well', P.well(), propHuman);
  instance('stall-a', P.stall('#c9573c'), propHuman);
  instance('stall-b', P.stall('#d9c08a'), propHuman);
  instance('hay', P.haystack(), propHuman);
  instance('person-a', P.person('#5a6b8c'), propHuman, false);
  instance('person-b', P.person('#8c5a4a'), propHuman, false);
  instance('wall', P.wallSegment(), propHuman);
  instance('gate', P.gatePost(), propHuman);
  instance('plaza', P.merge([{ g: new THREE.CylinderGeometry(0.3, 0.32, 0.014, 10).translate(0, 0.007, 0), c: '#a49a86' }]), propHuman, false);
  instance('mill', P.windmillBody(), propHuman);
  const millBlades: THREE.Mesh[] = [];
  for (const p of placed.get('mill') ?? []) {
    const blades = new THREE.Mesh(P.windmillBlades(), propHuman);
    const hub = new THREE.Vector3(0.09, 0.27, 0).applyAxisAngle(vy, p.rot).multiplyScalar(p.s);
    blades.position.set(p.x + hub.x, p.y + hub.y, p.z + hub.z);
    blades.rotation.set(0, p.rot, 0);
    blades.scale.setScalar(p.s);
    blades.castShadow = true;
    millBlades.push(blades);
    root.add(blades);
  }
  instance('pod', P.aiPod(false), propAi);
  instance('pod', P.aiPodBand(false), aiGlowMat, false);
  instance('pod-tall', P.aiPod(true), propAi);
  instance('pod-tall', P.aiPodBand(true), aiGlowMat, false);
  instance('spire', P.aiSpire(), propAi);
  instance('spire', P.aiSpireCore(), aiGlowMat, false);
  instance('panel', P.aiPanel(), propAi);
  instance('mast', P.aiMast(), propAi);
  instance('ai-plate', P.merge([{ g: new THREE.CylinderGeometry(0.36, 0.38, 0.016, 6).translate(0, 0.008, 0), c: '#34333f' }]), propAi, false);
  instance('ai-plate', P.merge([{ g: new THREE.CylinderGeometry(0.385, 0.385, 0.006, 6, 1, true).translate(0, 0.016, 0), c: '#fff' }]), aiGlowMat, false);
  // 空に浮かぶ輪（AIの都市の尖塔の上。ターンでゆっくり回る）
  const halos: THREE.Mesh[] = [];
  for (const p of placed.get('spire') ?? []) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 4, 36).rotateX(Math.PI / 2), aiGlowMat);
    halo.position.set(p.x, p.y + 0.78, p.z);
    halos.push(halo);
    root.add(halo);
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
  const propDepot = track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.88, flatShading: true }), 'logistics');
  {
    const depotGeo = P.depot();
    const barrelGeo = P.barrel();
    for (const d of DEPOTS) {
      const [cx, cz] = centerXZ(...d.hex);
      const y = topY(...d.hex);
      const g = new THREE.Group();
      const barn = new THREE.Mesh(depotGeo, propDepot);
      barn.castShadow = barn.receiveShadow = true;
      g.add(barn);
      [[-0.36, 0.26], [-0.3, 0.3], [-0.38, 0.33], [0.05, 0.3]].forEach(([x, z], i) => {
        const b2 = new THREE.Mesh(barrelGeo, propDepot);
        b2.position.set(x, 0, z);
        b2.rotation.y = i;
        b2.castShadow = true;
        g.add(b2);
      });
      g.position.set(cx - 0.12, y, cz - 0.1);
      // 箱を積む場所（+x, +z 側）に荷を積む台が向くよう、少し回す
      g.rotation.y = 0.35;
      root.add(g);
    }
  }
  const CRATE_CAP = 18;
  const placesForCrates = [
    ...SETTLEMENTS.map((s) => ({ id: s.id, hex: s.hex, per: 55, dx: 0.62, dz: 0.48 })),
    ...DEPOTS.map((d) => ({ id: d.id, hex: d.hex, per: 25, dx: 0.3, dz: 0.22 })),
  ];
  const crateMat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.85, flatShading: true }), 'logistics');
  // 木箱：板の継ぎ目が見えるよう、箱に細い帯を巻いた形
  const crateGeo = P.merge([
    { g: new THREE.BoxGeometry(0.09, 0.09, 0.09).translate(0, 0.045, 0), c: '#b98a52' },
    { g: new THREE.BoxGeometry(0.094, 0.012, 0.094).translate(0, 0.02, 0), c: '#7a5636' },
    { g: new THREE.BoxGeometry(0.094, 0.012, 0.094).translate(0, 0.07, 0), c: '#7a5636' },
  ]);
  const crates = new THREE.InstancedMesh(crateGeo, crateMat, placesForCrates.length * CRATE_CAP);
  crates.castShadow = true;
  root.add(crates);
  const crateSlot = (k: number): [number, number, number] => {
    const layer = Math.floor(k / 6);
    const j = k % 6;
    return [(j % 3) * 0.1, layer * 0.092, Math.floor(j / 3) * 0.1];
  };

  // ---- 荷車 ----
  // 人の荷車：牛が引く四輪の荷馬車と御者。AIの荷車：動物も人もいない、自分で走る車。
  // 荷は種類で形が違う（食料＝幌の下の袋、木材＝丸太、鉱石＝石）。車輪と牛の脚は、進んだ距離だけ動く。
  const CS = 1.3; // 遠くからも読めるよう、実寸より大きく
  const cartHuman = track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.88, flatShading: true }), 'logistics');
  const cartAi = track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.55, metalness: 0.1, flatShading: true }), 'ai');
  const roverGlowMat = track(new THREE.MeshStandardMaterial({ color: '#2a2147', emissive: PALETTE.ai, emissiveIntensity: 1.8, roughness: 1 }), 'ai');
  const geos = {
    bed: P.wagonBed(),
    wheel: P.wheel(0.055, 0.02),
    ox: P.oxBody(),
    leg: P.oxLeg(),
    driver: P.driver(),
    cargo: { food: P.cargoOf('food'), wood: P.cargoOf('wood'), ore: P.cargoOf('ore') },
    rover: P.rover(),
    roverGlow: P.roverGlow(),
    roverWheel: P.wheel(0.036, 0.03, P.COL.aiDark),
    pod: { food: P.roverPod('food'), wood: P.roverPod('wood'), ore: P.roverPod('ore') },
  };
  const ringGeo = new THREE.RingGeometry(0.3, 0.35, 32).rotateX(-Math.PI / 2);
  type Cart = { g: THREE.Group; load: THREE.Object3D; wheels: THREE.Mesh[]; legs: THREE.Mesh[]; ox: THREE.Mesh | null; r: number };
  const carts = new Map<string, Cart>();
  for (const r of ROUTES) {
    const g = new THREE.Group();
    const ai = r.kind === 'ai';
    const mat = ai ? cartAi : cartHuman;
    const wheels: THREE.Mesh[] = [];
    const legs: THREE.Mesh[] = [];
    let load: THREE.Object3D;
    let ox: THREE.Mesh | null = null;
    if (!ai) {
      g.add(new THREE.Mesh(geos.bed, mat));
      for (const [x, z] of [[-0.11, 0.115], [-0.11, -0.115], [0.11, 0.115], [0.11, -0.115]]) {
        const w = new THREE.Mesh(geos.wheel, mat);
        w.position.set(x, 0.055, z);
        wheels.push(w);
        g.add(w);
      }
      ox = new THREE.Mesh(geos.ox, mat);
      ox.position.set(0.42, 0.06, 0);
      g.add(ox);
      for (const [x, z] of [[0.36, 0.035], [0.36, -0.035], [0.5, 0.035], [0.5, -0.035]]) {
        const leg = new THREE.Mesh(geos.leg, mat);
        leg.position.set(x, 0.11, z);
        legs.push(leg);
        g.add(leg);
      }
      const drv = new THREE.Mesh(geos.driver, mat);
      drv.position.set(0.12, 0.17, 0.03);
      g.add(drv);
      load = new THREE.Mesh(geos.cargo[r.cargo], mat);
      g.add(load);
    } else {
      g.add(new THREE.Mesh(geos.rover, mat), new THREE.Mesh(geos.roverGlow, roverGlowMat));
      for (const [x, z] of [[-0.12, 0.11], [-0.12, -0.11], [0.12, 0.11], [0.12, -0.11]]) {
        const w = new THREE.Mesh(geos.roverWheel, mat);
        w.position.set(x, 0.036, z);
        wheels.push(w);
        g.add(w);
      }
      load = new THREE.Mesh(geos.pod[r.cargo], mat);
      g.add(load);
      const ringMat = track(new THREE.MeshBasicMaterial({ color: PALETTE.ai, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }), 'ai');
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.012;
      g.add(ring);
    }
    g.scale.setScalar(CS);
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !((o as THREE.Mesh).material as THREE.Material).transparent) (o as THREE.Mesh).castShadow = true;
    });
    carts.set(r.id, { g, load, wheels, legs, ox, r: (ai ? 0.036 : 0.055) * CS });
    root.add(g);
  }

  // ---- 見張り塔・視界・柵 ----
  const stoneMat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.9, flatShading: true }), 'defense');
  const poleMat = track(new THREE.MeshStandardMaterial({ color: '#6b5640', roughness: 0.9 }), 'defense');
  const towerGeo = P.watchtower();
  for (const t of TOWERS) {
    const kind = settlement(t.by)!.kind;
    const [cx, cz] = centerXZ(...t.hex);
    const y = topY(...t.hex);
    const g = new THREE.Group();
    const body = new THREE.Mesh(towerGeo, stoneMat);
    body.castShadow = body.receiveShadow = true;
    const flagMat = track(new THREE.MeshBasicMaterial({ color: kind === 'ai' ? PALETTE.ai : PALETTE.human, side: THREE.DoubleSide }), 'defense');
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.09).translate(0.08, 0.95, 0), flagMat);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.26).translate(0, 0.92, 0), poleMat);
    g.add(body, flag, pole);
    g.position.set(cx + 0.45, y, cz - 0.2);
    g.scale.setScalar(1.5);
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
      // 光る窓や帯も、沈める・薄めるに合わせて暗くする
      if (t.ei !== null) t.mat.emissiveIntensity = t.ei * k;
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
    // 風車の羽根と、AIの都市の輪（ターンで回る）
    millBlades.forEach((b, i) => (b.rotation.x = st.turn * 0.9 + i));
    halos.forEach((h, i) => {
      h.rotation.y = st.turn * 0.25 + i;
      h.position.y = topY(...SETTLEMENTS.find((x) => x.kind === 'ai' && x.size === 'city')!.hex) + 0.79 + Math.sin(st.turn * 0.6) * 0.02;
    });
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
      // 進んだ距離（向きに沿った位置）から、車輪の回転と牛の歩みを決める（前のフレームを使わない）
      const along = x * dirV.x + z * dirV.z;
      const spin = c.moving ? -along / cart.r : 0;
      for (const w of cart.wheels) w.rotation.z = spin;
      cart.legs.forEach((leg, i) => (leg.rotation.z = c.moving ? Math.sin(along * 9 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.45 : 0));
      if (cart.ox) cart.ox.position.y = 0.06 + (c.moving ? Math.abs(Math.sin(along * 9)) * 0.005 : 0);
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
