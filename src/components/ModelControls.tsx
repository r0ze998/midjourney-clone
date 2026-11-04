'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getSnapshot, model, resumeTour, subscribe, takeControl, wake } from '../model/store';
import { LAYERS, VIEWS, type Layer, type ViewKey } from '../model/timeline';
import { MAX_TURN, SETTLEMENTS } from '../model/world';
import { modelUi, type Content } from '../content/site';

// ヒーローの操作部品。入力は 1 つ（ターン）と、層を 1 つずつ取り出すボタン、カメラの視点のボタン。
// 自動の案内のあいだはカーソルがボタンを押しにいく。触ると操作を渡す。
export default function ModelControls({ c }: { c: Content['model'] }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const wrap = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<Layer, HTMLButtonElement | null>>>({});
  const viewButtons = useRef<Partial<Record<ViewKey, HTMLButtonElement | null>>>({});

  // カーソルを次に押すボタンへ動かす（視点が変わるならその視点のボタン、層だけならその層のボタン）
  const cursorView = snap.cursorTo?.view;
  const cursorLayer = snap.cursorTo?.layer;
  const cursorPath = snap.cursorPath;
  useEffect(() => {
    const el = cursor.current;
    const box = wrap.current;
    if (!el || !box) return;
    const btn = (to: { layer?: Layer; view?: ViewKey } | undefined) =>
      to?.view ? viewButtons.current[to.view] : to?.layer && to.layer !== 'none' ? buttons.current[to.layer] : null;
    const o = box.getBoundingClientRect();
    const point = (b: HTMLElement) => {
      const r = b.getBoundingClientRect();
      return { x: r.left - o.left + r.width * 0.62, y: r.top - o.top + r.height * 0.6 };
    };
    // 書き出し：カーソルは時間だけから決まる位置に置く（CSS の移りを使わない）
    if (cursorPath !== undefined) {
      const a = cursorPath && (btn(cursorPath.from) ?? btn(cursorPath.to));
      const b = cursorPath && btn(cursorPath.to);
      el.style.transition = 'none';
      if (!cursorPath || !a || !b) {
        el.style.opacity = '0';
        return;
      }
      const pa = point(a);
      const pb = point(b);
      const k = cursorPath.k;
      el.style.opacity = '1';
      el.style.transform = `translate(${pa.x + (pb.x - pa.x) * k}px, ${pa.y + (pb.y - pa.y) * k}px) scale(${1 - 0.25 * cursorPath.press})`;
      return;
    }
    const target = btn({ view: cursorView, layer: cursorLayer });
    if (snap.mode !== 'tour' || snap.still || !target) {
      el.style.opacity = '0';
      return;
    }
    const p = point(target);
    el.style.opacity = '1';
    el.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }, [cursorView, cursorLayer, cursorPath, snap.mode, snap.still]);

  const turn = Math.round(snap.turn);
  const toggle = (l: Exclude<Layer, 'none'>) => takeControl({ layer: snap.layer === l ? 'none' : l });
  const pct = (snap.turn / MAX_TURN) * 100;

  return (
    <div ref={wrap} className="relative">
      <p className="sr-only">
        {c.label}。{c.description}
      </p>

      {/* 案内の字幕（サイトの言語） */}
      <p className="serif min-h-[3.6em] max-w-[30em] text-[1.0625rem] leading-[1.75] text-ink md:text-[1.125rem]" aria-live="off">
        {c.captions[snap.caption]}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={c.label}>
        {LAYERS.map((l) => {
          const on = snap.layer === l;
          return (
            <button
              key={l}
              ref={(el) => {
                buttons.current[l] = el;
              }}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(l)}
              className={`min-h-11 border px-3.5 font-mono text-[0.75rem] tracking-[0.06em] transition-colors ${
                on
                  ? l === 'ai'
                    ? 'border-ai bg-ai text-white'
                    : 'border-ink bg-ink text-paper'
                  : 'border-rule bg-card/90 text-ink hover:border-ink'
              }`}
            >
              {modelUi.layers[l]}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={modelUi.viewsLabel}>
        <span className="label mr-1 !tracking-[0.12em]">{modelUi.viewsLabel}</span>
        {VIEWS.map((v) => {
          const on = snap.view === v;
          return (
            <button
              key={v}
              ref={(el) => {
                viewButtons.current[v] = el;
              }}
              type="button"
              aria-pressed={on}
              onClick={() => takeControl({ view: v })}
              className={`min-h-9 border px-2.5 font-mono text-[0.6875rem] tracking-[0.04em] transition-colors ${
                on ? 'border-signal text-signal' : 'border-rule bg-card/90 text-ink-2 hover:border-ink hover:text-ink'
              }`}
            >
              {modelUi.views[v]}
            </button>
          );
        })}
      </div>

      <label className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-4 font-mono text-[0.75rem] text-ink-2">
        <span>{modelUi.turn}</span>
        <input
          type="range"
          className="slider"
          min={0}
          max={MAX_TURN}
          step={1}
          value={snap.turn}
          style={{ ['--fill' as string]: `${pct}%` }}
          aria-valuetext={`${modelUi.turn} ${turn}`}
          onChange={(e) => takeControl({ turn: Number(e.target.value) })}
        />
        <span className="whitespace-nowrap text-right tabular-nums">
          {String(turn).padStart(3, '0')} / {MAX_TURN}
        </span>
      </label>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.75rem] text-ink-3">
        {!snap.still && snap.mode === 'user' && (
          <button
            type="button"
            className="text-link min-h-11 text-ink-2"
            onClick={() => {
              resumeTour(performance.now());
              model.lastInput = 0;
              wake();
            }}
          >
            {c.replay}
          </button>
        )}
      </div>

      {/* 案内のカーソル */}
      <div
        ref={cursor}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-ai/20 opacity-0 transition-[transform,opacity] duration-700 ease-[var(--ease-in-out)]"
      />
    </div>
  );
}

/** 計器：在庫と届いた荷のグラフ、AIの判断の帯、荷の配線図。描くのは WorldStage（毎フレーム state から） */
export function ModelConsole() {
  return (
    <div aria-hidden="true" className="border border-rule bg-card/90 p-4">
      <canvas id="yk-chart" className="block h-[11.5rem] w-full font-mono" />
      <canvas id="yk-decisions" className="mt-3 block h-9 w-full font-mono" />
      <canvas id="yk-schematic" className="mt-3 block h-[9.5rem] w-full border-t border-rule pt-1 font-mono" />
    </div>
  );
}

/** 模型の読み値（英語）。デスクトップのヒーロー右下 */
export function ModelReadout() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const r = snap.readout;
  const rows: [string, string][] = [
    [modelUi.readout.moving, String(r.moving)],
    [modelUi.readout.decisions, String(r.aiDecisions)],
    [modelUi.readout.share, `${Math.round(r.aiShare * 100)}%`],
    [modelUi.readout.defended, String(r.defended)],
  ];
  return (
    <div aria-hidden="true" className="border border-rule bg-card/90 p-4 font-mono text-[0.6875rem] text-ink">
      <p className="label mb-2 flex justify-between">
        <span>{modelUi.readout.title}</span>
        <span className="tabular-nums">
          {modelUi.turn} {String(Math.round(snap.turn)).padStart(3, '0')}
        </span>
      </p>
      {SETTLEMENTS.map((s) => {
        const v = snap.stocks[s.id] ?? 0;
        return (
          <div key={s.id} className="grid grid-cols-[4.2rem_1fr_2.6rem] items-center gap-2 py-[3px]">
            <span className={s.kind === 'ai' ? 'text-ai-ink' : ''}>{s.name}</span>
            <span className="h-1 bg-rule">
              <span className={`block h-full ${s.kind === 'ai' ? 'bg-ai' : 'bg-human'}`} style={{ width: `${Math.min(100, (v / 900) * 100)}%` }} />
            </span>
            <span className="text-right tabular-nums">{Math.round(v)}</span>
          </div>
        );
      })}
      <div className="mt-2 border-t border-rule pt-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-[2px]">
            <span className="text-ink-2">{k}</span>
            <span className="tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 模型の上を横に引くと、カメラが回る（縦のスクロールは邪魔しない） */
export function ScrubArea({ className = '' }: { className?: string }) {
  const start = useRef<{ x: number; id: number } | null>(null);
  return (
    <div
      aria-hidden="true"
      className={`touch-pan-y ${className}`}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, id: e.pointerId };
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) < 3) return;
        start.current = { ...s, x: e.clientX };
        takeControl({ orbitBy: -dx * 0.35 });
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
    />
  );
}
