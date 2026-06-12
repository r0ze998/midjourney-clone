'use client';
import { useEffect, useRef } from 'react';
import { matrixTexts } from '../content/site';

const GLITCH_CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';

const FONT_SIZE = 18;
const COLUMN_GAP = 1.4;

type Column = {
  x: number;
  y: number;
  speed: number;
  text: string;
  charIndex: number;
};

// 旧実装は40個のDOM要素を100ms間隔で再レンダリングしていたため重かった。
// canvas + requestAnimationFrame に置き換え、タブ非表示時は描画を止める。
export default function MatrixRain({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let columns: Column[] = [];
    let rafId = 0;
    let lastTime = 0;

    const pickText = () =>
      matrixTexts[Math.floor(Math.random() * matrixTexts.length)];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_SIZE}px monospace`;

      const count = Math.floor(canvas.offsetWidth / (FONT_SIZE * COLUMN_GAP));
      columns = Array.from({ length: count }, (_, i) => ({
        x: i * FONT_SIZE * COLUMN_GAP + FONT_SIZE / 2,
        y: Math.random() * -canvas.offsetHeight,
        speed: 40 + Math.random() * 80,
        text: pickText(),
        charIndex: 0,
      }));
    };

    const step = (dt: number) => {
      const h = canvas.offsetHeight;
      ctx.fillStyle = 'rgba(5, 6, 5, 0.18)';
      ctx.fillRect(0, 0, canvas.offsetWidth, h);

      for (const col of columns) {
        col.y += col.speed * dt;

        const char =
          Math.random() < 0.04
            ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
            : col.text[col.charIndex % col.text.length];
        col.charIndex++;

        // 先頭文字は明るく、軌跡はフェードで残す
        ctx.fillStyle = 'rgba(62, 240, 140, 0.9)';
        ctx.fillText(char, col.x, col.y);

        if (col.y > h + FONT_SIZE * col.text.length) {
          col.y = Math.random() * -h * 0.5;
          col.speed = 40 + Math.random() * 80;
          col.text = pickText();
          col.charIndex = 0;
        }
      }
    };

    const draw = (time: number) => {
      rafId = requestAnimationFrame(draw);
      step(Math.min((time - lastTime) / 1000, 0.1));
      lastTime = time;
    };

    const start = () => {
      cancelAnimationFrame(rafId);
      lastTime = performance.now();
      rafId = requestAnimationFrame(draw);
    };
    const stop = () => cancelAnimationFrame(rafId);

    const onVisibility = () =>
      document.visibilityState === 'visible' ? start() : stop();

    // reduced-motion 時はアニメーションせず、数百フレーム分を即時計算した静止画を描く
    if (reducedMotion) {
      const renderStatic = () => {
        resize();
        for (let i = 0; i < 400; i++) step(1 / 60);
      };
      renderStatic();
      window.addEventListener('resize', renderStatic);
      return () => window.removeEventListener('resize', renderStatic);
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

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
