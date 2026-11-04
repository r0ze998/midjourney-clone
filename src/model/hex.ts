// ヘックスの座標。Wylls のクライアント（permutation-server/web/frontier/map/table.mjs, sprites.mjs）と同じ寸法。
// 軸座標 (q, r)、r は下へ増える。ワールド座標の単位はタイル画像 @1x の px。

export const R = 44; // タイルの半径
export const FLATTEN = 0.76; // 斜め上から見た潰れ
export const HEX_W = Math.sqrt(3) * R;
export const ROW_H = R * 1.5 * FLATTEN;
// タイル画像の地面の中心から上面までの高さ（sprites.mjs の TOP_LIFT と同じ式）
export const TOP_LIFT = 0.24 * Math.sqrt(1 - FLATTEN * FLATTEN) * R;
// タイル画像の大きさと、地面の中心の位置（@1x）
export const TILE_W = 88;
export const TILE_H = 104;
export const ANCHOR_X = 44;
export const ANCHOR_Y = 62;

export type Hex = readonly [q: number, r: number];

export const key = (q: number, r: number) => `${q},${r}`;

/** タイルの地面の中心（ワールド座標） */
export const center = (q: number, r: number): [number, number] => [HEX_W * (q + r / 2), ROW_H * r];

/** 上面の中心。道・荷車・ゲージはここに載せる */
export const top = (q: number, r: number): [number, number] => {
  const [x, y] = center(q, r);
  return [x, y - TOP_LIFT];
};

export const distance = (a: Hex, b: Hex) =>
  (Math.abs(a[0] - b[0]) + Math.abs(a[0] + a[1] - b[0] - b[1]) + Math.abs(a[1] - b[1])) / 2;

// 隣のマス。辺 k は左上から反時計回り（sprites.mjs の EDGE_DIRS と同じ順）
export const DIRS: readonly Hex[] = [
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 0],
  [1, -1],
];

/** 上面の六角形の頂点 k（0..5）。辺 k（DIRS[k] の隣との境）は頂点 k と k+1 を結ぶ */
export const corner = (q: number, r: number, k: number, scale = 1): [number, number] => {
  const [x, y] = top(q, r);
  // 尖った頂点が上下に来る向き。頂点 0 が真上、そこから反時計回り（DIRS と同じ回り方）
  const a = (Math.PI / 180) * (-90 - 60 * k);
  return [x + R * scale * Math.cos(a), y + R * scale * Math.sin(a) * FLATTEN];
};

/** 半径 n の範囲のマス */
export const disc = (n: number): Hex[] => {
  const out: Hex[] = [];
  for (let r = -n; r <= n; r++)
    for (let q = -n; q <= n; q++) if (Math.abs(-q - r) <= n) out.push([q, r]);
  return out;
};

/** seed つきの乱数（mulberry32）。描画は乱数を使わず、世界を作るときだけ使う */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
