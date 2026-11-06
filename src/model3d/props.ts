// 模型の建物と荷車の形。すべてコードで組み立てる（画像や外部のモデルは使わない）。
// どの形も「部品の形＋部品の色」を一つの形にまとめ、頂点の色で塗る。同じ形はインスタンスで何度も置く。
// 向き：+x が正面（荷車は +x へ進む）。高さ 0 が地面。

import * as THREE from 'three';

export type Part = { g: THREE.BufferGeometry; c: string | THREE.Color };

/** 部品をまとめて一つの形に（面ごとの法線、頂点の色） */
export function merge(parts: Part[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const color = new THREE.Color();
  for (const { g: g0, c } of parts) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    g.computeVertexNormals();
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    color.set(c as THREE.ColorRepresentation);
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      col.push(color.r, color.g, color.b);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

// ---- 小さな部品 ----
const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
const cyl = (rt: number, rb: number, h: number, seg: number, x = 0, y = 0, z = 0) => new THREE.CylinderGeometry(rt, rb, h, seg, 1).translate(x, y + h / 2, z);
const cone = (r: number, h: number, seg: number, x = 0, y = 0, z = 0) => new THREE.ConeGeometry(r, h, seg, 1).translate(x, y + h / 2, z);

/** 切妻屋根：棟が x 方向。幅 w（x）、奥行き d（z、ひさし込み）、高さ h。下端が y */
function gable(w: number, d: number, h: number, y: number, x = 0, z = 0) {
  const g = new THREE.BufferGeometry();
  const hw = w / 2, hd = d / 2;
  // 正面と背面の三角形、左右の屋根の面（4 枚の三角形）
  const v = [
    // 屋根の面（+z 側）
    -hw, y, hd, hw, y, hd, hw, y + h, 0,
    -hw, y, hd, hw, y + h, 0, -hw, y + h, 0,
    // 屋根の面（-z 側）
    hw, y, -hd, -hw, y, -hd, -hw, y + h, 0,
    hw, y, -hd, -hw, y + h, 0, hw, y + h, 0,
    // 妻（+x と -x）
    hw, y, hd, hw, y, -hd, hw, y + h, 0,
    -hw, y, -hd, -hw, y, hd, -hw, y + h, 0,
    // 軒裏
    -hw, y, hd, -hw, y, -hd, hw, y, -hd,
    -hw, y, hd, hw, y, -hd, hw, y, hd,
  ];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.translate(x, 0, z);
  return g;
}

// ---- 色 ----
export const COL = {
  plaster: '#ddd3bd',
  plaster2: '#cfc3a6',
  timber: '#5b4330',
  stone: '#9c968a',
  stone2: '#7f7a70',
  roofHuman: '#b04a30',
  roofHuman2: '#8f3b27',
  thatch: '#c49a52',
  door: '#3a2a1e',
  wood: '#7a5636',
  wood2: '#5f4129',
  canvas: '#e6dcc3',
  rope: '#b39b72',
  slate: '#3a3f4a',
  aiShell: '#cfd2dc',
  aiShell2: '#a9adbd',
  aiRoof: '#5d4bb8',
  aiDark: '#2b2a3a',
  panel: '#1f2a45',
  hay: '#d8b25a',
  ox: '#7a5a3e',
  ox2: '#4e3a29',
  horn: '#e8dfca',
  skin: '#d9a77f',
  cloth: '#5a6b8c',
  iron: '#3b3d42',
};

// ---- 人の家 ----

/** 小さな家：漆喰の壁、木の帯、切妻屋根、煙突、戸口 */
export function cottage(roof = COL.roofHuman) {
  return merge([
    { g: box(0.26, 0.03, 0.2, 0, 0, 0), c: COL.stone2 }, // 土台
    { g: box(0.24, 0.15, 0.18, 0, 0.03, 0), c: COL.plaster },
    { g: box(0.245, 0.018, 0.185, 0, 0.1, 0), c: COL.timber }, // 胴差し
    { g: box(0.018, 0.15, 0.186, -0.11, 0.03, 0), c: COL.timber }, // 柱
    { g: box(0.018, 0.15, 0.186, 0.11, 0.03, 0), c: COL.timber },
    { g: gable(0.29, 0.25, 0.13, 0.18), c: roof },
    { g: box(0.3, 0.012, 0.03, 0, 0.307, 0), c: COL.roofHuman2 }, // 棟
    { g: box(0.035, 0.11, 0.035, 0.07, 0.22, 0.05), c: COL.stone }, // 煙突
    { g: box(0.002, 0.075, 0.045, 0.121, 0.03, -0.03), c: COL.door }, // 戸口（正面）
  ]);
}

/** 長屋：横に長い家と、草葺きの屋根 */
export function longhouse() {
  return merge([
    { g: box(0.42, 0.03, 0.2, 0, 0, 0), c: COL.stone2 },
    { g: box(0.4, 0.13, 0.18, 0, 0.03, 0), c: COL.plaster2 },
    ...[-0.18, -0.06, 0.06, 0.18].map((x) => ({ g: box(0.016, 0.13, 0.186, x, 0.03, 0), c: COL.timber })),
    { g: gable(0.46, 0.26, 0.15, 0.16), c: COL.thatch },
    { g: box(0.002, 0.07, 0.05, 0.201, 0.03, 0.02), c: COL.door },
  ]);
}

/** 集会所：二階建てと、角の小塔 */
export function hall(roof = COL.roofHuman) {
  return merge([
    { g: box(0.42, 0.04, 0.32, 0, 0, 0), c: COL.stone2 },
    { g: box(0.38, 0.14, 0.28, 0, 0.04, 0), c: COL.stone },
    { g: box(0.385, 0.02, 0.285, 0, 0.18, 0), c: COL.timber },
    { g: box(0.36, 0.12, 0.26, 0, 0.2, 0), c: COL.plaster },
    { g: gable(0.42, 0.34, 0.17, 0.32), c: roof },
    { g: box(0.43, 0.014, 0.034, 0, 0.484, 0), c: COL.roofHuman2 },
    // 角の小塔
    { g: cyl(0.06, 0.065, 0.42, 8, -0.17, 0, 0.12), c: COL.stone },
    { g: cone(0.085, 0.18, 8, -0.17, 0.42, 0.12), c: roof },
    { g: box(0.002, 0.1, 0.07, 0.191, 0.04, 0), c: COL.door },
  ]);
}

/** 家の窓（光る。家と同じ置き方で、別の光る材質で描く） */
export function windowsOf(kind: 'cottage' | 'longhouse' | 'hall') {
  const w = (x: number, y: number, z: number, axis: 'x' | 'z') =>
    axis === 'x' ? box(0.003, 0.032, 0.026, x, y, z) : box(0.026, 0.032, 0.003, x, y, z);
  if (kind === 'cottage') return merge([{ g: w(0.121, 0.06, 0.04, 'x'), c: '#fff' }, { g: w(-0.05, 0.06, 0.091, 'z'), c: '#fff' }, { g: w(0.05, 0.06, 0.091, 'z'), c: '#fff' }, { g: w(0, 0.06, -0.091, 'z'), c: '#fff' }]);
  if (kind === 'longhouse') return merge([-0.12, 0, 0.12].flatMap((x) => [{ g: w(x, 0.065, 0.091, 'z'), c: '#fff' }, { g: w(x, 0.065, -0.091, 'z'), c: '#fff' }]));
  return merge([-0.1, 0, 0.1].flatMap((z) => [{ g: w(0.181, 0.23, z, 'x'), c: '#fff' }]).concat([-0.1, 0.1].map((x) => ({ g: w(x, 0.23, 0.131, 'z'), c: '#fff' }))));
}

/** 井戸 */
export function well() {
  return merge([
    { g: cyl(0.07, 0.075, 0.06, 10), c: COL.stone },
    { g: cyl(0.05, 0.05, 0.062, 10, 0, 0.001), c: '#1d2a30' },
    { g: box(0.012, 0.13, 0.012, -0.06, 0.06, 0), c: COL.wood2 },
    { g: box(0.012, 0.13, 0.012, 0.06, 0.06, 0), c: COL.wood2 },
    { g: gable(0.16, 0.12, 0.05, 0.18), c: COL.roofHuman2 },
  ]);
}

/** 市場の屋台（色の違う日よけ） */
export function stall(awning: string) {
  return merge([
    { g: box(0.13, 0.05, 0.08), c: COL.wood },
    ...[[-0.06, -0.035], [0.06, -0.035], [-0.06, 0.035], [0.06, 0.035]].map(([x, z]) => ({ g: box(0.008, 0.12, 0.008, x, 0, z), c: COL.wood2 })),
    { g: gable(0.15, 0.11, 0.035, 0.12), c: awning },
    { g: box(0.03, 0.025, 0.03, -0.03, 0.05, 0), c: COL.hay },
    { g: box(0.025, 0.02, 0.025, 0.025, 0.05, 0.01), c: '#9a4a3a' },
  ]);
}

/** 干し草の山 */
export const haystack = () => merge([{ g: new THREE.SphereGeometry(0.06, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.2, 1), c: COL.hay }]);

/** 村人（とても小さい） */
export function person(cloth = COL.cloth) {
  return merge([
    { g: cone(0.018, 0.05, 6), c: cloth },
    { g: new THREE.SphereGeometry(0.011, 6, 4).translate(0, 0.058, 0), c: COL.skin },
  ]);
}

/** 石垣の一区画（長さ 1。胸壁つき） */
export function wallSegment() {
  return merge([
    { g: box(1, 0.11, 0.09), c: COL.stone2 },
    { g: box(1, 0.016, 0.1, 0, 0.11), c: COL.stone },
    ...[-0.375, -0.125, 0.125, 0.375].map((x) => ({ g: box(0.13, 0.04, 0.09, x, 0.126), c: COL.stone })),
  ]);
}

/** 門の両脇の塔 */
export const gatePost = () =>
  merge([
    { g: box(0.11, 0.2, 0.11), c: COL.stone },
    { g: box(0.125, 0.02, 0.125, 0, 0.2), c: COL.stone2 },
    { g: cone(0.095, 0.1, 4, 0, 0.22).rotateY(Math.PI / 4), c: COL.roofHuman2 },
  ]);

/** 風車：建物（羽根は別） */
export function windmillBody() {
  return merge([
    { g: cyl(0.06, 0.085, 0.3, 8), c: COL.plaster },
    { g: cone(0.08, 0.1, 8, 0, 0.3), c: COL.thatch },
    { g: box(0.002, 0.06, 0.035, 0.083, 0, 0), c: COL.door },
  ]);
}
/** 風車の羽根（+x に向けて立つ。x 軸まわりに回す） */
export function windmillBlades() {
  const blade = (a: number) => new THREE.BoxGeometry(0.004, 0.2, 0.04).translate(0, 0.11, 0.008).rotateX(a);
  return merge([
    { g: new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6).rotateZ(Math.PI / 2), c: COL.wood2 },
    ...[0, 1, 2, 3].map((k) => ({ g: blade((k * Math.PI) / 2), c: COL.canvas })),
  ]);
}

// ---- AIの村 ----

/** 六角の住まい：明るい殻、紫に光る帯（帯は窓と同じく光る材質で別に描く） */
export function aiPod(tall = false) {
  const h = tall ? 0.3 : 0.17;
  return merge([
    { g: cyl(0.12, 0.13, 0.025, 6), c: COL.aiDark },
    { g: cyl(0.1, 0.11, h, 6, 0, 0.025), c: COL.aiShell },
    { g: cyl(0.105, 0.1, 0.02, 6, 0, 0.025 + h), c: COL.aiShell2 },
    { g: cone(0.1, 0.06, 6, 0, 0.045 + h), c: COL.aiRoof },
    { g: box(0.002, 0.07, 0.05, 0.103, 0.025, 0), c: COL.aiDark },
  ]);
}
export function aiPodBand(tall = false) {
  const h = tall ? 0.3 : 0.17;
  return merge([{ g: new THREE.CylinderGeometry(0.107, 0.107, 0.014, 6, 1, true).translate(0, 0.025 + h * 0.62, 0), c: '#fff' }]);
}

/** 尖塔（AIの都市の中心） */
export function aiSpire() {
  return merge([
    { g: cyl(0.2, 0.22, 0.05, 6), c: COL.aiDark },
    { g: cyl(0.09, 0.15, 0.55, 6, 0, 0.05), c: COL.aiShell },
    { g: cyl(0.04, 0.09, 0.4, 6, 0, 0.6), c: COL.aiShell2 },
    { g: cone(0.04, 0.16, 6, 0, 1.0), c: COL.aiRoof },
  ]);
}
export function aiSpireCore() {
  return merge([
    { g: new THREE.CylinderGeometry(0.152, 0.152, 0.03, 6, 1, true).translate(0, 0.2, 0), c: '#fff' },
    { g: new THREE.CylinderGeometry(0.122, 0.122, 0.03, 6, 1, true).translate(0, 0.42, 0), c: '#fff' },
    { g: new THREE.OctahedronGeometry(0.05, 0).translate(0, 0.86, 0), c: '#fff' },
  ]);
}

/** 薄い板（受ける面） */
export function aiPanel() {
  return merge([
    { g: box(0.012, 0.06, 0.012), c: COL.iron },
    { g: new THREE.BoxGeometry(0.14, 0.008, 0.09).rotateZ(-0.5).translate(0, 0.07, 0), c: COL.panel },
  ]);
}

/** アンテナの柱 */
export function aiMast() {
  return merge([
    { g: box(0.05, 0.02, 0.05), c: COL.aiDark },
    { g: cyl(0.006, 0.01, 0.34, 5, 0, 0.02), c: COL.aiShell2 },
    { g: box(0.08, 0.006, 0.006, 0, 0.26), c: COL.aiShell2 },
    { g: box(0.06, 0.006, 0.006, 0, 0.31), c: COL.aiShell2 },
  ]);
}

// ---- 倉庫 ----

export function depot() {
  return merge([
    { g: box(0.7, 0.04, 0.5), c: COL.stone2 },
    { g: box(0.62, 0.28, 0.42, 0, 0.04, 0), c: '#a37d4f' },
    ...[-0.29, -0.1, 0.1, 0.29].map((x) => ({ g: box(0.02, 0.28, 0.425, x, 0.04, 0), c: COL.wood2 })),
    { g: gable(0.7, 0.54, 0.22, 0.32), c: '#6a4a2c' },
    { g: box(0.72, 0.016, 0.04, 0, 0.536, 0), c: COL.wood2 },
    // 大きな戸（正面）
    { g: box(0.004, 0.2, 0.18, 0.312, 0.04, 0), c: '#4a3423' },
    { g: box(0.006, 0.01, 0.2, 0.314, 0.15, 0), c: COL.wood },
    // 荷を積む台
    { g: box(0.18, 0.05, 0.46, 0.4, 0, 0), c: COL.wood },
    // 腕木（荷を吊る）
    { g: box(0.025, 0.42, 0.025, 0.46, 0.05, -0.2), c: COL.wood2 },
    { g: box(0.25, 0.02, 0.02, 0.56, 0.44, -0.2), c: COL.wood2 },
    { g: box(0.003, 0.16, 0.003, 0.67, 0.28, -0.2), c: COL.rope },
    { g: box(0.05, 0.04, 0.05, 0.67, 0.24, -0.2), c: '#b98a52' },
  ]);
}

export function barrel() {
  return merge([
    { g: cyl(0.035, 0.035, 0.08, 8), c: COL.wood },
    { g: cyl(0.037, 0.037, 0.008, 8, 0, 0.012), c: COL.iron },
    { g: cyl(0.037, 0.037, 0.008, 8, 0, 0.06), c: COL.iron },
  ]);
}

// ---- 見張り塔 ----

export function watchtower() {
  return merge([
    { g: cyl(0.12, 0.13, 0.05, 8), c: COL.stone2 },
    { g: cyl(0.085, 0.105, 0.5, 8, 0, 0.05), c: COL.stone },
    { g: cyl(0.108, 0.108, 0.018, 8, 0, 0.2), c: COL.stone2 },
    { g: cyl(0.096, 0.096, 0.018, 8, 0, 0.4), c: COL.stone2 },
    { g: cyl(0.14, 0.12, 0.05, 8, 0, 0.55), c: COL.stone2 },
    ...Array.from({ length: 8 }, (_, k) => {
      const a = (k / 8) * Math.PI * 2;
      return { g: box(0.04, 0.04, 0.03, Math.cos(a) * 0.125, 0.6, Math.sin(a) * 0.125).rotateY(0), c: COL.stone };
    }),
    { g: cone(0.15, 0.16, 8, 0, 0.66), c: COL.roofHuman2 },
    { g: box(0.002, 0.05, 0.03, 0.105, 0.3, 0), c: COL.door },
  ]);
}

// ---- 荷車 ----

/** 車輪（x-y 平面に立ち、z 軸まわりに回す）。輪・こしき・幅木 */
export function wheel(r: number, w: number, tint = COL.wood2) {
  return merge([
    { g: new THREE.TorusGeometry(r * 0.86, r * 0.14, 4, 12), c: tint },
    { g: new THREE.CylinderGeometry(r * 0.2, r * 0.2, w * 1.4, 8).rotateX(Math.PI / 2), c: COL.iron },
    ...[0, 1, 2, 3].map((k) => ({ g: new THREE.BoxGeometry(r * 1.6, r * 0.12, w * 0.6).rotateZ((k * Math.PI) / 4), c: tint })),
  ]);
}

/** 人の荷車の荷台（板張りの箱と、牛へ伸びる轅） */
export function wagonBed() {
  return merge([
    { g: box(0.36, 0.025, 0.2, 0, 0.07, 0), c: COL.wood },
    { g: box(0.36, 0.06, 0.012, 0, 0.095, 0.094), c: COL.wood2 },
    { g: box(0.36, 0.06, 0.012, 0, 0.095, -0.094), c: COL.wood2 },
    { g: box(0.012, 0.06, 0.2, -0.174, 0.095, 0), c: COL.wood2 },
    { g: box(0.012, 0.05, 0.2, 0.174, 0.095, 0), c: COL.wood2 },
    // 車軸
    { g: box(0.02, 0.02, 0.26, -0.11, 0.045, 0), c: COL.iron },
    { g: box(0.02, 0.02, 0.26, 0.11, 0.045, 0), c: COL.iron },
    // 轅（ながえ）
    { g: box(0.26, 0.014, 0.014, 0.3, 0.07, 0.04), c: COL.wood2 },
    { g: box(0.26, 0.014, 0.014, 0.3, 0.07, -0.04), c: COL.wood2 },
    // 御者の座席
    { g: box(0.05, 0.02, 0.18, 0.13, 0.15, 0), c: COL.wood2 },
  ]);
}

/** 御者（座っている） */
export function driver() {
  return merge([
    { g: box(0.045, 0.018, 0.04, 0.02, 0, 0), c: '#6b4a3a' }, // 腿
    { g: box(0.03, 0.045, 0.04, -0.005, 0.012, 0), c: COL.cloth }, // 胴
    { g: new THREE.SphereGeometry(0.016, 6, 4).translate(-0.003, 0.075, 0), c: COL.skin },
    { g: cone(0.026, 0.016, 8, -0.003, 0.084), c: COL.hay }, // 笠
  ]);
}

/** 牛（体・肩のこぶ・頭・耳・角・鼻先・尾）。脚は別にして歩かせる。+x が頭 */
export function oxBody() {
  const coat = '#a57c55', coat2 = '#8d6646', face = '#7d5a3e';
  return merge([
    { g: box(0.17, 0.075, 0.095, -0.01, 0.045, 0), c: coat }, // 胴
    { g: box(0.12, 0.02, 0.085, -0.02, 0.12, 0), c: coat2 }, // 背
    { g: box(0.06, 0.03, 0.08, 0.06, 0.115, 0), c: coat2 }, // 肩のこぶ
    { g: box(0.08, 0.06, 0.07, 0.085, 0.06, 0), c: coat2 }, // 首
    { g: box(0.065, 0.055, 0.06, 0.135, 0.06, 0).rotateZ(-0.25), c: face }, // 頭
    { g: box(0.03, 0.03, 0.05, 0.172, 0.045, 0), c: '#e2c9b0' }, // 鼻先
    { g: box(0.012, 0.02, 0.04, 0.12, 0.1, 0.045), c: face }, // 耳
    { g: box(0.012, 0.02, 0.04, 0.12, 0.1, -0.045), c: face },
    { g: cone(0.008, 0.045, 5).rotateX(Math.PI / 2 - 0.4).translate(0.125, 0.125, 0.04), c: COL.horn }, // 角
    { g: cone(0.008, 0.045, 5).rotateX(-Math.PI / 2 + 0.4).translate(0.125, 0.125, -0.04), c: COL.horn },
    { g: box(0.028, 0.028, 0.13, 0.07, 0.135, 0), c: COL.wood2 }, // くびき
    { g: box(0.01, 0.07, 0.01, -0.1, 0.06, 0).rotateZ(0.25), c: coat2 }, // 尾
  ]);
}
// 脚：付け根（y = 0）から地面まで 0.11。付け根で回して歩かせる
export const oxLeg = () => merge([{ g: box(0.022, 0.1, 0.022, 0, -0.1, 0), c: '#6b4d34' }, { g: box(0.025, 0.012, 0.025, 0, -0.11, 0), c: '#3a2a1e' }]);

/** 荷：食料（幌の下に袋）、木材（丸太）、鉱石（石） */
export function cargoOf(kind: 'food' | 'wood' | 'ore') {
  if (kind === 'food')
    return merge([
      ...[-0.1, 0, 0.1].map((x) => ({ g: new THREE.IcosahedronGeometry(0.05, 0).scale(1, 0.75, 1).translate(x, 0.13, 0.03), c: '#c9a86a' })),
      ...[-0.05, 0.05].map((x) => ({ g: new THREE.IcosahedronGeometry(0.048, 0).scale(1, 0.75, 1).translate(x, 0.13, -0.04), c: '#b8935a' })),
      // 幌
      // 幌：荷台の上に半円の屋根（軸は x。θ を π〜2π にすると上に弧ができる）
      { g: new THREE.CylinderGeometry(0.105, 0.105, 0.3, 9, 1, true, Math.PI, Math.PI).rotateZ(-Math.PI / 2).translate(-0.03, 0.1, 0), c: COL.canvas },
      ...[-0.17, 0.11].map((x) => ({ g: new THREE.TorusGeometry(0.105, 0.006, 3, 9, Math.PI).rotateY(Math.PI / 2).translate(x, 0.1, 0), c: COL.wood2 })),
    ]);
  if (kind === 'wood')
    return merge(
      [[-0.05, 0.135, 0.045], [-0.05, 0.135, -0.045], [-0.05, 0.135, 0], [-0.05, 0.175, 0.022], [-0.05, 0.175, -0.022]].map(([x, y, z]) => ({
        g: new THREE.CylinderGeometry(0.024, 0.024, 0.4, 7).rotateZ(Math.PI / 2).translate(x, y, z),
        c: COL.wood,
      })),
    );
  return merge(
    [[-0.1, 0.03], [0, -0.04], [0.08, 0.03], [-0.04, 0.05], [0.05, -0.03], [-0.02, 0]].map(([x, z], i) => ({
      g: new THREE.DodecahedronGeometry(0.045 + (i % 3) * 0.008, 0).translate(x, 0.125 + (i === 5 ? 0.04 : 0), z),
      c: i % 2 ? '#8e949b' : '#a3a9af',
    })),
  );
}

/** AIの荷車：動物も人もいない、自分で走る車。低い車体、車輪の覆い、前の傾いた鼻先、感知の柱 */
export function rover() {
  return merge([
    // 車台
    { g: box(0.4, 0.035, 0.19, 0, 0.04, 0), c: COL.aiDark },
    // 車体（明るい殻）。後ろが荷台、前が鼻先
    { g: box(0.3, 0.05, 0.17, -0.03, 0.075, 0), c: COL.aiShell },
    { g: gable(0.12, 0.17, 0.05, 0.075, 0.15, 0).rotateY(0), c: COL.aiShell2 },
    // 鼻先の黒い面（窓のない「目」）
    { g: box(0.004, 0.022, 0.12, 0.2, 0.082, 0), c: COL.panel },
    // 車輪の覆い（左右）
    ...[-0.12, 0.12].flatMap((x) => [
      { g: box(0.1, 0.02, 0.03, x, 0.075, 0.1), c: COL.aiShell2 },
      { g: box(0.1, 0.02, 0.03, x, 0.075, -0.1), c: COL.aiShell2 },
    ]),
    // 感知の柱
    { g: cyl(0.006, 0.009, 0.13, 5, 0.1, 0.125, 0.055), c: COL.aiShell2 },
    { g: box(0.03, 0.012, 0.03, 0.1, 0.125, 0.055), c: COL.aiDark },
  ]);
}
export function roverGlow() {
  return merge([
    { g: box(0.302, 0.008, 0.172, -0.03, 0.111, 0), c: '#fff' }, // 殻の縁の帯
    { g: new THREE.SphereGeometry(0.014, 6, 4).translate(0.1, 0.262, 0.055), c: '#fff' }, // 柱の先
    { g: box(0.004, 0.008, 0.1, 0.203, 0.086, 0), c: '#fff' }, // 目の光
  ]);
}
/** AIの荷車の荷の箱（積んでいるときだけ） */
export function roverPod(kind: 'food' | 'wood' | 'ore') {
  const tint = kind === 'ore' ? '#9aa1a8' : kind === 'wood' ? '#a8743f' : '#d9b44a';
  return merge([
    { g: box(0.19, 0.07, 0.14, -0.07, 0.125, 0), c: COL.aiShell2 },
    { g: box(0.194, 0.012, 0.144, -0.07, 0.15, 0), c: tint }, // 荷の種類の色の帯
    { g: box(0.17, 0.01, 0.12, -0.07, 0.195, 0), c: COL.aiShell },
  ]);
}

// ---- 導入のブラウン管の PC（画面そのものは intro3d で別に貼る） ----
// 画面の中心は (0, 0.64, 0.31)、大きさは 0.6 × 0.45（4:3）。+z が手前
export const CRT = { screenY: 0.64, screenZ: 0.3, screenW: 0.6, screenH: 0.45 };

export function crtMonitor() {
  const beige = '#b8ae96', beige2 = '#a39a83', beige3 = '#8f8771', dark = '#1c1a16';
  return merge([
    // 本体の箱（前面）と、後ろへすぼまる背中
    // 前面は z = 0.29 まで（画面の面より奥）。画面のまわりは下の縁の 4 枚で囲む
    { g: box(0.82, 0.68, 0.36, 0, 0.28, 0.11), c: beige },
    { g: box(0.68, 0.56, 0.3, 0, 0.33, -0.17), c: beige2 },
    { g: box(0.5, 0.42, 0.18, 0, 0.39, -0.4), c: beige3 },
    // 画面のまわりの縁（ベゼル）：上下左右の 4 枚
    { g: box(0.76, 0.06, 0.03, 0, 0.88, 0.32), c: beige },
    { g: box(0.76, 0.1, 0.03, 0, 0.3, 0.32), c: beige },
    { g: box(0.08, 0.5, 0.03, -0.34, 0.39, 0.32), c: beige },
    { g: box(0.08, 0.5, 0.03, 0.34, 0.39, 0.32), c: beige },
    // 画面の奥の黒い枠
    { g: box(0.64, 0.49, 0.01, 0, 0.375, 0.282), c: dark },
    // 前面の下：ロゴの札とつまみ、電源ランプ
    { g: box(0.12, 0.02, 0.005, -0.24, 0.33, 0.336), c: beige3 },
    { g: cyl(0.014, 0.014, 0.01, 10, 0.26, 0.33, 0.33).rotateX(Math.PI / 2).translate(0, 0, 0), c: beige3 },
    // 台（チルトの脚）
    { g: box(0.5, 0.06, 0.48, 0, 0, 0.02), c: beige2 },
    { g: box(0.36, 0.22, 0.3, 0, 0.06, 0.02), c: beige3 },
    // 本体（PC の箱）：モニターの下に敷く
    { g: box(0.98, 0.16, 0.7, 0, -0.17, 0.06), c: beige },
    { g: box(0.3, 0.012, 0.005, -0.18, -0.09, 0.412), c: dark }, // フロッピーの口
    { g: box(0.3, 0.012, 0.005, -0.18, -0.13, 0.412), c: dark },
    { g: box(0.04, 0.03, 0.006, 0.36, -0.12, 0.412), c: beige3 }, // 電源スイッチ
  ]);
}
/** 電源ランプ（光る材質で別に描く） */
export const crtLed = () => merge([{ g: box(0.018, 0.012, 0.006, 0.28, -0.12, 0.413), c: '#fff' }]);

export function keyboard() {
  const beige = '#cdc4ad', key = '#ddd5c0', key2 = '#bdb39b';
  const parts: Part[] = [{ g: box(0.86, 0.035, 0.28, 0, 0, 0).rotateX(-0.06), c: beige }];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 14; c++) {
      const x = -0.37 + c * 0.057 + (r % 2) * 0.012;
      const z = -0.09 + r * 0.058;
      parts.push({ g: box(0.046, 0.022, 0.046, x, 0.03 - r * 0.004, z), c: c === 0 || c === 13 ? key2 : key });
    }
  parts.push({ g: box(0.36, 0.022, 0.046, 0.02, 0.014, 0.14), c: key }); // スペース
  return merge(parts);
}
