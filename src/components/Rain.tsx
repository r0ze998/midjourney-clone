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

    // 残像の濃さ。60fps で 1 フレームあたり 0.035 暗くするのと同じ減衰を、任意の dt に換算する
    const fadeFor = (dt: number) => 1 - Math.pow(1 - 0.035, dt * 60);

    let size = { w: 0, h: 0 };
    function resize() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      // スマホのツールバーの出入りで高さだけ少し変わる場合は作り直さない
      if (w === size.w && h <= size.h) return;
      size = { w, h };
      const dpr = Math.min(window.devicePixelRatio || 1, w >= 1024 ? 2 : 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT}px ${getComputedStyle(canvas).fontFamily}`;
      ctx.textAlign = 'center';
      const n = Math.floor(w / (FONT * GAP));
      cols = Array.from({ length: n }, (_, k) => spawn(k * FONT * GAP + (FONT * GAP) / 2, h));
      ctx.fillStyle = '#040604';
      ctx.fillRect(0, 0, w, h);
      // 最初から画面全体に雨が降っているように、約20秒分を粗い刻みで先に進めておく
      for (let k = 0; k < 100; k++) step(0.2);
    }

    function step(dt: number) {
      const w = size.w;
      const h = size.h;
      // 残像: 前のフレームを少しだけ暗くする
      ctx.fillStyle = `rgba(4, 6, 4, ${fadeFor(dt)})`;
      ctx.fillRect(0, 0, w, h);
      for (const c of cols) {
        const from = Math.floor(c.y / FONT);
        c.y += c.speed * dt;
        const to = Math.floor(c.y / FONT);
        // 進んだ分のマス目すべてに文字を打つ（dt が大きくても列が途切れない）
        for (let cell = from + 1; cell <= to; cell++) {
          if (cell < 0) continue;
          const ch = Math.random() < 0.03 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : c.text[c.i % c.text.length];
          c.i++;
          ctx.fillStyle = `rgba(62, 240, 140, ${0.7 * c.tone})`;
          ctx.fillText(ch, c.x, cell * FONT);
        }
        if (c.y > h + FONT * c.text.length) {
          Object.assign(c, spawn(c.x, h), { y: -Math.random() * h * 0.4 });
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
