// 模型の描画（Canvas 2D）。地形と村のタイルは最初に一枚の画像へ描き固め、
// 毎フレームはそれを貼ってから、道・境・荷車・ゲージ・AIの光と判断の跡だけを描く。

import { ANCHOR_X, ANCHOR_Y, DIRS, TILE_H, TILE_W, corner, disc, distance, top } from './hex';
import { DEPOTS, FENCE, RADIUS, ROAD_EDGES, SETTLEMENTS, TILES, TOWERS, ownerAt, settlement } from './world';
import type { ModelState } from './state';

export type LayerWeights = { logistics: number; defense: number; ai: number };

/** 一枚の絵を決める見え方。スクロールとツアーはこれを補間して渡す */
export type View = {
  /** 画面の中心に置くワールド座標 */
  cx: number;
  cy: number;
  /** 画面に収める倍率に掛ける拡大率 */
  zoom: number;
  /** ワールドの中心を置く画面上の位置（0..1） */
  ax: number;
  ay: number;
  layers: LayerWeights;
  /** 着いた荷に「verified」の印を出す強さ（0..1） */
  verify: number;
  /** 模型全体を紙の色へ沈める量（0..1） */
  dim: number;
};

export const COLORS = {
  void: '#050706',
  bone: '#e8ece6',
  ink2: '#a3aca4',
  rule: '#2a332c',
  chip: 'rgba(8,12,10,0.9)',
  ai: '#9b7bff',
  human: '#e0704f',
  signal: '#3ef08c',
  road: '#8a6a3e',
  cart: '#6b4a2b',
  cargo: { food: '#d9b44a', ore: '#8b9198', wood: '#9a6a3a' },
} as const;

type Sprites = Record<string, HTMLImageElement>;

const HOLDING = { human: 'ember', ai: 'iron' } as const;

export async function loadSprites(set: '@1x' | '@2x'): Promise<Sprites> {
  const names = new Set<string>();
  for (const t of TILES) names.add(`${t.terrain}_${t.variant}`);
  for (const s of SETTLEMENTS) names.add(`${s.size}_w_${HOLDING[s.kind]}`);
  const out: Sprites = {};
  await Promise.all(
    [...names].map(
      (n) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            out[n] = img;
            resolve();
          };
          img.onerror = () => reject(new Error(`tile ${n}`));
          img.src = `/model/${set}/${n}.webp`;
        }),
    ),
  );
  return out;
}

// ワールドの外枠（タイル画像の四隅まで）
const BOUNDS = (() => {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [q, r] of disc(RADIUS)) {
    const [x, y] = top(q, r);
    x0 = Math.min(x0, x - ANCHOR_X);
    x1 = Math.max(x1, x - ANCHOR_X + TILE_W);
    y0 = Math.min(y0, y - ANCHOR_Y);
    y1 = Math.max(y1, y - ANCHOR_Y + TILE_H);
  }
  return { x0: x0 - 30, y0: y0 - 70, x1: x1 + 30, y1: y1 + 40 };
})();
export const WORLD = { ...BOUNDS, w: BOUNDS.x1 - BOUNDS.x0, h: BOUNDS.y1 - BOUNDS.y0 };

