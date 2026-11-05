'use client';
import { useEffect, useRef, useState } from 'react';
import type { Content } from '../content/site';
import { globeUi } from '../content/site';
import { GLOBE_START, GLOBE_TOTAL, NATIONS, globeState } from '../model/globe';
import { IDLE_RETURN } from '../model/timeline';
import { model } from '../model/store';

type Ui = Content['origin']['globe'];

const DEG = Math.PI / 180;
const BASE_PITCH = 16 * DEG;
const AUTO_SPEED = 0.07; // rad/s
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const ease = (k: number) => 1 - Math.pow(1 - k, 3);

/**
 * 「ワールド・ゲーム」の球体の模型。画面に近づいたときだけ three.js を読み込み、見えている間だけ描く。
 * 自動でゆっくり回り、ドラッグ（スマホは横だけ。縦はページのスクロール）や集落のボタンで操作を渡す。
 * 25 秒触らなければ自動に戻る（上の模型と同じ規則）。動きを減らす設定では止めた絵で、操作したときだけ描き直す。
 */
export default function WorldGlobe({ ui }: { ui: Ui }) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [readout, setReadout] = useState(() => globeState(GLOBE_START));
  const api = useRef<{ focus: (i: number) => void } | null>(null);

  useEffect(() => {
    const el = host.current;
    const canvas = canvasRef.current;
    const labelBox = labelsRef.current;
    if (!el || !canvas || !labelBox) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const start = async () => {
      try {
        const THREE = await import('three');
        const { buildGlobe } = await import('../model3d/globe3d');
        if (cancelled) return;
        const capture = new URLSearchParams(window.location.search).has('capture');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const weak = (navigator.hardwareConcurrency ?? 4) <= 2 || ((navigator as { deviceMemory?: number }).deviceMemory ?? 4) <= 2;
        let still = reduced || weak;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        renderer.setClearColor(0x000000, 0);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
        camera.position.set(0, 0, 4.6);
        // 月明かり：左上の手前から。右の縁は暗く落とす
        scene.add(new THREE.HemisphereLight('#6d7fa8', '#07090a', 0.42));
        const moon = new THREE.DirectionalLight('#dfe7ff', 2.6);
        moon.position.set(-3.6, 2.2, 2.6);
        scene.add(moon);
        const rim = new THREE.DirectionalLight('#ffd6a6', 0.45);
        rim.position.set(3.5, -0.6, -2.4);
        scene.add(rim);

        const tb = performance.now();
        const globe = buildGlobe({ rich: !still && window.innerWidth >= 768 });
        performance.measure('yk-globe-build', { start: tb, end: performance.now() });
        scene.add(globe.root);

        // 札（集落名と在庫）
        labelBox.replaceChildren();
        const tags = NATIONS.map((n) => {
          const d = document.createElement('div');
          d.className = 'pointer-events-none absolute left-0 top-0 whitespace-nowrap font-mono text-[0.625rem] tracking-[0.08em] text-ink transition-opacity duration-300';
          d.innerHTML = `<span class="yk-g-dot"></span><span class="yk-g-tag"><b>${n.id}</b><span class="yk-g-name"> · ${n.name}</span> <i>0</i></span>`;
          labelBox.appendChild(d);
          return { d, num: d.querySelector('i') as HTMLElement };
        });

        // 回り方
        let yaw = -10 * DEG;
        let pitch = BASE_PITCH;
        let from = { yaw, pitch };
        let to: { yaw: number; pitch: number } | null = null;
        let moveT = 0;
        let mode: 'auto' | 'user' = 'auto';
        let lastInput = 0;
        let sel = -1;
        let clock = 0;
        let size = { w: 0, h: 0 };
        let visible = false;
        let raf = 0;
        let last = performance.now();
        let frames = 0;
        let cost = 0;
        let lastPublish = 0;

        const resize = () => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!w || !h || (w === size.w && h === size.h)) return;
          size = { w, h };
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, still ? 1.25 : 1.75));
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // 球が枠の 78% ほどに収まる距離
          const fit = 1.18 / Math.tan((camera.fov * DEG) / 2) / Math.min(1, camera.aspect) / 0.78;
          camera.position.set(0, 0, fit);
          camera.updateProjectionMatrix();
        };

        const v = new THREE.Vector3();
        const n = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        const draw = (t: number) => {
          globe.root.rotation.set(pitch, yaw, 0, 'XYZ');
          globe.root.updateMatrixWorld();
          const st = globeState(t);
          globe.update(st, sel, t);
          renderer.render(scene, camera);
          // 札：手前を向いている集落だけ
          const small = size.w < 520;
          globe.frames.forEach((f, i) => {
            v.copy(f.pos).applyMatrix4(globe.root.matrixWorld);
            n.copy(f.normal).applyQuaternion(globe.root.quaternion);
            camDir.copy(camera.position).sub(v).normalize();
            const facing = n.dot(camDir);
            const tag = tags[i];
            const p = v.project(camera);
            const x = (p.x * 0.5 + 0.5) * size.w;
            const y = (-p.y * 0.5 + 0.5) * size.h;
            const show = facing > 0.18;
            tag.d.style.opacity = show ? String(Math.min(1, (facing - 0.18) * 4)) : '0';
            tag.d.style.transform = `translate(${x}px, ${y}px)`;
            tag.d.dataset.sel = i === sel ? '1' : '0';
            tag.d.dataset.small = small && i !== sel ? '1' : '0';
            tag.num.textContent = String(st.stocks[i]);
          });
          return st;
        };

        const frame = (now: number) => {
          raf = 0;
          if (cancelled) return;
          const dt = Math.min(0.1, (now - last) / 1000);
          last = now;
          if (mode === 'user' && !to && now - lastInput > IDLE_RETURN * 1000) {
            mode = 'auto';
            sel = -1;
            setSelected(-1);
          }
          if (to) {
            moveT = Math.min(1, moveT + dt / 1.4);
            const k = ease(moveT);
            yaw = from.yaw + wrap(to.yaw - from.yaw) * k;
            pitch = from.pitch + (to.pitch - from.pitch) * k;
            if (moveT >= 1) to = null;
          } else if (mode === 'auto') {
            yaw += AUTO_SPEED * dt;
            pitch += (BASE_PITCH - pitch) * Math.min(1, dt * 0.8);
          }
          clock += dt;
          const t0 = performance.now();
          const st = draw(GLOBE_START + clock);
          // 重い端末は、10 フレームで止めた絵に切り替える
          if (frames < 12) {
            frames++;
            if (frames > 2) cost += Math.max(performance.now() - t0, dt * 1000);
            if (frames === 12 && cost / 10 > 50) still = true;
          }
          if (now - lastPublish > 250) {
            lastPublish = now;
            setReadout(st);
          }
          if (!still && visible && document.visibilityState === 'visible') raf = requestAnimationFrame(frame);
        };
        const kick = () => {
          if (!raf && !capture) {
            last = performance.now();
            raf = requestAnimationFrame(frame);
          }
        };
        const redraw = () => {
          // 止めた絵の段：操作したときだけ描き直す
          if (still) {
            setReadout(draw(GLOBE_START + clock));
          } else kick();
        };

        // 操作：ドラッグで回す。スマホでは横の動きだけを拾い、縦はページのスクロールに任せる
        let drag: { x: number; y: number; yaw: number; pitch: number; id: number } | null = null;
        const onDown = (e: PointerEvent) => {
          drag = { x: e.clientX, y: e.clientY, yaw, pitch, id: e.pointerId };
          to = null;
          mode = 'user';
          lastInput = performance.now();
          canvas.setPointerCapture(e.pointerId);
        };
        const onMove = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          const k = 3.4 / Math.max(240, size.w);
          yaw = drag.yaw + (e.clientX - drag.x) * k;
          if (e.pointerType === 'mouse') pitch = Math.max(-35 * DEG, Math.min(50 * DEG, drag.pitch + (e.clientY - drag.y) * k));
          lastInput = performance.now();
          redraw();
        };
        const onUp = (e: PointerEvent) => {
          if (drag && e.pointerId === drag.id) drag = null;
        };
        const onKey = (e: KeyboardEvent) => {
          const step = 12 * DEG;
          if (e.key === 'ArrowLeft') yaw -= step;
          else if (e.key === 'ArrowRight') yaw += step;
          else if (e.key === 'ArrowUp') pitch = Math.min(50 * DEG, pitch + step / 2);
          else if (e.key === 'ArrowDown') pitch = Math.max(-35 * DEG, pitch - step / 2);
          else return;
          e.preventDefault();
          to = null;
          mode = 'user';
          lastInput = performance.now();
          redraw();
        };
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onUp);
        canvas.addEventListener('keydown', onKey);

        api.current = {
          focus: (i: number) => {
            const nat = NATIONS[i];
            from = { yaw, pitch };
            to = { yaw: yaw + wrap(-nat.lon * DEG - yaw), pitch: Math.max(-30 * DEG, Math.min(45 * DEG, nat.lat * DEG * 0.85)) };
            moveT = 0;
            mode = 'user';
            sel = i;
            lastInput = performance.now();
            setSelected(i);
            if (still) {
              // 動きを減らす設定：移らず、その場で向ける
              yaw = to.yaw;
              pitch = to.pitch;
              to = null;
              redraw();
            } else kick();
          },
        };

        const ro = new ResizeObserver(() => {
          resize();
          redraw();
        });
        ro.observe(el);
        const io = new IntersectionObserver(
          ([e]) => {
            visible = e.isIntersecting;
            // 球体が画面の 3 割以上に出ている間、後ろの盤の描画を止める
            model.globeActive = e.intersectionRatio > 0.3;
            if (visible) kick();
          },
          { threshold: [0, 0.3, 0.6] },
        );
        io.observe(el);
        const onVis = () => {
          last = performance.now();
          if (document.visibilityState === 'visible') kick();
        };
        document.addEventListener('visibilitychange', onVis);

        resize();
        await renderer.compileAsync(scene, camera);
        if (cancelled) return;
        setReadout(draw(GLOBE_START + clock));
        canvas.dataset.ready = '1';
        setReady(true);
        if (capture) {
          (window as unknown as { __ykGlobe: unknown }).__ykGlobe = {
            render: (t: number, y?: number, p?: number, s = -1) => {
              if (y !== undefined) yaw = y * DEG;
              if (p !== undefined) pitch = p * DEG;
              sel = s;
              draw(GLOBE_START + t);
            },
          };
        }

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          model.globeActive = false;
          document.removeEventListener('visibilitychange', onVis);
          canvas.removeEventListener('pointerdown', onDown);
          canvas.removeEventListener('pointermove', onMove);
          canvas.removeEventListener('pointerup', onUp);
          canvas.removeEventListener('pointercancel', onUp);
          canvas.removeEventListener('keydown', onKey);
          renderer.dispose();
          api.current = null;
        };
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    // 画面に近づいてから読み込む
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          near.disconnect();
          start();
        }
      },
      { rootMargin: '900px 0px' },
    );
    near.observe(el);
    return () => {
      cancelled = true;
      near.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <div>
      <div ref={host} className="relative mx-auto aspect-square w-full max-w-[44rem]">
        {/* 読み込むまで・描けないときの代わりの絵 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/globe-still.webp"
          alt={failed ? ui.stillAlt : ''}
          aria-hidden={failed ? undefined : true}
          width={880}
          height={880}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${ready && !failed ? 'opacity-0' : 'opacity-100'}`}
        />
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label={ui.canvasLabel}
          className={`absolute inset-0 block h-full w-full cursor-grab touch-pan-y outline-none transition-opacity duration-700 focus-visible:ring-1 focus-visible:ring-signal active:cursor-grabbing ${ready && !failed ? 'opacity-100' : 'opacity-0'}`}
        />
        <div ref={labelsRef} aria-hidden="true" className="yk-globe-tags pointer-events-none absolute inset-0 overflow-hidden" />
      </div>

      <div className="relative mx-auto mt-4 max-w-[44rem] lg:bg-paper/70 lg:p-4 lg:backdrop-blur-[2px]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="label">{ui.choose}</span>
          <div className="flex flex-wrap gap-1.5">
            {NATIONS.map((n, i) => (
              <button
                key={n.id}
                type="button"
                aria-pressed={selected === i}
                aria-label={`${n.id} · ${n.name}`}
                onClick={() => api.current?.focus(i)}
                className={`min-h-11 min-w-11 border px-2.5 font-mono text-[0.75rem] transition-colors ${selected === i ? 'border-signal text-signal' : 'border-rule text-ink-2 hover:border-ink-3 hover:text-ink'}`}
              >
                {n.id}
              </button>
            ))}
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 border-y border-rule font-mono text-[0.6875rem] tracking-[0.06em]" lang="en">
          {[
            [globeUi.stored, readout.stored],
            [globeUi.transit, readout.transit],
            [globeUi.total, GLOBE_TOTAL],
          ].map(([k, val]) => (
            <div key={k} className="flex flex-col gap-1 py-2.5 pr-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 sm:pr-4 [&+&]:border-l [&+&]:border-rule [&+&]:pl-3 sm:[&+&]:pl-4">
              <dt className="text-ink-3">{k}</dt>
              <dd className="tabular-nums text-ink">{val}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-3">{ui.hint}</p>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-3">{ui.note}</p>
      </div>
    </div>
  );
}
