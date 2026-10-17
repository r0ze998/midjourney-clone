import Image from 'next/image';
import type { Content } from '../content/site';

export default function SiteFooter({
  footer,
  nav,
  langSwitch,
}: {
  footer: Content['footer'];
  nav: Content['nav'];
  langSwitch: Content['langSwitch'];
}) {
  return (
    <footer className="border-t border-ink">
      <div className="container-site flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="" width={28} height={28} className="mix-blend-multiply" />
          <p className="text-sm">
            © {new Date().getFullYear()} {footer.rights}
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-2">
          {nav.map(({ label, href }) => (
            <a key={href} href={href} className="hover:text-accent transition-colors min-h-11 inline-flex items-center">
              {label}
            </a>
          ))}
          <a
            href={langSwitch.href}
            hrefLang={langSwitch.hrefLang}
            lang={langSwitch.hrefLang}
            className="hover:text-accent transition-colors min-h-11 inline-flex items-center"
          >
            {langSwitch.label}
          </a>
          <a href="#top" className="hover:text-accent transition-colors min-h-11 inline-flex items-center">
            {footer.top} <span aria-hidden="true" className="ml-1">↑</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
