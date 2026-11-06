'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * サイトを開いたときの導入（約 6.6 秒）。ブラウザのセッションごとに 1 回。
 * 表示するかどうかは、<head> のインラインスクリプトが html[data-intro] を立てて決める
 * （動きを減らす設定・?capture・2 回目以降は立てない）。立っていなければ何もしない。
 * three.js の部屋 → 画面いっぱいの 2D の端末 → 白い光でサイトへ。Skip・Esc・Enter・クリックで飛ばせる。
 *
 * パラメータ：
 * - ?intro=1                  既視でも・動きを減らす設定でも、必ず流す（強制再生。最後まで流れて自動で終わる）
 * - ?intro=1&introCapture=1   撮影用。自動では進めず、window.__ykIntro.render(t) で時刻 t の 1 コマを描く
 */
export default function Intro({ skip }: { skip: string }) {
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const c3 = useRef<HTMLCanvasElement>(null);
  const c2 = useRef<HTMLCanvasElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const finish = useRef<() => void>(() => {});

  useEffect(() => {
    if (document.documentElement.dataset.intro !== '1') return;
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let raf = 0;
    let cleanup = () => {};
    const html = document.documentElement;
    const done = () => {
      if (cancelled) return;
      cancelled = true;
      cancelAnimationFrame(raf);
      try {
        sessionStorage.setItem('yk-intro', '1');
      } catch {}
      setLeaving(true);
      html.removeAttribute('data-intro');
      // 本文の先頭へ
      window.setTimeout(() => {
        cleanup();
        setActive(false);
        document.getElementById('main')?.focus({ preventScroll: true });
      }, 650);
    };
    finish.current = done;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        done();
      }
    };
    window.addEventListener('keydown', onKey);

    (async () => {
      try {
        const [THREE, { buildIntro }, term] = await Promise.all([import('three'), import('../model3d/intro3d'), import('../model3d/terminal')]);
        if (cancelled) return;
        const canvas3 = c3.current!;
        const canvas2 = c2.current!;
        const font = getComputedStyle(html).getPropertyValue('--font-geist-mono').trim() || undefined;
        // ?intro=1 は強制再生（普通に最後まで流れる）。撮影用は ?intro=1&introCapture=1：
        // ループを回さず、window.__ykIntro.render(t) で 1 コマずつ描く（拍ごとの静止画の確認・書き出し用）
        const capture = new URLSearchParams(location.search).has('introCapture');

        // 画面の絵（3D の画面に貼る 4:3 の canvas）
        const scr = document.createElement('canvas');
        scr.width = 1024;
        scr.height = 768;
        const sg = scr.getContext('2d')!;

        let renderer: InstanceType<typeof THREE.WebGLRenderer> | null = null;
        try {
          renderer = new THREE.WebGLRenderer({ canvas: canvas3, antialias: true });
        } catch {
          renderer = null;
        }
        const world = renderer ? buildIntro(scr) : null;
        if (renderer) {
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
        }
        const g2 = canvas2.getContext('2d')!;
        let w = 0;
        let h = 0;
        const resize = () => {
          w = window.innerWidth;
          h = window.innerHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2);
          renderer?.setPixelRatio(dpr);
          renderer?.setSize(w, h, false);
          canvas2.width = Math.round(w * dpr);
          canvas2.height = Math.round(h * dpr);
          g2.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        let only2d = !renderer;
        // 時刻 t の 1 コマ
        const draw = (t: number) => {
          const handoff = term.T.logsStart - 0.25;
          const mix = Math.max(0, Math.min(1, (t - handoff) / 0.3));
          if (!only2d && world && renderer && mix < 1) {
            term.drawTerminal(sg, scr.width, scr.height, t, { font });
            world.update(t, w / h);
            renderer.render(world.scene, world.camera);
          }
          const show2 = only2d ? 1 : mix;
          canvas2.style.opacity = String(show2);
          canvas3.style.opacity = String(only2d ? 0 : 1);
          if (show2 > 0) term.drawTerminal(g2, w, h, only2d ? t : Math.max(t, term.T.logsStart), { zoomed: true, font });
          // 白い光
          const fk = (t - term.T.flash) / (term.INTRO_LENGTH - term.T.flash);
          if (flash.current) {
            flash.current.style.opacity = String(fk <= 0 ? 0 : Math.min(1, fk * 2.2));
            flash.current.style.transform = `translate(-50%, -50%) scale(${fk <= 0 ? 0 : 0.2 + fk * 4})`;
          }
        };
        if (renderer && world) await renderer.compileAsync(world.scene, world.camera).catch(() => {});
        if (cancelled) return;

        if (capture) (window as unknown as { __ykIntro: unknown }).__ykIntro = { render: (t: number) => draw(t), length: term.INTRO_LENGTH };

        const start = performance.now();
        let frames = 0;
        let slow = 0;
        let last = start;
        const loop = (now: number) => {
          if (cancelled) return;
          const t = (now - start) / 1000;
          // 最初の数コマが重ければ、3D の部屋をやめて 2D の端末だけにする
          if (!only2d && frames < 10) {
            frames++;
            if (frames > 2 && now - last > 70) slow++;
            if (slow >= 4) only2d = true;
          }
          last = now;
          draw(t);
          if (t >= term.INTRO_LENGTH) return done();
          raf = requestAnimationFrame(loop);
        };
        if (!capture) raf = requestAnimationFrame(loop);

        cleanup = () => {
          window.removeEventListener('resize', resize);
          renderer?.dispose();
          world?.dispose();
        };
      } catch {
        done();
      }
    })();

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={wrap}
      className={`yk-intro fixed inset-0 z-[100] overflow-hidden bg-black transition-opacity duration-[650ms] ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      onClick={() => finish.current()}
    >
      <div aria-hidden="true">
        <canvas ref={c3} className="absolute inset-0 h-full w-full" />
        <canvas ref={c2} className="absolute inset-0 h-full w-full opacity-0" />
        <div
          ref={flash}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] rounded-full opacity-0"
          style={{ background: 'radial-gradient(circle, #f4fff8 0%, #dffbe9 38%, rgba(200,255,220,0.35) 62%, rgba(0,0,0,0) 72%)' }}
        />
      </div>
      <button
        type="button"
        autoFocus
        onClick={(e) => {
          e.stopPropagation();
          finish.current();
        }}
        className="absolute bottom-5 right-5 min-h-11 border border-[#7dffb0]/40 bg-black/60 px-4 font-mono text-[0.75rem] uppercase tracking-[0.18em] text-[#b8ffd2] hover:border-[#7dffb0]"
      >
        {skip} ›
      </button>
    </div>
  );
}
