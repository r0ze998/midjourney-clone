// 「ワールド・ゲーム」の球体の模型（社名の項）。描画以外は純粋な関数。
// 地形の輪郭・6 集落・物流の規則は、持ち主から受け取った素材（Yukikaze World Game Asset、2026-11-05）による。
// 輪郭は地球を模した手描きの模式図で、正確な地理ではない。集落・道・物資量も、この模型のための仮の表現で、
// Wylls のゲームの地図・国・経済とは別のもの。

/** 大陸の輪郭（[経度, 緯度] の多角形） */
export const LANDS: [number, number][][] = [
  [[-168, 71], [-150, 70], [-137, 69], [-123, 72], [-109, 74], [-96, 69], [-84, 72], [-71, 61], [-61, 58], [-52, 50], [-65, 44], [-74, 39], [-80, 31], [-80, 25], [-85, 22], [-87, 16], [-78, 9], [-84, 8], [-92, 16], [-102, 20], [-111, 29], [-118, 33], [-124, 42], [-127, 53], [-141, 59], [-155, 59], [-168, 63]],
  [[-82, 12], [-72, 12], [-62, 7], [-52, 4], [-42, -1], [-35, -7], [-39, -16], [-46, -24], [-51, -31], [-58, -38], [-65, -54], [-70, -55], [-76, -45], [-73, -28], [-78, -12], [-81, -3], [-78, 5]],
  [[-53, 60], [-43, 60], [-23, 70], [-21, 80], [-35, 84], [-57, 82], [-65, 75]],
  [[-17, 37], [-5, 36], [10, 37], [26, 32], [33, 30], [35, 23], [43, 12], [50, 11], [43, -4], [39, -16], [32, -29], [20, -35], [13, -26], [10, -8], [1, 5], [-10, 5], [-17, 15]],
  [[-10, 36], [-9, 44], [1, 43], [5, 47], [-4, 49], [0, 52], [9, 54], [8, 58], [5, 61], [14, 70], [28, 71], [31, 61], [44, 67], [60, 70], [75, 73], [100, 77], [120, 72], [143, 70], [162, 68], [179, 66], [179, 58], [165, 59], [157, 51], [145, 48], [138, 41], [130, 42], [129, 35], [121, 31], [120, 22], [108, 20], [108, 10], [103, 1], [98, 6], [97, 20], [89, 23], [81, 8], [76, 8], [71, 21], [66, 24], [57, 25], [52, 15], [43, 12], [35, 30], [28, 36], [24, 40], [21, 38], [17, 41], [12, 46], [5, 44], [-1, 37]],
  [[112, -11], [129, -12], [135, -13], [142, -10], [145, -17], [153, -27], [149, -37], [139, -39], [131, -32], [116, -35], [113, -25]],
  [[44, -13], [50, -16], [48, -25], [44, -25], [43, -19]],
  [[-10, 51], [-6, 51], [-2, 56], [-3, 59], [-7, 58], [-8, 54]],
  [[130, 32], [134, 34], [137, 37], [141, 40], [144, 45], [140, 45], [137, 39], [133, 35]],
  [[94, 5], [102, 1], [106, -6], [114, -7], [119, -9], [111, -8], [105, -5], [98, 1]],
  [[111, 7], [118, 6], [119, 0], [115, -4], [109, -2], [108, 3]],
  [[130, -3], [139, -3], [151, -6], [147, -10], [137, -8]],
  [[166, -35], [174, -39], [177, -41], [170, -46], [166, -45], [172, -40]],
  [[-24, 63], [-14, 64], [-16, 67], [-22, 67]],
];

/** 6 つの集落（模型の中の文字は英語） */
export const NATIONS = [
  { id: 'I', name: 'Woodland', lat: 43, lon: -87 },
  { id: 'II', name: 'Riverside', lat: -15, lon: -52 },
  { id: 'III', name: 'Highland', lat: 47, lon: 17 },
  { id: 'IV', name: 'Grassland', lat: 4, lon: 23 },
  { id: 'V', name: 'Coastland', lat: 31, lon: 114 },
  { id: 'VI', name: 'Southland', lat: -25, lon: 134 },
] as const;

/** 集落をめぐる 6 本の道。1 便 5 単位、30 秒ごとに出る */
export const GLOBE_ROUTES = ([[0, 2], [2, 4], [4, 5], [5, 3], [3, 1], [1, 0]] as const).map(([from, to], i) => ({
  from,
  to,
  offset: i * 3.7,
  duration: 12 + (i % 3) * 1.4,
  amount: 5,
}));

export const GLOBE_PERIOD = 30;
export const GLOBE_TOTAL = 300;
/** 始まりの時刻。最初から荷が道の上にあるように、60 秒先から始める */
export const GLOBE_START = 60;
/** 出発・到着の合図を見せる秒数。状態そのものはこの合図と無関係に進む */
export const GLOBE_EVENT_SPAN = 2;

const count = (t: number, offset: number) => (t < offset - 1e-9 ? 0 : Math.floor((t - offset + 1e-9) / GLOBE_PERIOD) + 1);

export type GlobeState = {
  t: number;
  stocks: number[];
  shipments: { route: number; progress: number; amount: number }[];
  events: { route: number; kind: 'depart' | 'arrive'; age: number; amount: number }[];
  transit: number;
  stored: number;
};

/** 時刻 t の状態。出発で村から減り、到着で次の村に増える。保管＋輸送中はいつも 300 */
export function globeState(t: number): GlobeState {
  t = Math.max(0, Number.isFinite(t) ? t : 0);
  const stocks = NATIONS.map(() => 50);
  const shipments: GlobeState['shipments'] = [];
  const events: GlobeState['events'] = [];
  let transit = 0;
  GLOBE_ROUTES.forEach((r, i) => {
    const departed = count(t, r.offset);
    const arrived = count(t, r.offset + r.duration);
    stocks[r.from] -= departed * r.amount;
    stocks[r.to] += arrived * r.amount;
    // 同じ経路と時刻から、移動中の荷と出発・到着の合図を導く。
    // 差分フレームを見ないので、タブ復帰・低 fps・静止画モードでも再現できる。
    if (departed > 0) {
      const age = t - (r.offset + (departed - 1) * GLOBE_PERIOD);
      if (age >= 0 && age < GLOBE_EVENT_SPAN) events.push({ route: i, kind: 'depart', age, amount: r.amount });
    }
    if (arrived > 0) {
      const age = t - (r.offset + r.duration + (arrived - 1) * GLOBE_PERIOD);
      if (age >= 0 && age < GLOBE_EVENT_SPAN) events.push({ route: i, kind: 'arrive', age, amount: r.amount });
    }
    if (departed > arrived) {
      const p = (t - r.offset - (departed - 1) * GLOBE_PERIOD) / r.duration;
      shipments.push({ route: i, progress: Math.max(0, Math.min(1 - Number.EPSILON, p)), amount: r.amount });
      transit += r.amount;
    }
  });
  return { t, stocks, shipments, events, transit, stored: stocks.reduce((a, b) => a + b, 0) };
}

// 多角形ごとの囲み（内外判定の前に、外れているものを先に除く）
const BOXES = LANDS.map((poly) => {
  let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { x0, x1, y0, y1 };
});

/** 点が陸か（経度・緯度の平面での内外判定） */
export function isLand(lon: number, lat: number): boolean {
  let inside = false;
  for (let k = 0; k < LANDS.length; k++) {
    const b = BOXES[k];
    if (lon < b.x0 || lon > b.x1 || lat < b.y0 || lat > b.y1) continue;
    const poly = LANDS[k];
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
