'use client';
import { useEffect, useRef, useState } from 'react';

// 荷車の短い映像。画面に入ったときだけ再生し、出たら止める。動きを減らす設定では自動で再生しない。
// 映像が読めなくても、静止画（poster）とキャプションだけで内容が伝わるようにする。
export default function CartVideo({ caption, play, pause }: { caption: string; play: string; pause: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

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
    <figure>
      <div className="relative overflow-hidden border border-rule bg-paper-2">
        <video
          ref={ref}
          className="block aspect-video h-auto w-full"
          muted
          loop
          playsInline
          preload="none"
          poster="/media/cart-poster.webp"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label={caption}
        >
          <source src="/media/cart.mp4" type="video/mp4" />
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
          className="absolute bottom-2 left-2 min-h-11 border border-rule bg-card/95 px-3 font-mono text-[0.75rem] text-ink hover:border-ink"
        >
          {playing ? pause : play}
        </button>
      </div>
      <figcaption className="mt-3 text-[0.75rem] leading-relaxed text-ink-3">{caption}</figcaption>
    </figure>
  );
}
