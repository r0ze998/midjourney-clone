// 導入の 3D の場面：暗い部屋の机、ランプの灯り、ブラウン管の PC。画面には terminal.ts の絵を貼る。
// カメラは時刻 t だけで決まる（純粋）。

import * as THREE from 'three';
import * as P from './props';
import { T } from './terminal';

const ease = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export type Intro3D = ReturnType<typeof buildIntro>;

export function buildIntro(screen: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#020302');
  scene.fog = new THREE.Fog('#020302', 3.5, 9);

  // 光：ランプ（左上の暖色）、画面の緑の照り返し、ごく弱い環境光
  const amb = new THREE.HemisphereLight('#4a5a6a', '#050505', 0.35);
  const lamp = new THREE.PointLight('#ffc98a', 0, 6, 1.6);
  lamp.position.set(-1.25, 1.35, 0.9);
  lamp.castShadow = false;
  const glow = new THREE.PointLight('#7dffb0', 0, 2.4, 2);
  glow.position.set(0, P.CRT.screenY, P.CRT.screenZ + 0.35);
  scene.add(amb, lamp, glow);

  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.78, flatShading: true });
  const monitor = new THREE.Mesh(P.crtMonitor(), mat);
  const led = new THREE.Mesh(P.crtLed(), new THREE.MeshBasicMaterial({ color: '#7dffb0' }));
  const kb = new THREE.Mesh(P.keyboard(), mat);
  kb.position.set(0.02, -0.25, 0.86);
  kb.rotation.y = -0.05;
  // 机：濃い木の板
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 2.2), new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.7 }));
  desk.position.set(0, -0.29, 0.35);
  // ランプの傘（光源の位置に）
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#1c1c1a', roughness: 0.6, side: THREE.DoubleSide }));
  shade.position.set(-1.25, 1.45, 0.9);
  shade.rotation.z = -0.5;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.7, 6), new THREE.MeshStandardMaterial({ color: '#1c1c1a' }));
  arm.position.set(-1.38, 0.6, 0.8);
  arm.rotation.z = 0.08;
  // 奥の壁
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshStandardMaterial({ color: '#0d0f10', roughness: 1 }));
  wall.position.set(0, 1.2, -1.2);
  scene.add(monitor, led, kb, desk, shade, arm, wall);

  // 画面：少し膨らんだ面に、端末の絵を貼る
  const tex = new THREE.CanvasTexture(screen);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sg = new THREE.PlaneGeometry(P.CRT.screenW, P.CRT.screenH, 24, 18);
  const pos = sg.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (P.CRT.screenW / 2);
    const y = pos.getY(i) / (P.CRT.screenH / 2);
    pos.setZ(i, 0.022 * (1 - x * x) * (1 - y * y));
  }
  sg.computeVertexNormals();
  const screenMesh = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screenMesh.position.set(0, P.CRT.screenY, P.CRT.screenZ);
  scene.add(screenMesh);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 30);
  const target = new THREE.Vector3();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();

  /** 時刻 t の場面に合わせる。aspect は描く枠の縦横比 */
  function update(t: number, aspect: number) {
    // ランプが灯る（ちらついてから）
    const on = t < T.lamp ? 0 : 1;
    const flick = t < T.lamp + 0.25 ? (Math.sin(t * 90) > 0 ? 1 : 0.3) : 1;
    lamp.intensity = 2.4 * on * flick;
    glow.intensity = t >= T.bootStart ? 0.28 : 0;
    tex.needsUpdate = true;

    camera.aspect = aspect;
    // 縦長（スマホ）は引いて、PC 全体が入るように
    const pull = aspect < 1 ? 1.9 : aspect < 1.4 ? 1.25 : 1;
    // 寄り：斜め上の遠景 → 正面 → 画面いっぱい
    const k1 = ease((t - 0.2) / 1.5); // 遠景から正面へ
    const k2 = ease((t - 1.6) / (T.logsStart - 1.6)); // 正面から画面へ（打たれる文字が読めるよう、早めに寄る）
    v0.set(0.95 * pull, 1.05 + 0.25 * pull, 2.55 * pull);
    v1.set(0.12, 0.78, 1.75 * Math.min(pull, 1.5));
    camera.position.lerpVectors(v0, v1, k1);
    // 画面を埋める距離（高さで合わせる。縦長は幅で）
    const halfFov = (camera.fov * Math.PI) / 360;
    const fillH = P.CRT.screenH / 2 / Math.tan(halfFov);
    const fillW = P.CRT.screenW / 2 / (Math.tan(halfFov) * aspect);
    const fill = Math.max(fillH, fillW) * 0.92;
    v0.copy(camera.position);
    v1.set(0, P.CRT.screenY, P.CRT.screenZ + fill);
    camera.position.lerpVectors(v0, v1, k2);
    target.set(0, 0.42, 0).lerp(new THREE.Vector3(0, P.CRT.screenY, P.CRT.screenZ), Math.max(k1 * 0.6, k2));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }

  function dispose() {
    tex.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
  }

  return { scene, camera, update, dispose };
}
