import type { MetadataRoute } from 'next';
import { site } from '../content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ja: `${site.url}/`, en: `${site.url}/en` };
  return [
    { url: `${site.url}/`, alternates: { languages } },
    { url: `${site.url}/en`, alternates: { languages } },
  ];
}
