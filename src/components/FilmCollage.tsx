'use client';
import { useEffect, useRef, useState } from 'react';
import CartVideo from './CartVideo';
import ScreenFrame from './ScreenFrame';
import { filmUi, introUi } from '../content/site';

type Labels = { intro: string; storm: string; march: string; cart: string };

/**
 * Wylls の欄の映像。3 つの窓を少しずつ傾けて重ね、散らして置く。
 * 画面に入ると、窓が順に「ポン」と現れる（動きを減らす設定では、最初から置いたまま）。
 * 窓に触れる・フォーカスすると、傾きが戻って前に出る。
 */
const SPOTS = [
  // デスクトップの位置（枠の幅・高さに対する %）と傾き。スマホは縦に並べ、左右に少しずらす
  { lg: 'lg:left-0 lg:top-0 lg:w-[64%]', sp: 'w-full', rot: '-1.4deg', delay: 200 },
  { lg: 'lg:right-0 lg:top-[27%] lg:w-[50%]', sp: 'ml-auto w-[88%] mt-4', rot: '1.6deg', delay: 340 },
  { lg: 'lg:left-[14%] lg:top-[63%] lg:w-[36%]', sp: 'w-[72%] mt-4', rot: '-2.2deg', delay: 480 },
];

export default function FilmCollage({ labels, play, pause, sound }: { labels: Labels; play: string; pause: string; sound: { on: string; off: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-shown={shown ? '1' : '0'} className="film-collage mt-8">
      {/* メインの映像：大きく、傾けずに置く */}
      <div className="film-pop relative z-[4]" style={{ ['--rot' as string]: '0deg', ['--delay' as string]: '0ms' }}>
        <div className="shadow-[0_28px_70px_-14px_rgba(0,0,0,0.95)]">
          <ScreenFrame title={introUi.title} meta="Play the agent economy">
            <CartVideo bare src={introUi.src} poster={introUi.poster} caption={labels.intro} play={play} pause={pause} sound={sound} />
          </ScreenFrame>
        </div>
      </div>
      <div className="relative mt-6 lg:mt-10 lg:aspect-[100/66]">
      {filmUi.map((f, i) => {
        const s = SPOTS[i];
        return (
          <div
            key={f.key}
            className={`film-pop relative ${s.sp} lg:absolute lg:mt-0 ${s.lg}`}
            style={{ ['--rot' as string]: s.rot, ['--delay' as string]: `${s.delay}ms`, zIndex: i + 1 }}
          >
            <div className="film-float shadow-[0_24px_60px_-14px_rgba(0,0,0,0.95)]">
              <ScreenFrame title={f.title} accent={f.accent}>
                <CartVideo bare src={f.src} poster={f.poster} caption={labels[f.key]} play={play} pause={pause} />
              </ScreenFrame>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
