import MatrixRain from './MatrixRain';
import Marquee from './Marquee';
import { site } from '../content/site';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex flex-col justify-center min-h-screen overflow-hidden"
    >
      <MatrixRain className="absolute inset-0 w-full h-full" />
      {/* 端を締めるビネット。中央は素通しでrainを見せる */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,6,5,0.5)_60%,rgba(5,6,5,0.95)_100%)]" />

      {/* HUD風コーナーラベル */}
      <div className="absolute inset-x-0 top-24 z-10 hidden md:flex justify-between px-10 font-mono text-xs tracking-[0.3em] text-white/40">
        <span>KYOTO — JAPAN</span>
        <span className="text-accent/70">35.0116°N 135.7681°E</span>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-10 z-10 hidden lg:block font-mono text-xs tracking-[0.4em] text-white/30 [writing-mode:vertical-rl]">
        WORLD GAME — NOT WORLD WAR GAME
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-6xl">
        <p className="font-mono text-sm md:text-base tracking-[0.5em] text-accent mb-2 animate-flicker">
          {site.nameEn.toUpperCase()}
        </p>
        <h1
          data-text="雪風"
          className="glitch font-brand text-[clamp(7rem,28vw,24rem)] leading-[0.95] text-white drop-shadow-[0_0_60px_rgba(62,240,140,0.25)] select-none"
        >
          雪風
        </h1>
        <div className="mt-10 md:mt-14 md:flex md:items-end md:justify-between gap-12">
          <p className="text-base md:text-lg text-white/80 max-w-xl leading-loose">
            {site.tagline}
          </p>
          <div className="flex gap-4 mt-10 md:mt-0 shrink-0">
            <a
              href="#services"
              className="px-8 py-4 bg-accent text-ink font-bold font-mono text-sm tracking-widest hover:shadow-[0_0_30px_rgba(62,240,140,0.5)] transition-shadow"
            >
              SERVICES ↓
            </a>
            <a
              href="#contact"
              className="px-8 py-4 border border-white/30 text-white font-mono text-sm tracking-widest hover:border-accent hover:text-accent transition-colors"
            >
              CONTACT
            </a>
          </div>
        </div>
      </div>

      {/* 画面下のマーキー */}
      <div className="absolute bottom-0 inset-x-0 z-10 border-t border-white/10 bg-ink/60 backdrop-blur-sm py-4">
        <Marquee />
      </div>
    </section>
  );
}
