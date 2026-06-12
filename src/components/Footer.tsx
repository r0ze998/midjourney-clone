import Image from 'next/image';
import { nav, site } from '../content/site';

export default function Footer() {
  return (
    <footer className="py-10 border-t border-white/10">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
