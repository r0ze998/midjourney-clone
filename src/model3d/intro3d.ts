// 導入の 3D の場面：暗い部屋の机、卓上ランプの灯り、ブラウン管のレトロ PC（retroPc.ts）。
// 画面には terminal.ts の絵を貼り、その上に映り込みのガラスを重ねる。カメラと光は時刻 t だけで決まる（純粋）。

import * as THREE from 'three';
import { buildRetroPc, CRT, DESK_Y } from './retroPc';
import { T, drawRain } from './terminal';

export { CRT };

const clamp = (x: number) => Math.max(0, Math.min(1, x));
/** ゆっくり動き出して、ゆっくり止まる（寄りのカメラ用） */
const smoother = (x: number) => {
  const t = clamp(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

const hashFlick = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type Intro3D = ReturnType<typeof buildIntro>;

/** 机の木目（コードで描く） */
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3a271a';
  g.fillRect(0, 0, 512, 512);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 140; i++) {
    const y = rnd() * 512;
    const amp = 2 + rnd() * 6;
    const ph = rnd() * 6;
    g.strokeStyle = `rgba(${rnd() < 0.5 ? '20,12,6' : '90,62,40'},${0.12 + rnd() * 0.22})`;
    g.lineWidth = 0.6 + rnd() * 2.2;
    g.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const yy = y + Math.sin(x / 70 + ph) * amp + Math.sin(x / 23 + ph * 2) * amp * 0.25;
      if (x === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1.2);
  t.anisotropy = 4;
  return t;
}

/**
 * 画面のガラスに映る、ごく暗い部屋（6 面の小さな絵のキューブ）。左上にランプの暖かい光、右に窓のような冷たい明かり。
 * PMREM で作るより、低性能の端末でずっと軽い。
 */
function reflectionCube() {
  const S = 64;
  // 面の順：+x, -x, +y, -y, +z, -z。各面に置く光（中心 0..1、半径、色、強さ）
  const blobs: [number, number, number, string, number][][] = [
    [[0.35, 0.45, 0.35, '#9fb4cc', 0.35]], // 右：窓
    [[0.3, 0.25, 0.22, '#ffcf96', 0.9]], // 左：ランプ
    [[0.25, 0.75, 0.25, '#ffcf96', 0.55]], // 上
    [[0.5, 0.5, 0.6, '#2a2620', 0.5]], // 下：机
    [[0.2, 0.2, 0.25, '#ffcf96', 0.7]], // 手前（画面から見て、見る人の側）
    [[0.5, 0.5, 0.5, '#0a0a0a', 0.2]],
  ];
  const faces = blobs.map((list) => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d')!;
    g.fillStyle = '#030303';
    g.fillRect(0, 0, S, S);
    for (const [x, y, r, col, a] of list) {
      const grd = g.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S);
      const cc = new THREE.Color(col);
      grd.addColorStop(0, `rgba(${cc.r * 255 | 0},${cc.g * 255 | 0},${cc.b * 255 | 0},${a})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, S, S);
    }
    return c;
  });
  const cube = new THREE.CubeTexture(faces);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.needsUpdate = true;
  return cube;
}

export function buildIntro(screen: HTMLCanvasElement, renderer: THREE.WebGLRenderer, opts: { lowPower?: boolean } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#020302');
  scene.fog = new THREE.Fog('#020302', 4.5, 11);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const envCube = reflectionCube();

  // ---- 光：卓上ランプ（左上の暖色、影を落とす）、画面の緑の照り返し、ごく弱い環境光 ----
  const amb = new THREE.HemisphereLight('#3c4a5a', '#080604', 0.22);
  const head = new THREE.Vector3(-0.78, 0.82, 0.62);
  const lamp = new THREE.SpotLight('#ffd2a0', 0, 6, 0.72, 0.8, 1.4);
  lamp.position.copy(head);
  lamp.target.position.set(0.05, DESK_Y, 0.35);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(opts.lowPower ? 1024 : 1536, opts.lowPower ? 1024 : 1536);
  // 物も光の位置も動かないので、影は最初の 1 回だけ描く
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  lamp.shadow.bias = -0.0004;
  lamp.shadow.normalBias = 0.02;
  lamp.shadow.radius = 3;
  lamp.shadow.camera.near = 0.2;
  lamp.shadow.camera.far = 4;
  lamp.shadow.focus = 0.6;
  // ランプの傘の内側から部屋へこぼれる弱い光
  const spill = new THREE.PointLight('#ffb978', 0, 3.5, 1.8);
  spill.position.copy(head).add(new THREE.Vector3(0, 0.12, 0));
  const glow = new THREE.PointLight('#7dffb0', 0, 1.8, 2);
  // 画面より下・手前に置いて、ガラスに光の点が映らないように
  glow.position.set(0, CRT.screenY - 0.42, CRT.screenZ + 0.32);
  scene.add(amb, lamp, lamp.target, spill, glow);

  // ---- PC 一式 ----
  const pc = buildRetroPc();
  scene.add(pc.group);

  // ---- 机：木目の天板と、手前の木口 ----
  const wood = woodTexture();
  const deskMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.62 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 1.7), deskMat);
  desk.position.set(0, DESK_Y - 0.025, 0.3);
  desk.receiveShadow = true;
  // 奥の壁（わずかに青い、ランプの光が届く）
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshStandardMaterial({ color: '#151719', roughness: 1 }));
  wall.position.set(0, 1.2, -0.6);
  wall.receiveShadow = true;
  scene.add(desk, wall);

  // ---- 奥の壁一面に MATRIX のコードの雨（ブラウン管が点くと、世界が目を覚ますように降り出す） ----
  const rainCanvas = document.createElement('canvas');
  rainCanvas.width = opts.lowPower ? 384 : 640;
  rainCanvas.height = rainCanvas.width / 2;
  const rg = rainCanvas.getContext('2d')!;
  let lastRain = -1;
  const rainTex = new THREE.CanvasTexture(rainCanvas);
  rainTex.colorSpace = THREE.SRGBColorSpace;
  const rainMat = new THREE.MeshBasicMaterial({ map: rainTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: '#000000' });
  const rainWall = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), rainMat);
  rainWall.position.set(0, 0.75, -0.58);
  scene.add(rainWall);

  // ---- ネオン：壁の右に紫の縦の管、モニターの後ろから緑の縁取りの光 ----
  const neonMat = new THREE.MeshBasicMaterial({ color: '#000000', toneMapped: false });
  const neon = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.85, 4, 10), neonMat);
  neon.position.set(0.8, 0.42, -0.55);
  const violet = new THREE.PointLight('#b54dff', 0, 3.2, 1.6);
  violet.position.set(0.85, 0.6, -0.35);
  const rim = new THREE.PointLight('#38ff8c', 0, 2.6, 1.5);
  rim.position.set(-0.2, 0.75, -0.95);
  scene.add(neon, violet, rim);

  // ---- 卓上ランプ：重い台、2 本の腕、金属の傘、電球 ----
  const lampMat = new THREE.MeshStandardMaterial({ color: '#23231f', roughness: 0.42, metalness: 0.25 });
  const base = new THREE.Vector3(-0.92, DESK_Y, 0.05);
  const elbow = new THREE.Vector3(-0.98, 0.55, -0.05);
  const arm = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), lampMat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    return m;
  };
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.03, 32), lampMat);
  lampBase.position.copy(base).add(new THREE.Vector3(0, 0.015, 0));
  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), lampMat);
  joint.position.copy(elbow);
  const shadeGeo = new THREE.CylinderGeometry(0.05, 0.16, 0.2, 32, 1, true).translate(0, -0.1, 0);
  const shade = new THREE.Mesh(shadeGeo, new THREE.MeshStandardMaterial({ color: '#26302b', roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }));
  shade.position.copy(head).add(new THREE.Vector3(0, 0.1, 0));
  shade.lookAt(lamp.target.position);
  shade.rotateX(-Math.PI / 2);
  shade.castShadow = false;
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#2a2016' });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), bulbMat);
  bulb.position.copy(head).add(new THREE.Vector3(0, 0.05, 0));
  const lampGroup = new THREE.Group();
  lampGroup.add(lampBase, arm(base.clone().setY(DESK_Y + 0.03), elbow, 0.011), joint, arm(elbow, head.clone().add(new THREE.Vector3(0, 0.12, 0)), 0.01), shade, bulb);
  scene.add(lampGroup);

  // ---- 画面：少し膨らんだ面に、端末の絵。その上に映り込みのガラス ----
  const tex = new THREE.CanvasTexture(screen);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const bulge = (g: THREE.PlaneGeometry, k: number) => {
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / (CRT.screenW / 2);
      const y = pos.getY(i) / (CRT.screenH / 2);
      pos.setZ(i, k * (1 - x * x * 0.85) * (1 - y * y * 0.85));
    }
    g.computeVertexNormals();
    return g;
  };
  const screenMesh = new THREE.Mesh(bulge(new THREE.PlaneGeometry(CRT.screenW, CRT.screenH, 24, 18), 0.022), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screenMesh.position.set(0, CRT.screenY, CRT.screenZ);
  // ガラス：色は黒、映り込みと光沢だけを足し合わせる
  // 光源の点は映さず、部屋（envCube）だけを映す
  const glassMat = new THREE.MeshBasicMaterial({
    color: '#000000',
    envMap: envCube,
    combine: THREE.AddOperation,
    reflectivity: 0.6,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const glass = new THREE.Mesh(bulge(new THREE.PlaneGeometry(CRT.screenW + 0.012, CRT.screenH + 0.012, 24, 18), 0.024), glassMat);
  glass.position.set(0, CRT.screenY, CRT.screenZ + 0.002);
  glass.renderOrder = 2;
  scene.add(screenMesh, glass);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 30);
  const target = new THREE.Vector3();
  const wideT = new THREE.Vector3();
  const pWide = new THREE.Vector3();
  const pMid = new THREE.Vector3();
  const pEnd = new THREE.Vector3();
  const curve = new THREE.QuadraticBezierCurve3(pWide, pMid, pEnd);
  const screenC = new THREE.Vector3(0, CRT.screenY, CRT.screenZ);

  /** 時刻 t の場面に合わせる。aspect は描く枠の縦横比 */
  function update(t: number, aspect: number) {
    // ランプが灯る（ちらついてから）。電球と傘からこぼれる光も一緒に
    const on = t < T.lamp ? 0 : 1;
    const flick = t < T.lamp + 0.35 ? (Math.sin(t * 83) > -0.2 ? 1 : 0.25) * (Math.sin(t * 37) > 0 ? 1 : 0.6) : 1;
    const lk = on * flick * (0.55 + 0.45 * clamp((t - T.lamp) / 0.5));
    lamp.intensity = 7 * lk;
    spill.intensity = 0.55 * lk;
    // ガラスの映り込みは、部屋が明るくなってから
    glassMat.reflectivity = 0.6 * lk;
    bulbMat.color.setRGB(0.16 + 0.84 * lk, 0.12 + 0.68 * lk, 0.08 + 0.42 * lk);
    // ブラウン管が点くと、緑の照り返しがキーボードと机に
    const sk = clamp((t - T.powerOn) / 0.5);
    glow.intensity = 0.32 * sk;
    // 紫のネオンは、ジジッと瞬いてから灯る
    const nt = t - 1.5;
    const nk = nt < 0 ? 0 : nt < 0.45 ? (hashFlick(Math.floor(nt * 24)) > 0.45 ? 1 : 0.08) : 1;
    neonMat.color.setRGB(0.85 * nk, 0.35 * nk, 1.0 * nk);
    violet.intensity = 0.9 * nk;
    // 緑の縁取りと、壁のコードの雨
    rim.intensity = 1.6 * sk;
    const rk = clamp((t - T.powerOn - 0.2) / 2.2);
    // 壁の雨は 1 秒に 20 回だけ描き直す（時刻を 20 分の 1 秒に丸めるので、t だけで決まるのは同じ）
    const rf = Math.floor(t * 20);
    if (rk > 0 && t < T.pushEnd + 0.3 && rf !== lastRain) {
      lastRain = rf;
      rg.fillStyle = '#000';
      rg.fillRect(0, 0, rainCanvas.width, rainCanvas.height);
      drawRain(rg, rainCanvas.width, rainCanvas.height, rf / 20, { size: rainCanvas.width / 64, density: 0.75, seed: 9 });
      rainTex.needsUpdate = true;
    }
    rainMat.color.setScalar(0.7 * rk);
    pc.setLights(t >= T.powerOn - 0.15, t >= T.bootStart && t < T.bootEnd && Math.sin(t * 31) * Math.sin(t * 7.3) > 0.05);
    tex.needsUpdate = true;

    camera.aspect = aspect;
    // 縦長（スマホ）は引いて、PC と机の幅が入るように
    const pull = aspect < 0.8 ? 1.8 : aspect < 1.25 ? 1.35 : 1;
    // 1) 遠景：斜め上から PC 全体。ほとんど止まったまま、ごくわずかに回り込む
    const drift = clamp(t / T.pushStart);
    pWide.set((1.2 - 0.16 * drift) * pull, 0.72 + 0.24 * pull, 2.5 * pull + 0.25 - 0.1 * drift);
    wideT.set(0, 0.06, 0.3);
    // 2) 寄り：遠景から画面の正面いっぱいへ、ゆっくり（滑らかに動き出して、滑らかに止まる）
    const halfFov = (camera.fov * Math.PI) / 360;
    const fillH = CRT.screenH / 2 / Math.tan(halfFov);
    const fillW = CRT.screenW / 2 / (Math.tan(halfFov) * aspect);
    const fill = Math.max(fillH, fillW) * 0.92;
    pEnd.set(0, CRT.screenY, CRT.screenZ + fill);
    pMid.set(0.35 * Math.min(pull, 1.4), CRT.screenY + 0.12, CRT.screenZ + 1.15 * Math.min(pull, 1.6));
    const k = smoother((t - T.pushStart) / (T.pushEnd - T.pushStart));
    curve.getPoint(k, camera.position);
    target.copy(wideT).lerp(screenC, smoother((t - T.pushStart) / ((T.pushEnd - T.pushStart) * 0.7)));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }

  function dispose() {
    tex.dispose();
    wood.dispose();
    rainTex.dispose();
    envCube.dispose();
    pc.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
  }

  return { scene, camera, update, dispose };
}

