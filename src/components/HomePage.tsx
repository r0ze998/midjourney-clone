import Image from 'next/image';
import Rain from './Rain';
import Emblem from './Emblem';
import ExternalLink from './ExternalLink';
import ScrollVar from './ScrollVar';
import Below from './Below';
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

      <ScrollVar />

      {/* 背景: 文字の雨。下半分と端を落として文字の居場所を作る。スクロールすると全体が暗く引いていく */}
      <Rain className="fixed inset-x-0 top-0 -z-30 h-lvh w-full" />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-[linear-gradient(180deg,rgba(4,6,4,0.25)_0%,transparent_28%,transparent_48%,rgba(4,6,4,0.88)_100%)]"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-[radial-gradient(ellipse_60%_80%_at_50%_40%,transparent_30%,rgba(4,6,4,0.7)_100%)]"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-void"
        style={{ opacity: 'calc(var(--scroll, 0) * 0.82)' }}
      />

      {/* 立体（デスクトップ）: 画面に固定し、トップの中央の列と同じ位置に置く。スクロールすると右端へ寄って小さく薄くなり、透かしになる */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 hidden lg:block"
        style={{
          opacity: 'calc(1 - var(--scroll, 0) * 0.72)',
          transform: 'translateX(calc(var(--scroll, 0) * 30vw)) scale(calc(1 - var(--scroll, 0) * 0.45))',
          transformOrigin: '50% 45%',
        }}
      >
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-12 gap-x-8 px-12 pt-20">
          <div className="col-span-4 col-start-5 flex items-center justify-center xl:col-span-6 xl:col-start-4">
            <Emblem className="h-[min(78svh,760px)] w-full" />
          </div>
        </div>
      </div>

      <div id="top" className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <header className="sticky top-0 z-30 -mx-5 flex h-16 items-center justify-between bg-void/80 px-5 backdrop-blur-sm sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:h-20 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <a href={lang === 'ja' ? '/' : '/en'} className="flex min-h-11 items-center gap-3">
            <Image src="/images/logo.png" alt="" width={22} height={22} className="invert mix-blend-screen opacity-90" />
            <span className="serif text-[0.9375rem] font-normal tracking-[0.08em]">{c.name}</span>
          </a>
          <nav aria-label="Main" className="flex items-center gap-5 md:gap-7">
            {c.nav.map(({ label, href }) => (
              <a key={href} href={href} className="label hidden min-h-11 items-center !text-bone-2 transition-colors hover:!text-signal md:flex">
                {label}
              </a>
            ))}
            <a
              href={c.langSwitch.href}
              hrefLang={c.langSwitch.hrefLang}
              lang={c.langSwitch.hrefLang}
              className="label flex min-h-11 items-center !text-bone-2 transition-colors hover:!text-signal"
            >
              {c.langSwitch.label}
            </a>
          </nav>
        </header>

        <main id="main" tabIndex={-1} className="outline-none">
        <div className="flex min-h-[calc(100svh-4rem)] flex-col lg:min-h-[calc(100svh-5rem)] lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8">
          {/* 立体: モバイルは流れの中（上）に。デスクトップは固定レイヤーに置くので、ここは場所を空けるだけ */}
          <div className="order-1 flex items-center justify-center lg:hidden">
            <Emblem className="aspect-[3/4] w-full max-w-[18rem] sm:max-w-[22rem]" />
          </div>
          <div aria-hidden="true" className="hidden lg:order-2 lg:col-span-4 lg:col-start-5 lg:block lg:h-[min(78svh,760px)] xl:col-span-6 xl:col-start-4" />

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
        </div>

        <Below c={c} />
        </main>

        {/* 右端の縦の一行: 旧サイトから引き継いだ社是 */}
        <p
          aria-hidden="true"
          className="label pointer-events-none fixed right-4 top-1/2 hidden -translate-y-1/2 select-none [writing-mode:vertical-rl] xl:block"
        >
          {c.rail}
        </p>

        <footer className="flex flex-col gap-3 border-t border-rule py-6 text-[0.6875rem] text-bone-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono tracking-[0.06em]">© {new Date().getFullYear()} {c.nameLatin}</p>
          <a href="#top" className="label inline-flex min-h-11 items-center !text-bone-3 transition-colors hover:!text-signal">
            {c.footer.top} <span aria-hidden="true" className="ml-2">↑</span>
          </a>
        </footer>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(lang)) }}
      />
    </>
  );
}
