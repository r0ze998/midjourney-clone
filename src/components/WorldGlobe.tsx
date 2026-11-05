'use client';
import { useEffect, useRef, useState } from 'react';
import type { Content } from '../content/site';
import { globeUi } from '../content/site';
import { GLOBE_EVENT_SPAN, GLOBE_ROUTES, GLOBE_START, GLOBE_TOTAL, NATIONS, globeState } from '../model/globe';
import { IDLE_RETURN } from '../model/timeline';
import { model } from '../model/store';

type Ui = Content['origin']['globe'];

const DEG = Math.PI / 180;
const BASE_PITCH = 16 * DEG;
const AUTO_SPEED = 0.07; // rad/s
const FOCUS_DISTANCE = 0.52;
const MOBILE_FOCUS_LIFT = 0.17;
const TOUR_HOLD = 4800;
const STATIC_CLOCK = GLOBE_EVENT_SPAN + 0.25;
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
  const [touring, setTouring] = useState(false);
  const [motionAvailable, setMotionAvailable] = useState(false);
  const [readout, setReadout] = useState(() => globeState(GLOBE_START));
  const api = useRef<{
    focus: (i: number) => void;
    rotate: (direction: -1 | 1) => void;
    overview: () => void;
    toggleTour: () => void;
  } | null>(null);

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
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !!qa?.has('reduced-motion');
        const weak = (navigator.hardwareConcurrency ?? 4) <= 2 || ((navigator as { deviceMemory?: number }).deviceMemory ?? 4) <= 2;
        let still = reduced || weak;

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
        const globe = buildGlobe({ rich: !still && window.innerWidth >= 768 });
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
        let mode: 'auto' | 'user' = 'auto';
        let lastInput = 0;
        let sel = -1;
        let tourStep = -1;
        let tourDue = 0;
        let clock = still ? STATIC_CLOCK : 0;
        let size = { w: 0, h: 0 };
        let visible = false;
        let raf = 0;
        let last = performance.now();
        let frames = 0;
        let cost = 0;
        let lastPublish = 0;
        const mobileLift = () => window.innerWidth < 640 ? MOBILE_FOCUS_LIFT : 0;

        const resize = () => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!w || !h || (w === size.w && h === size.h)) return;
          size = { w, h };
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, still ? 1.25 : 1.75));
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // 球が枠の 78% ほどに収まる距離
          fitDistance = 1.18 / Math.tan((camera.fov * DEG) / 2) / Math.min(1, camera.aspect) / 0.78;
          if (to) {
            from = { yaw, pitch, distance, lift };
            to.distance = sel < 0 ? fitDistance : fitDistance * FOCUS_DISTANCE;
            to.lift = sel < 0 ? 0 : mobileLift();
            moveT = 0;
          } else {
            distance = sel < 0 ? fitDistance : fitDistance * FOCUS_DISTANCE;
            lift = sel < 0 ? 0 : mobileLift();
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
          if (tourStep >= 0 && now >= tourDue) {
            if (tourStep < NATIONS.length - 1) {
              focusSettlement(tourStep + 1, false);
              tourStep++;
              tourDue = now + TOUR_HOLD;
            } else {
              showOverview(false);
              stopTour();
            }
          }
          if (mode === 'user' && !to && tourStep < 0 && now - lastInput > IDLE_RETURN * 1000) {
            mode = 'auto';
            sel = -1;
            setSelected(-1);
            from = { yaw, pitch, distance, lift };
            to = { yaw, pitch: BASE_PITCH, distance: fitDistance, lift: 0 };
            moveT = 0;
          }
          if (to) {
            moveT = Math.min(1, moveT + dt / 1.5);
            const k = ease(moveT);
            yaw = from.yaw + wrap(to.yaw - from.yaw) * k;
            pitch = from.pitch + (to.pitch - from.pitch) * k;
            distance = from.distance + (to.distance - from.distance) * k;
            lift = from.lift + (to.lift - from.lift) * k;
            if (moveT >= 1) to = null;
          } else if (mode === 'auto') {
            yaw += AUTO_SPEED * dt;
            pitch += (BASE_PITCH - pitch) * Math.min(1, dt * 0.8);
          }
          clock += dt;
          const t0 = performance.now();
          let st = draw(GLOBE_START + clock);
          // 重い端末は、10 フレームで止めた絵に切り替える
          if (frames < 12) {
            frames++;
            if (frames > 2) cost += Math.max(performance.now() - t0, dt * 1000);
            if (frames === 12 && cost / 10 > 50) {
              still = true;
              clock = Math.max(clock, STATIC_CLOCK);
              st = draw(GLOBE_START + clock);
              setMotionAvailable(false);
              stopTour();
            }
          }
          if (now - lastPublish > 250) {
            lastPublish = now;
            setReadout(st);
          }
          if (!still && visible && document.visibilityState === 'visible' && !raf) raf = requestAnimationFrame(frame);
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

        const stopTour = () => {
          if (tourStep < 0) return;
          tourStep = -1;
          setTouring(false);
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
        const focusSettlement = (i: number, manual: boolean) => {
          if (manual) stopTour();
          const nat = NATIONS[i];
          from = { yaw, pitch, distance, lift };
          to = {
            yaw: yaw + wrap(-nat.lon * DEG - yaw),
            pitch: Math.max(-50 * DEG, Math.min(50 * DEG, nat.lat * DEG)),
            distance: fitDistance * FOCUS_DISTANCE,
            lift: mobileLift(),
          };
          moveT = 0;
          mode = 'user';
          sel = i;
          lastInput = performance.now();
          setSelected(i);
          settleMove();
        };
        const showOverview = (manual: boolean) => {
          if (manual) stopTour();
          from = { yaw, pitch, distance, lift };
          to = { yaw, pitch: BASE_PITCH, distance: fitDistance, lift: 0 };
          moveT = 0;
          mode = 'user';
          sel = -1;
          lastInput = performance.now();
          setSelected(-1);
          settleMove();
        };
        const turnBy = (direction: -1 | 1) => {
          stopTour();
          from = { yaw, pitch, distance, lift };
          to = { yaw: yaw + direction * 20 * DEG, pitch: BASE_PITCH, distance: fitDistance, lift: 0 };
          moveT = 0;
          mode = 'user';
          sel = -1;
          lastInput = performance.now();
          setSelected(-1);
          settleMove();
        };

        // 操作：ドラッグで回す。スマホでは横の動きだけを拾い、縦はページのスクロールに任せる
        let drag: { x: number; y: number; yaw: number; pitch: number; id: number; moved: boolean } | null = null;
        const onDown = (e: PointerEvent) => {
          stopTour();
          drag = { x: e.clientX, y: e.clientY, yaw, pitch, id: e.pointerId, moved: false };
          to = null;
          mode = 'user';
          lastInput = performance.now();
          canvas.setPointerCapture(e.pointerId);
        };
        const onMove = (e: PointerEvent) => {
          if (!drag || e.pointerId !== drag.id) return;
          const dx = e.clientX - drag.x;
          const dy = e.clientY - drag.y;
          if (e.pointerType !== 'mouse' && Math.abs(dx) <= Math.max(4, Math.abs(dy) * 1.1)) return;
          if (!drag.moved) {
            if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
            drag.moved = true;
            if (sel >= 0) {
              sel = -1;
              setSelected(-1);
              from = { yaw, pitch, distance, lift };
              to = { yaw, pitch, distance: fitDistance, lift: 0 };
              moveT = 0;
            }
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
          if (drag && e.pointerId === drag.id) drag = null;
        };
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            turnBy(e.key === 'ArrowLeft' ? -1 : 1);
            return;
          }
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          stopTour();
          from = { yaw, pitch, distance, lift };
          to = {
            yaw,
            pitch: Math.max(-35 * DEG, Math.min(50 * DEG, pitch + (e.key === 'ArrowUp' ? 6 : -6) * DEG)),
            distance: fitDistance,
            lift: 0,
          };
          moveT = 0;
          mode = 'user';
          sel = -1;
          setSelected(-1);
          lastInput = performance.now();
          settleMove();
        };
        canvas.addEventListener('pointerdown', onDown);
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        canvas.addEventListener('pointercancel', onUp);
        canvas.addEventListener('keydown', onKey);

        api.current = {
          focus: (i: number) => focusSettlement(i, true),
          rotate: turnBy,
          overview: () => showOverview(true),
          toggleTour: () => {
            if (tourStep >= 0) {
              stopTour();
              return;
            }
            if (still) return;
            tourStep = 0;
            tourDue = performance.now() + TOUR_HOLD;
            setTouring(true);
            focusSettlement(0, false);
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
            if (visible) {
              if (tourStep >= 0) tourDue = performance.now() + TOUR_HOLD;
              kick();
            }
          },
          { threshold: 0 },
        );
        io.observe(el);
        const onVis = () => {
          last = performance.now();
          if (document.visibilityState === 'visible') {
            if (tourStep >= 0) tourDue = last + TOUR_HOLD;
            kick();
          }
        };
        const onPageScroll = () => stopTour();
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('scroll', onPageScroll, { passive: true });

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          document.removeEventListener('visibilitychange', onVis);
          window.removeEventListener('scroll', onPageScroll);
          canvas.removeEventListener('pointerdown', onDown);
          canvas.removeEventListener('pointermove', onMove);
          canvas.removeEventListener('pointerup', onUp);
          canvas.removeEventListener('pointercancel', onUp);
          canvas.removeEventListener('keydown', onKey);
          disposeRenderer?.();
          api.current = null;
        };
        resize();
        await renderer.compileAsync(scene, camera);
        if (cancelled) return;
        setReadout(draw(GLOBE_START + clock));
        canvas.dataset.ready = '1';
        canvas.dataset.buildMs = buildMs.toFixed(1);
        setMotionAvailable(!still);
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

  const preferredRoute = (route: number) =>
    selected < 0 || GLOBE_ROUTES[route].from === selected || GLOBE_ROUTES[route].to === selected;
  const event = readout.events.find((e) => preferredRoute(e.route)) ?? readout.events[0];
  const shipment = readout.shipments.find((s) => preferredRoute(s.route)) ?? readout.shipments[0];
  const eventRoute = event && GLOBE_ROUTES[event.route];
  const shipmentRoute = shipment && GLOBE_ROUTES[shipment.route];
  const settlementButtons = () => NATIONS.map((n, i) => (
    <button
      key={n.id}
      type="button"
      aria-pressed={selected === i}
      aria-label={`${n.id} · ${n.name}`}
      onClick={() => api.current?.focus(i)}
      disabled={!ready || failed}
      className={`min-h-11 min-w-11 border px-2.5 font-mono text-[0.75rem] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selected === i ? 'border-signal text-signal' : 'border-rule text-ink-2 hover:border-ink-3 hover:text-ink'}`}
    >
      {n.id}
    </button>
  ));
  const navigationButtons = () => (
    <>
      <div className="flex gap-1" role="group" aria-label={ui.canvasLabel}>
        <button type="button" aria-label={ui.rotateLeft} title={ui.rotateLeft} disabled={!ready || failed} onClick={() => api.current?.rotate(-1)} className="min-h-11 min-w-11 border border-rule text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">←</button>
        <button type="button" aria-label={ui.rotateRight} title={ui.rotateRight} disabled={!ready || failed} onClick={() => api.current?.rotate(1)} className="min-h-11 min-w-11 border border-rule text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">→</button>
      </div>
      <button type="button" disabled={!ready || failed || selected < 0} onClick={() => api.current?.overview()} className="min-h-11 border border-rule px-2 text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 sm:px-3">{ui.overview}</button>
      <button type="button" aria-pressed={touring} disabled={!ready || failed || !motionAvailable} onClick={() => api.current?.toggleTour()} className={`min-h-11 border px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 ${touring ? 'border-signal text-signal' : 'border-rule text-ink-2 hover:border-ink-3 hover:text-ink'}`}>{touring ? ui.stopTour : ui.tour}</button>
    </>
  );

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
        <div className="absolute inset-x-2 bottom-2 z-10 border border-rule bg-paper/90 p-2 backdrop-blur-sm sm:hidden">
          <p className="mb-1 font-mono text-[0.625rem] tracking-[0.06em] text-ink-3">{ui.choose}{selected >= 0 && ` · ${NATIONS[selected].name}`}</p>
          <div className="flex justify-center gap-1">{settlementButtons()}</div>
          <div className="mt-1 flex items-center justify-center gap-1 font-mono text-[0.625rem] tracking-[0.02em]">{navigationButtons()}</div>
        </div>
      </div>

      <div className="relative mx-auto mt-4 max-w-[44rem] lg:bg-paper/70 lg:p-4 lg:backdrop-blur-[2px]">
        {failed && <p role="status" className="mb-3 border-l-2 border-rule pl-3 text-[0.75rem] leading-relaxed text-ink-2">{ui.staticNotice}</p>}
        <div className="hidden flex-wrap items-center gap-x-4 gap-y-3 sm:flex">
          <span className="label">{ui.choose}</span>
          <div className="flex flex-wrap gap-1.5">{settlementButtons()}</div>
        </div>
        <div className="mt-3 hidden flex-wrap items-center gap-2 font-mono text-[0.6875rem] tracking-[0.05em] sm:flex">{navigationButtons()}</div>
        {ready && !motionAvailable && <p className="mt-2 text-[0.6875rem] leading-relaxed text-ink-3">{ui.tourUnavailable}</p>}
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
            {selected >= 0 && (
              <p className="border-l-2 border-signal pl-3 text-ink-2">
                <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.07em] text-ink-3">{NATIONS[selected].id} · {NATIONS[selected].name}</span>
                {ui.selectedStock}: <span className="font-mono tabular-nums text-ink">{readout.stocks[selected]}</span> {ui.units}
              </p>
            )}
            <div className={`border-l-2 border-rule pl-3 ${selected < 0 ? 'sm:col-span-2' : ''}`}>
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
            <p role="status" aria-live="polite" className="min-h-5 font-mono text-[0.6875rem] tracking-[0.04em] text-signal sm:col-span-2">
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
