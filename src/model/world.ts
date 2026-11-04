// 模型の世界（見本・固定）。seed から一度だけ作り、あとは読むだけ。描画のコードはここに置かない。
// これはコンセプトを伝えるための模型で、Wylls の実際のゲームデータではない。

import { DIRS, disc, distance, key, rng, top, type Hex } from './hex';

export const MAX_TURN = 120;
export const RADIUS = 5;

export type Terrain = 'grassland' | 'plains' | 'forest' | 'hills' | 'mountain' | 'water';
export type Kind = 'human' | 'ai';
export type Cargo = 'food' | 'ore' | 'wood';

export type Tile = { q: number; r: number; terrain: Terrain; variant: 1 | 2 | 3 };

export type Settlement = {
  id: string;
  name: string;
  kind: Kind;
  hex: Hex;
  size: 'hamlet' | 'town' | 'city';
  /** このターンから領域が半径 2 に広がる */
  grow: number;
  stock0: number;
  /** 1 ターンあたりの生産から消費を引いた量 */
  net: number;
};

export type Depot = { id: string; name: string; hex: Hex; stock0: number };

export type Route = {
  id: string;
  /** 荷車を動かしている側 */
  by: string;
  kind: Kind;
  from: string;
  to: string;
  cargo: Cargo;
  load: number;
  /** 最初の出発ターン */
  offset: number;
  /** 道の上の点（上面の中心、ワールド座標）と、そこまでの累積距離 */
  points: [number, number][];
  lengths: number[];
  /** 片道にかかるターン数 */
  travel: number;
  /** 往復と荷下ろしを含めた一巡のターン数 */
  period: number;
};

export type Tower = { id: string; by: string; hex: Hex; radius: number };

export type Decision = { turn: number; by: string; text: string };

/** 1 ターンに進むマスの数 */
const SPEED = 0.55;
/** 着いてから引き返すまでのターン数 */
const DWELL = 2.5;

const WATER: Hex[] = [
  [0, -3],
  [0, -4],
  [1, -4],
  [-4, 4],
  [-5, 5],
];
const MOUNTAIN: Hex[] = [
  [5, -3],
  [4, -4],
  [-5, 3],
  [-1, 5],
  [4, 1],
];

export const SETTLEMENTS: Settlement[] = [
  { id: 'lamar', name: 'Lamar', kind: 'human', hex: [-3, 1], size: 'town', grow: 30, stock0: 420, net: 2.2 },
  { id: 'olsen', name: 'Olsen', kind: 'human', hex: [-1, 3], size: 'hamlet', grow: 58, stock0: 260, net: 1.6 },
  { id: 'harrow', name: 'Harrow', kind: 'human', hex: [-2, -2], size: 'hamlet', grow: 74, stock0: 240, net: 1.5 },
  { id: 'verde', name: 'Verde', kind: 'ai', hex: [3, -2], size: 'city', grow: 22, stock0: 480, net: 2.4 },
  { id: 'ashby', name: 'Ashby', kind: 'ai', hex: [2, 2], size: 'hamlet', grow: 46, stock0: 230, net: 1.8 },
];

export const DEPOTS: Depot[] = [
  { id: 'west', name: 'West depot', hex: [-1, 0], stock0: 120 },
  { id: 'east', name: 'East depot', hex: [1, -1], stock0: 120 },
];

export const TOWERS: Tower[] = [
  { id: 't-lamar', by: 'lamar', hex: [-3, 2], radius: 2 },
  { id: 't-verde', by: 'verde', hex: [3, -1], radius: 2 },
];

/** 柵を建てるターン（ラマールの南の境） */
export const FENCE_TURN = 64;
export const FENCE: { hex: Hex; edges: number[] } = { hex: [-3, 2], edges: [2, 3] };

const ROUTE_DEFS: Omit<Route, 'points' | 'lengths' | 'travel' | 'period'>[] = [
  { id: 'r1', by: 'lamar', kind: 'human', from: 'lamar', to: 'west', cargo: 'food', load: 40, offset: 1 },
  { id: 'r2', by: 'olsen', kind: 'human', from: 'olsen', to: 'west', cargo: 'wood', load: 30, offset: 4 },
  { id: 'r3', by: 'harrow', kind: 'human', from: 'harrow', to: 'west', cargo: 'food', load: 30, offset: 7 },
  { id: 'r4', by: 'lamar', kind: 'human', from: 'west', to: 'verde', cargo: 'food', load: 50, offset: 10 },
  { id: 'r5', by: 'verde', kind: 'ai', from: 'verde', to: 'east', cargo: 'ore', load: 45, offset: 2 },
  { id: 'r6', by: 'ashby', kind: 'ai', from: 'ashby', to: 'east', cargo: 'ore', load: 35, offset: 5 },
  { id: 'r7', by: 'verde', kind: 'ai', from: 'east', to: 'lamar', cargo: 'ore', load: 50, offset: 12 },
  { id: 'r8', by: 'ashby', kind: 'ai', from: 'ashby', to: 'olsen', cargo: 'ore', load: 25, offset: 16 },
];

