import Image from 'next/image';
import Section, { Body } from './Section';
import ExternalLink from './ExternalLink';
import { site, type Content } from '../content/site';

export default function Contact({ contact, hint }: { contact: Content['contact']; hint: string }) {
  return (
    <Section id="contact" index="04" label={contact.label} heading={contact.heading}>
      <Body>
        <p className="text-[1.0625rem] md:text-lg max-w-[34em]">{contact.body}</p>
        <a
          href={`mailto:${site.email}`}
          className="text-link mt-6 inline-block py-2 break-all font-mono text-[clamp(1.25rem,3.6vw,2.25rem)] leading-tight"
        >
          {site.email}
        </a>
        <p className="mt-4 text-sm text-ink-3">{contact.note}</p>

        <div className="mt-14 flex flex-col gap-8 border-t border-rule pt-8 sm:flex-row sm:items-start sm:gap-12">
          <div className="flex items-center gap-4">
            <Image
              src="/images/profile.png"
              alt=""
              width={56}
              height={56}
              className="rounded-full [image-rendering:pixelated]"
            />
            <div>
              <p className="font-medium">{contact.person.name}</p>
              <p className="label">{contact.person.role}</p>
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            {contact.links.map(({ label, href, note }) => (
              <li key={href}>
                <ExternalLink href={href} hint={hint} className="group inline-flex min-h-11 items-baseline gap-2">
                  <span className="text-link">{label}</span>
                  {note && <span className="label group-hover:!text-accent">{note}</span>}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
      </Body>
    </Section>
  );
}
