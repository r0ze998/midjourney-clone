import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { services } from '../content/site';

export default function Services() {
  return (
    <section id="services" className="py-28 scroll-mt-16">
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionHeading index="01" title="Services" subtitle="事業内容" />
        <div className="grid gap-6 md:grid-cols-2">
          {services.map(({ title, label, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-300 hover:border-accent/50 hover:bg-accent/[0.04] hover:shadow-[0_0_40px_rgba(62,240,140,0.08)]">
                <p className="font-mono text-xs tracking-[0.25em] text-accent/80 mb-4">
                  {label.toUpperCase()}
                </p>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-white/70">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
