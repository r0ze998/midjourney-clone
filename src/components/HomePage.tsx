import SiteHeader from './SiteHeader';
import Intro from './Intro';
import Works from './Works';
import Approach from './Approach';
import Company from './Company';
import Contact from './Contact';
import SiteFooter from './SiteFooter';
import { content, type Lang } from '../content/site';
import { organizationJsonLd } from '../lib/metadata';

export default function HomePage({ lang }: { lang: Lang }) {
  const c = content[lang];
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {c.skip}
      </a>
      <SiteHeader
        nav={c.nav}
        langSwitch={c.langSwitch}
        menu={c.menu}
        name={lang === 'ja' ? '株式会社雪風' : 'Yukikaze Inc.'}
        homeHref={lang === 'ja' ? '/' : '/en'}
      />
      <main id="main" tabIndex={-1} className="outline-none">
        <Intro intro={c.intro} />
        <Works works={c.works} hint={c.externalHint} />
        <Approach approach={c.approach} />
        <Company company={c.company} />
        <Contact contact={c.contact} hint={c.externalHint} />
      </main>
      <SiteFooter footer={c.footer} nav={c.nav} langSwitch={c.langSwitch} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(lang)) }}
      />
    </>
  );
}
