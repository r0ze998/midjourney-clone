// 導入の机の上のレトロ PC 一式（ブラウン管のモニター・デスクトップの本体・キーボード・マウス・ケーブル）。
// すべてコードで組み立てる（画像や外部のモデルは使わない）。部品は材質ごとに一つの形にまとめて描く。
// 単位はおおよそメートル。+z が手前、y = DESK_Y が机の天板。画面そのもの（端末の絵）は intro3d で貼る。

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const DESK_Y = -0.25;
/** モニターの前面（ベゼルの一番手前）の位置。画面の中心は (0, screenY, screenZ)、大きさ 0.6 × 0.45（4:3） */
const MON = { x: 0, y: 0.4, z: 0.3 };
export const CRT = { screenY: MON.y, screenZ: MON.z - 0.036, screenW: 0.6, screenH: 0.45 };

type Mat = 'bezel' | 'shell' | 'case' | 'trim' | 'keyLight' | 'keyDark' | 'slot' | 'rubber' | 'mask' | 'cable' | 'metal';

const rbox = (w: number, h: number, d: number, r: number, x = 0, y = 0, z = 0, seg = 3) =>
  new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999).translate(x, y, z);
const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
/** 手前（+z）を向いた円柱 */
const knob = (r: number, d: number, x: number, y: number, z: number, seg = 28) =>
  new THREE.CylinderGeometry(r, r * 1.04, d, seg).rotateX(Math.PI / 2).translate(x, y, z + d / 2);

function roundedRect(s: THREE.Path, w: number, h: number, r: number, cx = 0, cy = 0, hole = false) {
  const x0 = cx - w / 2, y0 = cy - h / 2;
  const pts: [number, number][] = [];
  const corner = (ox: number, oy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]);
    }
  };
  corner(x0 + w - r, y0 + r, -Math.PI / 2);
  corner(x0 + w - r, y0 + h - r, 0);
  corner(x0 + r, y0 + h - r, Math.PI / 2);
  corner(x0 + r, y0 + r, Math.PI);
  if (hole) pts.reverse();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
}

/** 細かな凹凸と、うっすらした色むら（樹脂の肌）。256px を繰り返す */
function plasticBump() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const img = g.createImageData(256, 256);
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 120 + rnd() * 30;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

