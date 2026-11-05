// ツアーの台本と、各セクションの場面。どちらも時間（またはスクロール）だけから決まる純粋な関数。
// 同じ台本が、サイトの自動ツアーと、書き出す映像（film）の両方を動かす。

import { MAX_TURN } from './world';

export type Layer = 'none' | 'logistics' | 'defense' | 'ai';
export const LAYERS: Exclude<Layer, 'none'>[] = ['logistics', 'defense', 'ai'];
export type LayerWeights = { logistics: number; defense: number; ai: number };

export type ViewKey = 'overview' | 'trade' | 'ai' | 'borders' | 'ride';
export const VIEWS: ViewKey[] = ['overview', 'trade', 'ai', 'borders', 'ride'];

export const weightsOf = (layer: Layer): LayerWeights => ({
  logistics: layer === 'logistics' ? 1 : 0,
  defense: layer === 'defense' ? 1 : 0,
  ai: layer === 'ai' ? 1 : 0,
});

export type CaptionKey = 'overview' | 'logistics' | 'ride' | 'defense' | 'ai' | 'verify';

/** ツアーの一拍。t 秒から次の拍まで、この層・視点・字幕を保つ */
export type Beat = { t: number; layer: Layer; view: ViewKey; verify: number; caption: CaptionKey };

export const TOUR: Beat[] = [
  { t: 0, layer: 'none', view: 'overview', verify: 0, caption: 'overview' },
  { t: 5, layer: 'logistics', view: 'trade', verify: 0, caption: 'logistics' },
  { t: 11, layer: 'ai', view: 'ride', verify: 0, caption: 'ride' },
  { t: 16.5, layer: 'defense', view: 'borders', verify: 0, caption: 'defense' },
  { t: 22, layer: 'ai', view: 'ai', verify: 0, caption: 'ai' },
  { t: 27, layer: 'none', view: 'overview', verify: 1, caption: 'verify' },
];
export const TOUR_LENGTH = 32;
/** ツアー中、1 秒あたりに進むターン */
export const TOUR_SPEED = 2.2;
export const TOUR_START_TURN = 20;
/** 操作がこの秒数なければツアーに戻る（teardown の live.js と同じ） */
export const IDLE_RETURN = 25;
/** 状態の移りにかける秒数 */
const BLEND = 1.1;

/** cubic-bezier(0.65, 0, 0.35, 1) に近い、状態から状態への移り */
export const ease = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerpW = (a: LayerWeights, b: LayerWeights, k: number): LayerWeights => ({
  logistics: lerp(a.logistics, b.logistics, k),
  defense: lerp(a.defense, b.defense, k),
  ai: lerp(a.ai, b.ai, k),
});

/** 視点の重み（足すと 1）。カメラはこの重みで姿勢を混ぜる */
export type ViewWeights = Record<ViewKey, number>;
export const viewOnly = (v: ViewKey): ViewWeights => ({ overview: 0, trade: 0, ai: 0, borders: 0, ride: 0, [v]: 1 });
export const lerpV = (a: ViewWeights, b: ViewWeights, k: number): ViewWeights =>
  Object.fromEntries(VIEWS.map((v) => [v, lerp(a[v], b[v], k)])) as ViewWeights;

export type TourFrame = {
  turn: number;
  layers: LayerWeights;
  views: ViewWeights;
  verify: number;
  caption: CaptionKey;
  beat: number;
  layer: Layer;
  view: ViewKey;
  /** 次に押すボタン（切り替えの 1.4 秒前から） */
  cursorTo: { layer?: Layer; view?: ViewKey } | null;
  /** カーソルの動き（書き出し用、時間だけから決まる）。from のボタンから to のボタンへ k で移り、press で押す */
  cursorPath: { from: { layer?: Layer; view?: ViewKey }; to: { layer?: Layer; view?: ViewKey }; k: number; press: number } | null;
};

