import Section, { Body } from './Section';
import type { Content } from '../content/site';

export default function Approach({ approach }: { approach: Content['approach'] }) {
  return (
    <Section id="approach" index="02" label={approach.label} heading={approach.heading} aliases={['vision']}>
      <Body>
        <div className="max-w-[40em] space-y-6 text-[1.0625rem] md:text-lg leading-[2]">
          {approach.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <h3 className="label mt-16 md:mt-20 mb-4">{approach.principlesLabel}</h3>
        <ol className="grid border-t border-ink md:grid-cols-3 md:gap-x-8">
          {approach.principles.map(({ title, body, inWylls }, i) => (
            <li key={title} className="flex flex-col border-b border-rule py-6 md:border-b-0 md:pt-6 md:pb-0">
              <span aria-hidden="true" className="label mb-3">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="display text-xl leading-snug mb-3">{title}</p>
              <p className="text-[0.9375rem] text-ink-2 mb-5">{body}</p>
              <p className="mt-auto border-l-2 border-wylls-teal pl-4 text-[0.9375rem]">
                <span className="label block !text-wylls-teal mb-1">{approach.inWyllsLabel}</span>
                {inWylls}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-20 md:mt-28 grid gap-12 md:grid-cols-9 md:gap-x-10">
          <figure className="md:col-span-5">
            <blockquote className="display text-xl md:text-[1.6rem] leading-[1.8]">
              <p>{approach.quote.text}</p>
            </blockquote>
            <figcaption className="label mt-5">— {approach.quote.source}</figcaption>
          </figure>
          <div className="md:col-span-4 md:pt-2">
            <h3 className="label mb-3">{approach.name.title}</h3>
            <p className="text-[0.9375rem] text-ink-2 leading-[1.95]">{approach.name.body}</p>
          </div>
        </div>
      </Body>
    </Section>
  );
}
