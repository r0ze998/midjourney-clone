'use client';
import { useEffect, useRef, useState } from 'react';

// 短い繰り返しの映像。画面に入ったときだけ再生し、出たら止める。動きを減らす設定では自動で再生しない。
// 映像が読めなくても、静止画（poster）で内容が伝わるようにする。
// 再生・一時停止と音のボタン：アイコンだけの丸いボタン。読み上げには文言（aria-label）を渡す
const ICON_BTN =
  'absolute bottom-2 grid h-11 w-11 place-items-center rounded-full border border-rule/80 bg-card/80 text-ink backdrop-blur-sm transition-colors hover:border-ink hover:bg-card focus-visible:outline focus-visible:outline-1 focus-visible:outline-signal';

export default function CartVideo({
  caption,
  play,
  pause,
  bare = false,
  src = '/media/cart.mp4',
  poster = '/media/cart-poster.webp',
  sound,
}: {
  caption: string;
  play: string;
  pause: string;
  bare?: boolean;
  src?: string;
  poster?: string;
  /** 音のある映像：音を出す・消すボタンの文言。最初は消音で再生する */
  sound?: { on: string; off: string };
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [userPaused]);

  return (
    <figure className="m-0">
      <div className={`relative overflow-hidden bg-paper-2 ${bare ? '' : 'border border-rule'}`}>
        <video
          ref={ref}
          className="block aspect-video h-auto w-full"
          muted={muted}
          loop
          playsInline
          preload="none"
          poster={poster}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={caption}
        >
          {/* H.264 を先に（Safari・Chrome）。H.264 を再生できないブラウザは WebM（VP9）へ */}
          <source src={src} type="video/mp4" />
          <source src={src.replace(/\.mp4$/, '.webm')} type="video/webm" />
        </video>
        <button
          type="button"
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            if (v.paused) {
              setUserPaused(false);
              v.play().catch(() => {});
            } else {
              setUserPaused(true);
              v.pause();
            }
          }}
          aria-label={playing ? pause : play}
          title={playing ? pause : play}
          className={`${ICON_BTN} left-2`}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
              <rect x="6" y="5" width="4" height="14" rx="0.5" />
              <rect x="14" y="5" width="4" height="14" rx="0.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          )}
        </button>
        {sound && (
          <button
            type="button"
            aria-pressed={!muted}
            onClick={() => {
              const v = ref.current;
              if (!v) return;
              const next = !muted;
              v.muted = next;
              setMuted(next);
              // 音を出すときは、止まっていれば再生する
              if (!next && v.paused) {
                setUserPaused(false);
                v.play().catch(() => {});
              }
            }}
            aria-label={muted ? sound.on : sound.off}
            title={muted ? sound.on : sound.off}
            className={`${ICON_BTN} right-2`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
              {muted ? (
                <path d="M16 9.5l5 5M21 9.5l-5 5" />
              ) : (
                <>
                  <path d="M15.5 9a4 4 0 0 1 0 6" />
                  <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {!bare && <figcaption className="mt-3 text-[0.75rem] leading-relaxed text-ink-3">{caption}</figcaption>}
    </figure>
  );
}
