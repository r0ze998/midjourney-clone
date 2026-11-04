// state(turn)：模型の画面に出るものは、すべてこの一つの純粋関数から決まる。
// 乱数・時計・前のフレームの状態は使わない（teardown の render(t) の約束）。

import { distance, disc } from './hex';
import {
  DEPOTS,
  FENCE_TURN,
  PLANS,
  RADIUS,
  ROUTES,
  SETTLEMENTS,
  TOWERS,
  nameOf,
  ownerAt,
  type Cargo,
  type Kind,
  type Route,
} from './world';

export type Cart = {
  route: string;
  kind: Kind;
  cargo: Cargo;
  x: number;
  y: number;
  /** 荷を積んでいるか（行きは積み、帰りは空） */
  loaded: boolean;
  /** 進む向き（左右の反転用） */
  dir: 1 | -1;
  /** 道の上を動いているか（着いて荷下ろし中・出発待ちは false） */
  moving: boolean;
};

export type Arrival = { at: string; route: string; kind: Kind; age: number };
export type Trace = { by: string; text: string; age: number };

export type ModelState = {
  turn: number;
  carts: Cart[];
  stocks: Record<string, number>;
  arrivals: Arrival[];
  traces: Trace[];
  fence: boolean;
  readout: {
    moving: number;
    aiDecisions: number;
    aiShare: number;
    defended: number;
  };
};

const count = (t: number, start: number, period: number) => (t >= start ? Math.floor((t - start) / period) + 1 : 0);

/** 道の上の位置（u = 0..1） */
function along(route: Route, u: number): [number, number, 1 | -1] {
  const total = route.lengths[route.lengths.length - 1];
  const d = Math.max(0, Math.min(1, u)) * total;
  let i = 1;
  while (i < route.lengths.length - 1 && route.lengths[i] < d) i++;
  const [x0, y0] = route.points[i - 1];
  const [x1, y1] = route.points[i];
  const seg = route.lengths[i] - route.lengths[i - 1] || 1;
  const f = (d - route.lengths[i - 1]) / seg;
  return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, x1 >= x0 ? 1 : -1];
}

const smooth = (x: number) => x * x * (3 - 2 * x);

const KIND_OF = new Map(SETTLEMENTS.map((s) => [s.id, s.kind]));
const DEFENSE_TILES = TOWERS.map((t) => ({
  by: t.by,
  tiles: disc(RADIUS).filter((h) => distance(h, t.hex) <= t.radius),
}));

export function state(turn: number): ModelState {
  const t = Math.max(0, turn);
  const carts: Cart[] = [];
  const arrivals: Arrival[] = [];
  const traces: Trace[] = [];
  const stocks: Record<string, number> = {};
  for (const s of SETTLEMENTS) stocks[s.id] = s.stock0 + s.net * t;
  for (const d of DEPOTS) stocks[d.id] = d.stock0;

  let aiDecisions = 0;
  let aiLoad = 0;
  let allLoad = 0;

  for (const r of ROUTES) {
    const departed = count(t, r.offset, r.period);
    const arrived = count(t, r.offset + r.travel, r.period);
    stocks[r.from] -= departed * r.load;
    stocks[r.to] += arrived * r.load;
    allLoad += arrived * r.load;
    if (r.kind === 'ai') {
      aiLoad += arrived * r.load;
      aiDecisions += departed;
    }

    if (t < r.offset) continue;
    const k = Math.floor((t - r.offset) / r.period);
    const phase = t - (r.offset + k * r.period);
    const dwell = (r.period - 2 * r.travel) / 2;
    let u = 0;
    let loaded = false;
    let moving = false;
    if (phase < r.travel) {
      u = smooth(phase / r.travel);
      loaded = moving = true;
    } else if (phase < r.travel + dwell) {
      u = 1;
    } else if (phase < 2 * r.travel + dwell) {
      u = 1 - smooth((phase - r.travel - dwell) / r.travel);
      moving = true;
    }
    const [x, y, dir] = along(r, u);
    carts.push({ route: r.id, kind: r.kind, cargo: r.cargo, x, y, loaded, moving, dir: loaded ? dir : (-dir as 1 | -1) });

    // 着いた直後（4 ターン以内）
    const sinceArrival = phase - r.travel;
    if (sinceArrival >= 0 && sinceArrival < 4) arrivals.push({ at: r.to, route: r.id, kind: r.kind, age: sinceArrival });
    // AIが荷車を出した判断の跡（10 ターン残す）
    if (r.kind === 'ai' && phase < 10)
      traces.push({ by: r.by, text: `send ${r.cargo} ${r.load} → ${nameOf(r.to)}`, age: phase });
  }

  for (const p of PLANS) {
    if (t >= p.turn) aiDecisions++;
    const age = t - p.turn;
    if (age >= 0 && age < 10) traces.push({ by: p.by, text: p.text, age });
  }

  for (const id of Object.keys(stocks)) stocks[id] = Math.max(0, stocks[id]);

  let defended = 0;
  for (const d of DEFENSE_TILES) for (const [q, r] of d.tiles) if (ownerAt(q, r, t) === d.by) defended++;

  return {
    turn: t,
    carts,
    stocks,
    arrivals,
    traces,
    fence: t >= FENCE_TURN,
    readout: {
      moving: carts.filter((c) => c.moving).length,
      aiDecisions,
      aiShare: allLoad ? aiLoad / allLoad : 0,
      defended,
    },
  };
}

export const kindOf = (id: string): Kind | undefined => KIND_OF.get(id);
