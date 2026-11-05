'use client';
import { useEffect, useRef, useState } from 'react';
import type { Content } from '../content/site';
import { globeUi } from '../content/site';
import { GLOBE_EVENT_SPAN, GLOBE_ROUTES, GLOBE_START, GLOBE_TOTAL, NATIONS, globeState } from '../model/globe';
import { model } from '../model/store';

type Ui = Content['origin']['globe'];

const DEG = Math.PI / 180;
const BASE_PITCH = 16 * DEG;
const AUTO_SPEED = 0.07; // rad/s
const RESUME_DELAY = 1200;
const STATIC_CLOCK = GLOBE_EVENT_SPAN + 0.25;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const ease = (k: number) => 1 - Math.pow(1 - k, 3);

/**
 * 「ワールド・ゲーム」の球体の模型。画面に近づいたときだけ three.js を読み込み、見えている間だけ描く。
 * 自動でゆっくり回り、ドラッグ（スマホは横だけ。縦はページのスクロール）や矢印キーで操作を渡す。
 * 操作後はゆっくり自動回転に戻る。動きを減らす設定では、操作したときだけ描き直す。
 */
export default function WorldGlobe({ ui }: { ui: Ui }) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [readout, setReadout] = useState(() => globeState(GLOBE_START));

  useEffect(() => {
    const el = host.current;
    const canvas = canvasRef.current;
    const labelBox = labelsRef.current;
    if (!el || !canvas || !labelBox) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    // buildGlobe などが例外を出しても、生成済みの WebGL コンテキストを必ず解放する。
    let disposeRenderer: (() => void) | null = null;

    // 盤の WebGL が使えない場合も、固定のヒーロー画像を球体の上に重ねない。
    const visibility = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.dataset.globeInView = String(entry.isIntersecting);
        model.globeActive = entry.intersectionRatio > 0.1;
      },
      { threshold: [0, 0.1] },
    );
    visibility.observe(el);

    const start = async () => {
      try {
        const qa = process.env.NODE_ENV === 'production' ? null : new URLSearchParams(window.location.search);
        if (qa?.has('no-webgl')) {
          setFailed(true);
          return;
        }
        const THREE = await import('three');
        const { buildGlobe } = await import('../model3d/globe3d');
        if (cancelled) return;
        const capture = new URLSearchParams(window.location.search).has('capture');
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const forcedReduced = !!qa?.has('reduced-motion');
        let still = motionQuery.matches || forcedReduced;
        const weak = (navigator.hardwareConcurrency ?? 4) <= 2 || ((navigator as { deviceMemory?: number }).deviceMemory ?? 4) <= 2;
        let lowResolution = weak;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: capture });
        disposeRenderer = () => {
          disposeRenderer = null;
          renderer.dispose();
        };
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.03;
        renderer.setClearColor(0x000000, 0);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 20);
        camera.position.set(0, 0, 4.6);
        // 暗い模型のまま、裏側へ回した集落も読める程度に前面を補う。
        scene.add(new THREE.HemisphereLight('#788da7', '#142019', 0.65));
        const moon = new THREE.DirectionalLight('#dfe7ff', 2.35);
        moon.position.set(-3.6, 2.2, 2.6);
        scene.add(moon);
        const fill = new THREE.DirectionalLight('#bed7cc', 0.65);
        fill.position.set(2.8, 0.3, 3.5);
        scene.add(fill);
        const rim = new THREE.DirectionalLight('#ffd6a6', 0.45);
        rim.position.set(3.5, -0.6, -2.4);
        scene.add(rim);

        const tb = performance.now();
        const globe = buildGlobe({ rich: !still && !weak && window.innerWidth >= 768 });
        const buildMs = performance.now() - tb;
        performance.measure('yk-globe-build', { start: tb, end: tb + buildMs });
        scene.add(globe.root);

        // 札（集落名と在庫）
        labelBox.replaceChildren();
        const tags = NATIONS.map((n) => {
          const d = document.createElement('div');
          d.className = 'pointer-events-none absolute left-0 top-0 whitespace-nowrap font-mono text-[0.625rem] tracking-[0.08em] text-ink transition-opacity duration-300';
          d.innerHTML = `<span class="yk-g-dot"></span><span class="yk-g-tag"><b>${n.id}</b><span class="yk-g-name"> · ${n.name}</span> <i>0</i></span>`;
          labelBox.appendChild(d);
          return { d, num: d.querySelector('i') as HTMLElement, label: d.querySelector('.yk-g-tag') as HTMLElement };
        });

        // 回り方
        let yaw = -10 * DEG;
        let pitch = BASE_PITCH;
        let distance = 6;
        let lift = 0;
        let fitDistance = 6;
        let from = { yaw, pitch, distance, lift };
        let to: { yaw: number; pitch: number; distance: number; lift: number } | null = null;
        let moveT = 0;
        let lastInput = 0;
        let spin = AUTO_SPEED;
        let sel = -1;
        let drag: { x: number; y: number; yaw: number; pitch: number; id: number; engaged: boolean } | null = null;
        let clock = still ? STATIC_CLOCK : 0;
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
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowResolution || still ? 1 : 1.75));
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // 球が枠の 78% ほどに収まる距離
          fitDistance = 1.18 / Math.tan((camera.fov * DEG) / 2) / Math.min(1, camera.aspect) / 0.78;
          if (to) {
            from = { yaw, pitch, distance, lift };
            to.distance = fitDistance;
            to.lift = 0;
            moveT = 0;
          } else {
            distance = fitDistance;
            lift = 0;
          }
          camera.position.set(0, 0, distance);
          camera.updateProjectionMatrix();
        };

        const v = new THREE.Vector3();
        const n = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        const draw = (t: number) => {
          camera.position.z = distance;
          globe.root.position.y = lift;
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
            // 点は集落に残し、選択中の札だけ離して建物を隠さない。
            tag.label.style.transform = i === sel
              ? `translate(${x > size.w - 155 ? -135 : 24}px, ${y < 70 ? 30 : -24}px)`
              : '';
            tag.num.textContent = String(st.stocks[i]);
          });
          return st;
        };

        const frame = (now: number) => {
          raf = 0;
          if (cancelled) return;
          const dt = Math.min(0.1, (now - last) / 1000);
          last = now;
          const resume = !drag?.engaged && now - lastInput >= RESUME_DELAY;
          const targetSpin = resume ? AUTO_SPEED : 0;
          spin += (targetSpin - spin) * (1 - Math.exp(-dt / 1.1));
          if (to) {
            moveT = Math.min(1, moveT + dt / 1.5);
            const k = ease(moveT);
            yaw = from.yaw + wrap(to.yaw - from.yaw) * k;
            pitch = from.pitch + (to.pitch - from.pitch) * k;
            distance = from.distance + (to.distance - from.distance) * k;
            lift = from.lift + (to.lift - from.lift) * k;
            if (moveT >= 1) to = null;
          } else if (!drag?.engaged) {
            yaw += spin * dt;
            if (resume) pitch += (BASE_PITCH - pitch) * (1 - Math.exp(-dt / 2.5));
          }
          clock += dt;
          const t0 = performance.now();
          let st = draw(GLOBE_START + clock);
          // 重い端末は解像度を下げて、動きを保つ。
          if (frames < 12) {
            frames++;
            if (frames > 2) cost += Math.max(performance.now() - t0, dt * 1000);
            if (frames === 12 && cost / 10 > 50 && !lowResolution) {
              lowResolution = true;
              size = { w: 0, h: 0 };
              resize();
              st = draw(GLOBE_START + clock);
            }
          }
          if (now - lastPublish > 250) {
            lastPublish = now;
            setReadout(st);
          }
          if (!still && visible && document.visibilityState === 'visible' && !raf) raf = requestAnimationFrame(frame);
        };
        const kick = () => {
          if (!raf && !capture && !still && visible && document.visibilityState === 'visible') {
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

        const settleMove = () => {
          if (still && to) {
            yaw = to.yaw;
            pitch = to.pitch;
            distance = to.distance;
            lift = to.lift;
            to = null;
            redraw();
          } else kick();
        };
        const turnBy = (direction: -1 | 1) => {
          from = { yaw, pitch, distance, lift };
          to = { yaw: yaw + direction * 20 * DEG, pitch, distance: fitDistance, lift: 0 };
          moveT = 0;
          lastInput = performance.now();
          spin = 0;
          settleMove();
        };

        // 操作：ドラッグで回す。スマホでは横の動きだけを拾い、縦はページのスクロールに任せる
        const onDown = (e: PointerEvent) => {
          if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
          const engaged = e.pointerType === 'mouse';
          drag = { x: e.clientX, y: e.clientY, yaw, pitch, id: e.pointerId, engaged };
          if (engaged) {
            to = null;
            lastInput = performance.now();
            spin = 0;
          }
          canvas.setPointerCapture(e.pointerId);
        };
        const onMove = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          const dx = e.clientX - drag.x;
          const dy = e.clientY - drag.y;
          if (!drag.engaged) {
            if (Math.abs(dx) <= Math.max(4, Math.abs(dy) * 1.1)) return;
            drag.engaged = true;
            // 縦スクロールの間は回し続け、横操作と分かってから現在位置を基準にする。
            drag.yaw = yaw;
            drag.pitch = pitch;
            to = null;
            spin = 0;
          }
          const k = 3.4 / Math.max(240, size.w);
          yaw = drag.yaw + dx * k;
          if (e.pointerType === 'mouse') pitch = Math.max(-35 * DEG, Math.min(50 * DEG, drag.pitch + dy * k));
          if (to) {
            from.yaw = to.yaw = yaw;
            from.pitch = to.pitch = pitch;
          }
          lastInput = performance.now();
          redraw();
        };
        const onUp = (e: PointerEvent) => {
          if (drag && e.pointerId === drag.id) {
            if (drag.engaged) lastInput = performance.now();
            drag = null;
          }
        };
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            turnBy(e.key === 'ArrowLeft' ? -1 : 1);
            return;
          }
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          from = { yaw, pitch, distance, lift };
          to = {
            yaw,
            pitch: Math.max(-35 * DEG, Math.min(50 * DEG, pitch + (e.key === 'ArrowUp' ? 6 : -6) * DEG)),
            distance: fitDistance,
            lift: 0,
          };
          moveT = 0;
          lastInput = performance.now();
          spin = 0;
          settleMove();
        };
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onUp);
        canvas.addEventListener('keydown', onKey);

        const ro = new ResizeObserver(() => {
          resize();
          redraw();
        });
        ro.observe(el);
        const io = new IntersectionObserver(
          ([e]) => {
            visible = e.isIntersecting;
            if (visible) {
              kick();
            }
          },
          { threshold: 0 },
        );
        io.observe(el);
        const onVis = () => {
          last = performance.now();
          if (document.visibilityState === 'visible') {
            kick();
          }
        };
        const onMotionChange = () => {
          still = motionQuery.matches || forcedReduced;
          if (still) {
            cancelAnimationFrame(raf);
            raf = 0;
            redraw();
          } else {
            lastInput = performance.now();
            spin = 0;
            if (visible && document.visibilityState === 'visible') kick();
          }
        };
        document.addEventListener('visibilitychange', onVis);
        motionQuery.addEventListener('change', onMotionChange);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          document.removeEventListener('visibilitychange', onVis);
          motionQuery.removeEventListener('change', onMotionChange);
          canvas.removeEventListener('pointerdown', onDown);
          canvas.removeEventListener('pointermove', onMove);
          canvas.removeEventListener('pointerup', onUp);
          canvas.removeEventListener('pointercancel', onUp);
          canvas.removeEventListener('keydown', onKey);
          disposeRenderer?.();
        };
        resize();
        await renderer.compileAsync(scene, camera);
        if (cancelled) return;
        setReadout(draw(GLOBE_START + clock));
        canvas.dataset.ready = '1';
        canvas.dataset.buildMs = buildMs.toFixed(1);
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
      } catch {
        cleanup?.();
        cleanup = null;
        disposeRenderer?.();
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
      visibility.disconnect();
      delete document.documentElement.dataset.globeInView;
      model.globeActive = false;
      cleanup?.();
      disposeRenderer?.();
    };
  }, []);

  const event = readout.events[0];
  const shipment = readout.shipments[0];
  const eventRoute = event && GLOBE_ROUTES[event.route];
  const shipmentRoute = shipment && GLOBE_ROUTES[shipment.route];

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
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 motion-reduce:transition-none ${ready && !failed ? 'opacity-0' : 'opacity-100'}`}
        />
        <canvas
          ref={canvasRef}
          tabIndex={ready && !failed ? 0 : -1}
          role="img"
          aria-hidden={!ready || failed}
          aria-label={ui.canvasLabel}
          className={`absolute inset-0 block h-full w-full touch-pan-y outline-none transition-opacity duration-700 motion-reduce:transition-none focus-visible:ring-1 focus-visible:ring-signal ${ready && !failed ? 'cursor-grab opacity-100 active:cursor-grabbing' : 'pointer-events-none opacity-0'}`}
        />
        <div ref={labelsRef} aria-hidden="true" className={`yk-globe-tags pointer-events-none absolute inset-0 overflow-hidden ${ready && !failed ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      <div className="relative mx-auto mt-4 max-w-[44rem] lg:bg-paper/70 lg:p-4 lg:backdrop-blur-[2px]">
        {failed && <p role="status" className="mb-3 border-l-2 border-rule pl-3 text-[0.75rem] leading-relaxed text-ink-2">{ui.staticNotice}</p>}
        {ready && !failed && (
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
        )}
        {ready && !failed && (
          <div className="mt-3 grid gap-3 text-[0.75rem] leading-relaxed sm:grid-cols-2">
            <div className="border-l-2 border-rule pl-3 sm:col-span-2">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.07em] text-ink-3">{ui.shipment}</p>
              {shipment && shipmentRoute && (
                <>
                  <p className="mt-0.5 text-ink-2">
                    {NATIONS[shipmentRoute.from].name} <span aria-hidden="true">→</span> {NATIONS[shipmentRoute.to].name}
                    <span className="ml-2 font-mono tabular-nums text-ink">{shipment.amount} {ui.units}</span>
                  </p>
                  <div className="mt-1.5 h-1 max-w-[18rem] bg-rule" aria-hidden="true"><div className="h-full bg-signal transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${Math.round(shipment.progress * 100)}%` }} /></div>
                  <span className="sr-only">{Math.round(shipment.progress * 100)}%</span>
                </>
              )}
            </div>
            <p className="min-h-5 font-mono text-[0.6875rem] tracking-[0.04em] text-signal sm:col-span-2">
              {event && eventRoute && `${event.kind === 'depart' ? ui.departed : ui.arrived}: ${NATIONS[eventRoute.from].name} → ${NATIONS[eventRoute.to].name} · ${event.amount} ${ui.units}`}
            </p>
          </div>
        )}
        {!failed && <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-3">{ui.hint}</p>}
        <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-3">{ui.note}</p>
      </div>
    </div>
  );
}
