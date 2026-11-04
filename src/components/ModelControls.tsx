'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getSnapshot, model, resumeTour, subscribe, takeControl, wake } from '../model/store';
import { LAYERS, type Layer } from '../model/timeline';
import { MAX_TURN, SETTLEMENTS } from '../model/world';
import { modelUi, type Content } from '../content/site';

// ヒーローの操作部品。入力は 1 つ（ターン）と、層を 1 つずつ取り出すボタン。
// 自動の案内のあいだはカーソルがボタンを押しにいく。触ると操作を渡す。
export default function ModelControls({ c }: { c: Content['model'] }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const wrap = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<Layer, HTMLButtonElement | null>>>({});

  // カーソルを次に押すボタンへ動かす
  useEffect(() => {
    const el = cursor.current;
    const box = wrap.current;
    if (!el || !box) return;
    const target = snap.cursorTo && snap.cursorTo !== 'none' ? buttons.current[snap.cursorTo] : null;
    if (snap.mode !== 'tour' || snap.still || !target) {
      el.style.opacity = '0';
      return;
    }
    const b = target.getBoundingClientRect();
    const o = box.getBoundingClientRect();
    el.style.opacity = '1';
    el.style.transform = `translate(${b.left - o.left + b.width * 0.62}px, ${b.top - o.top + b.height * 0.6}px)`;
  }, [snap.cursorTo, snap.mode, snap.still]);

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
        <p>{snap.still ? '' : snap.mode === 'tour' ? c.touring : c.yours}</p>
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
      <p className="mt-2 text-[0.75rem] text-ink-3">{c.note}</p>

      {/* 案内のカーソル */}
      <div
        ref={cursor}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-ai/20 opacity-0 transition-[transform,opacity] duration-700 ease-[var(--ease-in-out)]"
      />
    </div>
  );
}

/** 模型の読み値（英語）。デスクトップのヒーロー右上 */
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
    <div aria-hidden="true" className="w-64 border border-rule bg-card/90 p-4 font-mono text-[0.6875rem] text-ink backdrop-blur-sm">
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

/** 地図の上を横に引くとターンが動く（縦のスクロールは邪魔しない） */
export function ScrubArea({ className = '' }: { className?: string }) {
  const start = useRef<{ x: number; turn: number; id: number } | null>(null);
  return (
    <div
      aria-hidden="true"
      className={`touch-pan-y ${className}`}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, turn: getSnapshot().turn, id: e.pointerId };
      }}
      onPointerMove={(e) => {
        const s = start.current;
        if (!s || s.id !== e.pointerId) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) < 6) return;
        const next = Math.max(0, Math.min(MAX_TURN, s.turn + dx * 0.12));
        takeControl({ turn: next });
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
    />
  );
}
