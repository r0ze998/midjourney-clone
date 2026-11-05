// カメラの視点。どれも state(turn) と視点の重みだけから決まる（純粋）。
// 「荷車に乗る」視点は、AIの荷車（East depot → Lamar）の後ろに付いて走る。

import * as THREE from 'three';
import { DEPOTS, SETTLEMENTS } from '../model/world';
import type { ModelState } from '../model/state';
import { VIEWS, type ViewWeights } from '../model/timeline';
import { centerXZ, from2D, groundAt, topY } from './world3d';
import { FLATTEN } from '../model/hex';

type Pose = { pos: THREE.Vector3; target: THREE.Vector3 };

const at = (id: string) => {
  const p = SETTLEMENTS.find((s) => s.id === id)?.hex ?? DEPOTS.find((d) => d.id === id)!.hex;
  const [x, z] = centerXZ(...p);
  return new THREE.Vector3(x, topY(...p), z);
};
const mid = (a: THREE.Vector3, b: THREE.Vector3) => a.clone().add(b).multiplyScalar(0.5);

/** 注視点・距離・天頂からの角度・方位角（度）から位置を出す */
function orbit(target: THREE.Vector3, dist: number, polar: number, az: number): Pose {
  const p = (polar * Math.PI) / 180;
  const a = (az * Math.PI) / 180;
  const pos = new THREE.Vector3(target.x + dist * Math.sin(p) * Math.sin(a), target.y + dist * Math.cos(p), target.z + dist * Math.sin(p) * Math.cos(a));
  return { pos, target: target.clone() };
}

export const RIDE_ROUTE = 'r7';

/**
 * 視点ごとの姿勢。aspect が縦長（スマホ）のときは引いて全体を収める。
 * orbitAz は訪問者がドラッグで回した分、spin は場面ごとのゆっくりした回転（度）。
 */
export function poseFor(views: ViewWeights, st: ModelState, aspect: number, orbitAz = 0, spin = 0): Pose {
  // 縦長（スマホ）は引いて全体を収める。引きすぎると模型が小さく読めないので 1.5 に
  const pull = aspect < 1 ? 1.5 : aspect < 1.4 ? 1.25 : 1;
  const az0 = -14 + orbitAz + spin;
  const poses: Record<string, Pose> = {
    overview: orbit(new THREE.Vector3(0.4, 0, 0.9), 50 * pull, 48, az0),
    trade: orbit(mid(at('lamar'), at('verde')).add(new THREE.Vector3(0, 0, 0.6)), 27 * pull, 46, az0 + 6),
    ai: orbit(mid(at('verde'), at('ashby')), 25 * pull, 43, az0 + 38),
    borders: orbit(new THREE.Vector3(0.4, 0, 0.5), 58 * pull, 8, az0 * 0.3),
    ride: ridePose(st, pull),
  };
  const pos = new THREE.Vector3();
  const target = new THREE.Vector3();
  let sum = 0;
  for (const v of VIEWS) {
    const w = views[v];
    if (w <= 0) continue;
    pos.addScaledVector(poses[v].pos, w);
    target.addScaledVector(poses[v].target, w);
    sum += w;
  }
  if (sum <= 0) return poses.overview;
  return { pos: pos.multiplyScalar(1 / sum), target: target.multiplyScalar(1 / sum) };
}

function ridePose(st: ModelState, pull: number): Pose {
  const cart = st.carts.find((c) => c.route === RIDE_ROUTE);
  if (!cart) return orbit(at('east'), 14, 50, 0);
  const [x, z] = from2D(cart.x, cart.y);
  const h = new THREE.Vector3(cart.hx, 0, cart.hy / FLATTEN).normalize();
  const base = new THREE.Vector3(x, groundAt(x, z) + 0.15, z);
  // 後ろ上から、少し横にずらして荷車と行き先が両方見えるように
  const side = new THREE.Vector3(-h.z, 0, h.x);
  const pos = base.clone().addScaledVector(h, -5.4 * pull).addScaledVector(side, 1.8).add(new THREE.Vector3(0, 3.1 * pull, 0));
  const target = base.clone().addScaledVector(h, 2.4).add(new THREE.Vector3(0, -0.15, 0));
  return { pos, target };
}
