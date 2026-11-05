'use client';
import { useEffect, useRef, useState } from 'react';
import { state } from '../model/state';
import { model, onWake, publish, resumeTour } from '../model/store';
import {
  IDLE_RETURN,
  SCENES,
  anchorFor,
  ease,
  lerp,
  lerpV,
  lerpW,
  tourAt,
  viewOnly,
  weightsOf,
  type CaptionKey,
  type Layer,
  type LayerWeights,
  type SceneKey,
  type ViewKey,
  type ViewWeights,
} from '../model/timeline';
import { downgrade, dprFor, initialTier, type Tier } from '../model/tiers';

type Anchor = { key: SceneKey; at: number; top: number; bottom: number };
type Frame = {
  turn: number;
  layers: LayerWeights;
  views: ViewWeights;
  verify: number;
  dim: number;
  spin: number;
  ax: number;
  ay: number;
};
type Live = Frame & { layer: Layer; view: ViewKey; caption: CaptionKey; cursorTo: ReturnType<typeof tourAt>['cursorTo'] };

const STILL_TURN = 42;

// 画面に固定した 3D の模型（three.js）。ページのどこにいても、スクロール位置から場面を決めて描く。
// - 形は world3d.ts、カメラは camera.ts、計器は console.ts。どれも state(turn) から描き直す
// - three は後から読み込む（最初の表示を待たせない）。WebGL が使えなければ止めた絵を出す
// - タブが隠れているあいだは止める。段 0 では操作・スクロールしたときだけ描く
export default function WorldStage({ stillSrc, stillAlt }: { stillSrc: string; stillAlt: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    const calloutBox = calloutRef.current;
    if (!canvas || !calloutBox) return;
    let cancelled = false;
    let dispose = () => {};

    (async () => {
      try {
        const THREE = await import('three');
        const { buildWorld } = await import('../model3d/world3d');
        const { poseFor } = await import('../model3d/camera');
        const con = await import('../model3d/console');
        if (cancelled) return;

        let tier: Tier = initialTier();
        const capture = new URLSearchParams(window.location.search).has('capture');
        if (capture) tier = 2;
        if (tier === 0 || capture) {
          model.still = true;
          model.mode = 'user';
          model.userTurn = STILL_TURN;
        }

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier === 2, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: capture });
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = tier === 2;
        renderer.shadowMap.type = THREE.PCFShadowMap;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog('#050706', 45, 105);
        const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 220);

        // 夜の照明：青い月明かり（影）、空と地の明かり、中央の灯りのたまり
        scene.add(new THREE.HemisphereLight('#6d7fa8', '#0b0e0c', 0.95));
        const moon = new THREE.DirectionalLight('#cfdcff', 1.55);
        moon.position.set(-9, 15, 7);
        moon.castShadow = tier === 2;
        Object.assign(moon.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60 });
        moon.shadow.mapSize.set(2048, 2048);
        moon.shadow.bias = -0.0006;
        moon.shadow.normalBias = 0.02;
        scene.add(moon, moon.target);
        const lamp = new THREE.SpotLight('#ffd6a6', 55, 42, 0.62, 0.85, 1.5);
        lamp.position.set(0.5, 17, 2.5);
        lamp.target.position.set(0.5, 0, 0.5);
        scene.add(lamp, lamp.target);

        const world = buildWorld({ rich: tier === 2 });
        scene.add(world.root);

        const font = getComputedStyle(canvas).fontFamily || 'monospace';
        let size = { w: 0, h: 0, dpr: 1 };
        let anchors: Anchor[] = [];
        let pointer = { x: 0.5, y: 0.5 };
        let tourClock = 0;
        let lastNow = performance.now();
        let frames = 0;
        let frameCost = 0;
        let raf = 0;
        let frameNo = 0;
        let frozen = false;

        const measure = () => {
          anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).map((el) => {
            const r = el.getBoundingClientRect();
            const top = r.top + window.scrollY;
            return { key: el.dataset.scene as SceneKey, top, bottom: top + r.height, at: top + Math.min(r.height * 0.4, window.innerHeight * 0.45) };
          });
        };

        const resize = () => {
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          if (!w || !h) return;
          const dpr = dprFor(tier, w);
          // 高さが縮むだけ（スマホのツールバー）のときは描き直さない
          if (w === size.w && h <= size.h && dpr === size.dpr) return;
          size = { w, h: Math.max(h, size.h), dpr };
          renderer.setPixelRatio(dpr);
          renderer.setSize(w, size.h, false);
          camera.aspect = w / size.h;
          camera.updateProjectionMatrix();
          measure();
          kick();
        };

        // ---- いまの姿を決める ----
        const liveFrame = (): Live => {
          const anchor = anchorFor(size.w, 'hero');
          if (model.mode === 'tour' && !model.still) {
            const t = tourAt(tourClock, model.tourTurn);
            return { ...t, dim: 0, spin: 0, ...anchor };
          }
          return {
            turn: model.userTurn,
            layer: model.userLayer,
            layers: weightsOf(model.userLayer),
            view: model.userView,
            views: viewOnly(model.userView),
            verify: model.userLayer === 'none' ? 0.6 : 0,
            dim: 0,
            spin: 0,
            caption: captionForLayer(model.userLayer, model.userView),
            cursorTo: null,
            ...anchor,
          };
        };

        const sceneFrame = (live: Live): { frame: Frame; heroVisible: boolean } => {
          const y = window.scrollY + window.innerHeight * 0.5;
          const heroA = anchors.find((a) => a.key === 'hero');
          const heroEnd = heroA ? heroA.bottom - window.innerHeight * 0.15 : 0;
          const keys = anchors.filter((a) => a.key !== 'hero');
          if (!keys.length || y <= heroEnd) return { frame: live, heroVisible: true };
          const toFrame = (k: Exclude<SceneKey, 'hero'>): Frame => {
            const s = SCENES[k];
            return { turn: s.turn, layers: s.layers, views: viewOnly(s.view), verify: s.verify, dim: s.dim, spin: s.spin, ...anchorFor(size.w, k) };
          };
          const pts: { at: number; f: Frame }[] = [{ at: heroEnd, f: live }, ...keys.map((a) => ({ at: a.at, f: toFrame(a.key as Exclude<SceneKey, 'hero'>) }))];
          let i = 0;
          while (i < pts.length - 1 && pts[i + 1].at <= y) i++;
          const a = pts[i];
          const b = pts[Math.min(i + 1, pts.length - 1)];
          const span = b.at - a.at;
          const lin = span > 0 ? Math.max(0, Math.min(1, (y - a.at) / span)) : 1;
          const k = ease(lin);
          return {
            frame: {
              turn: lerp(a.f.turn, b.f.turn, lin),
              layers: lerpW(a.f.layers, b.f.layers, k),
              views: lerpV(a.f.views, b.f.views, k),
              verify: lerp(a.f.verify, b.f.verify, k),
              dim: lerp(a.f.dim, b.f.dim, k),
              spin: lerp(a.f.spin, b.f.spin, lin),
              ax: lerp(a.f.ax, b.f.ax, k),
              ay: lerp(a.f.ay, b.f.ay, k),
            },
            heroVisible: i === 0 && lin < 0.35,
          };
        };

        // コールアウト：付け根（3D）を画面に写し、少し離した札と細い線でつなぐ
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'absolute inset-0 h-full w-full');
        calloutBox.appendChild(svg);
        const pool: { box: HTMLDivElement; line: SVGLineElement; dot: SVGCircleElement }[] = [];
        const hide = (p: (typeof pool)[number]) => {
          p.box.style.display = 'none';
          p.line.style.display = p.dot.style.display = 'none';
        };
        const drawCallouts = (list: ReturnType<typeof con.calloutsFor>) => {
          list = list.slice(0, size.w >= 1024 ? 2 : 1);
          while (pool.length < list.length) {
            const box = document.createElement('div');
            box.className = 'absolute whitespace-nowrap border bg-card/90 px-2.5 py-1.5 font-mono text-[0.6875rem] tracking-[0.04em] text-ink';
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('stroke-width', '1');
            const dot = document.createElementNS(svgNS, 'circle');
            dot.setAttribute('r', '2.5');
            svg.append(line, dot);
            calloutBox.appendChild(box);
            pool.push({ box, line, dot });
          }
          pool.forEach((p, i) => {
            const c = list[i];
            if (!c) return hide(p);
            let anchor = world.anchors.get(c.anchor)?.clone();
            if (c.anchor.startsWith('cart:')) {
              const g = world.cartGroup(c.anchor.slice(5));
              if (g) anchor = g.position.clone().add(new THREE.Vector3(0, 0.28, 0));
            }
            if (!anchor) return hide(p);
            const sp = anchor.project(camera);
            const sx = (sp.x * 0.5 + 0.5) * size.w;
            const sy = (-sp.y * 0.5 + 0.5) * size.h;
            if (sp.z > 1 || sx < 0 || sx > size.w || sy < 60 || sy > size.h) return hide(p);
            const color = c.accent === 'ai' ? '#9b7bff' : c.accent === 'signal' ? '#3ef08c' : c.accent === 'human' ? '#e0704f' : '#a9b2aa';
            p.box.style.display = 'block';
            p.line.style.display = p.dot.style.display = 'inline';
            if (p.box.textContent !== c.text) p.box.textContent = c.text;
            p.box.style.borderColor = color;
            // 札は画面の内側に収める（端から 16px）。付け根が右寄りなら左へ出す
            const bw = p.box.offsetWidth;
            // 右に計器があるときは、その手前までに収める
            const panel = document.querySelector<HTMLElement>('[data-console]');
            const pr = panel && panel.offsetParent ? panel.getBoundingClientRect() : null;
            const right = pr && pr.top < size.h && pr.bottom > 0 ? pr.left - 16 : size.w - 16;
            const left = sx + 56 + bw > right && sx - 56 - bw >= 16;
            let bx = sx + (left ? -56 - bw : 56);
            bx = Math.max(16, Math.min(right - bw, bx));
            const by = Math.max(72, sy - 54 - i * 38);
            p.box.style.left = `${bx}px`;
            p.box.style.top = `${by}px`;
            p.box.style.transform = 'translateY(-50%)';
            // 線は札の近い側の縁へ
            const ex = bx + bw / 2 < sx ? bx + bw : bx;
            p.line.setAttribute('x1', String(sx));
            p.line.setAttribute('y1', String(sy));
            p.line.setAttribute('x2', String(ex));
            p.line.setAttribute('y2', String(by));
            p.line.setAttribute('stroke', color);
            p.dot.setAttribute('cx', String(sx));
            p.dot.setAttribute('cy', String(sy));
            p.dot.setAttribute('fill', color);
          });
        };

        // ---- 1 フレームを描く（f と live が決まれば、前のフレームに関係なく同じ絵になる） ----
        const paint = (f: Frame, live: Live, heroVisible: boolean, parallax: boolean) => {
          const st = state(f.turn);
          world.update(st, { layers: f.layers, verify: f.verify, dim: f.dim, turn: f.turn });
          // 沈め具合が 0.9 を超えた分は、盤そのものを透かして消す（社名の項で球体を前に出すため）
          const fade = f.dim > 0.9 ? Math.max(0, 1 - (f.dim - 0.9) / 0.1) : 1;
          if (canvas.style.opacity !== String(fade)) canvas.style.opacity = String(fade);
          const az = model.orbitAz + (parallax ? (pointer.x - 0.5) * 6 : 0);
          const pose = poseFor(f.views, st, size.w / size.h, az, f.spin);
          camera.position.copy(pose.pos);
          camera.lookAt(pose.target);
          // 霧は注視点までの距離に合わせる。縦長の画面で引いたときに模型が霧に沈まないように
          if (scene.fog instanceof THREE.Fog) {
            const d = pose.pos.distanceTo(pose.target);
            scene.fog.near = d * 0.85;
            scene.fog.far = d * 2.1;
          }
          // ワールドの中心を画面の (ax, ay) に置く
          camera.setViewOffset(size.w, size.h, -(f.ax - 0.5) * size.w, -(f.ay - 0.5) * size.h, size.w, size.h);
          renderer.render(scene, camera);

          // 計器（ヒーローが見えているときだけ）。段 1 では 1 フレームおき
          if (heroVisible && (tier === 2 || frameNo % 2 === 0)) {
            const chart = document.getElementById('yk-chart') as HTMLCanvasElement | null;
            const decisions = document.getElementById('yk-decisions') as HTMLCanvasElement | null;
            const schematic = document.getElementById('yk-schematic') as HTMLCanvasElement | null;
            const d = Math.min(2, size.dpr || 1);
            if (chart?.offsetParent) con.drawCharts(chart, live.turn, live.layers, font, d);
            if (decisions?.offsetParent) con.drawDecisions(decisions, live.turn, font, d);
            if (schematic?.offsetParent) con.drawSchematic(schematic, live.turn === f.turn ? st : state(live.turn), live.layers, font, d);
          }
          drawCallouts(heroVisible ? con.calloutsFor(live.caption, st) : []);
          return st;
        };

        const frame = (now: number) => {
          raf = 0;
          if (cancelled) return;
          const dt = Math.min(0.1, (now - lastNow) / 1000);
          lastNow = now;
          frameNo++;
          if (model.mode === 'user' && !model.still && now - model.lastInput > IDLE_RETURN * 1000) {
            resumeTour(now);
            tourClock = 0;
          }
          const live = liveFrame();
          const { frame: f, heroVisible } = sceneFrame(live);
          if (heroVisible && model.mode === 'tour' && !model.still) tourClock += dt;
          // 社名の項で球体が出ている間は、沈めた盤を描かない（最後の絵がそのまま残る）。GPU を球体に回す
          // ただし止める前に、沈めた今の場面を一度描く（前の場面の絵が残らないように）
          if (model.globeActive && f.dim > 0.95) {
            if (!frozen) {
              paint(f, live, false, false);
              frozen = true;
            }
            if (!model.still && document.visibilityState === 'visible') setTimeout(() => (raf = requestAnimationFrame(frame)), 120);
            return;
          }
          frozen = false;
          const t0 = performance.now();
          const st = paint(f, live, heroVisible, tier === 2 && size.w >= 1024 && model.mode !== 'tour');
          const cost = performance.now() - t0;
          // 最初の 4 フレーム（シェーダーの準備）は数えない。10 フレームで重すぎると分かれば、60 を待たずに下げる。
          // 段 1 は 30fps で回すので、その分を引いて比べる
          if (frameNo > 4 && frames < 60) {
            frames++;
            frameCost += Math.max(cost, dt * 1000 - (tier === 1 ? 16 : 0));
            const avg = frameCost / frames;
            if (frames === 60 || (frames === 10 && avg > 40)) {
              frames = 60;
              const next = downgrade(tier, avg);
              if (next !== tier) {
                tier = next;
                renderer.shadowMap.enabled = tier === 2;
                moon.castShadow = tier === 2;
                size = { ...size, dpr: 0 };
                resize();
                if (tier === 0) {
                  model.still = true;
                  model.mode = 'user';
                }
              }
            }
          }
          const ls = live.turn === f.turn ? st : state(live.turn);
          publish({ mode: model.mode, turn: live.turn, layer: live.layer, view: live.view, caption: live.caption, cursorTo: live.cursorTo, readout: ls.readout, stocks: ls.stocks, still: model.still });
          if (!model.still && document.visibilityState === 'visible') {
            if (tier === 1) setTimeout(() => (raf = requestAnimationFrame(frame)), 16);
            else raf = requestAnimationFrame(frame);
          }
        };
        function kick() {
          if (!raf && !capture) raf = requestAnimationFrame(frame);
        }

        // 映像の書き出し用：t 秒のツアーの 1 フレームを描く
        if (capture) {
          (window as unknown as { __ykCapture: unknown }).__ykCapture = {
            ready: () => canvas.dataset.ready === '1',
            render: (t: number, at?: { ax: number; ay: number; layers?: Live['layers']; cam?: { pos: number[]; target: number[]; turn?: number } }) => {
              const anchor = at ? { ax: at.ax, ay: at.ay } : anchorFor(size.w, 'hero');
              const tf = tourAt(t);
              const live: Live = { ...tf, dim: 0, spin: 0, ...anchor, ...(at?.layers ? { layers: at.layers } : {}), ...(at?.cam?.turn !== undefined ? { turn: at.cam.turn } : {}) };
              paint(live, live, !at?.cam, false);
              // 確認用：カメラを指定して撮り直す（部品を寄って見るため）
              if (at?.cam) {
                camera.clearViewOffset();
                camera.position.set(at.cam.pos[0], at.cam.pos[1], at.cam.pos[2]);
                camera.lookAt(at.cam.target[0], at.cam.target[1], at.cam.target[2]);
                if (scene.fog instanceof THREE.Fog) {
                  scene.fog.near = 30;
                  scene.fog.far = 90;
                }
                renderer.render(scene, camera);
              }
              const ls = state(live.turn);
              publish({ mode: 'tour', turn: live.turn, layer: live.layer, view: live.view, caption: live.caption, cursorTo: live.cursorTo, cursorPath: tf.cursorPath, readout: ls.readout, stocks: ls.stocks, still: false }, true);
            },
          };
        }

        // 操作
        const onPointer = (e: PointerEvent) => {
          if (e.pointerType !== 'mouse') return;
          pointer = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
          if (model.still) kick();
        };
        // 止めた絵の段では、スクロールが落ち着いてから一度だけ描き直す（重い端末でスクロールを詰まらせない）
        let scrollTimer = 0;
        const onScroll = () => {
          if (!model.still) return;
          window.clearTimeout(scrollTimer);
          scrollTimer = window.setTimeout(kick, 160);
        };
        const onVisibility = () => {
          lastNow = performance.now();
          if (document.visibilityState === 'visible') kick();
        };
        let resizeTimer = 0;
        const onResize = () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(resize, 150);
        };
        const ro = new ResizeObserver(() => {
          measure();
          kick();
        });
        ro.observe(document.body);
        window.addEventListener('pointermove', onPointer, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibility);
        const offWake = onWake(kick);

        resize();
        // シェーダーを先にまとめて用意し、最初のフレームで止まらないようにする
        camera.position.set(0, 35, 35);
        camera.lookAt(0, 0, 0);
        await renderer.compileAsync(scene, camera);
        if (cancelled) return;
        model.tourStart = performance.now();
        canvas.dataset.ready = '1';
        if (model.still && !capture) frame(performance.now());
        else kick();

        dispose = () => {
          cancelAnimationFrame(raf);
          window.clearTimeout(resizeTimer);
          ro.disconnect();
          offWake();
          window.removeEventListener('pointermove', onPointer);
          window.removeEventListener('scroll', onScroll);
          window.clearTimeout(scrollTimer);
          window.removeEventListener('resize', onResize);
          document.removeEventListener('visibilitychange', onVisibility);
          scene.traverse((o) => {
            const m = o as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] };
            m.geometry?.dispose();
            const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
            mats.forEach((x) => x.dispose());
          });
          renderer.dispose();
        };
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 -z-10 block h-lvh w-full font-mono" />
      <div ref={calloutRef} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-10 h-lvh w-full" />
      {fallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={stillSrc} alt={stillAlt} className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[46svh] w-full object-contain lg:left-[30%] lg:h-svh lg:w-[70%]" />
      )}
    </>
  );
}

function captionForLayer(layer: Layer, view: ViewKey): CaptionKey {
  if (view === 'ride') return 'ride';
  if (layer === 'logistics') return 'logistics';
  if (layer === 'defense') return 'defense';
  if (layer === 'ai') return 'ai';
  return 'overview';
}