export function buildRetroPc() {
  const parts: Record<Mat, THREE.BufferGeometry[]> = {
    bezel: [], shell: [], case: [], trim: [], keyLight: [], keyDark: [], slot: [], rubber: [], mask: [], cable: [], metal: [],
  };
  const add = (m: Mat, g: THREE.BufferGeometry) => parts[m].push(g);

  // ================= モニター（ローカル：画面の中心が原点、ベゼルの前面が z = 0） =================
  const mon: Record<Mat, THREE.BufferGeometry[]> = {
    bezel: [], shell: [], case: [], trim: [], keyLight: [], keyDark: [], slot: [], rubber: [], mask: [], cable: [], metal: [],
  };
  const madd = (m: Mat, g: THREE.BufferGeometry) => mon[m].push(g);
  {
    // 前面の枠（ベゼル）：角の丸い外形に角の丸い窓。面取りで厚みを出す
    const bt = 0.012;
    const shape = new THREE.Shape();
    roundedRect(shape, 0.8 - bt * 2, 0.7 - bt * 2, 0.05, 0, -0.05);
    const hole = new THREE.Path();
    roundedRect(hole, 0.64 + bt * 2, 0.49 + bt * 2, 0.03, 0, 0, true);
    shape.holes.push(hole);
    const depth = 0.04;
    const bez = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bt, bevelSegments: 4, curveSegments: 6 });
    bez.translate(0, 0, -(depth + bt));
    madd('bezel', bez);
    // 窓の奥：ブラウン管のまわりの黒いマスク（面取りした窓の内側から画面へ）
    const ms = new THREE.Shape();
    roundedRect(ms, 0.66, 0.51, 0.03);
    const mh = new THREE.Path();
    roundedRect(mh, 0.605, 0.455, 0.035, 0, 0, true);
    ms.holes.push(mh);
    madd('mask', new THREE.ExtrudeGeometry(ms, { depth: 0.03, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -0.07));

    // 筐体：前から後ろへ、段を付けてすぼまる（ブラウン管の首）
    madd('shell', rbox(0.78, 0.68, 0.32, 0.045, 0, -0.05, -0.2));
    madd('shell', rbox(0.66, 0.58, 0.26, 0.07, 0, -0.07, -0.43));
    madd('shell', rbox(0.44, 0.4, 0.16, 0.06, 0, -0.1, -0.6));
    // 背中のネジと銘板
    for (const sx of [-0.15, 0.15]) madd('metal', knob(0.008, 0.004, sx, 0.02, -0.68, 12).rotateY(Math.PI).translate(0, 0, -1.36));
    // 上面の放熱スリット（2 か所）
    for (let i = 0; i < 22; i++) madd('slot', box(0.011, 0.006, 0.17, -0.315 + i * 0.03, 0.288, -0.22));
    for (let i = 0; i < 16; i++) madd('slot', box(0.011, 0.006, 0.14, -0.225 + i * 0.03, 0.218, -0.44));
    // 側面のスリット
    for (const sx of [-1, 1])
      for (let j = 0; j < 6; j++) madd('slot', box(0.006, 0.01, 0.16, sx * 0.39, -0.02 - j * 0.035, -0.22));
    // 前面の下：無地の銘板（文字なし）、つまみ 2 つ、電源ボタン
    madd('trim', rbox(0.15, 0.03, 0.008, 0.004, -0.24, -0.325, 0.002));
    madd('trim', knob(0.017, 0.012, 0.15, -0.33, -0.004));
    madd('trim', knob(0.017, 0.012, 0.205, -0.33, -0.004));
    for (const kx of [0.15, 0.205]) madd('slot', box(0.002, 0.016, 0.004, kx, -0.33, 0.009));
    madd('trim', rbox(0.045, 0.028, 0.014, 0.006, 0.29, -0.33, 0.003));
    // 首振りの台：本体の上の円盤と、モニターを受ける台座
    madd('trim', rbox(0.36, 0.075, 0.3, 0.02, 0, -0.425, -0.2));
  }

  // ================= 本体（デスクトップ型の箱） =================
  const C = { w: 0.96, h: 0.17, d: 0.66, z: 0.04 };
  const cy = DESK_Y + 0.012 + C.h / 2; // ゴム足の上
  const front = C.z + C.d / 2;
  add('case', rbox(C.w, C.h, C.d, 0.016, 0, cy, C.z));
  // 前面のパネル（わずかに出る）で継ぎ目の影を作る
  add('case', rbox(C.w - 0.02, C.h - 0.016, 0.018, 0.008, 0, cy, front + 0.002));
  const fz = front + 0.011;
  // 5.25 インチのドライブ
  add('trim', rbox(0.36, 0.062, 0.008, 0.004, -0.22, cy + 0.035, fz));
  add('slot', box(0.29, 0.008, 0.004, -0.235, cy + 0.04, fz + 0.004));
  add('trim', rbox(0.03, 0.014, 0.01, 0.003, -0.07, cy + 0.02, fz + 0.002));
  // 3.5 インチのドライブ
  add('trim', rbox(0.22, 0.04, 0.008, 0.004, -0.29, cy - 0.04, fz));
  add('slot', box(0.15, 0.006, 0.004, -0.3, cy - 0.036, fz + 0.004));
  add('trim', rbox(0.026, 0.012, 0.01, 0.003, -0.205, cy - 0.048, fz + 0.002));
  // 右側：吸気のスリットと電源スイッチ
  for (let i = 0; i < 6; i++) add('slot', box(0.2, 0.006, 0.004, 0.2, cy - 0.05 + i * 0.019, fz + 0.002));
  add('trim', rbox(0.05, 0.036, 0.016, 0.006, 0.4, cy - 0.01, fz + 0.004));
  // ゴム足
  for (const fx of [-0.42, 0.42]) for (const fz2 of [C.z - 0.27, C.z + 0.27]) add('rubber', new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16).translate(fx, DESK_Y + 0.006, fz2));
  // モニターの台の円盤
  const caseTop = cy + C.h / 2;
  add('trim', new THREE.CylinderGeometry(0.2, 0.205, 0.012, 48).translate(0, caseTop + 0.006, 0.1));

  // ================= キーボード =================
  const kb = { x: 0.0, z: 0.72, tilt: 0.085 };
  const kbParts: Record<'kbCase' | 'keyLight' | 'keyDark' | 'rubber', THREE.BufferGeometry[]> = { kbCase: [], keyLight: [], keyDark: [], rubber: [] };
  {
    const KW = 0.8, KD = 0.33, KH = 0.03;
    kbParts.kbCase.push(rbox(KW, KH, KD, 0.012, 0, KH / 2, 0));
    // 縁の段（キーの周りが一段低い）
    kbParts.kbCase.push(rbox(KW - 0.04, 0.004, KD - 0.05, 0.004, 0, KH + 0.001, 0.004));
    const u = 0.0485;
    const rows: { z: number; keys: (number | null)[]; dark: (w: number, i: number) => boolean }[] = [
      { z: 0.122, keys: [1.5, 1.25, 1.5, 6.5, 1.5, 1.25, 1.5], dark: (w) => w !== 6.5 },
      { z: 0.0735, keys: [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75], dark: (w) => w !== 1 },
      { z: 0.025, keys: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25], dark: (w) => w !== 1 },
      { z: -0.0235, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5], dark: (w) => w !== 1 },
      { z: -0.072, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], dark: (w, i) => w !== 1 || i === 0 },
      { z: -0.13, keys: [1, null, 1, 1, 1, 1, null, 1, 1, 1, 1, null, 1, 1, 1, 1], dark: () => true },
    ];
    const cache = new Map<number, THREE.BufferGeometry>();
    const cap = (w: number) => {
      if (cache.has(w)) return cache.get(w)!;
      const g = new RoundedBoxGeometry(w * u - 0.0065, 0.022, u - 0.0065, 2, 0.0055);
      // 上が少しすぼまるキーキャップ
      const p = g.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y > 0) {
          const k = (y / 0.011) * 0.0045;
          p.setX(i, p.getX(i) - Math.sign(p.getX(i)) * k);
          p.setZ(i, p.getZ(i) - Math.sign(p.getZ(i)) * k);
        }
      }
      g.computeVertexNormals();
      cache.set(w, g);
      return g;
    };
    for (const row of rows) {
      const total = row.keys.reduce<number>((a, k) => a + (k ?? 0.5), 0);
      let x = -(total * u) / 2;
      row.keys.forEach((k, i) => {
        const w = k ?? 0.5;
        if (k !== null) {
          const g = cap(k).clone().translate(x + (w * u) / 2, KH + 0.012 - (row.z + 0.15) * 0.02, row.z);
          (row.dark(k, i) ? kbParts.keyDark : kbParts.keyLight).push(g);
        }
        x += w * u;
      });
    }
    // 後ろの脚
    for (const sx of [-0.33, 0.33]) kbParts.rubber.push(box(0.05, 0.03, 0.02, sx, -0.012, -KD / 2 + 0.02));
  }
  const kbMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(kb.x, DESK_Y + 0.33 / 2 * Math.sin(kb.tilt), kb.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), kb.tilt),
    new THREE.Vector3(1, 1, 1),
  );
  for (const g of kbParts.kbCase) add('case', g.applyMatrix4(kbMatrix));
  for (const g of kbParts.keyLight) add('keyLight', g.applyMatrix4(kbMatrix));
  for (const g of kbParts.keyDark) add('keyDark', g.applyMatrix4(kbMatrix));
  for (const g of kbParts.rubber) add('rubber', g.applyMatrix4(kbMatrix));

  // ================= マウス =================
  {
    const mx = 0.6, mz = 0.74;
    const body = new RoundedBoxGeometry(0.066, 0.034, 0.11, 4, 0.016);
    const p = body.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      // 後ろが高い、手のひらに沿う形
      const z = p.getZ(i), y = p.getY(i);
      if (y > 0) p.setY(i, y - (z / 0.055) * 0.007);
    }
    body.computeVertexNormals();
    add('case', body.translate(mx, DESK_Y + 0.017, mz));
    add('slot', box(0.002, 0.004, 0.04, mx, DESK_Y + 0.036, mz - 0.03));
    add('slot', box(0.066, 0.004, 0.002, mx, DESK_Y + 0.033, mz - 0.008));
  }

  // ================= ケーブル =================
  const tube = (pts: [number, number, number][], r: number) =>
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 64, r, 8, false);
  add('cable', tube([[0, DESK_Y + 0.035, kb.z - 0.165], [-0.05, DESK_Y + 0.008, kb.z - 0.22], [-0.25, DESK_Y + 0.006, kb.z - 0.27], [-0.43, DESK_Y + 0.006, front + 0.07], [-0.47, DESK_Y + 0.04, front + 0.01]], 0.0055));
  add('cable', tube([[0.6, DESK_Y + 0.01, 0.685], [0.6, DESK_Y + 0.005, 0.6], [0.55, DESK_Y + 0.005, 0.48], [0.47, DESK_Y + 0.04, front + 0.02]], 0.004));

  // ================= 材質 =================
  const bump = plasticBump();
  const plastic = (color: string, rough = 0.58) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, bumpMap: bump, bumpScale: 0.35 });
  const mats: Record<Mat, THREE.MeshStandardMaterial> = {
    bezel: plastic('#cdc2a5'),
    shell: plastic('#c3b798', 0.62),
    case: plastic('#c9bd9f'),
    trim: plastic('#aea284', 0.55),
    keyLight: plastic('#dcd3bc', 0.5),
    keyDark: plastic('#a59b83', 0.52),
    slot: new THREE.MeshStandardMaterial({ color: '#0d0c0a', roughness: 0.95 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.95 }),
    mask: new THREE.MeshStandardMaterial({ color: '#0b0b0a', roughness: 0.85 }),
    cable: new THREE.MeshStandardMaterial({ color: '#3a3832', roughness: 0.7 }),
    metal: new THREE.MeshStandardMaterial({ color: '#8b8b86', roughness: 0.45, metalness: 0.3 }),
  };

  const flat = (list: THREE.BufferGeometry[]) => {
    if (!list.length) return null;
    const ok = list.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') n.deleteAttribute(k);
      return n;
    });
    return mergeGeometries(ok, false);
  };

  const group = new THREE.Group();
  const shadowy: Mat[] = ['bezel', 'shell', 'case', 'trim', 'keyLight', 'keyDark', 'cable', 'rubber'];
  const meshOf = (m: Mat, list: THREE.BufferGeometry[], parent: THREE.Object3D) => {
    const g = flat(list);
    if (!g) return;
    const mesh = new THREE.Mesh(g, mats[m]);
    mesh.castShadow = shadowy.includes(m);
    // 枠の窓の内側は、細かい影がギザギザに出るので受けない
    mesh.receiveShadow = m !== 'bezel' && m !== 'mask';
    parent.add(mesh);
  };
  for (const m of Object.keys(parts) as Mat[]) meshOf(m, parts[m], group);
  const monitor = new THREE.Group();
  monitor.position.set(MON.x, MON.y, MON.z);
  for (const m of Object.keys(mon) as Mat[]) meshOf(m, mon[m], monitor);
  group.add(monitor);

  // ランプ類（光る材質。intro3d が明るさを変える）
  const ledMat = new THREE.MeshBasicMaterial({ color: '#163a22' });
  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 12).rotateX(Math.PI / 2), ledMat);
  led.position.set(MON.x + 0.29, MON.y - 0.305, MON.z + 0.003);
  const hddMat = new THREE.MeshBasicMaterial({ color: '#3a2a0c' });
  const hdd = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.005, 0.004), hddMat);
  hdd.position.set(0.4, cy + 0.03, fz + 0.004);
  group.add(led, hdd);

  // 接地の影：本体・キーボード・マウスの下に、ぼかした暗がり
  const contact = (w: number, d: number, x: number, z: number, a: number) => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    grd.addColorStop(0, `rgba(0,0,0,${a})`);
    grd.addColorStop(0.55, `rgba(0,0,0,${a * 0.6})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    );
    m.position.set(x, DESK_Y + 0.0005, z);
    m.renderOrder = 1;
    return m;
  };
  group.add(contact(1.25, 0.95, 0, C.z, 0.75), contact(0.98, 0.46, kb.x, kb.z, 0.6), contact(0.13, 0.17, 0.6, 0.74, 0.6));

  function setLights(screenOn: boolean, hddOn: boolean) {
    ledMat.color.set(screenOn ? '#7dffb0' : '#163a22');
    hddMat.color.set(hddOn ? '#ffb347' : '#3a2a0c');
  }

  function dispose() {
    bump.dispose();
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      const mm = m.material as THREE.MeshBasicMaterial;
      mm.map?.dispose();
      mm.dispose();
    });
  }

  return { group, setLights, dispose };
}