const hexOf = (id: string): Hex => {
  const s = SETTLEMENTS.find((x) => x.id === id) ?? DEPOTS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown place ${id}`);
  return s.hex;
};

export const nameOf = (id: string) =>
  SETTLEMENTS.find((x) => x.id === id)?.name ?? DEPOTS.find((x) => x.id === id)?.name ?? id;

function buildTiles(): Tile[] {
  const rand = rng(1117);
  const hexes = disc(RADIUS);
  const value = new Map<string, number>();
  for (const [q, r] of hexes) value.set(key(q, r), rand());
  // 一度ならして、森や丘がまとまるようにする
  const smooth = new Map<string, number>();
  for (const [q, r] of hexes) {
    let sum = value.get(key(q, r))! * 2;
    let n = 2;
    for (const [dq, dr] of DIRS) {
      const v = value.get(key(q + dq, r + dr));
      if (v !== undefined) {
        sum += v;
        n++;
      }
    }
    smooth.set(key(q, r), sum / n);
  }
  const fixed = new Map<string, Terrain>();
  for (const [q, r] of WATER) fixed.set(key(q, r), 'water');
  for (const [q, r] of MOUNTAIN) fixed.set(key(q, r), 'mountain');
  const open = new Set([...SETTLEMENTS, ...DEPOTS].map((s) => key(...s.hex)));
  return hexes.map(([q, r]) => {
    const k = key(q, r);
    let terrain: Terrain;
    const v = smooth.get(k)!;
    if (fixed.has(k)) terrain = fixed.get(k)!;
    else if (open.has(k)) terrain = v < 0.5 ? 'grassland' : 'plains';
    else terrain = v < 0.36 ? 'forest' : v < 0.56 ? 'grassland' : v < 0.7 ? 'plains' : 'hills';
    const variant = (1 + Math.floor(rand() * 3)) as 1 | 2 | 3;
    return { q, r, terrain, variant };
  });
}

export const TILES = buildTiles();
const TILE_AT = new Map(TILES.map((t) => [key(t.q, t.r), t]));
export const tileAt = (q: number, r: number) => TILE_AT.get(key(q, r));

/** 水と山を避けた最短の道（幅優先、同じ長さなら平地を選ぶ） */
function findPath(a: Hex, b: Hex): Hex[] {
  const cost = (t: Tile) => (t.terrain === 'forest' || t.terrain === 'hills' ? 1.6 : 1);
  const dist = new Map<string, number>([[key(...a), 0]]);
  const prev = new Map<string, Hex>();
  const queue: Hex[] = [a];
  while (queue.length) {
    queue.sort((x, y) => dist.get(key(...x))! - dist.get(key(...y))!);
    const cur = queue.shift()!;
    if (cur[0] === b[0] && cur[1] === b[1]) break;
    for (const [dq, dr] of DIRS) {
      const n: Hex = [cur[0] + dq, cur[1] + dr];
      const t = tileAt(...n);
      if (!t || t.terrain === 'water' || t.terrain === 'mountain') continue;
      const d = dist.get(key(...cur))! + cost(t);
      if (d < (dist.get(key(...n)) ?? Infinity)) {
        dist.set(key(...n), d);
        prev.set(key(...n), cur);
        queue.push(n);
      }
    }
  }
  const path: Hex[] = [b];
  while (path[0][0] !== a[0] || path[0][1] !== a[1]) {
    const p = prev.get(key(...path[0]));
    if (!p) throw new Error('no path');
    path.unshift(p);
  }
  return path;
}

export const ROUTES: Route[] = ROUTE_DEFS.map((def) => {
  const hexes = findPath(hexOf(def.from), hexOf(def.to));
  const points = hexes.map(([q, r]) => top(q, r));
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const travel = (hexes.length - 1) / SPEED;
  return { ...def, points, lengths, travel, period: 2 * (travel + DWELL) };
});

/** 道として描くマスの並び（同じ区間を何度も描かないよう、辺ごとにまとめる） */
export const ROAD_EDGES: [[number, number], [number, number]][] = (() => {
  const seen = new Set<string>();
  const out: [[number, number], [number, number]][] = [];
  for (const r of ROUTES)
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1];
      const b = r.points[i];
      const k = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push([a, b]);
    }
  return out;
})();

/** AIの判断（決めた方針）。荷車の出発とは別の、節目の判断 */
export const PLANS: Decision[] = [
  { turn: 14, by: 'verde', text: 'plan: keep 400 ore in reserve' },
  { turn: 38, by: 'ashby', text: 'plan: trade ore with Olsen' },
  { turn: 66, by: 'verde', text: 'plan: route east, avoid the fence' },
  { turn: 92, by: 'ashby', text: 'plan: raise food stock' },
];

/** 領域：そのターンに届いている村のうち、いちばん近い村のもの */
export function ownerAt(q: number, r: number, turn: number): string | undefined {
  let best: Settlement | undefined;
  let bestD = Infinity;
  for (const s of SETTLEMENTS) {
    const rad = turn >= s.grow ? 2 : 1;
    const d = distance([q, r], s.hex);
    if (d <= rad && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best?.id;
}

export const settlement = (id: string) => SETTLEMENTS.find((s) => s.id === id);
