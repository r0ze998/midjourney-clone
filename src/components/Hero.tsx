'use client';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Hero() {
  const scope = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // .float をすべて取得してランダム挙動を与える
      gsap.utils.toArray<HTMLSpanElement>('.float').forEach((el) => {
        gsap.fromTo(
          el,
          {
            x: gsap.utils.random(-300, 300),
            y: gsap.utils.random(-150, 150),
            rotate: gsap.utils.random(-20, 20),
            opacity: 0,
          },
          {
            x: gsap.utils.random(-300, 300),
            y: gsap.utils.random(-150, 150),
            rotate: gsap.utils.random(-20, 20),
            opacity: 0.1,
            duration: gsap.utils.random(8, 15),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: gsap.utils.random(0, 5),
          }
        );
      });
    }, scope);

    return () => ctx.revert(); // コンポーネント unmount 時にクリーンアップ
  }, []);

  return (
    <section
      ref={scope}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      {/* 背景テキスト */}
      <div className="absolute inset-0 flex flex-wrap text-4xl font-bold select-none opacity-10 leading-none">
        {Array.from({ length: 120 }).map((_, i) => (
          <span key={i} className="float mx-2">
            mj
          </span>
        ))}
      </div>

      {/* ロゴ / 見出し */}
      <h1 className="relative z-10 text-7xl font-extrabold tracking-tight drop-shadow-lg">
        Midjourney&nbsp;Clone
      </h1>
    </section>
  );
}
