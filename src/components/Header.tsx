'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { nav, site } from '../content/site';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || menuOpen
          ? 'bg-ink/80 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt=""
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-bold tracking-wide">{site.name}</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {nav.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="font-mono text-sm text-white/70 hover:text-accent transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
          aria-label="メニューを開閉"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span
            className={`block w-6 h-px bg-white transition-transform ${
              menuOpen ? 'translate-y-[3.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block w-6 h-px bg-white transition-transform ${
              menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-white/10 bg-ink/95 backdrop-blur-md">
          {nav.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4 font-mono text-sm text-white/80 hover:text-accent border-b border-white/5"
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
