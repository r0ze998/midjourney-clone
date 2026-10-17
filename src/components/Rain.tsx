'use client';
import { useEffect, useRef } from 'react';
import { rainTexts } from '../content/site';

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
const FONT = 15;
const GAP = 1.7; // 列の間隔（文字幅の倍数）。疎らにして、文字が読める速さにする

type Column = { x: number; y: number; speed: number; text: string; i: number; tone: number };

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
    let cols: Column[] = [];
    let raf = 0;
    let last = 0;

    const pick = () => rainTexts[Math.floor(Math.random() * rainTexts.length)];
    const spawn = (x: number, h: number): Column => ({
      x,
      y: -Math.random() * h,
      speed: 28 + Math.random() * 46,
      text: pick(),
      i: 0,
      tone: 0.3 + Math.random() * 0.7,
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT}px ${getComputedStyle(canvas).fontFamily}`;
      ctx.textAlign = 'center';
      const n = Math.floor(w / (FONT * GAP));
      cols = Array.from({ length: n }, (_, k) => spawn(k * FONT * GAP + (FONT * GAP) / 2, h));
      ctx.fillStyle = '#040604';
      ctx.fillRect(0, 0, w, h);
      // 最初から画面全体に雨が降っているように、数秒分を先に進めておく
      for (let k = 0; k < 1500; k++) step(1 / 60);
    }

    function step(dt: number) {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      // 残像: 前のフレームを少しだけ暗くする
      ctx.fillStyle = 'rgba(4, 6, 4, 0.035)';
      ctx.fillRect(0, 0, w, h);
      for (const c of cols) {
        const prev = c.y;
        c.y += c.speed * dt;
        // 文字ひとつ分進んだときだけ、次の文字を打つ
        if (Math.floor(c.y / FONT) !== Math.floor(prev / FONT)) {
          const ch = Math.random() < 0.03 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : c.text[c.i % c.text.length];
          c.i++;
          ctx.fillStyle = `rgba(62, 240, 140, ${0.7 * c.tone})`;
          ctx.fillText(ch, c.x, c.y);
        }
        if (c.y > h + FONT * c.text.length) {
          Object.assign(c, spawn(c.x, h), { y: -Math.random() * h * 0.4 });
        }
      }
    }

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
      // 動かさず、数百フレーム分を計算した静止画を一度だけ描く
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }

    resize();
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`font-mono ${className}`} />;
}
