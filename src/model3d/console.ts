// 模型のまわりの計器（teardown の console）。グラフ・配線図・コールアウトは、すべて state(turn) から描き直す。
// 画面に出る数字で、手で打ったものはない。

import { PLANS, ROUTES, SETTLEMENTS, DEPOTS, TOWERS, MAX_TURN, nameOf } from '../model/world';
import { state, type ModelState } from '../model/state';
import type { CaptionKey, LayerWeights } from '../model/timeline';
import { RIDE_ROUTE } from './camera';

const C = {
  bone: '#e8ece6',
  dim: '#a9b2aa',
  mute: '#7d867f',
  grid: 'rgba(232,236,230,0.09)',
  human: '#e0704f',
  ai: '#9b7bff',
  signal: '#3ef08c',
  road: '#c8a679',
};

// ---- 全ターンの系列を一度だけ作る（グラフはこれを読む） ----
const STEP = 1;
const SERIES = (() => {
  const turns: number[] = [];
  const stocks: Record<string, number[]> = Object.fromEntries(SETTLEMENTS.map((s) => [s.id, []]));
  const human: number[] = [];
  const ai: number[] = [];
  for (let t = 0; t <= MAX_TURN; t += STEP) {
    const st = state(t);
    turns.push(t);
    for (const s of SETTLEMENTS) stocks[s.id].push(st.stocks[s.id]);
    human.push(st.readout.delivered.human);
    ai.push(st.readout.delivered.ai);
  }
  const maxStock = Math.max(...Object.values(stocks).flat());
  const maxCargo = Math.max(human[human.length - 1], ai[ai.length - 1]);
  // AIの判断：AIの荷車の出発と、節目の方針
  const decisions: { turn: number; plan: boolean }[] = [];
  for (const r of ROUTES.filter((x) => x.kind === 'ai')) for (let t = r.offset; t <= MAX_TURN; t += r.period) decisions.push({ turn: t, plan: false });
  for (const p of PLANS) decisions.push({ turn: p.turn, plan: true });
  decisions.sort((a, b) => a.turn - b.turn);
  return { turns, stocks, human, ai, maxStock, maxCargo, decisions };
})();

const fontOf = (family: string, size: number, weight = 400) => `${weight} ${size}px ${family}`;

function setup(canvas: HTMLCanvasElement, dpr: number) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return null;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/** 在庫（5 本の線）と、届いた荷の累計（人とAI）。いまのターンに縦の線 */
export function drawCharts(canvas: HTMLCanvasElement, turn: number, layers: LayerWeights, font: string, dpr: number) {
  const s = setup(canvas, dpr);
  if (!s) return;
  const { ctx, w, h } = s;
  const pad = { l: 4, r: 52, t: 16 };
  const gap = 22;
  const h1 = (h - pad.t * 2 - gap) * 0.55;
  const h2 = h - pad.t * 2 - gap - h1;
  const X = (t: number) => pad.l + (t / MAX_TURN) * (w - pad.l - pad.r);
  const focusAi = layers.ai;
  const focusLog = layers.logistics;

  const panel = (y0: number, ph: number, title: string, max: number, lines: { data: number[]; color: string; width: number; alpha: number; label?: string }[]) => {
    ctx.font = fontOf(font, 9.5, 500);
    ctx.fillStyle = C.mute;
    ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), pad.l, y0 - 5);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let k = 0; k <= 2; k++) {
      const y = y0 + (ph * k) / 2;
      ctx.beginPath();
      ctx.moveTo(pad.l, y + 0.5);
      ctx.lineTo(w - pad.r, y + 0.5);
      ctx.stroke();
    }
    const Y = (v: number) => y0 + ph - (v / max) * ph;
    const idx = Math.min(SERIES.turns.length - 1, Math.round(turn / STEP));
    for (const L of lines) {
      ctx.globalAlpha = L.alpha;
      ctx.strokeStyle = L.color;
      ctx.lineWidth = L.width;
      ctx.beginPath();
      L.data.forEach((v, i) => {
        const x = X(SERIES.turns[i]);
        if (i) ctx.lineTo(x, Y(v));
        else ctx.moveTo(x, Y(v));
      });
      ctx.stroke();
      // いまの値の点と数字
      const v = L.data[idx];
      ctx.fillStyle = L.color;
      ctx.beginPath();
      ctx.arc(X(turn), Y(v), 2.6, 0, Math.PI * 2);
      ctx.fill();
      if (L.label) {
        ctx.font = fontOf(font, 9.5, 500);
        // 2 本の線が近いときは、ラベルを上下に離す
        const ly = Y(v) + 3 + (L.label === 'AI' ? -6 : 6);
        ctx.fillText(`${L.label} ${Math.round(v)}`, w - pad.r + 4, Math.max(y0 + 6, Math.min(y0 + ph + 4, ly)));
      }
    }
    ctx.globalAlpha = 1;
  };

  panel(
    pad.t,
    h1,
    'Stock',
    SERIES.maxStock,
    SETTLEMENTS.map((st) => ({
      data: SERIES.stocks[st.id],
      color: st.kind === 'ai' ? C.ai : C.human,
      width: st.kind === 'ai' ? 1.6 : 1.2,
      alpha: st.kind === 'ai' ? 0.55 + 0.45 * Math.max(focusAi, 1 - focusLog) : 0.45 + 0.4 * (1 - focusAi),
    })),
  );
  panel(pad.t + h1 + gap, h2, 'Cargo delivered', SERIES.maxCargo, [
    { data: SERIES.human, color: C.human, width: 1.5, alpha: 0.95, label: 'H' },
    { data: SERIES.ai, color: C.ai, width: 1.8, alpha: 0.95, label: 'AI' },
  ]);

  // いまのターン
  ctx.strokeStyle = C.signal;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(X(turn)) + 0.5, pad.t - 2);
  ctx.lineTo(Math.round(X(turn)) + 0.5, h - pad.t + 4);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** AIの判断の帯：一つの判断が一本の刻み。過ぎたものは明るく、直近は緑で光る */
