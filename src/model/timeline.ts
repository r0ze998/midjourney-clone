// ツアーの台本と、各セクションの場面。どちらも時間（またはスクロール）だけから決まる。

import { top } from './hex';
import type { LayerWeights, View } from './render';
import { MAX_TURN } from './world';

export type Layer = 'none' | 'logistics' | 'defense' | 'ai';
export const LAYERS: Exclude<Layer, 'none'>[] = ['logistics', 'defense', 'ai'];

export const weightsOf = (layer: Layer): LayerWeights => ({
  logistics: layer === 'logistics' ? 1 : 0,
  defense: layer === 'defense' ? 1 : 0,
  ai: layer === 'ai' ? 1 : 0,
});

// ---- ツアー（約 46 秒で一周） ----

export type Beat = { t: number; layer: Layer; verify: number; caption: CaptionKey };
export type CaptionKey = 'overview' | 'logistics' | 'defense' | 'ai' | 'verify';

export const TOUR: Beat[] = [
  { t: 0, layer: 'none', verify: 0, caption: 'overview' },
  { t: 9, layer: 'logistics', verify: 0, caption: 'logistics' },
  { t: 19, layer: 'defense', verify: 0, caption: 'defense' },
  { t: 28, layer: 'ai', verify: 0, caption: 'ai' },
  { t: 37, layer: 'none', verify: 1, caption: 'verify' },
];
export const TOUR_LENGTH = 46;
/** ツアー中、1 秒あたりに進むターン */
export const TOUR_SPEED = 1.6;
/** 操作がこの秒数なければツアーに戻る（teardown の live.js と同じ） */
export const IDLE_RETURN = 25;
/** 層の切り替えにかける秒数 */
const BLEND = 0.7;

const ease = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  // cubic-bezier(0.65, 0, 0.35, 1) に近い、状態から状態への移り
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const lerpW = (a: LayerWeights, b: LayerWeights, k: number): LayerWeights => ({
  logistics: a.logistics + (b.logistics - a.logistics) * k,
  defense: a.defense + (b.defense - a.defense) * k,
  ai: a.ai + (b.ai - a.ai) * k,
});

export function tourAt(seconds: number, startTurn: number) {
  const t = ((seconds % TOUR_LENGTH) + TOUR_LENGTH) % TOUR_LENGTH;
  let i = TOUR.length - 1;
  while (i > 0 && TOUR[i].t > t) i--;
  const beat = TOUR[i];
  const prev = TOUR[(i - 1 + TOUR.length) % TOUR.length];
  const k = ease((t - beat.t) / BLEND);
  const next = TOUR[(i + 1) % TOUR.length];
  const nextAt = i + 1 < TOUR.length ? next.t : TOUR_LENGTH;
  return {
    turn: (startTurn + seconds * TOUR_SPEED) % MAX_TURN,
    layers: lerpW(weightsOf(prev.layer), weightsOf(beat.layer), k),
    verify: prev.verify + (beat.verify - prev.verify) * k,
    caption: beat.caption,
    beat: i,
    /** 次の層のボタンへカーソルを動かし始める（切り替えの 1.4 秒前から） */
    cursorTo: nextAt - t < 1.4 ? next.layer : null,
  };
}

// ---- セクションの場面 ----

export type SceneKey = 'hero' | 'why-1' | 'why-2' | 'why-3' | 'wylls' | 'name' | 'log' | 'company';

export type Scene = Omit<View, 'ax' | 'ay'> & { turn: [number, number] };

const at = (q: number, r: number, dx = 0, dy = 0): [number, number] => {
  const [x, y] = top(q, r);
  return [x + dx, y + dy];
};

const view = (c: [number, number], zoom: number, layer: Layer, extra: Partial<Scene> = {}, turn: [number, number] = [0, 0]): Scene => ({
  cx: c[0],
  cy: c[1],
  zoom,
  layers: weightsOf(layer),
  verify: 0,
  dim: 0,
  turn,
  ...extra,
});

export const SCENES: Record<Exclude<SceneKey, 'hero'>, Scene> = {
  // AIの層を取り出し、AIの村へ寄る
  'why-1': view(at(2, -1), 1.3, 'ai', {}, [20, 40]),
  // 人とAIの村のあいだを荷車が行き来する
  'why-2': view(at(0, 0), 1.18, 'logistics', {}, [40, 64]),
  // 着いた荷に「verified」の印
  'why-3': view(at(-1, 0), 1.25, 'logistics', { verify: 1, layers: { logistics: 0.45, defense: 0, ai: 0 } }, [64, 84]),
  // 荷車の道へ寄り、実際の画面を前に出すため地図を沈める
  wylls: view(at(-2, 1, 20, 0), 1.75, 'logistics', { dim: 0.55 }, [84, 96]),
  // 引いて全体。国境がすべて一枚に収まる
  name: view(at(0, 0), 0.92, 'defense', { layers: { logistics: 0, defense: 0.55, ai: 0 } }, [96, 118]),
  log: view(at(0, 0), 0.92, 'none', { dim: 0.78 }, [118, 120]),
  company: view(at(0, 0), 0.92, 'none', { dim: 0.88 }, [120, 120]),
};

export const HERO_VIEW = { cx: 0, cy: 0, zoom: 1 };

/** ワールドの中心を置く画面上の位置。デスクトップは右寄せ、スマホは上の窓 */
export function anchorFor(width: number, key: SceneKey): { ax: number; ay: number } {
  if (width < 768) return { ax: 0.5, ay: key === 'hero' ? 0.28 : 0.3 };
  return { ax: key === 'hero' ? 0.58 : 0.68, ay: key === 'hero' ? 0.46 : 0.52 };
}

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export { ease, lerpW };
