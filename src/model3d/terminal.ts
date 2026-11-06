// 導入の端末の絵。時刻 t（秒）だけで決まる（純粋）。3D のモニターの画面にも、全面の 2D にも同じ関数で描く。
// 緑の燐光の文字・点滅するカーソル・雪風のロゴ（円錐と輪）のワイヤーフレーム・模型の実際の出来事のログ。

import { state } from '../model/state';
import { nameOf } from '../model/world';

export const INTRO_LENGTH = 11.6;

export const BOOT = [
  '> boot world_117',
  '> terrain ......... generated',
  '> humans .......... online',
  '> ai citizens ..... online',
  '> rules ........... shared · verifiable',
  '> ledger .......... recording',
];
export const WAKE = 'A new world is waking up.';
export const HEADLINE = 'Make the world work.';

// 拍（秒）。場面ごとに間を変える：全体を見せる → 画面が点く → 起動ログを読ませる → 一文 → ロゴ → 寄り切って 2D へ → 見出し → 白い光
export const T = {
  lamp: 0.6, // ランプが灯る
  pushStart: 3.0, // カメラが遠景から画面へ寄り始める
  powerOn: 2.8, // ブラウン管が点く
  bootStart: 3.35,
  bootEnd: 5.6,
  wakeStart: 5.85,
  wakeEnd: 6.8,
  logoStart: 7.25,
  click: 8.15,
  pushEnd: 8.6, // 画面いっぱい（ここで 2D へ渡す）
  logsStart: 8.8,
  headline: 9.6,
  flash: 10.9,
};

const PHOSPHOR = '#7dffb0';
const PHOSPHOR_DIM = 'rgba(125,255,176,0.55)';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// ---- ログ：模型の state(turn) から、出来事を時刻順に（読み込み時に一度だけ作る） ----
export const LOGS: string[] = (() => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let turn = 20; turn <= 118 && out.length < 60; turn += 0.5) {
    const st = state(turn);
    const t = String(Math.floor(turn)).padStart(3, '0');
    for (const a of st.arrivals) {
      const k = `a:${a.route}:${Math.floor(turn - a.age)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(`${t}  verify    delivery ${nameOf(a.at)} ✓`);
    }
    for (const tr of st.traces) {
      const k = `t:${tr.by}:${tr.text}`;
      if (seen.has(k) || tr.age > 1) continue;
      seen.add(k);
      const who = tr.by.length > 6 ? tr.by.slice(0, 6) : tr.by;
      out.push(`${t}  ai.${who.padEnd(6)} decide: ${tr.text}`);
    }
    for (const c of st.carts) {
      if (!c.moving || !c.loaded) continue;
      const k = `c:${c.route}:${Math.floor(turn / 8)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(`${t}  caravan   ${c.route} · ${c.cargo} → ${c.kind === 'ai' ? 'ai cart' : 'cart'}`);
    }
  }
  return out;
})();

// ---- ロゴ（円錐と輪）の 3D の線 ----
type V3 = [number, number, number];
const LOGO_LINES: [V3, V3][] = (() => {
  const L: [V3, V3][] = [];
  const N = 10;
  const tip: V3 = [0, 1.25, 0];
  const base = -0.55;
  const r = 0.36;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    const a1 = ((i + 1) / N) * Math.PI * 2;
    const p0: V3 = [Math.cos(a0) * r, base, Math.sin(a0) * r];
    const p1: V3 = [Math.cos(a1) * r, base, Math.sin(a1) * r];
    L.push([p0, p1]);
    if (i % 2 === 0) L.push([p0, tip]);
  }
  // 輪：円錐の下のほうを囲む
  const R = 0.62;
  const ry = -0.18;
  for (let i = 0; i < 20; i++) {
    const a0 = (i / 20) * Math.PI * 2;
    const a1 = ((i + 1) / 20) * Math.PI * 2;
    L.push([
      [Math.cos(a0) * R, ry, Math.sin(a0) * R],
      [Math.cos(a1) * R, ry, Math.sin(a1) * R],
    ]);
  }
  return L;
})();

