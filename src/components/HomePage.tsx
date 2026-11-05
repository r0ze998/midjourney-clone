import Image from 'next/image';
import type { ReactNode } from 'react';
import WorldStage from './WorldStage';
import Rain from './Rain';
import ModelControls, { ModelConsole, ModelReadout, ScrubArea } from './ModelControls';
import ExternalLink from './ExternalLink';
import FilmCollage from './FilmCollage';
import WorldGlobe from './WorldGlobe';
import { content, site, type Lang } from '../content/site';
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

/** セクションの見出し（英語、ヒーローと同じ太い書体） */
function H2({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} lang="en" className={`font-display text-[2.75rem] font-extrabold uppercase leading-[0.92] tracking-[0.01em] [font-variation-settings:'opsz'_72] md:text-[3.5rem] ${className}`}>
      {children}
    </h2>
  );
}

/** 本文の段落 */
function Paras({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <div className={`space-y-4 text-[0.9375rem] leading-[2] text-ink-2 ${className}`}>
      {items.map((t) => (
        <p key={t}>{t}</p>
      ))}
    </div>
  );
}

export default function HomePage({ lang }: { lang: Lang }) {
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
              <h1 id="hero-title" className="font-display text-[3.75rem] font-extrabold uppercase [font-variation-settings:'opsz'_72] leading-[0.92] tracking-[0.005em] sm:text-[4.75rem] lg:text-[5.5rem]">
                {c.hero.title.replace(/^(\S+ \S+) /, '$1\n')
                  .split('\n')
                  .map((line, i) => (
                    <span key={i} className="block">
                      {line}
                      {/* 読み上げ・検索で語がつながらないように、行の間に空白を残す */}
                      {i === 0 ? ' ' : ''}
                    </span>
                  ))}
              </h1>

              <p className="serif mt-5 text-[1.25rem] leading-[1.6] lg:text-[1.375rem]">{c.hero.lead}</p>
              <div className="mt-4 max-w-[30em] space-y-2.5 text-[0.875rem] leading-[1.9] text-ink-2">
                {c.hero.body.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              <div className="js-only mt-7 border-t border-rule pt-5">
                <ModelControls c={c.model} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. なぜゲームか（2 つの場面）と、人間とAI（AIの区画の場面） */}
        <section id="why" aria-labelledby="why-heading" className="relative">
          <span id="vision" aria-hidden="true" />
          <span id="approach" aria-hidden="true" />
          <div aria-hidden="true" className="over-model absolute inset-y-0 left-0 hidden w-[56%] lg:block" />
          <div className="relative mx-auto max-w-[1440px] lg:px-12">
            {c.why.parts.map((part, i) => (
              <div key={i} data-scene={i === 0 ? 'why-2' : 'why-3'} className="lg:flex lg:min-h-[92svh] lg:items-center">
                <Over className="lg:max-w-[29rem]">
                  {i === 0 && (
                    <>
                      <SectionLabel>{c.why.label}</SectionLabel>
                      <H2 id="why-heading" className="mb-6">
                        {c.why.heading}
                      </H2>
                    </>
                  )}
                  <Paras items={part} />
                </Over>
              </div>
            ))}
          </div>
        </section>

        <section id="humans" aria-labelledby="humans-heading" className="relative">
          <div aria-hidden="true" className="over-model absolute inset-y-0 left-0 hidden w-[56%] lg:block" />
          <div className="relative mx-auto max-w-[1440px] lg:px-12">
            <div data-scene="why-1" className="lg:flex lg:min-h-[100svh] lg:items-center">
              <Over className="lg:max-w-[29rem]">
                <SectionLabel>{c.humans.label}</SectionLabel>
                <H2 id="humans-heading" className="mb-6">
                  {c.humans.heading}
                </H2>
                <Paras items={c.humans.body} />
              </Over>
            </div>
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
                <H2 id="wylls-heading">{c.wylls.heading}</H2>
              </div>
              <p className="serif mt-5 text-[1.125rem] leading-[1.75] md:text-[1.25rem]">{c.wylls.oneLiner}</p>
              <Paras items={c.wylls.body} className="mt-4 max-w-[42rem]" />

              {/* メインの紹介映像と、散らした映像の窓（持ち主の映像 2 本と、模型の荷車） */}
              <FilmCollage labels={c.wylls.films} play={c.wylls.video.play} pause={c.wylls.video.pause} sound={{ on: c.wylls.video.soundOn, off: c.wylls.video.soundOff }} />

              <p className="mt-10 max-w-[46rem] text-[0.9375rem] leading-[2] text-ink-2">{c.wylls.about}</p>

              {/* 使っている技術 */}
              <h3 className="label mb-2 mt-12">{c.wylls.techLabel}</h3>
              <ol>
                {c.wylls.tech.map((t) => (
                  <li key={t.no} className="grid gap-x-6 gap-y-2 border-t border-rule py-5 md:grid-cols-[11rem_1fr]">
                    <p className="flex items-baseline gap-3">
                      <span className="font-mono text-[0.75rem] text-signal">{t.no}</span>
                      <span lang="en" className="font-display text-[1.375rem] font-extrabold uppercase leading-none tracking-[0.01em] [font-variation-settings:'opsz'_72]">
                        {t.name}
                      </span>
                    </p>
                    <div>
                      <p className="text-[0.875rem] leading-[1.95] text-ink-2">{t.text}</p>
                      <p lang="en" className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-ink-3">
                        {t.tags}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-10">
                <ul>
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
          </div>
        </section>

        {/* 4. 構想：A world to build on */}
        <section id="build" data-scene="build" aria-labelledby="build-heading" className="relative">
          <div aria-hidden="true" className="over-model absolute inset-y-0 left-0 hidden w-[56%] lg:block" />
          <div className="relative mx-auto max-w-[1440px] lg:flex lg:min-h-[100svh] lg:items-center lg:px-12">
            <Over className="lg:max-w-[30rem]">
              <SectionLabel>{c.build.label}</SectionLabel>
              <H2 id="build-heading" className="mb-6">
                {c.build.heading}
              </H2>
              <Paras items={c.build.body} />
            </Over>
          </div>
        </section>

        {/* 5. ワールド・ゲーム */}
        <section id="origin" data-scene="name" aria-labelledby="origin-heading" className="relative">
          <div aria-hidden="true" className="over-model absolute inset-y-0 left-0 hidden w-[46%] lg:block" />
          <div className="relative mx-auto max-w-[1440px] lg:grid lg:min-h-[100svh] lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-center lg:gap-12 lg:px-12 lg:py-20">
            <Over window={false} className="lg:max-w-[30rem]">
              <SectionLabel>{c.origin.label}</SectionLabel>
              <H2 id="origin-heading" className="mb-6">
                {c.origin.heading}
              </H2>
              <Paras items={c.origin.body.slice(0, 2)} />
              <figure className="my-8 border-l border-signal/60 pl-5">
                <blockquote className="serif text-[1.0625rem] leading-[1.95] md:text-[1.1875rem]">
                  <p>{c.origin.quote.text}</p>
                </blockquote>
                <figcaption className="label mt-3 !normal-case !tracking-[0.06em]">— {c.origin.quote.source}</figcaption>
              </figure>
              <Paras items={c.origin.body.slice(2)} />
            </Over>
            {/* 球体の模型：スマホでは文章の下、デスクトップでは右 */}
            <div className="bg-paper px-5 pb-12 sm:px-8 lg:bg-transparent lg:px-0 lg:pb-0">
              <WorldGlobe ui={c.origin.globe} />
            </div>
          </div>
        </section>

        {/* 6. 取り組み（WHAT WE DO） */}
        <section id="what" data-scene="what" aria-labelledby="what-heading" className="relative">
          <div className="relative mx-auto max-w-[1440px] bg-paper px-5 py-16 sm:px-8 lg:bg-transparent lg:px-12 lg:py-28">
            <div className="lg:max-w-[40rem]">
              <SectionLabel>{c.what.label}</SectionLabel>
              <H2 id="what-heading" className="mb-6">
                {c.what.heading}
              </H2>
              <p className="serif text-[1.25rem] leading-[1.6] md:text-[1.5rem]">{c.what.lead}</p>
              <p className="mt-4 text-[0.9375rem] leading-[2] text-ink-2">{c.what.body}</p>
            </div>
            <ol className="mt-12 grid gap-px border border-rule bg-rule md:grid-cols-3">
              {c.what.items.map((it) => (
                <li key={it.no} className="group relative bg-paper/95 p-6 backdrop-blur-[2px] md:min-h-[17rem] md:p-8 lg:bg-card/85">
                  {/* 四隅の角（Wylls の窓と同じ作法） */}
                  <span aria-hidden="true" className="absolute -left-px -top-px h-3 w-3 border-l border-t border-signal" />
                  <p className="flex items-baseline gap-3 font-mono text-[0.75rem] tracking-[0.14em] text-ink-3">
                    <span className="text-signal">{it.no}</span>
                    <span aria-hidden="true">/</span>
                    <span lang="en" className="uppercase text-ink">
                      {it.name}
                    </span>
                  </p>
                  <p className="mt-6 text-[0.9375rem] leading-[2] text-ink-2 md:mt-10">{it.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 7. 会社・連絡先 */}
        <section data-scene="company" className="relative">
          <div className="relative mx-auto grid max-w-[1440px] gap-14 bg-paper px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:bg-transparent lg:px-12 lg:py-24">
            <div id="company">
              <span id="about" aria-hidden="true" />
              <SectionLabel>{c.company.label}</SectionLabel>
              <H2 className="mb-6">{c.company.heading}</H2>
              <Paras items={c.company.body} />
              <h3 className="label mb-1 mt-10">{c.company.rowsLabel}</h3>
              <dl>
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
              <H2>{c.contact.heading}</H2>
              <p className="mt-6 text-[0.9375rem] leading-[2] text-ink-2">{c.contact.body}</p>
              <a
                href={`mailto:${site.email}`}
                className="text-link mt-4 inline-block break-all py-2 font-mono text-[clamp(1.0625rem,2.4vw,1.5rem)]"
              >
                {site.email}
              </a>
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
