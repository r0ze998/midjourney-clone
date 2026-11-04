'use client';
import { useEffect, useRef } from 'react';
import { bakeBoard, draw, fitScale, hitSettlement, loadSprites, type View } from '../model/render';
import { state } from '../model/state';
import { model, onWake, publish, resumeTour } from '../model/store';
import {
  HERO_VIEW,
  IDLE_RETURN,
  SCENES,
  anchorFor,
  ease,
  lerp,
  lerpW,
  tourAt,
  weightsOf,
  type Layer,
  type SceneKey,
} from '../model/timeline';
import { downgrade, dprFor, initialTier, type Tier } from '../model/tiers';

type Anchor = { key: SceneKey; at: number; top: number; bottom: number };

const MAX_ZOOM = 1.8;
const STILL_TURN = 42;

// 画面に固定した一枚の模型。ページのどこにいても、スクロール位置から場面を決めて描く。
// - canvas は枠いっぱいに絶対配置し、canvas の大きさが枠に影響しないようにする
// - 高さは lvh で固定し、スマホのツールバーの出入りでは作り直さない
// - タブが隠れている間は止める。段 0 では操作・スクロールしたときだけ描く
export default function WorldStage() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let cancelled = false;
    let tier: Tier = initialTier();
    let raf = 0;
    let board: HTMLCanvasElement | null = null;
    let boardScale = 1;
    let sprites: Awaited<ReturnType<typeof loadSprites>> | null = null;
    let spriteSet: '@1x' | '@2x' | null = null;
    let size = { w: 0, h: 0, dpr: 1 };
    let anchors: Anchor[] = [];
    const font = getComputedStyle(canvas).fontFamily || 'monospace';
    let pointer = { x: 0.5, y: 0.5, sx: -1, sy: -1 };
    let tourClock = 0; // ヒーローが見えているあいだだけ進むツアーの時計（秒）
    let lastNow = performance.now();
    let frames = 0;
    let frameCost = 0;

    // ?capture：映像の書き出し用。時間を止め、外から 1 フレームずつ描かせる（teardown の render(t) と同じ考え方）
    const capture = new URLSearchParams(window.location.search).has('capture');
    if (tier === 0 || capture) {
      model.still = true;
      model.mode = 'user';
      model.userTurn = STILL_TURN;
    }
    if (capture) {
      tier = 2;
      (window as unknown as { __ykCapture: unknown }).__ykCapture = {
        ready: () => Boolean(board),
        draw: (turn: number, v: View) => {
          if (!board) return;
          draw({ ctx, width: size.w, height: size.h, dpr: size.dpr, board, boardScale, font, rich: true }, v, state(turn));
        },
      };
    }

    const measure = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
      anchors = els.map((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        return { key: el.dataset.scene as SceneKey, top, bottom: top + r.height, at: top + Math.min(r.height * 0.4, window.innerHeight * 0.45) };
      });
    };

    const rebuild = async () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = dprFor(tier, w);
      const widthChanged = w !== size.w || dpr !== size.dpr;
      // 高さが縮むだけ（スマホのツールバー）のときは何もしない。canvas の大きさを付け直すと中身が消えて重い
      if (!widthChanged && h <= size.h && board) return;
      size = { w, h: Math.max(h, size.h), dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(size.h * dpr);
      if (!widthChanged && board) {
        kick();
        return;
      }
      const want = capture ? 2.4 : Math.min(2.4, fitScale(w, size.h) * MAX_ZOOM * dpr);
      const set: '@1x' | '@2x' = tier === 2 && want > 1.1 ? '@2x' : '@1x';
      if (set !== spriteSet || !sprites) {
        sprites = await loadSprites(set);
        spriteSet = set;
      }
      if (cancelled) return;
      boardScale = Math.max(0.6, Math.min(set === '@2x' ? 2 : 1.2, want));
      board = bakeBoard(sprites, boardScale);
      measure();
      kick();
    };

    // スクロール位置から場面を決める
    const sceneFor = (live: { turn: number; layer: Layer; layers: View['layers']; verify: number }) => {
      const y = window.scrollY + window.innerHeight * 0.5;
      const w = size.w;
      const hero: View & { turn: number } = {
        ...HERO_VIEW,
        ...anchorFor(w, 'hero'),
        cx: HERO_VIEW.cx + (pointer.x - 0.5) * (tier === 2 ? 14 : 0),
        cy: HERO_VIEW.cy + (pointer.y - 0.5) * (tier === 2 ? 10 : 0),
        layers: live.layers,
        verify: live.verify,
        dim: 0,
        turn: live.turn,
      };
      const keys = anchors.filter((a) => a.key !== 'hero');
      const heroA = anchors.find((a) => a.key === 'hero');
      const heroEnd = heroA ? heroA.bottom - window.innerHeight * 0.15 : 0;
      const toView = (k: Exclude<SceneKey, 'hero'>): View & { turn: number } => {
        const s = SCENES[k];
        return { ...s, ...anchorFor(w, k), turn: s.turn[0] };
      };
      if (!keys.length || y <= heroEnd) return { view: hero, heroVisible: true };
      const points: { at: number; v: View & { turn: number } }[] = [{ at: heroEnd, v: hero }, ...keys.map((a) => ({ at: a.at, v: toView(a.key as Exclude<SceneKey, 'hero'>) }))];
      let i = 0;
      while (i < points.length - 1 && points[i + 1].at <= y) i++;
      const a = points[i];
      const b = points[Math.min(i + 1, points.length - 1)];
      const span = b.at - a.at;
      const lin = span > 0 ? Math.max(0, Math.min(1, (y - a.at) / span)) : 1;
      const k = ease(lin);
      const v: View & { turn: number } = {
        cx: lerp(a.v.cx, b.v.cx, k),
        cy: lerp(a.v.cy, b.v.cy, k),
        zoom: lerp(a.v.zoom, b.v.zoom, k),
        ax: lerp(a.v.ax, b.v.ax, k),
        ay: lerp(a.v.ay, b.v.ay, k),
        layers: lerpW(a.v.layers, b.v.layers, k),
        verify: lerp(a.v.verify, b.v.verify, k),
        dim: lerp(a.v.dim, b.v.dim, k),
        // スクロールで時間が進む（ターンは線形に）
        turn: lerp(a.v.turn, b.v.turn, lin),
      };
      return { view: v, heroVisible: i === 0 && lin < 0.35 };
    };

    const frame = (now: number) => {
      raf = 0;
      if (cancelled || !board || capture) return;
      const dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;

      // ツアーと操作
      if (model.mode === 'user' && !model.still && now - model.lastInput > IDLE_RETURN * 1000) {
        resumeTour(now);
        tourClock = 0;
      }
      let live: { turn: number; layer: Layer; layers: View['layers']; verify: number; caption: ReturnType<typeof tourAt>['caption']; cursorTo: Layer | null };
      if (model.mode === 'tour' && !model.still) {
        const t = tourAt(tourClock, model.tourTurn);
        const w = t.layers;
        const layer: Layer = w.ai > 0.5 ? 'ai' : w.defense > 0.5 ? 'defense' : w.logistics > 0.5 ? 'logistics' : 'none';
        live = { turn: t.turn, layer, layers: t.layers, verify: t.verify, caption: t.caption, cursorTo: t.cursorTo };
      } else {
        live = { turn: model.userTurn, layer: model.userLayer, layers: weightsOf(model.userLayer), verify: 0, caption: model.snapshot.caption, cursorTo: null };
      }

      const { view, heroVisible } = sceneFor(live);
      if (heroVisible && model.mode === 'tour' && !model.still) tourClock += dt;

      const st = state(view.turn);
      const t0 = performance.now();
      draw(
        {
          ctx,
          width: size.w,
          height: size.h,
          dpr: size.dpr,
          board,
          boardScale,
          font,
          rich: tier === 2,
          hover: heroVisible && pointer.sx >= 0 ? hitSettlement(view, size.w, size.h, pointer.sx, pointer.sy) : undefined,
        },
        view,
        st,
      );
      const cost = performance.now() - t0;
      if (frames < 60) {
        frames++;
        frameCost += cost;
        if (frames === 60) {
          const next = downgrade(tier, frameCost / 60);
          if (next !== tier) {
            tier = next;
            if (tier === 0) {
              model.still = true;
              model.mode = 'user';
            }
            rebuild();
          }
        }
      }

      const ls = live.turn === view.turn ? st : state(live.turn);
      publish({
        mode: model.mode,
        turn: live.turn,
        layer: live.layer,
        caption: live.caption,
        cursorTo: live.cursorTo,
        readout: ls.readout,
        stocks: ls.stocks,
        still: model.still,
      });

      if (!model.still && document.visibilityState === 'visible') {
        // 段 1 は 30fps
        if (tier === 1) setTimeout(() => (raf = requestAnimationFrame(frame)), 16);
        else raf = requestAnimationFrame(frame);
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight, sx: e.clientX, sy: e.clientY };
      if (model.still) kick();
    };
    const onScroll = () => {
      if (model.still) kick();
    };
    const onVisibility = () => {
      lastNow = performance.now();
      if (document.visibilityState === 'visible') kick();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 150);
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
    model.tourStart = performance.now();
    rebuild();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      offWake();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 block h-lvh w-full font-mono"
    />
  );
}