export function drawDecisions(canvas: HTMLCanvasElement, turn: number, font: string, dpr: number) {
  const s = setup(canvas, dpr);
  if (!s) return;
  const { ctx, w, h } = s;
  const X = (t: number) => 4 + (t / MAX_TURN) * (w - 44);
  ctx.font = fontOf(font, 9.5, 500);
  ctx.fillStyle = C.mute;
  ctx.fillText('AI DECISIONS', 4, 10);
  let n = 0;
  for (const d of SERIES.decisions) {
    const past = d.turn <= turn;
    if (past) n++;
    const recent = past && turn - d.turn < 3;
    ctx.fillStyle = recent ? C.signal : past ? C.ai : 'rgba(155,123,255,0.22)';
    const th = d.plan ? h - 16 : (h - 16) * 0.6;
    ctx.fillRect(Math.round(X(d.turn)), h - 2 - th, d.plan ? 2 : 1.4, th);
  }
  ctx.fillStyle = C.bone;
  ctx.textAlign = 'right';
  ctx.fillText(String(n), w - 2, h - 4);
  ctx.textAlign = 'left';
}

// ---- 配線図：村と倉庫、荷車の道、動いている荷車を 2D で描き直す ----
const NODES = [...SETTLEMENTS.map((s) => ({ id: s.id, hex: s.hex, kind: s.kind as 'human' | 'ai' | 'depot' })), ...DEPOTS.map((d) => ({ id: d.id, hex: d.hex, kind: 'depot' as const }))];
const P2 = (q: number, r: number) => [Math.sqrt(3) * (q + r / 2), 1.5 * r] as const;
const BOUNDS = (() => {
  const pts = NODES.map((n) => P2(...n.hex));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
})();

