import Section, { Body } from './Section';
import ExternalLink from './ExternalLink';
import WyllsMedia from './WyllsMedia';
import wyllsWorld from '../assets/wylls-world.png';
import { links, type Content } from '../content/site';

function LinkList({ items, hint }: { items: { label: string; href: string; note?: string }[]; hint: string }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {items.map(({ label, href, note }) => (
        <li key={href}>
          <ExternalLink
            href={href}
            hint={hint}
            className="group flex min-h-12 items-baseline justify-between gap-4 py-3 hover:text-accent transition-colors"
          >
            <span className="font-medium">{label}</span>
            {note && <span className="label ml-auto group-hover:!text-accent">{note}</span>}
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}

export default function Works({ works, hint }: { works: Content['works']; hint: string }) {
  const w = works.wylls;
  return (
    <Section id="works" index="01" label={works.label} heading={works.heading} aliases={['services']}>
      <article id="wylls" aria-labelledby="wylls-name">
        <Body>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3 mb-4">
            <h3 id="wylls-name" className="display text-[clamp(2.5rem,6vw,4.5rem)] leading-none">
              {w.name}
            </h3>
            <p className="label flex items-center gap-2 !text-accent">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              {w.status}
            </p>
          </div>
          <p className="display text-xl md:text-2xl leading-relaxed max-w-[30em]">{w.oneLiner}</p>
        </Body>

        {/* 作品の窓: ここだけ Wylls の色（深緑の枠）を使う */}
        <figure className="mt-10 md:mt-14">
          <div className="bg-wylls-metal p-1.5 md:p-2.5">
            <WyllsMedia
              image={wyllsWorld}
              imageAlt={w.imageAlt}
              videoId={links.wyllsDemoId}
              play={w.video.play}
              duration={w.video.duration}
              iframeTitle={w.video.iframeTitle}
              externalNote={w.video.external}
            />
          </div>
          <figcaption className="mt-4 lg:grid lg:grid-cols-12 lg:gap-x-10 text-sm leading-relaxed text-ink-2">
            <div className="lg:col-start-4 lg:col-span-9 grid gap-2 md:grid-cols-2 md:gap-8">
              <p>{w.imageCaption}</p>
              <p>{w.video.caption}</p>
            </div>
          </figcaption>
        </figure>

        {/* スマホでは「何か → 状態とリンク → しくみ」の順。広い画面では右列に状態とリンクを置く */}
        <div className="mt-14 md:mt-20 grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-start-4 lg:col-span-5 lg:row-start-1">
            <p className="text-[1.0625rem] leading-[1.95]">{w.body}</p>
          </div>

          <div className="lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:row-span-2">
            <dl className="border-t border-ink">
              {w.facts.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-rule py-3.5 text-[0.9375rem]">
                  <dt className="label pt-[0.2rem]">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <LinkList items={w.links} hint={hint} />
            </div>

            <div className="mt-8 bg-paper-2 p-5">
              <h4 className="label mb-3 !text-ink-2">{w.notYet.label}</h4>
              <ul className="space-y-1.5 text-[0.9375rem] text-ink-2">
                {w.notYet.items.map((item) => (
                  <li key={item} className="grid grid-cols-[1rem_1fr]">
                    <span aria-hidden="true">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="lg:col-start-4 lg:col-span-5 lg:row-start-2">
            <h4 className="label mb-2">{w.mechanicsLabel}</h4>
            <ol className="border-t border-rule">
              {w.mechanics.map(({ title, body }, i) => (
                <li key={title} className="grid grid-cols-[2.5rem_1fr] border-b border-rule py-5">
                  <span className="label pt-1" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium mb-1">{title}</p>
                    <p className="text-[0.9375rem] text-ink-2">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </article>

      <div className="mt-20 md:mt-28">
        <Body>
          <h3 className="label mb-4">{works.others.label}</h3>
          <ul className="border-t border-ink">
            {works.others.items.map((p) => (
              <li key={p.name} className="border-b border-rule py-8 md:grid md:grid-cols-9 md:gap-x-10">
                <div className="md:col-span-3">
                  <p className="display text-2xl md:text-3xl leading-tight">{p.name}</p>
                  <p className="label mt-2">
                    {p.year} · {p.platform}
                  </p>
                  <p className="label mt-1 !text-ink-2">{p.status}</p>
                </div>
                <p className="mt-4 md:mt-0 md:col-span-4 text-[0.9375rem] text-ink-2">{p.body}</p>
                <ul className="mt-4 md:mt-0 md:col-span-2 text-sm space-y-1">
                  {p.links.map(({ label, href, note }) => (
                    <li key={href}>
                      <ExternalLink href={href} hint={hint} className="text-link inline-flex min-h-11 md:min-h-8 items-center">
                        {label}
                        {note && <span className="sr-only"> ({note})</span>}
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Body>
      </div>
    </Section>
  );
}
