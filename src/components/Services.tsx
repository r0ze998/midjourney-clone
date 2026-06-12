import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { services } from '../content/site';

export default function Services() {
  return (
    <section id="services" className="py-32 scroll-mt-16">
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionHeading index="01" title="Services" subtitle="事業内容" />

        <div className="border-t border-white/10">
          {services.map(({ title, label, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="group relative grid md:grid-cols-[5rem_1fr_18rem_3rem] gap-4 md:gap-8 items-center py-10 md:py-12 border-b border-white/10 px-4 md:px-6 transition-colors duration-300 hover:bg-accent/[0.05] cursor-default">
                <span className="font-mono text-sm text-white/30 group-hover:text-accent transition-colors">
                  0{i + 1}
                </span>
                <div>
                  <p className="font-mono text-[0.65rem] tracking-[0.3em] text-accent/70 mb-2">
                    {label.toUpperCase()}
                  </p>
                  <h3 className="text-2xl md:text-4xl font-bold group-hover:text-accent group-hover:translate-x-2 transition-all duration-300">
                    {title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-white/60 md:text-white/50 group-hover:text-white/80 transition-colors">
                  {desc}
                </p>
                <span
                  aria-hidden="true"
                  className="hidden md:block font-mono text-2xl text-white/20 group-hover:text-accent group-hover:translate-x-2 transition-all duration-300"
                >
                  →
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