export function drawSchematic(canvas: HTMLCanvasElement, st: ModelState, layers: LayerWeights, font: string, dpr: number) {
  const s = setup(canvas, dpr);
  if (!s) return;
  const { ctx, w, h } = s;
  const pad = 22;
  const sc = Math.min((w - pad * 2) / (BOUNDS.x1 - BOUNDS.x0), (h - pad * 2 - 10) / (BOUNDS.y1 - BOUNDS.y0));
  const ox = (w - (BOUNDS.x1 - BOUNDS.x0) * sc) / 2 - BOUNDS.x0 * sc;
  const oy = (h - (BOUNDS.y1 - BOUNDS.y0) * sc) / 2 - BOUNDS.y0 * sc + 6;
  const toS = (x: number, y: number) => [ox + x * sc, oy + y * sc] as const;
  // 2D の荷車座標（タイル画像の px）→ ヘックス単位
  const from2D = (x: number, y: number) => [x / 44, (y + 0.24 * Math.sqrt(1 - 0.76 * 0.76) * 44) / (44 * 0.76)] as const;

  ctx.font = fontOf(font, 9.5, 500);
  ctx.fillStyle = C.mute;
  ctx.fillText('NETWORK', 4, 10);

  // 道
  for (const r of ROUTES) {
    const ai = r.kind === 'ai';
    ctx.strokeStyle = ai ? C.ai : C.road;
    ctx.globalAlpha = ai ? 0.35 + 0.45 * layers.ai : 0.25 + 0.5 * layers.logistics;
    ctx.lineWidth = 1.2;
    ctx.setLineDash(ai ? [3, 3] : []);
    ctx.beginPath();
    r.points.forEach(([x, y], i) => {
      const [hx, hy] = from2D(x, y);
      const [sx, sy] = toS(hx, hy);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  // 見張りの範囲（防衛）
  if (layers.defense > 0.02) {
    for (const t of TOWERS) {
      const kind = SETTLEMENTS.find((x) => x.id === t.by)!.kind;
      const [sx, sy] = toS(...P2(...t.hex));
      ctx.strokeStyle = kind === 'ai' ? C.ai : C.human;
      ctx.globalAlpha = 0.6 * layers.defense;
      ctx.beginPath();
      ctx.arc(sx, sy, t.radius * Math.sqrt(3) * sc, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // 荷車
  for (const c of st.carts) {
    if (!c.moving) continue;
    const [hx, hy] = from2D(c.x, c.y);
    const [sx, sy] = toS(hx, hy);
    ctx.fillStyle = c.kind === 'ai' ? C.ai : C.road;
    ctx.beginPath();
    ctx.arc(sx, sy, c.route === RIDE_ROUTE ? 3.4 : 2.4, 0, Math.PI * 2);
    ctx.fill();
    if (c.route === RIDE_ROUTE) {
      ctx.strokeStyle = C.signal;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // 村と倉庫
  for (const n of NODES) {
    const [sx, sy] = toS(...P2(...n.hex));
    if (n.kind === 'depot') {
      ctx.fillStyle = '#0a0f0c';
      ctx.strokeStyle = C.road;
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
      ctx.strokeRect(sx - 4 + 0.5, sy - 4 + 0.5, 7, 7);
    } else {
      ctx.fillStyle = n.kind === 'ai' ? C.ai : C.human;
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (n.kind === 'ai') {
        ctx.strokeStyle = C.ai;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = C.dim;
    ctx.font = fontOf(font, 9, 400);
    ctx.fillText(nameOf(n.id).replace(' depot', ''), sx + 7, sy - 6);
  }
}

// ---- コールアウト（部品に線を引いた注記） ----
export type Callout = { anchor: string; text: string; accent?: 'ai' | 'signal' | 'human' };

/** いまの字幕（ツアー）か層（操作中）に合わせて、出す注記を決める */
export function calloutsFor(caption: CaptionKey, st: ModelState): Callout[] {
  const stock = (id: string) => Math.round(st.stocks[id] ?? 0);
  const latestAi = [...st.traces].sort((a, b) => a.age - b.age)[0];
  const ride = st.carts.find((c) => c.route === RIDE_ROUTE);
  const rideRoute = ROUTES.find((r) => r.id === RIDE_ROUTE)!;
  const arrival = st.arrivals[0];
  switch (caption) {
    case 'overview':
      return [
        { anchor: 'verde', text: 'Verde · AI agent village', accent: 'ai' },
        { anchor: 'lamar', text: 'Lamar · human village', accent: 'human' },
      ];
    case 'logistics':
      return [
        { anchor: 'east', text: `East depot · stock ${stock('east')}` },
        { anchor: 'west', text: `West depot · stock ${stock('west')}` },
      ];
    case 'ride':
      return ride ? [{ anchor: `cart:${RIDE_ROUTE}`, text: `AI cart · ${rideRoute.cargo} ${rideRoute.load} → ${nameOf(rideRoute.to)}${ride.loaded ? '' : ' (returning)'}`, accent: 'ai' }] : [];
    case 'defense':
      return [{ anchor: 't-lamar', text: `Watchtower · ${st.readout.defended} tiles held`, accent: 'human' }];
    case 'ai':
      return latestAi ? [{ anchor: latestAi.by, text: `${nameOf(latestAi.by)} · ${latestAi.text}`, accent: 'ai' }] : [{ anchor: 'verde', text: 'Verde · AI agent village', accent: 'ai' }];
    case 'verify':
      return arrival ? [{ anchor: arrival.at, text: `✓ verified · delivery to ${nameOf(arrival.at)}`, accent: 'signal' }] : [];
  }
}