/** 地形と村を一枚に描き固める。scale はワールド 1px あたりの画素数 */
export function bakeBoard(sprites: Sprites, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.ceil(WORLD.w * scale);
  c.height = Math.ceil(WORLD.h * scale);
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  g.translate(-WORLD.x0, -WORLD.y0);
  g.imageSmoothingQuality = 'high';
  // 卓の上の影
  // 外枠の内側に収まる大きさにする（はみ出すと四角く切れて見える）
  const sr = Math.min(WORLD.w, WORLD.h) * 0.5;
  g.save();
  g.translate(0, 34);
  g.scale(WORLD.w / WORLD.h, 1);
  const shadow = g.createRadialGradient(0, 0, sr * 0.2, 0, 0, sr);
  shadow.addColorStop(0, 'rgba(62,240,140,0.07)');
  shadow.addColorStop(0.7, 'rgba(62,240,140,0.025)');
  shadow.addColorStop(1, 'rgba(62,240,140,0)');
  g.fillStyle = shadow;
  g.beginPath();
  g.arc(0, 0, sr, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const tiles = [...TILES].sort((a, b) => a.r - b.r || a.q - b.q);
  for (const t of tiles) {
    const [x, y] = top(t.q, t.r);
    const img = sprites[`${t.terrain}_${t.variant}`];
    if (img) g.drawImage(img, x - ANCHOR_X, y - ANCHOR_Y, TILE_W, TILE_H);
  }
  for (const s of [...SETTLEMENTS].sort((a, b) => a.hex[1] - b.hex[1])) {
    const [x, y] = top(...s.hex);
    const img = sprites[`${s.size}_w_${HOLDING[s.kind]}`];
    const k = s.size === 'city' ? 1.28 : s.size === 'town' ? 1.2 : 1.08;
    if (img) g.drawImage(img, x - ANCHOR_X * k, y - ANCHOR_Y * k, TILE_W * k, TILE_H * k);
  }
  // 夜の照明：タイルだけを暗くし（source-atop）、中央に灯りのたまりを残す
  g.globalCompositeOperation = 'source-atop';
  const lamp = g.createRadialGradient(0, -10, WORLD.h * 0.1, 0, -10, WORLD.w * 0.62);
  lamp.addColorStop(0, 'rgba(4,8,6,0.22)');
  lamp.addColorStop(0.65, 'rgba(4,8,6,0.48)');
  lamp.addColorStop(1, 'rgba(4,8,6,0.72)');
  g.fillStyle = lamp;
  g.fillRect(WORLD.x0, WORLD.y0, WORLD.w, WORLD.h);
  g.globalCompositeOperation = 'source-over';
  return c;
}

// 領域の境の辺（ターンで変わるのは村が育つときだけなので、ターン帯ごとに作り置く）
type Edge = { by: string; kind: 'human' | 'ai'; a: [number, number]; b: [number, number] };
const edgeCache = new Map<string, Edge[]>();
function borderEdges(turn: number): Edge[] {
  const stage = SETTLEMENTS.map((s) => (turn >= s.grow ? 1 : 0)).join('');
  const hit = edgeCache.get(stage);
  if (hit) return hit;
  const out: Edge[] = [];
  for (const [q, r] of disc(RADIUS)) {
    const own = ownerAt(q, r, turn);
    if (!own) continue;
    const s = settlement(own)!;
    DIRS.forEach(([dq, dr], k) => {
      const n = ownerAt(q + dq, r + dr, turn);
      if (n === own) return;
      out.push({ by: own, kind: s.kind, a: corner(q, r, k, 0.97), b: corner(q, r, (k + 1) % 6, 0.97) });
    });
  }
  edgeCache.set(stage, out);
  return out;
}

const TOWER_TILES = TOWERS.map((t) => ({ ...t, tiles: disc(RADIUS).filter((h) => distance(h, t.hex) <= t.radius) }));

/** 層の強調：選ばれた層は 1、ほかは 0.25 まで薄く */
const emph = (w: number, focus: number) => (focus <= 0 ? 1 : 1 - focus * 0.75 * (1 - Math.min(1, w / focus)));

export type Frame = {
  ctx: CanvasRenderingContext2D;
  /** CSS px */
  width: number;
  height: number;
  dpr: number;
  board: HTMLCanvasElement;
  boardScale: number;
  font: string;
  /** 光と判断の跡を描くか（低い段では省く） */
  rich: boolean;
  hover?: string;
};

/** 画面に収める基本の倍率 */
export function fitScale(width: number, height: number) {
  const mobile = width < 768;
  const bw = mobile ? width * 0.98 : width * 0.5;
  const bh = mobile ? height * 0.5 : height * 0.78;
  return Math.min(bw / WORLD.w, bh / WORLD.h);
}

export function worldToScreen(v: View, width: number, height: number, x: number, y: number): [number, number] {
  const s = fitScale(width, height) * v.zoom;
  return [(x - v.cx) * s + width * v.ax, (y - v.cy) * s + height * v.ay];
}

export function draw(f: Frame, v: View, st: ModelState) {
  const { ctx, width, height, dpr } = f;
  const s = fitScale(width, height) * v.zoom;
  const L = v.layers;
  const focus = Math.min(1, L.logistics + L.defense + L.ai);
  const aLog = emph(L.logistics, focus);
  const aDef = emph(L.defense, focus);
  const aAi = emph(L.ai, focus);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (width * v.ax - v.cx * s), dpr * (height * v.ay - v.cy * s));

  // 1. 地形と村
  ctx.drawImage(f.board, WORLD.x0, WORLD.y0, WORLD.w, WORLD.h);
  if (focus > 0) {
    // 層を取り出しているあいだは、地図を紙の色に寄せて退かせる
    ctx.fillStyle = `rgba(5,7,6,${0.5 * focus})`;
    ctx.fillRect(WORLD.x0, WORLD.y0, WORLD.w, WORLD.h);
  }
  const px = 1 / s; // 画面の 1px

  // 2. 道（物流）
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#d9b77a';
  ctx.globalAlpha = 0.5 * aLog;
  ctx.lineWidth = Math.max(3, 3 * px);
  ctx.setLineDash([]);
  ctx.beginPath();
  for (const [a, b] of ROAD_EDGES) {
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
  }
  ctx.stroke();

  // 3. 領域の境（防衛）。AIの境は破線
  const edges = borderEdges(st.turn);
  ctx.lineWidth = 2;
  for (const kind of ['human', 'ai'] as const) {
    ctx.strokeStyle = kind === 'ai' ? COLORS.ai : COLORS.human;
    ctx.globalAlpha = (kind === 'ai' ? Math.max(aDef, aAi) : aDef) * 0.85;
    ctx.setLineDash(kind === 'ai' ? [6, 4] : []);
    ctx.beginPath();
    for (const e of edges)
      if (e.kind === kind) {
        ctx.moveTo(e.a[0], e.a[1]);
        ctx.lineTo(e.b[0], e.b[1]);
      }
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 4. 見張り塔の視界と柵（防衛の層を選んだときだけ広く見せる）
  if (L.defense > 0.01) {
    ctx.globalAlpha = 0.5 * L.defense;
    for (const t of TOWER_TILES) {
      const kind = settlement(t.by)!.kind;
      ctx.fillStyle = kind === 'ai' ? 'rgba(123,92,255,0.14)' : 'rgba(201,71,47,0.12)';
      for (const [q, r] of t.tiles) {
        if (ownerAt(q, r, st.turn) !== t.by) continue;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const [x, y] = corner(q, r, k, 0.9);
          if (k) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = aDef;
  for (const t of TOWERS) drawTower(ctx, ...top(...t.hex), settlement(t.by)!.kind);
  if (st.fence) {
    ctx.strokeStyle = '#5b4126';
    ctx.lineWidth = 2;
    for (const k of FENCE.edges) {
      const a = corner(FENCE.hex[0], FENCE.hex[1], k, 0.97);
      const b = corner(FENCE.hex[0], FENCE.hex[1], (k + 1) % 6, 0.97);
      drawFence(ctx, a, b);
    }
  }

  // 5. 夜の灯り：人の村は暖かい灯、AIの村は紫の光（AIの層）
  if (f.rich) {
    for (const v2 of SETTLEMENTS) {
      if (v2.kind !== 'human') continue;
      const [x, y] = top(...v2.hex);
      const rad = v2.size === 'town' ? 58 : 44;
      const g = ctx.createRadialGradient(x, y, 3, x, y, rad);
      g.addColorStop(0, 'rgba(255,178,92,0.34)');
      g.addColorStop(1, 'rgba(255,178,92,0)');
      ctx.globalAlpha = Math.max(0.4, aDef, aLog);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const v2 of SETTLEMENTS) {
      if (v2.kind !== 'ai') continue;
      const [x, y] = top(...v2.hex);
      const pulse = 0.82 + 0.18 * Math.sin(st.turn * 0.9 + x);
      const rad = (v2.size === 'city' ? 70 : 52) * (0.9 + 0.25 * L.ai);
      const g = ctx.createRadialGradient(x, y, 4, x, y, rad);
      g.addColorStop(0, `rgba(155,123,255,${0.55 * pulse})`);
      g.addColorStop(1, 'rgba(155,123,255,0)');
      ctx.globalAlpha = Math.max(0.35, aAi);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const v2 of SETTLEMENTS) {
    if (v2.kind !== 'ai') continue;
    const [x, y] = top(...v2.hex);
    ctx.strokeStyle = COLORS.ai;
    ctx.globalAlpha = 0.8 * Math.max(0.45, aAi);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y, 40, 40 * 0.76, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 6. 倉庫
  ctx.globalAlpha = aLog;
  for (const d of DEPOTS) drawDepot(ctx, ...top(...d.hex));

  // 7. 荷車。AIの荷車はAIの層でも強調する
  for (const c of st.carts) {
    const a = c.kind === 'ai' ? Math.max(aLog, aAi) : aLog;
    ctx.globalAlpha = a;
    drawCart(ctx, c.x, c.y, c.dir, c.loaded ? COLORS.cargo[c.cargo] : null, c.kind === 'ai');
  }

  // 8. 在庫のゲージ（物流）
  ctx.globalAlpha = 1;
  const places = [...SETTLEMENTS.map((x) => ({ id: x.id, hex: x.hex, kind: x.kind, max: 900 })), ...DEPOTS.map((d) => ({ id: d.id, hex: d.hex, kind: 'human' as const, max: 900, depot: true }))];
  for (const p of places) {
    const [x, y] = top(...p.hex);
    const value = st.stocks[p.id] ?? 0;
    const w = 34;
    const gy = y - 44;
    ctx.globalAlpha = Math.max(0.3, aLog) * 0.95;
    ctx.fillStyle = COLORS.chip;
    ctx.fillRect(x - w / 2 - 2, gy - 2, w + 4, 8);
    ctx.fillStyle = COLORS.rule;
    ctx.fillRect(x - w / 2, gy, w, 4);
    ctx.fillStyle = 'depot' in p ? '#d9b77a' : p.kind === 'ai' ? COLORS.ai : COLORS.human;
    ctx.fillRect(x - w / 2, gy, w * Math.min(1, value / p.max), 4);
    if (L.logistics > 0.3) {
      ctx.globalAlpha = L.logistics;
      ctx.font = `500 9px ${f.font}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.bone;
      ctx.fillText(String(Math.round(value)), x, gy - 4);
    }
  }

  // 9. 名前
  ctx.globalAlpha = 1;
  ctx.font = `500 10.5px ${f.font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const p of SETTLEMENTS) {
    const [x, y] = top(...p.hex);
    const label = p.name;
    const tag = p.kind === 'ai' ? 'AI' : '';
    const tw = ctx.measureText(label).width;
    const tagW = tag ? ctx.measureText(tag).width + 8 : 0;
    const w = tw + 12 + tagW;
    const lx = x - w / 2;
    const ly = y + 30;
    const hot = f.hover === p.id;
    ctx.fillStyle = hot ? COLORS.bone : COLORS.chip;
    ctx.fillRect(lx, ly - 8, w, 16);
    ctx.strokeStyle = p.kind === 'ai' ? COLORS.ai : 'rgba(232,236,230,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx + 0.5, ly - 7.5, w - 1, 15);
    ctx.fillStyle = hot ? COLORS.void : COLORS.bone;
    ctx.fillText(label, lx + 6, ly + 0.5);
    if (tag) {
      ctx.fillStyle = COLORS.ai;
      ctx.fillRect(lx + 6 + tw + 5, ly - 5, tagW - 2, 10);
      ctx.fillStyle = '#fff';
      ctx.font = `500 8px ${f.font}`;
      ctx.fillText(tag, lx + 6 + tw + 8, ly + 0.5);
      ctx.font = `500 10.5px ${f.font}`;
    }
  }
  ctx.textBaseline = 'alphabetic';

  // 10. AIの判断の跡（紫の文字）。各AIの村の直近の判断を、生まれてから 2 ターンは立ちのぼらせ、10 ターンかけて消す
  if (f.rich && aAi > 0.3) {
    ctx.font = `500 10.5px ${f.font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const latest = new Map<string, { text: string; age: number }>();
    for (const tr of st.traces) {
      const cur = latest.get(tr.by);
      if (!cur || tr.age < cur.age) latest.set(tr.by, tr);
    }
    for (const [by, tr] of latest) {
      const at = settlement(by);
      if (!at) continue;
      const [x, y] = top(...at.hex);
      const rise = Math.min(1, tr.age / 2);
      const alpha = Math.max(0.5, 1 - tr.age / 10) * aAi;
      const ty = y - 62 - rise * 10;
      const tx = x + 30;
      const w = ctx.measureText(tr.text).width + 12;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = COLORS.ai;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 8, y - 18);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = COLORS.chip;
      ctx.fillRect(tx, ty - 8, w, 16);
      ctx.strokeRect(tx + 0.5, ty - 7.5, w - 1, 15);
      ctx.fillStyle = '#c3b2ff';
      ctx.fillText(tr.text, tx + 6, ty + 0.5);
    }
    ctx.textBaseline = 'alphabetic';
  }

  // 11. 着いた荷の「verified」
  if (v.verify > 0.01) {
    ctx.font = `500 10px ${f.font}`;
    ctx.textAlign = 'center';
    for (const a of st.arrivals) {
      const place = settlement(a.at) ?? DEPOTS.find((d) => d.id === a.at);
      if (!place) continue;
      const [x, y] = top(...place.hex);
      ctx.globalAlpha = v.verify * Math.max(0, 1 - a.age / 4);
      const text = '✓ verified';
      const w = ctx.measureText(text).width + 12;
      ctx.fillStyle = COLORS.chip;
      ctx.fillRect(x - w / 2, y - 74, w, 16);
      ctx.strokeStyle = COLORS.signal;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - w / 2 + 0.5, y - 73.5, w - 1, 15);
      ctx.fillStyle = COLORS.signal;
      ctx.fillText(text, x, y - 62.5);
    }
  }

  // 12. 沈める
  ctx.globalAlpha = 1;
  if (v.dim > 0.01) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgba(5,7,6,${Math.min(0.92, v.dim)})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawCart(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, cargo: string | null, ai: boolean) {
  ctx.save();
  ctx.translate(x, y - 2);
  ctx.scale(dir, 1);
  // 影
  ctx.fillStyle = 'rgba(40,30,18,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 12, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (ai) {
    ctx.strokeStyle = COLORS.ai;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 1, 15, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 牛（前）
  ctx.fillStyle = '#7d5a3c';
  ctx.beginPath();
  ctx.ellipse(9, 0, 4.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(12, -3, 3, 3);
  // 荷台
  ctx.fillStyle = COLORS.cart;
  ctx.fillRect(-9, -4, 13, 6);
  if (cargo) {
    ctx.fillStyle = cargo;
    ctx.beginPath();
    ctx.ellipse(-2.5, -5, 6, 3.4, 0, Math.PI, 0);
    ctx.fill();
  }
  // 車輪
  ctx.fillStyle = '#2d2219';
  ctx.beginPath();
  ctx.arc(-6, 3, 2.6, 0, Math.PI * 2);
  ctx.arc(1, 3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDepot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(40,30,18,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b89462';
  ctx.fillRect(-13, -10, 26, 15);
  ctx.fillStyle = '#7a5634';
  ctx.beginPath();
  ctx.moveTo(-16, -9);
  ctx.lineTo(0, -19);
  ctx.lineTo(16, -9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a3420';
  ctx.fillRect(-3.5, -4, 7, 9);
  ctx.restore();
}

function drawTower(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'human' | 'ai') {
  ctx.save();
  ctx.translate(x + 18, y - 4);
  ctx.fillStyle = 'rgba(40,30,18,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c8c1b1';
  ctx.fillRect(-4, -18, 8, 24);
  ctx.fillStyle = '#9d9585';
  ctx.fillRect(-6, -22, 12, 5);
  ctx.fillStyle = kind === 'ai' ? COLORS.ai : COLORS.human;
  ctx.fillRect(-1, -32, 1.5, 10);
  ctx.beginPath();
  ctx.moveTo(0.5, -32);
  ctx.lineTo(8, -29);
  ctx.lineTo(0.5, -26);
  ctx.fill();
  ctx.restore();
}

function drawFence(ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number]) {
  const n = 5;
  ctx.beginPath();
  ctx.moveTo(a[0], a[1] - 3);
  ctx.lineTo(b[0], b[1] - 3);
  ctx.stroke();
  for (let i = 0; i <= n; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / n;
    const y = a[1] + ((b[1] - a[1]) * i) / n;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 7);
    ctx.stroke();
  }
}

/** 画面上の点に近い村（ホバー用） */
export function hitSettlement(v: View, width: number, height: number, sx: number, sy: number): string | undefined {
  let best: string | undefined;
  let bestD = 34;
  for (const p of SETTLEMENTS) {
    const [x, y] = worldToScreen(v, width, height, ...top(...p.hex));
    const d = Math.hypot(sx - x, sy - y);
    if (d < bestD) {
      best = p.id;
      bestD = d;
    }
  }
  return best;
}
