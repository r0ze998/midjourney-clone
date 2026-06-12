import Image from 'next/image';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { contact } from '../content/site';

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative py-32 scroll-mt-16 border-t border-white/5 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(62,240,140,0.04),transparent_50%)]" />
      <div className="relative container mx-auto px-6 max-w-6xl">
        <SectionHeading index="04" title="Contact" subtitle="お問い合わせ" />

        <Reveal>
          <p className="text-xl md:text-2xl text-white/70 mb-6">
            ワールド・ゲームを、一緒に。
          </p>
          <a
            href={`mailto:${contact.email}`}
            className="link-underline inline-block font-mono text-[clamp(1.4rem,5vw,4rem)] font-bold text-white hover:text-accent transition-colors break-all"
          >
            {contact.email}
          </a>
        </Reveal>

        <Reveal delay={150} className="mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pt-10 border-t border-white/10">
            <div className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden ring-1 ring-accent/40">
              <Image
                src="/images/profile.jpg"
                alt={contact.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-wrap gap-x-14 gap-y-6">
              <div>
                <h3 className="font-mono text-[0.65rem] tracking-[0.3em] text-white/40 mb-1">
                  NAME
                </h3>
                <p className="text-white/90">{contact.name}</p>
              </div>
              <div>
                <h3 className="font-mono text-[0.65rem] tracking-[0.3em] text-white/40 mb-1">
                  LOCATION
                </h3>
                <p className="text-white/90">{contact.location}</p>
              </div>
              <div>
                <h3 className="font-mono text-[0.65rem] tracking-[0.3em] text-white/40 mb-1">
                  SOCIAL
                </h3>
                <div className="flex gap-5">
                  {contact.socials.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-accent transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
