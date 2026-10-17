import Section, { Body } from './Section';
import type { Content } from '../content/site';

export default function Company({ company }: { company: Content['company'] }) {
  return (
    <Section id="company" index="03" label={company.label} heading={company.heading} aliases={['about']}>
      <Body>
        <dl className="max-w-3xl border-t border-ink">
          {company.rows.map(({ label, value }) => (
            <div key={label} className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="label sm:pt-[0.3rem]">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Body>
    </Section>
  );
}
