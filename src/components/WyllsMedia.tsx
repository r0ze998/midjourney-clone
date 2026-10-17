'use client';
import { useEffect, useRef, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';

// 静止画を先に見せ、押したときだけ YouTube を読み込む。
// 映像が読み込めなくても、静止画とキャプションだけで作品が伝わるようにしておく。
export default function WyllsMedia({
  image,
  imageAlt,
  videoId,
  play,
  duration,
  iframeTitle,
  externalNote,
}: {
  image: StaticImageData;
  imageAlt: string;
  videoId: string;
  play: string;
  duration: string;
  iframeTitle: string;
  externalNote: string;
}) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // 再生を始めたら、キーボード操作でもそのまま映像を操作できるようにフォーカスを移す
  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  return (
    <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-wylls-metal">
      {playing ? (
        <iframe
          ref={frameRef}
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={iframeTitle}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          <Image
            src={image}
            alt={imageAlt}
            placeholder="blur"
            sizes="(min-width: 1280px) 1200px, 100vw"
            quality={82}
            className="absolute inset-0 h-full w-full object-cover object-[38%_50%] sm:object-center"
          />
          {/* JS が動かない環境では、そのまま YouTube へのリンクとして働く */}
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setPlaying(true);
            }}
            aria-describedby="wylls-video-note"
            className="absolute bottom-2 left-2 md:bottom-5 md:left-5 flex min-h-11 items-center gap-2.5 md:gap-3 bg-wylls-metal/95 pl-2.5 pr-3.5 md:pl-3 md:pr-4 py-1.5 md:py-2 text-[0.8125rem] md:text-sm text-wylls-paper ring-1 ring-wylls-paper/25 hover:bg-wylls-metal transition-colors"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-wylls-paper text-wylls-metal text-[0.7rem]"
            >
              ▶
            </span>
            <span>{play}</span>
            <span className="font-mono text-xs text-wylls-paper/70">{duration}</span>
          </a>
          <span id="wylls-video-note" className="sr-only">
            {externalNote}
          </span>
        </>
      )}
    </div>
  );
}
