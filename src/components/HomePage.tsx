import Image from 'next/image';
import Rain from './Rain';
import Emblem from './Emblem';
import ExternalLink from './ExternalLink';
import { content, type Lang } from '../content/site';
import { organizationJsonLd } from '../lib/metadata';

export default function HomePage({ lang }: { lang: Lang }) {
  const c = content[lang];
  const [line1, line2] = c.statement.split('\n');

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-signal focus:px-4 focus:py-2 focus:text-void"
      >
        {c.skip}
      </a>

      {/* 背景: 文字の雨。端と中央下をわずかに落として、文字の載る場所を確保する */}
      <Rain className="fixed inset-0 -z-20 h-full w-full" />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,6,4,0.25)_0%,transparent_28%,transparent_48%,rgba(4,6,4,0.88)_100%)]"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_40%,transparent_30%,rgba(4,6,4,0.7)_100%)]"
      />

      <div className="relative mx-auto flex min-h-svh max-w-[1600px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex h-16 items-center justify-between lg:h-20">
          <a href={lang === 'ja' ? '/' : '/en'} className="flex min-h-11 items-center gap-3">
            <Image src="/images/logo.png" alt="" width={22} height={22} className="invert mix-blend-screen opacity-90" />
            <span className="serif text-[0.9375rem] font-normal tracking-[0.08em]">{c.name}</span>
          </a>
          <a
            href={c.langSwitch.href}
            hrefLang={c.langSwitch.hrefLang}
            lang={c.langSwitch.hrefLang}
            className="label flex min-h-11 items-center !text-bone-2 hover:!text-signal transition-colors"
          >
            {c.langSwitch.label}
          </a>
        </header>

        <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8">
          {/* 立体: モバイルは上に、デスクトップは中央の列に */}
          <div className="order-1 lg:order-2 lg:col-span-4 lg:col-start-5 xl:col-span-6 xl:col-start-4 lg:self-stretch flex items-center justify-center">
            <Emblem className="aspect-[3/4] w-full max-w-[18rem] sm:max-w-[22rem] lg:aspect-auto lg:h-[min(78svh,760px)] lg:max-w-none" />
          </div>

          {/* 宣言 */}
          <section
            aria-labelledby="statement"
            className="order-2 lg:order-1 lg:col-span-4 lg:col-start-1 xl:col-span-3 flex flex-col justify-end pb-10 lg:pb-14"
          >
            <p className="label mb-6 flex items-center gap-3">
              <span aria-hidden="true" className="inline-block h-px w-6 bg-signal" />
              {c.kicker}
            </p>
            <p aria-hidden="true" className="wordmark text-[4.5rem] text-bone sm:text-[5.5rem]" lang="ja">
              雪風
            </p>
            <h1 id="statement" className="serif mt-5 text-[1.5rem] leading-[1.45] text-bone sm:text-[1.75rem]">
              {line1}
              <br />
              {line2}
            </h1>
            <p className="mt-5 max-w-[26em] text-[0.875rem] leading-[1.95] text-bone-2">{c.lead}</p>
          </section>

          {/* 現在と連絡先 */}
          <aside className="order-3 lg:col-span-4 lg:col-start-9 xl:col-span-3 xl:col-start-10 flex flex-col justify-end pb-10 lg:pb-14">
            <p className="label mb-3 flex items-center gap-3">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal shadow-[0_0_8px_#3ef08c]" />
              {c.now.label}
            </p>
            <ExternalLink href={c.now.href} hint={c.externalHint} arrow={false} className="group block border-t border-rule pt-4 pb-5">
              <span className="flex items-baseline justify-between gap-4">
                <span className="serif text-[2rem] leading-none text-bone transition-colors group-hover:text-signal">{c.now.name}</span>
                <span aria-hidden="true" className="row-link-arrow font-mono text-sm text-bone-3">
                  ↗
                </span>
              </span>
              <span className="mt-3 block text-[0.8125rem] leading-[1.8] text-bone-2">{c.now.desc}</span>
              <span className="label mt-2 block !text-signal-dim !normal-case !tracking-[0.1em]">{c.now.status}</span>
            </ExternalLink>

            <ul className="mt-2">
              {c.links.map(({ label, href, note }) => (
                <li key={href}>
                  {href.startsWith('mailto:') ? (
                    <a href={href} className="row-link">
                      <span className="font-mono text-sm">{label}</span>
                      <span className="ml-auto font-mono text-xs text-bone-3">{note}</span>
                    </a>
                  ) : (
                    <ExternalLink href={href} hint={c.externalHint} className="row-link">
                      <span className="font-mono text-sm">{label}</span>
                      <span className="ml-auto font-mono text-xs text-bone-3">{note}</span>
                    </ExternalLink>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        </main>

        {/* 右端の縦の一行: 旧サイトから引き継いだ社是 */}
        <p
          aria-hidden="true"
          className="label pointer-events-none fixed right-4 top-1/2 hidden -translate-y-1/2 select-none [writing-mode:vertical-rl] xl:block"
        >
          {c.rail}
        </p>

        <footer className="flex flex-col gap-3 border-t border-rule py-5 text-[0.6875rem] text-bone-3 sm:flex-row sm:items-center sm:justify-between">
          <dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono tracking-[0.06em]">
            {c.company.map(({ label, value }) => (
              <div key={label} className="flex gap-2">
                <dt className="text-bone-3/70">{label}</dt>
                <dd className="text-bone-2">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="font-mono tracking-[0.06em]">© {new Date().getFullYear()} {c.nameLatin}</p>
        </footer>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(lang)) }}
      />
    </>
  );
}