function drawLogo(g: CanvasRenderingContext2D, cx: number, cy: number, size: number, rot: number, drawn: number, alpha: number) {
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const tilt = 0.32;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  const proj = ([x, y, z]: V3): [number, number] => {
    const x1 = x * cos - z * sin;
    const z1 = x * sin + z * cos;
    const y2 = y * ct - z1 * st;
    const z2 = y * st + z1 * ct;
    const k = 3.2 / (3.2 + z2);
    return [cx + x1 * size * k, cy - y2 * size * k];
  };
  const n = Math.floor(LOGO_LINES.length * clamp(drawn));
  g.globalAlpha = alpha;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const [a, b] = LOGO_LINES[i];
    const [ax, ay] = proj(a);
    const [bx, by] = proj(b);
    g.moveTo(ax, ay);
    g.lineTo(bx, by);
  }
  g.stroke();
  g.globalAlpha = 1;
}

function drawCursor(g: CanvasRenderingContext2D, x: number, y: number, s: number, pressed: boolean) {
  g.save();
  g.translate(x, y);
  g.scale(s * (pressed ? 0.88 : 1), s * (pressed ? 0.88 : 1));
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, 17);
  g.lineTo(4.5, 13);
  g.lineTo(7.5, 20);
  g.lineTo(10.5, 18.6);
  g.lineTo(7.6, 12);
  g.lineTo(13, 12);
  g.closePath();
  g.shadowBlur = 0;
  g.fillStyle = '#f2fff6';
  g.strokeStyle = '#06110a';
  g.lineWidth = 1.2;
  g.fill();
  g.stroke();
  g.restore();
}

// ---- MATRIX のコードの雨（時刻 t だけで決まる） ----
const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ0123456789Z:・"=*+-<>¦';
const hash = (a: number, b = 0, c = 0) => {
  let x = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647);
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

/**
 * コードの雨。size は 1 文字の高さ（px）。
 * start を渡すと、その時刻から上から降り注ぎ始める（列ごとに少しずつずれて）。渡さなければ、ずっと降り続ける。
 */
export function drawRain(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  o: { size: number; alpha?: number; density?: number; start?: number; font?: string; seed?: number },
) {
  const size = o.size;
  const cols = Math.ceil(w / (size * 0.72));
  const rows = Math.ceil(h / size) + 1;
  const alpha = o.alpha ?? 1;
  const seed = o.seed ?? 1;
  g.save();
  g.shadowBlur = 0;
  g.font = `600 ${size * 0.86}px ${o.font || 'ui-monospace, monospace'}`;
  g.textBaseline = 'top';
  g.textAlign = 'center';
  for (let i = 0; i < cols; i++) {
    if (hash(i, seed, 1) > (o.density ?? 0.75)) continue;
    const speed = 7 + hash(i, seed, 2) * 13; // 行/秒
    const len = 6 + Math.floor(hash(i, seed, 3) * 22);
    let head: number;
    if (o.start !== undefined) {
      head = (t - o.start - hash(i, seed, 4) * 0.35) * speed * 1.6;
      if (head < 0) continue;
    } else {
      const period = rows + len + Math.floor(hash(i, seed, 5) * rows);
      head = ((t * speed + hash(i, seed, 4) * period) % period + period) % period;
    }
    const hr = Math.floor(head);
    const x = (i + 0.5) * size * 0.72;
    for (let k = 0; k < len; k++) {
      const r = hr - k;
      if (r < 0 || r >= rows) continue;
      const ch = GLYPHS[Math.floor(hash(i, r, Math.floor(t * (2 + hash(i, r) * 6)) + seed) * GLYPHS.length)];
      const f = 1 - k / len;
      // 先頭の 1 文字は白く光る（ぼかしは重いので使わず、色だけで）
      g.fillStyle = k === 0 ? `rgba(225,255,235,${alpha})` : `rgba(${40 + 60 * f},${150 + 105 * f},${80 + 40 * f},${alpha * (0.15 + 0.85 * f * f)})`;
      g.fillText(ch, x, r * size);
    }
  }
  g.restore();
}