export function tourAt(seconds: number, startTurn = TOUR_START_TURN): TourFrame {
  const t = ((seconds % TOUR_LENGTH) + TOUR_LENGTH) % TOUR_LENGTH;
  let i = TOUR.length - 1;
  while (i > 0 && TOUR[i].t > t) i--;
  const beat = TOUR[i];
  const prev = TOUR[(i - 1 + TOUR.length) % TOUR.length];
  const k = ease((t - beat.t) / BLEND);
  const next = TOUR[(i + 1) % TOUR.length];
  const nextAt = i + 1 < TOUR.length ? next.t : TOUR_LENGTH;
  const soon = nextAt - t < 1.4;
  const target = (b: Beat, from: Beat) => ({ layer: b.layer !== from.layer ? b.layer : undefined, view: b.view !== from.view ? b.view : undefined });
  const toNext = target(next, beat);
  const toHere = target(beat, prev);
  // 押した後 0.5 秒は、押したボタンの上に残る
  const cursorPath = soon
    ? { from: toHere, to: toNext, k: ease((t - (nextAt - 1.4)) / 0.8), press: Math.max(0, 1 - Math.abs(t - (nextAt - 0.12)) / 0.12) }
    : t - beat.t < 0.5 && i > 0
      ? { from: toHere, to: toHere, k: 1, press: 0 }
      : null;
  return {
    turn: (startTurn + seconds * TOUR_SPEED) % MAX_TURN,
    layers: lerpW(weightsOf(prev.layer), weightsOf(beat.layer), k),
    views: lerpV(viewOnly(prev.view), viewOnly(beat.view), k),
    verify: lerp(prev.verify, beat.verify, k),
    caption: beat.caption,
    beat: i,
    layer: beat.layer,
    view: beat.view,
    cursorTo: soon ? toNext : null,
    cursorPath,
  };
}

/** 書き出す映像の拍（秒）。音もこれを読む */
export const filmBeats = () => TOUR.map((b) => ({ t: b.t, caption: b.caption, layer: b.layer, view: b.view }));

// ---- セクションの場面 ----

export type SceneKey = 'hero' | 'why-1' | 'why-2' | 'why-3' | 'wylls' | 'name' | 'log' | 'company';

export type Scene = { view: ViewKey; layers: LayerWeights; verify: number; dim: number; turn: number; spin: number };

const scene = (view: ViewKey, layer: Layer, turn: number, extra: Partial<Scene> = {}): Scene => ({
  view,
  layers: weightsOf(layer),
  verify: 0,
  dim: 0,
  turn,
  spin: 0,
  ...extra,
});

export const SCENES: Record<Exclude<SceneKey, 'hero'>, Scene> = {
  // AIの層を取り出し、AIの区画へ寄る
  'why-1': scene('ai', 'ai', 22),
  // 荷車に乗って、人とAIの村のあいだを行く
  'why-2': scene('ride', 'logistics', 40),
  // 着いた荷に「verified」の輪
  'why-3': scene('trade', 'none', 62, { verify: 1, layers: { logistics: 0.45, defense: 0, ai: 0 } }),
  // 引いて沈め、実際の画面を前に出す
  wylls: scene('overview', 'none', 84, { dim: 0.6 }),
  // 真上から。国境がすべて一枚に収まり、時間とともに広がる
  // 社名の項は球体の模型が主役。後ろの盤は沈めて、描くのも止める（WorldStage が model.globeActive を見る）
  name: scene('overview', 'none', 100, { dim: 0.98, spin: 30 }),
  log: scene('overview', 'none', 116, { dim: 0.75, spin: 40 }),
  company: scene('overview', 'none', 120, { dim: 0.93, spin: 60 }),
};

/** ワールドの中心を置く画面上の位置。デスクトップは右寄せ、スマホは上の窓 */
export function anchorFor(width: number, key: SceneKey): { ax: number; ay: number } {
  if (width < 1024) return { ax: 0.5, ay: key === 'hero' ? 0.27 : 0.28 };
  // xl 以上のヒーローは右に計器があるので、模型を中央寄りに置く
  if (key === 'hero') return { ax: width >= 1280 ? 0.545 : 0.62, ay: 0.5 };
  return { ax: 0.66, ay: 0.5 };
}
