'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Content } from '../content/site';

export default function SiteHeader({
  nav,
  langSwitch,
  menu,
  name,
  homeHref,
}: {
  nav: Content['nav'];
  langSwitch: Content['langSwitch'];
  menu: Content['menu'];
  name: string;
  homeHref: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Esc で閉じてボタンにフォーカスを戻す。広い画面に戻ったら閉じる。
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => mq.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-sm">
      <div className="container-site flex h-16 items-center justify-between gap-6">
        <a href={homeHref} className="flex items-center gap-3 min-h-11">
          <Image
            src="/images/logo.png"
            alt=""
            width={28}
            height={28}
            className="mix-blend-multiply"
            priority
          />
          <span className="font-medium tracking-wide">{name}</span>
        </a>

        <nav aria-label="Main" className="hidden md:flex items-center gap-8 text-sm">
          {nav.map(({ label, href }) => (
            <a key={href} href={href} className="text-ink-2 hover:text-accent transition-colors py-2">
              {label}
            </a>
          ))}
          <a
            href={langSwitch.href}
            hrefLang={langSwitch.hrefLang}
            lang={langSwitch.hrefLang}
            className="label !text-ink border border-rule px-3 py-1.5 hover:border-ink transition-colors"
          >
            {langSwitch.label}
          </a>
        </nav>

        <button
          ref={buttonRef}
          type="button"
          className="md:hidden -mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[7px]"
          aria-label={open ? menu.close : menu.open}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`block h-px w-6 bg-ink transition-transform ${open ? 'translate-y-[4px] rotate-45' : ''}`}
          />
          <span
            className={`block h-px w-6 bg-ink transition-transform ${open ? '-translate-y-[4px] -rotate-45' : ''}`}
          />
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Main"
        hidden={!open}
        className="md:hidden border-t border-rule bg-paper"
      >
        <ul className="container-site py-2">
          {nav.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center border-b border-rule/60 text-base"
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={langSwitch.href}
              hrefLang={langSwitch.hrefLang}
              lang={langSwitch.hrefLang}
              className="flex min-h-12 items-center text-base text-ink-2"
            >
              {langSwitch.label}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
