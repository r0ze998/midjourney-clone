// 模型の操作の状態。描画のループと、ヒーローの操作部品（スライダー・層のボタン・読み値）が共有する。
// 毎フレームの値は React の状態にせず、ここに置く。操作部品へは 1 秒に 8 回まで知らせる。

import type { CaptionKey, Layer } from './timeline';
import type { ModelState } from './state';

export type Mode = 'tour' | 'user';

type Snapshot = {
  mode: Mode;
  turn: number;
  layer: Layer;
  caption: CaptionKey;
  cursorTo: Layer | null;
  readout: ModelState['readout'];
  stocks: ModelState['stocks'];
  /** 動きを止めているか（段 0） */
  still: boolean;
};

const listeners = new Set<() => void>();

export const model = {
  mode: 'tour' as Mode,
  userTurn: 42,
  userLayer: 'none' as Layer,
  /** ツアーを始めた（または再開した）時刻 ms と、そのときのターン */
  tourStart: 0,
  tourTurn: 24,
  lastInput: 0,
  still: false,
  snapshot: {
    mode: 'tour',
    turn: 0,
    layer: 'none',
    caption: 'overview',
    cursorTo: null,
    readout: { moving: 0, aiDecisions: 0, aiShare: 0, defended: 0 },
    stocks: {},
    still: false,
  } as Snapshot,
};

let lastEmit = 0;
export function publish(next: Snapshot, force = false) {
  const now = performance.now();
  if (!force && now - lastEmit < 125) return;
  lastEmit = now;
  model.snapshot = next;
  listeners.forEach((l) => l());
}

export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getSnapshot = () => model.snapshot;

/** 訪問者が触った：ツアーから操作を渡す */
export function takeControl(patch: { turn?: number; layer?: Layer }) {
  if (model.mode === 'tour') {
    model.userTurn = model.snapshot.turn;
    model.userLayer = model.snapshot.layer;
  }
  model.mode = 'user';
  if (patch.turn !== undefined) model.userTurn = patch.turn;
  if (patch.layer !== undefined) model.userLayer = patch.layer;
  model.lastInput = performance.now();
  // すぐに知らせる。遅れると、スライダーが古い値で描き直され、その値で change が届いてしまう
  publish({ ...model.snapshot, mode: 'user', turn: model.userTurn, layer: model.userLayer }, true);
  wake();
}

/** 止まった段でも、操作したときだけ描き直すための合図 */
let waker: (() => void) | null = null;
export const onWake = (fn: () => void) => {
  waker = fn;
  return () => {
    if (waker === fn) waker = null;
  };
};
export const wake = () => waker?.();

export function resumeTour(now: number) {
  model.mode = 'tour';
  model.tourStart = now;
  model.tourTurn = model.userTurn;
}