/** 映像の乱れ（横にずれる帯と、色のにじみ）。窓の時刻の中だけ、t で決まる強さ */
function glitch(g: CanvasRenderingContext2D, w: number, h: number, t: number, k: number) {
  if (k <= 0) return;
  const step = Math.floor(t * 30);
  const n = 3 + Math.floor(hash(step, 7) * 5);
  for (let i = 0; i < n; i++) {
    const y = Math.floor(hash(step, i, 1) * h);
    const bh = Math.max(2, Math.floor(hash(step, i, 2) * h * 0.08 * k));
    const dx = (hash(step, i, 3) - 0.5) * w * 0.12 * k;
    const sc = g.canvas.height / h;
    g.drawImage(g.canvas, 0, y * sc, g.canvas.width, bh * sc, dx, y, w, bh);
  }
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = 0.18 * k;
  g.fillStyle = '#ff2bd6';
  g.fillRect(0, Math.floor(hash(step, 9) * h), w, Math.max(1, h * 0.004));
  g.fillStyle = '#29e7ff';
  g.fillRect(0, Math.floor(hash(step, 10) * h), w, Math.max(1, h * 0.003));
  g.restore();
}

/**
 * 端末の絵を描く。w×h の canvas に、時刻 t の画面。
 * zoomed：全面に出すとき（文字を大きく）。
 */
