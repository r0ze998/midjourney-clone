// 導入の端末の絵。時刻 t（秒）だけで決まる（純粋）。3D のモニターの画面にも、全面の 2D にも同じ関数で描く。
// 緑の燐光の文字・点滅するカーソル・雪風のロゴ（円錐と輪）のワイヤーフレーム・模型の実際の出来事のログ。

import { state } from '../model/state';
import { nameOf } from '../model/world';

export const INTRO_LENGTH = 6.6;

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

// 拍（秒）
export const T = {
  lamp: 0.6,
  bootStart: 0.6,
  bootEnd: 2.5,
  wakeStart: 2.55,
  wakeEnd: 3.3,
  logoStart: 3.4,
  click: 4.15,
  logsStart: 4.6,
  headline: 5.55,
  flash: 5.95,
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

/**
 * 端末の絵を描く。w×h の canvas に、時刻 t の画面。
 * zoomed：全面に出すとき（文字を大きく）。
 */
export function drawTerminal(g: CanvasRenderingContext2D, w: number, h: number, t: number, opts: { zoomed?: boolean; font?: string } = {}) {
  // 基準の大きさ。全面に出すときは、スマホでも読めるよう下限を設ける
  const u = opts.zoomed ? Math.max(Math.min(w, h * 1.35) / 1000, 0.62) : Math.min(w, h * 1.35) / 1000;
  g.save();
  g.fillStyle = '#020604';
  g.fillRect(0, 0, w, h);

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
    const fade = logoPhase ? 1 - clamp((t - T.logoStart) / 0.5) * 0.65 : 1;
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
      const fs2 = 44 * u;
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
      const lk = clamp((t - T.logoStart) / 0.55);
      const cx = w * 0.62;
      const cy = h * 0.42;
      const size = h * 0.2;
      const rot = (t - T.logoStart) * 1.3;
      g.lineWidth = Math.max(1, 2.4 * u);
      g.shadowBlur = 14 * u;
      drawLogo(g, cx, cy, size, rot, ease(lk), 1);
      // クリック後、輪郭が外へ何重にも増える
      if (t >= T.click) {
        const ck = clamp((t - T.click) / 0.45);
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
    }
  } else {
    // ---- ログが流れる（行番号つき） ----
    const fs = (opts.zoomed ? 22 : 24) * u;
    const lh = fs * 1.6;
    g.font = mono(fs);
    const rows = Math.ceil(h / lh) + 1;
    const scroll = (t - T.logsStart) * 26; // 1 秒あたり 26 行
    const first = Math.floor(scroll);
    const off = (scroll - first) * lh;
    const headK = clamp((t - T.headline) / 0.25);
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
}
