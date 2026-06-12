import MatrixRain from './MatrixRain';
import { site } from '../content/site';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
    >
      <MatrixRain className="absolute inset-0 w-full h-full opacity-60" />
      {/* 中央の文字を読みやすくするためのビネット */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,6,5,0.55)_0%,rgba(5,6,5,0.2)_55%,rgba(5,6,5,0.9)_100%)]" />

      <div className="relative z-10 text-center px-6">
        <p className="font-mono text-sm tracking-[0.4em] text-accent mb-6">
          {site.nameEn.toUpperCase()}
        </p>
        <h1 className="font-brand text-7xl md:text-8xl text-white drop-shadow-[0_0_30px_rgba(62,240,140,0.35)] mb-10">
          雪風
        </h1>
        <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-loose mb-12">
          {site.tagline}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#services"
            className="px-8 py-3 rounded-full bg-accent text-ink font-semibold hover:bg-accent/85 transition-colors"
          >
            事業内容を見る
          </a>
          <a
            href="#contact"
            className="px-8 py-3 rounded-full border border-white/25 text-white hover:border-accent hover:text-accent transition-colors"
          >
            お問い合わせ
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 font-mono text-xs tracking-[0.3em] text-white/40 animate-pulse">
        SCROLL
      </div>
    </section>
  );
}
