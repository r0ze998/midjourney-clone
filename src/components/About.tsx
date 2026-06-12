import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { about } from '../content/site';

export default function About() {
  return (
    <section id="about" className="relative py-32 scroll-mt-16 overflow-hidden">
      {/* 縦書きの装飾テキスト */}
      <span
        aria-hidden="true"
        className="absolute top-32 right-6 hidden xl:block font-brand text-3xl text-white/[0.07] [writing-mode:vertical-rl] tracking-[0.5em] select-none"
      >
        {about.lead}
      </span>

      <div className="container mx-auto px-6 max-w-6xl">
        <SectionHeading index="03" title="About" subtitle={about.heading} />

        <div className="grid gap-20 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <p className="font-brand text-3xl md:text-5xl leading-relaxed text-accent mb-10 drop-shadow-[0_0_30px_rgba(62,240,140,0.2)]">
              {about.lead}
            </p>
            <p className="leading-loose text-white/80">{about.body}</p>
          </Reveal>

          <Reveal delay={150}>
            <div className="lg:sticky lg:top-28">
              <h3 className="flex items-center gap-4 font-mono text-sm tracking-[0.3em] text-white/50 mb-8">
                <span className="inline-block w-8 h-px bg-white/30" />
                COMPANY OVERVIEW
              </h3>
              <dl className="divide-y divide-white/10 border-y border-white/10">
                {about.overview.map(({ label, value }) => (
                  <div
                    key={label}
                    className="grid grid-cols-[6rem_1fr] gap-4 py-5"
                  >
                    <dt className="text-sm text-white/40 font-mono">{label}</dt>
                    <dd className="text-sm leading-relaxed text-white/85">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
