import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { about } from '../content/site';

export default function About() {
  return (
    <section id="about" className="py-28 scroll-mt-16">
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionHeading index="03" title="About" subtitle={about.heading} />

        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <p className="font-brand text-2xl md:text-3xl text-accent mb-8">
              {about.lead}
            </p>
            <p className="leading-loose text-white/80">{about.body}</p>
          </Reveal>

          <Reveal delay={150}>
            <h3 className="font-mono text-sm tracking-[0.3em] text-white/50 mb-6">
              COMPANY OVERVIEW
            </h3>
            <dl className="divide-y divide-white/10 border-y border-white/10">
              {about.overview.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[6rem_1fr] gap-4 py-4">
                  <dt className="text-sm text-white/50">{label}</dt>
                  <dd className="text-sm leading-relaxed text-white/85">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
