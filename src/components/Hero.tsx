'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import dynamic from 'next/dynamic';
const Matrix = dynamic(() => import('./Matrix'), { ssr: false });

// 好きな文字や文章をここに設定（カンマ区切りで複数の文章を設定可能）
const CUSTOM_TEXTS = [
  '妖精を見るには妖精の目がいる',
  '人となりては童のことを捨てたり',
  '117',
  'すべては同じ木の枝',
  'Free my mind',
  '饒速日',
  'The answer',
  'yukikaze',
  'world game',
  '998',
];

// 文字化け用の文字セット
const GLITCH_CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';

// 文字化け効果を適用する関数
const glitchText = (text: string, intensity: number = 0.3) => {
  return text
    .split('')
    .map((char) => {
      if (Math.random() < intensity) {
        // より控えめな文字化けのために、1文字のみを変更
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
      return char;
    })
    .join('');
};

export default function Hero() {
  const scope = useRef<HTMLDivElement>(null);
  const [glitchedTexts, setGlitchedTexts] = useState<string[]>([]);

  useLayoutEffect(() => {
    // より頻繁に文字化けを更新
    const interval = setInterval(() => {
      setGlitchedTexts(CUSTOM_TEXTS.map((text) => glitchText(text)));
    }, 100);

    const ctx = gsap.context(() => {
      // Matrix-like falling animation for each text
      gsap.utils.toArray<HTMLSpanElement>('.matrix-text').forEach((el) => {
        gsap.fromTo(
          el,
          {
            y: -100,
            opacity: 0,
          },
          {
            y: '100vh',
            opacity: 0.9,
            duration: gsap.utils.random(2, 4),
            repeat: -1,
            ease: 'none',
            delay: gsap.utils.random(0, 2),
            onComplete: () => {
              gsap.set(el, { y: -100, opacity: 0 });
            },
          }
        );
      });
    }, scope);

    return () => {
      ctx.revert();
      clearInterval(interval);
    };
  }, []);

  return (
    <section
      ref={scope}
      className="relative flex items-center justify-center h-screen overflow-hidden bg-black"
    >
      {/* Matrix falling texts */}
      <div className="absolute inset-0 flex flex-wrap text-xl font-mono select-none text-green-500 leading-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="matrix-text mx-2 whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              letterSpacing: '0.1em',
              lineHeight: '1.4em',
              transform: `translateX(${Math.random() * 10 - 5}px)`,
              textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
            }}
          >
            {glitchedTexts[Math.floor(Math.random() * glitchedTexts.length)] ||
              CUSTOM_TEXTS[0]}
          </span>
        ))}
      </div>

      {/* Logo / Heading */}
      <div className="relative z-10 text-center">
        <h1 className="text-7xl font-extrabold tracking-tight text-white drop-shadow-lg mb-12">
          ユキカゼ
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed space-y-4">
          生態系を破壊することなく、また誰の不利益も被ることなく、
          <br />
          自発的な協力によって、可能な限り最短の時間で、
          <br />
          100%が世界をうまく利用できるようにする。
        </p>
      </div>
    </section>
  );
}
