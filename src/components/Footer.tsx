import Image from 'next/image';
import Marquee from './Marquee';
import { nav, site } from '../content/site';

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 overflow-hidden">
      <div className="py-4 border-b border-white/10">
        <Marquee />
      </div>

      <div className="container mx-auto px-6 max-w-6xl pt-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-16">
          <a href="#top" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt=""
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-lg font-bold">{site.name}</span>
          </a>

          <nav className="flex gap-6">
            {nav.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="font-mono text-xs text-white/50 hover:text-accent transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>

        {/* 巨大ウォーターマーク */}
        <p
          aria-hidden="true"
          className="text-stroke font-mono font-bold text-[clamp(4rem,14vw,12rem)] leading-[0.8] text-center tracking-tight select-none pointer-events-none translate-y-[18%]"
        >
          YUKIKAZE
        </p>
      </div>
    </footer>
  );
}
