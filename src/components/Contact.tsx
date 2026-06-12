import Image from 'next/image';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';
import { contact } from '../content/site';

export default function Contact() {
  return (
    <section
      id="contact"
      className="py-28 scroll-mt-16 border-t border-white/5 bg-[linear-gradient(180deg,rgba(62,240,140,0.03),transparent_40%)]"
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionHeading index="04" title="Contact" subtitle="お問い合わせ" />

        <Reveal>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
            <div className="relative w-40 h-40 shrink-0 rounded-full overflow-hidden ring-2 ring-accent/40 ring-offset-4 ring-offset-ink">
              <Image
                src="/images/profile.jpg"
                alt={contact.name}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>

            <div className="flex-1 w-full grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-mono text-xs tracking-[0.25em] text-white/50 mb-2">
                  NAME
                </h3>
                <p className="text-white/90">{contact.name}</p>
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-[0.25em] text-white/50 mb-2">
                  LOCATION
                </h3>
                <p className="text-white/90">{contact.location}</p>
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-[0.25em] text-white/50 mb-2">
                  EMAIL
                </h3>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-accent hover:underline"
                >
                  {contact.email}
                </a>
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-[0.25em] text-white/50 mb-2">
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
