'use client';
import { useEffect, useRef } from 'react';
import { rainTexts } from '../content/site';
import { rng } from '../model/hex';

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
const FONT = 15;
const GAP = 1.15; // 列の間隔（文字幅の倍数）。列は詰め、同時に落ちる列を少なくしてまばらに見せる

const TRAIL = 18; // 尾の長さ（文字数）

// 雫（列ごとに一つ）。落ち切ったら、しばらく休んでから次を落とす。
// 毎フレーム画面を消して、落ちている雫だけを描き直す（重ね塗りで薄める方式は残像が消えきらないため）。
// words: 社訓の断片を流す列か、ばらばらの記号を流す列か。chars: マスごとの文字
type Column = { x: number; y: number; speed: number; text: string; tone: number; rest: number; words: boolean; chars: string[] };

// 背景を流れる文字の雨。canvas + requestAnimationFrame。タブ非表示時は止める。
export default function Rain({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    const context = el?.getContext('2d');
    if (!el || !context) return;
    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 映像の書き出し（?capture）では、乱数を固定し、書き出す側が 1 コマずつ進める
    const capture = new URLSearchParams(window.location.search).has('capture');
    const random = capture ? rng(2026) : Math.random;
    let cols: Column[] = [];
    let raf = 0;
    let last = 0;

    const pick = () => rainTexts[Math.floor(random() * rainTexts.length)];
    const glyph = () => GLYPHS[Math.floor(random() * GLYPHS.length)];
    let rows = 0;
    const spawn = (x: number, h: number, first = false): Column => {
      const words = random() < 0.3;
      const text = pick();
      const start = Math.floor(random() * 50);
      return {
        x,
        y: first ? random() * h : -FONT * (1 + random() * 4),
        speed: 70 + random() * 110,
        text,
        tone: 0.45 + random() * 0.55,
        // 同時に落ちているのは列の 1〜2 割。休みは 3〜14 秒
        rest: first ? (random() < 0.16 ? 0 : random() * 14) : 3 + random() * 11,
        words,
        // 社訓の列は文字を順に、記号の列はばらばらに置く
        chars: Array.from({ length: rows + TRAIL + 4 }, (_, i) => (words ? text[(start + i) % text.length] : glyph())),
      };
    };

    let size = { w: 0, h: 0 };
    let dprNow = 1;
    let fontStr = '';
    function resize() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      // スマホのツールバーの出入りで高さだけ少し変わる場合は作り直さない
      if (w === size.w && h <= size.h) return;
      size = { w, h };
      dprNow = Math.min(window.devicePixelRatio || 1, w >= 1024 ? 2 : 1.5);
      canvas.width = Math.round(w * dprNow);
      canvas.height = Math.round(h * dprNow);
      rows = Math.ceil(h / FONT) + 2;
      fontStr = `${FONT}px ${getComputedStyle(canvas).fontFamily}`;
      const n = Math.floor(w / (FONT * GAP));
      cols = Array.from({ length: n }, (_, k) => spawn(k * FONT * GAP + (FONT * GAP) / 2, h, true));
      draw();
    }

    function step(dt: number) {
      const h = size.h;
      for (const c of cols) {
        if (c.rest > 0) {
          c.rest -= dt;
          continue;
        }
        c.y += c.speed * dt;
        // 記号の列は、途中の文字が時々入れ替わる
        if (!c.words && random() < 0.35 * dt * 60 * 0.1) c.chars[Math.floor(random() * c.chars.length)] = glyph();
        if (c.y > h + FONT * (TRAIL + 2)) Object.assign(c, spawn(c.x, h));
      }
      draw();
    }

    function draw() {
      const { w, h } = size;
      ctx.setTransform(dprNow, 0, 0, dprNow, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = fontStr;
      ctx.textAlign = 'center';
      for (const c of cols) {
        if (c.rest > 0) continue;
        const head = Math.floor(c.y / FONT);
        for (let k = 0; k < TRAIL; k++) {
          const cell = head - k;
          if (cell < 0) break;
          if (cell * FONT > h + FONT) continue;
          const ch = c.chars[cell % c.chars.length];
          if (k === 0) {
            // 先頭は白に近い緑で光らせる
            ctx.fillStyle = `rgba(214, 255, 228, ${0.7 + 0.3 * c.tone})`;
          } else {
            const a = Math.pow(1 - k / TRAIL, 1.6) * 0.85 * c.tone;
            ctx.fillStyle = `rgba(62, 240, 140, ${a})`;
          }
          ctx.fillText(ch, c.x, cell * FONT);
        }
      }
    }

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      step(Math.min((now - last) / 1000, 0.1));
      last = now;
    };
    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => cancelAnimationFrame(raf);
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

    if (reduced) {
      // 動かさず、先に進めた状態の静止画を一度だけ描く
      resize();
      window.addEventListener('resize', onResize);
      return () => {
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
      };
    }

    if (capture) {
      resize();
      (window as unknown as { __ykRain: unknown }).__ykRain = { step: (dt: number) => step(dt) };
      return;
    }

    resize();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`font-mono ${className}`} />;
}
