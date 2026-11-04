import Image from 'next/image';
import type { ReactNode } from 'react';
import WorldStage from './WorldStage';
import Rain from './Rain';
import ModelControls, { ModelConsole, ModelReadout, ScrubArea } from './ModelControls';
import ExternalLink from './ExternalLink';
import CartVideo from './CartVideo';
import wyllsShot from '../assets/wylls-village.jpg';
import { content, site, type Lang } from '../content/site';
import type { FeedItem } from '../lib/feed';
import { organizationJsonLd } from '../lib/metadata';

// 1 ページの構成。模型（WorldStage）は画面に固定した背景で、各セクションの data-scene に合わせて場面が移る。

/** デスクトップ：左から紙色が溶ける地の上に文章。スマホ：上に模型の窓、下に紙の札 */
function Over({ children, window: win = true, className = '' }: { children: ReactNode; window?: boolean; className?: string }) {
  return (
    <>
      {win && <div aria-hidden="true" className="h-[46svh] lg:hidden" />}
      <div className={`relative bg-paper px-5 py-10 sm:px-8 lg:bg-transparent lg:px-0 lg:py-0 ${className}`}>{children}</div>
    </>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="label mb-5">{children}</p>;
}

const fmtDate = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Tokyo' }).format(new Date(iso));

export default function HomePage({ lang, feed }: { lang: Lang; feed: FeedItem[] }) {
  const c = content[lang];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {c.skip}
      </a>

      {/* 背景：コードの雨（いちばん奥）→ 模型。雨は下と端を暗く落として、文字の居場所を作る */}
      <Rain className="fixed inset-x-0 top-0 -z-30 h-lvh w-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(ellipse_80%_85%_at_60%_45%,transparent_45%,rgba(5,7,6,0.55)_100%)]"
      />
      <WorldStage stillSrc="/media/model-still.webp" stillAlt={c.model.description} />

      <header className="sticky top-0 z-30 border-b border-rule/70 bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-16 lg:px-12">
          <a href={lang === 'ja' ? '/' : '/en'} className="flex min-h-11 items-center gap-2.5">
            <Image src="/images/logo.png" alt="" width={22} height={22} className="invert mix-blend-screen" priority />
            <span className="serif text-[0.9375rem] tracking-[0.08em]">{c.name}</span>
          </a>
          <nav aria-label="Main" className="flex items-center gap-5 md:gap-7">
            {c.nav.map(({ label, href }) => (
              <a key={href} href={href} className="label hidden min-h-11 items-center !text-ink-2 transition-colors hover:!text-ink md:flex">
                {label}
              </a>
            ))}
            <a
              href={c.langSwitch.href}
              hrefLang={c.langSwitch.hrefLang}
              lang={c.langSwitch.hrefLang}
              className="label flex min-h-11 items-center !text-ink transition-colors hover:!text-ai-ink"
            >
              {c.langSwitch.label}
            </a>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        {/* 1. ヒーロー：模型を操作できる */}
        <section id="top" data-scene="hero" aria-labelledby="hero-title" className="relative lg:min-h-[calc(100svh-4rem)]">
          <div aria-hidden="true" className="over-model pointer-events-none absolute inset-y-0 left-0 hidden w-[40%] lg:block" />
          <ScrubArea className="absolute inset-x-0 top-0 h-[46svh] lg:left-[38%] lg:h-full" />
          {/* JS が動かないときは、模型の止まった絵を見せ、操作の部品は隠す */}
          <noscript>
            <style>{`.js-only{display:none!important}`}</style>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/model-still.webp"
              alt={c.model.description}
              className="absolute inset-x-0 top-0 -z-10 h-[46svh] w-full object-cover lg:left-[30%] lg:h-full lg:w-[70%] lg:object-contain"
            />
          </noscript>
          {/* 計器（teardown の console）：グラフ・AIの判断の帯・配線図・読み値。すべて模型と同じ state から */}
          <div data-console className="pointer-events-none absolute bottom-10 right-12 top-8 hidden w-[17.5rem] flex-col justify-end gap-3 xl:flex">
            <ModelConsole />
            <ModelReadout />
          </div>
          <div aria-hidden="true" className="h-[46svh] lg:hidden" />
          <div className="relative mx-auto max-w-[1440px] bg-paper px-5 pb-12 pt-6 sm:px-8 lg:flex lg:min-h-[calc(100svh-4rem)] lg:flex-col lg:justify-end lg:bg-transparent lg:px-12 lg:pb-12 lg:pt-10">
            <div className="lg:max-w-[30rem]">
              <p className="label mb-5 flex items-center gap-3">
                <span aria-hidden="true" className="inline-block h-px w-6 bg-signal" />
                {c.hero.kicker}
              </p>
              <h1 id="hero-title" className="serif text-[2.5rem] leading-[1.2] tracking-[0.005em] sm:text-[3rem] lg:text-[2.875rem]">
                {c.hero.title}
              </h1>

              <p className="mt-4 max-w-[24em] text-[0.9375rem] leading-[1.9] text-ink-2 lg:text-base">{c.hero.lead}</p>
              <div className="js-only mt-8 border-t border-rule pt-5">
                <ModelControls c={c.model} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. なぜゲームなのか（3 つの場面） */}
        <section id="why" aria-labelledby="why-heading" className="relative">
          <span id="vision" aria-hidden="true" />
          <span id="approach" aria-hidden="true" />
          <div aria-hidden="true" className="over-model absolute inset-y-0 left-0 hidden w-[56%] lg:block" />
          <div className="relative mx-auto max-w-[1440px] lg:px-12">
            <div className="bg-paper px-5 pt-16 sm:px-8 lg:bg-transparent lg:px-0 lg:pt-28">
              <SectionLabel>{c.why.label}</SectionLabel>
              <h2 id="why-heading" className="serif text-[1.75rem] leading-[1.35] md:text-[2.25rem]">
                {c.why.heading}
              </h2>
            </div>
            {c.why.beats.map((b, i) => (
              <div key={b.title} data-scene={`why-${i + 1}`} className="lg:flex lg:min-h-[88svh] lg:items-center">
                <Over className="lg:max-w-[28rem]">
                  <p className="label mb-3 !text-ai-ink">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="serif text-[1.375rem] leading-[1.5] md:text-[1.625rem]">{b.title}</h3>
                  <p className="mt-4 text-[0.9375rem] leading-[2] text-ink-2">{b.body}</p>
                </Over>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 作っているもの：Wylls */}
        <section id="wylls" data-scene="wylls" aria-labelledby="wylls-heading" className="relative">
          <span id="services" aria-hidden="true" />
          <span id="works" aria-hidden="true" />
          <div aria-hidden="true" className="h-[30svh] lg:h-[18svh]" />
          <div className="relative mx-auto max-w-[1440px] px-0 lg:px-12">
            <div className="border-y border-rule bg-card/95 px-5 py-12 backdrop-blur-sm sm:px-8 lg:max-w-[64rem] lg:border lg:p-12">
              <SectionLabel>{c.wylls.label}</SectionLabel>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <h2 id="wylls-heading" className="serif text-[2.25rem] leading-none md:text-[2.75rem]">
                  {c.wylls.heading}
                </h2>
                <p className="label flex items-center gap-2 !text-ai-ink">
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-ai" />
                  {c.wylls.status}
                </p>
              </div>
              <p className="serif mt-4 text-[1.125rem] leading-[1.75] md:text-[1.25rem]">{c.wylls.oneLiner}</p>

              <figure className="mt-8">
                <div className="overflow-hidden border border-rule bg-ink">
                  <Image
                    src={wyllsShot}
                    alt={c.wylls.shot.alt}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 900px, 100vw"
                    quality={78}
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="mt-3 text-[0.75rem] leading-relaxed text-ink-3">{c.wylls.shot.caption}</figcaption>
              </figure>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                <CartVideo caption={c.wylls.video.caption} play={c.wylls.video.play} pause={c.wylls.video.pause} />
                <div>
                <dl>
                  {c.wylls.facts.map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 border-t border-rule py-3 text-[0.875rem]">
                      <dt className="label pt-[0.15rem]">{label}</dt>
                      <dd className="text-ink-2">{value}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="mt-6">
                  {c.wylls.links.map(({ label, href, note }) => (
                    <li key={href}>
                      <ExternalLink href={href} hint={c.externalHint} className="row-link">
                        <span className="font-mono text-sm">{label}</span>
                        <span className="ml-auto font-mono text-xs text-ink-3">{note}</span>
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
                </div>
              </div>

              <h3 className="label mb-2 mt-12">{c.wylls.pastLabel}</h3>
              <ul>
                {c.wylls.past.map((p) => (
                  <li key={p.name}>
                    <ExternalLink
                      href={p.href}
                      hint={c.externalHint}
                      arrow={false}
                      className="group grid gap-x-6 gap-y-1 border-t border-rule py-4 md:grid-cols-[7rem_1fr_auto] md:items-baseline"
                    >
                      <span className="serif text-[1.25rem] transition-colors group-hover:text-ai-ink">{p.name}</span>
                      <span>
                        <span className="label block !normal-case !tracking-[0.06em]">{p.meta}</span>
                        <span className="mt-1 block text-[0.875rem] leading-[1.85] text-ink-2">{p.desc}</span>
                      </span>
                      <span aria-hidden="true" className="row-link-arrow hidden font-mono text-sm text-ink-3 md:block">
                        ↗
                      </span>
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 4. 社名とワールド・ゲーム */}
        <section id="origin" data-scene="name" aria-labelledby="origin-heading" className="relative">
          <div aria-hidden="true" className="over-model absolute inset-y-0 left-0 hidden w-[56%] lg:block" />
          <div className="relative mx-auto max-w-[1440px] lg:flex lg:min-h-[96svh] lg:items-center lg:px-12">
            <Over className="lg:max-w-[30rem]">
              <SectionLabel>{c.origin.label}</SectionLabel>
              <h2 id="origin-heading" className="serif text-[1.75rem] leading-[1.35] md:text-[2.25rem]">
                {c.origin.heading}
              </h2>
              <figure className="mt-8">
                <blockquote className="serif text-[1.0625rem] leading-[1.95] md:text-[1.1875rem]">
                  <p>{c.origin.quote.text}</p>
                </blockquote>
                <figcaption className="label mt-3 !normal-case !tracking-[0.06em]">— {c.origin.quote.source}</figcaption>
              </figure>
              <p className="mt-8 text-[0.9375rem] leading-[2] text-ink-2">{c.origin.body}</p>
            </Over>
          </div>
        </section>

        {/* 5. 開発ログ（取り込めないときは出さない） */}
        {feed.length > 0 && (
          <section id="log" data-scene="log" aria-labelledby="log-heading" className="relative">
            <div className="relative mx-auto max-w-[1440px] bg-paper px-5 py-16 sm:px-8 lg:bg-transparent lg:px-12 lg:py-24">
              <div className="lg:max-w-[40rem]">
                <SectionLabel>{c.log.label}</SectionLabel>
                <h2 id="log-heading" className="serif text-[1.75rem] leading-[1.35] md:text-[2.25rem]">
                  {c.log.heading}
                </h2>
                <p className="mt-3 text-[0.8125rem] text-ink-3">{c.log.note}</p>
                <ul className="mt-6">
                  {feed.map((item) => (
                    <li key={item.url}>
                      <ExternalLink href={item.url} hint={c.externalHint} className="row-link">
                        <time dateTime={item.date} className="w-[7.5rem] shrink-0 font-mono text-xs text-ink-3">
                          {fmtDate(item.date, lang)}
                        </time>
                        <span className="text-[0.875rem]" lang="en">
                          {item.title}
                        </span>
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 6. 会社概要・連絡先 */}
        <section data-scene="company" className="relative">
          <div className="relative mx-auto grid max-w-[1440px] gap-14 bg-paper px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:bg-transparent lg:px-12 lg:py-24">
            <div id="company">
              <span id="about" aria-hidden="true" />
              <SectionLabel>{c.company.label}</SectionLabel>
              <h2 className="serif text-[1.75rem] leading-[1.35] md:text-[2.25rem]">{c.company.heading}</h2>
              <dl className="mt-8">
                {c.company.rows.map(({ label, value }) => (
                  <div key={label} className="grid gap-1 border-t border-rule py-4 text-[0.9375rem] sm:grid-cols-[7rem_1fr] sm:gap-6">
                    <dt className="label sm:pt-[0.2rem]">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div id="contact">
              <SectionLabel>{c.contact.label}</SectionLabel>
              <h2 className="serif text-[1.75rem] leading-[1.35] md:text-[2.25rem]">{c.contact.heading}</h2>
              <p className="mt-6 text-[0.9375rem] leading-[2] text-ink-2">{c.contact.body}</p>
              <a
                href={`mailto:${site.email}`}
                className="text-link mt-4 inline-block break-all py-2 font-mono text-[clamp(1.0625rem,2.4vw,1.5rem)]"
              >
                {site.email}
              </a>
              <p className="mt-2 text-[0.75rem] text-ink-3">{c.contact.note}</p>
              <ul className="mt-8">
                {c.contact.links.map(({ label, href, note }) => (
                  <li key={href}>
                    <ExternalLink href={href} hint={c.externalHint} className="row-link">
                      <span className="font-mono text-sm">{label}</span>
                      <span className="ml-auto font-mono text-xs text-ink-3">{note}</span>
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule bg-paper">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-6 text-[0.6875rem] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p className="font-mono tracking-[0.06em]">
            © {new Date().getFullYear()} {lang === 'ja' ? '株式会社雪風' : 'Yukikaze Inc.'}
          </p>
          <a href="#top" className="label inline-flex min-h-11 items-center !text-ink-3 transition-colors hover:!text-ink">
            {c.footer.top} <span aria-hidden="true" className="ml-2">↑</span>
          </a>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(lang)) }} />
    </>
  );
}
