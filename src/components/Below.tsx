import Image from 'next/image';
import Section from './Section';
import ExternalLink from './ExternalLink';
import wyllsWorld from '../assets/wylls-world.png';
import { site, type Content } from '../content/site';

// トップの1画面の下に続く部分: 考え方 / 作品 / 会社概要 / 連絡
export default function Below({ c }: { c: Content }) {
  const w = c.works.wylls;
  return (
    <>
      <Section id="approach" label={c.approach.label} heading={c.approach.heading}>
        <div className="max-w-[36em] space-y-5 text-[0.9375rem] leading-[2] text-bone-2">
          {c.approach.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-5 md:gap-8">
          <figure className="md:col-span-3">
            <blockquote className="serif text-[1.125rem] leading-[1.9] text-bone md:text-[1.25rem]">
              <p>{c.approach.quote.text}</p>
            </blockquote>
            <figcaption className="label mt-4 !normal-case !tracking-[0.1em]">— {c.approach.quote.source}</figcaption>
          </figure>
          <div className="md:col-span-2">
            <h3 className="label mb-3">{c.approach.name.title}</h3>
            <p className="text-[0.875rem] leading-[1.95] text-bone-2">{c.approach.name.body}</p>
          </div>
        </div>
      </Section>

      <Section id="works" label={c.works.label} heading={c.works.heading}>
        <article aria-labelledby="wylls-heading">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <h3 id="wylls-heading" className="serif text-[2.5rem] leading-none text-bone md:text-[3rem]">
              {c.now.name}
            </h3>
            <p className="label flex items-center gap-2 !text-signal">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_8px_#3ef08c]" />
              {c.now.status}
            </p>
          </div>
          <p className="serif mt-4 max-w-[28em] text-[1.125rem] leading-[1.8] text-bone md:text-[1.25rem]">{w.oneLiner}</p>

          <figure className="mt-8">
            <div className="border border-rule bg-void p-1">
              <Image
                src={wyllsWorld}
                alt={w.imageAlt}
                placeholder="blur"
                sizes="(min-width: 1280px) 900px, (min-width: 1024px) 66vw, 100vw"
                quality={80}
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 text-[0.75rem] leading-relaxed text-bone-3">{w.imageCaption}</figcaption>
          </figure>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <dl>
              {w.facts.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 border-t border-rule py-3 text-[0.875rem]">
                  <dt className="label pt-[0.15rem]">{label}</dt>
                  <dd className="text-bone-2">{value}</dd>
                </div>
              ))}
            </dl>
            <ul>
              {w.links.map(({ label, href, note }) => (
                <li key={href}>
                  <ExternalLink href={href} hint={c.externalHint} className="row-link">
                    <span className="font-mono text-sm">{label}</span>
                    <span className="ml-auto font-mono text-xs text-bone-3">{note}</span>
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <h3 className="label mt-16 mb-2">{c.works.pastLabel}</h3>
        <ul>
          {c.works.past.map((p) => (
            <li key={p.name}>
              <ExternalLink
                href={p.href}
                hint={c.externalHint}
                className="group grid gap-x-6 gap-y-2 border-t border-rule py-5 md:grid-cols-[9rem_1fr_auto] md:items-baseline"
              >
                <span className="flex items-baseline justify-between md:block">
                  <span className="serif text-[1.375rem] text-bone transition-colors group-hover:text-signal">{p.name}</span>
                  <span aria-hidden="true" className="row-link-arrow font-mono text-sm text-bone-3 md:hidden">
                    ↗
                  </span>
                </span>
                <span>
                  <span className="label block !normal-case !tracking-[0.08em]">
                    {p.year} · {p.platform} · {p.status}
                  </span>
                  <span className="mt-1 block text-[0.875rem] leading-[1.9] text-bone-2">{p.desc}</span>
                </span>
                <span aria-hidden="true" className="row-link-arrow hidden font-mono text-sm text-bone-3 md:block">
                  ↗
                </span>
              </ExternalLink>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="company" label={c.companySection.label} heading={c.companySection.heading}>
        <dl className="max-w-2xl">
          {c.company.map(({ label, value }) => (
            <div key={label} className="grid gap-1 border-t border-rule py-4 text-[0.9375rem] sm:grid-cols-[8rem_1fr] sm:gap-6">
              <dt className="label sm:pt-[0.2rem]">{label}</dt>
              <dd className="text-bone">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id="contact" label={c.contact.label} heading={c.contact.heading}>
        <p className="max-w-[34em] text-[0.9375rem] leading-[2] text-bone-2">{c.contact.body}</p>
        <a
          href={`mailto:${site.email}`}
          className="mt-5 inline-block py-2 break-all font-mono text-[clamp(1.125rem,3.2vw,1.75rem)] leading-tight text-bone underline decoration-bone-3 underline-offset-[0.3em] transition-colors hover:text-signal hover:decoration-signal"
        >
          {site.email}
        </a>
        <p className="mt-3 text-[0.75rem] text-bone-3">{c.contact.note}</p>
        <ul className="mt-10 max-w-md">
          {c.links
            .filter(({ href }) => !href.startsWith('mailto:'))
            .map(({ label, href, note }) => (
              <li key={href}>
                <ExternalLink href={href} hint={c.externalHint} className="row-link">
                  <span className="font-mono text-sm">{label}</span>
                  <span className="ml-auto font-mono text-xs text-bone-3">{note}</span>
                </ExternalLink>
              </li>
            ))}
        </ul>
      </Section>
    </>
  );
}