export function drawTerminal(g: CanvasRenderingContext2D, w: number, h: number, t: number, opts: { zoomed?: boolean; font?: string } = {}) {
  // 基準の大きさ。全面に出すときは、スマホでも読めるよう下限を設ける
  // ただし起動ログの一番長い行（約 600u px）が幅に収まる大きさまで
  const u = opts.zoomed ? Math.min(Math.max(Math.min(w, h * 1.35) / 1000, 0.62), (w * 0.84) / 600) : Math.min(w, h * 1.35) / 1000;
  g.save();
  g.fillStyle = '#020604';
  g.fillRect(0, 0, w, h);

  // ---- ブラウン管が点く：消えている画面 → 中央に光の線 → 上下に開く ----
  const pk = (t - T.powerOn) / 0.55;
  if (pk < 0) {
    g.restore();
    return;
  }
  if (pk < 1) {
    const bh = Math.max(2, h * ease((pk - 0.3) / 0.7));
    g.beginPath();
    g.rect(0, h / 2 - bh / 2, w, bh);
    g.clip();
  }

  // 画面の光の地（中央が少し明るい）
  const bg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  bg.addColorStop(0, 'rgba(40,90,60,0.22)');
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  const family = opts.font || 'ui-monospace, "SFMono-Regular", Menlo, monospace';
  const mono = (px: number) => `500 ${px}px ${family}`;
  g.textBaseline = 'top';
  g.shadowColor = PHOSPHOR;
  g.shadowBlur = 10 * u;
  g.fillStyle = PHOSPHOR;
  g.strokeStyle = PHOSPHOR;
  g.lineWidth = Math.max(1, 2.2 * u);

  const left = w * 0.09;
  const blink = Math.floor(t * 2.6) % 2 === 0;
  const cursorBox = (x: number, y: number, s: number) => {
    if (!blink) return;
    g.strokeRect(x, y + s * 0.15, s * 0.62, s * 0.62);
  };

  const logsOn = t >= T.logsStart;

  if (!logsOn) {
    // ---- 起動ログ ----
    const fs = 26 * u;
    const lh = fs * 1.55;
    g.font = mono(fs);
    const bootChars = BOOT.join('\n').length;
    const k = clamp((t - T.bootStart) / (T.bootEnd - T.bootStart));
    let left2 = Math.floor(bootChars * k);
    let y = h * 0.12;
    const logoPhase = t >= T.logoStart;
    const fade = logoPhase ? 1 - clamp((t - T.logoStart) / 0.7) * 0.65 : 1;
    g.globalAlpha = fade;
    let lastX = left;
    let lastY = y;
    for (const line of BOOT) {
      if (left2 <= 0) break;
      const s = line.slice(0, left2);
      left2 -= line.length + 1;
      // 「online」などの答えは明るく、ドットは暗く
      g.fillStyle = PHOSPHOR_DIM;
      g.fillText(s, left, y);
      const ans = s.match(/\.\s(\S.*)$/);
      if (ans) {
        g.fillStyle = PHOSPHOR;
        const pre = s.slice(0, s.length - ans[1].length);
        g.fillText(ans[1], left + g.measureText(pre).width, y);
      }
      lastX = left + g.measureText(s).width + fs * 0.3;
      lastY = y;
      y += lh;
    }
    // 起きる世界の一文
    const wk = clamp((t - T.wakeStart) / (T.wakeEnd - T.wakeStart));
    if (t >= T.wakeStart) {
      // 一文は幅に収まる大きさに（スマホで切れないように）
      g.font = mono(100);
      const fs2 = Math.min(44 * u, ((w * 0.84) / g.measureText(WAKE).width) * 100);
      g.font = mono(fs2);
      g.fillStyle = PHOSPHOR;
      g.shadowBlur = 16 * u;
      const s = WAKE.slice(0, Math.floor(WAKE.length * wk));
      const yy = y + lh * 0.6;
      g.fillText(s, left, yy);
      lastX = left + g.measureText(s).width + fs2 * 0.25;
      lastY = yy;
      g.shadowBlur = 10 * u;
      if (!logoPhase) cursorBox(lastX, lastY, fs2);
    } else if (t >= T.bootStart) {
      cursorBox(lastX, lastY, fs);
    }
    g.globalAlpha = 1;

    // ---- ロゴ ----
    if (logoPhase) {
      const lk = clamp((t - T.logoStart) / 0.75);
      const cx = w * 0.62;
      const cy = h * 0.42;
      const size = h * 0.2;
      const rot = (t - T.logoStart) * 0.95;
      g.lineWidth = Math.max(1, 2.4 * u);
      g.shadowBlur = 14 * u;
      drawLogo(g, cx, cy, size, rot, ease(lk), 1);
      // クリック後、輪郭が外へ何重にも増える
      if (t >= T.click) {
        const ck = clamp((t - T.click) / 0.6);
        for (let i = 1; i <= 5; i++) {
          const s = 1 + i * 0.16 * ease(ck);
          drawLogo(g, cx, cy, size * s, rot, 1, (1 - i / 6) * 0.75);
        }
      }
      // カーソル：右下から近づいて、ロゴを押す
      const mk = ease((t - (T.logoStart + 0.2)) / (T.click - T.logoStart - 0.2));
      const mx = w * 0.9 + (cx + size * 0.1 - w * 0.9) * mk;
      const my = h * 0.86 + (cy + size * 0.05 - h * 0.86) * mk;
      const pressed = t >= T.click && t < T.click + 0.12;
      drawCursor(g, mx, my, 1.6 * u * 1.2, pressed);
      // 押すと、コードの雨が上から画面いっぱいに降り注ぐ
      if (t >= T.click) drawRain(g, w, h, t, { size: 24 * u, start: T.click + 0.05, density: 0.92, font: family, seed: 5 });
    }
  } else {
    // ---- 背景にコードの雨（薄く）----
    drawRain(g, w, h, t, { size: (opts.zoomed ? 20 : 22) * u, alpha: 0.28, density: 0.55, font: family, seed: 3 });
    // ---- ログが流れる（行番号つき） ----
    const fs = (opts.zoomed ? 22 : 24) * u;
    const lh = fs * 1.6;
    g.font = mono(fs);
    const rows = Math.ceil(h / lh) + 1;
    const scroll = (t - T.logsStart) * 14; // 1 秒あたり 14 行
    const first = Math.floor(scroll);
    const off = (scroll - first) * lh;
    const headK = clamp((t - T.headline) / 0.4);
    g.globalAlpha = 1 - headK * 0.7;
    for (let r = 0; r < rows; r++) {
      const i = first + r;
      const line = LOGS[i % LOGS.length];
      const y = r * lh - off + h * 0.04;
      g.fillStyle = PHOSPHOR_DIM;
      g.fillText(String(i + 1).padStart(3, '0'), w * 0.05, y);
      g.fillStyle = /verify/.test(line) ? '#d6ffe6' : /ai\./.test(line) ? '#b9a6ff' : PHOSPHOR;
      g.fillText(line, w * 0.05 + fs * 3.2, y);
    }
    g.globalAlpha = 1;
    // 降り注いだ雨が、ログの上を抜けていく
    if (t < T.logsStart + 1.2) drawRain(g, w, h, t, { size: 24 * u, start: T.click + 0.05, density: 0.92, font: family, seed: 5, alpha: 1 - clamp((t - T.logsStart) / 1.2) });
    // 見出しの帯
    if (t >= T.headline) {
      // 幅に収まる大きさに（スマホで切れないように）
      g.font = mono(100);
      const fit = (w * 0.84) / g.measureText(HEADLINE).width * 100;
      const fs2 = Math.min(64 * u, fit);
      g.font = mono(fs2);
      const tw = g.measureText(HEADLINE).width;
      const bx = (w - tw) / 2;
      const by = h / 2 - fs2 * 0.75;
      g.shadowBlur = 0;
      g.fillStyle = `rgba(2,6,4,${0.85 * headK})`;
      g.fillRect(bx - fs2 * 0.5, by - fs2 * 0.3, tw + fs2, fs2 * 1.6);
      g.shadowBlur = 20 * u;
      g.fillStyle = `rgba(214,255,230,${headK})`;
      g.fillText(HEADLINE, bx, by);
    }
  }

  // ---- 映像の乱れ：点いた直後、ロゴを押した瞬間、見出しが出る瞬間 ----
  const win = (a: number, d: number) => (t >= a && t < a + d ? 1 - (t - a) / d : 0);
  glitch(g, w, h, t, Math.max(win(T.powerOn + 0.5, 0.35), win(T.click, 0.3), win(T.headline - 0.05, 0.22) * 0.7, win(T.wakeStart + 0.9, 0.12) * 0.5));

  // ---- 走査線と四隅の暗さ（ブラウン管の質感） ----
  g.shadowBlur = 0;
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(0,0,0,0.22)';
  const step = Math.max(2, Math.round(3 * u * 1.4));
  for (let y = 0; y < h; y += step) g.fillRect(0, y, w, Math.max(1, step * 0.45));
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.65)');
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);
  // わずかなちらつき
  g.fillStyle = `rgba(180,255,210,${0.015 + 0.015 * Math.sin(t * 47)})`;
  g.fillRect(0, 0, w, h);
  g.restore();
  if (pk < 1) {
    // 点いた瞬間の光の線（横へ伸びて、開くにつれて消える）
    const lw = w * ease(pk / 0.3);
    const lh2 = Math.max(2, h * 0.008);
    g.save();
    g.globalAlpha = 1 - ease((pk - 0.25) / 0.75);
    g.shadowColor = PHOSPHOR;
    g.shadowBlur = h * 0.03;
    g.fillStyle = '#eafff2';
    g.fillRect(w / 2 - lw / 2, h / 2 - lh2 / 2, lw, lh2);
    g.restore();
  }
}
