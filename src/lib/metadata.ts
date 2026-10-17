import type { Metadata, Viewport } from 'next';
import { content, site, type Lang } from '../content/site';

const paths: Record<Lang, string> = { ja: '/', en: '/en' };

export const viewport: Viewport = {
  themeColor: '#040604',
};

export function buildMetadata(lang: Lang): Metadata {
  const { meta } = content[lang];
  const ogImage = {
    url: `/og/${lang}.png`,
    width: 1200,
    height: 630,
    alt: meta.ogAlt,
  };
  return {
    metadataBase: new URL(site.url),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: paths[lang],
      languages: { ja: paths.ja, en: paths.en, 'x-default': paths.ja },
    },
    openGraph: {
      url: paths[lang],
      title: meta.title,
      description: meta.description,
      siteName: lang === 'ja' ? '株式会社雪風' : 'Yukikaze Inc.',
      locale: lang === 'ja' ? 'ja_JP' : 'en_US',
      alternateLocale: lang === 'ja' ? 'en_US' : 'ja_JP',
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
}

// 構造化データ。確認済みの会社情報だけを入れ、受賞・実績・評価などは入れない。
export function organizationJsonLd(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: lang === 'ja' ? '株式会社雪風' : 'Yukikaze Inc.',
    alternateName: lang === 'ja' ? 'Yukikaze Inc.' : '株式会社雪風',
    url: site.url,
    logo: `${site.url}/images/logo.png`,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: lang === 'ja' ? '京都市' : 'Kyoto',
      addressRegion: lang === 'ja' ? '京都府' : 'Kyoto',
      addressCountry: 'JP',
    },
    founder: {
      '@type': 'Person',
      name: lang === 'ja' ? '竹原大智' : 'Daichi Takehara',
    },
    sameAs: [site.x, site.github],
  };
}
