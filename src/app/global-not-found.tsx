import type { Metadata } from 'next';
import Link from 'next/link';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'ページが見つかりません | 株式会社雪風',
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ja" className={fontVariables}>
      <body>
        <main className="container-site flex min-h-svh flex-col justify-center py-20">
          <p className="label mb-6">404</p>
          <h1 className="display text-[clamp(1.75rem,5vw,3rem)] leading-snug">
            ページが見つかりません。
          </h1>
          <p className="mt-2 text-ink-2" lang="en">
            This page could not be found.
          </p>
          <p className="mt-10 flex gap-8">
            <Link href="/" className="text-link">
              トップへ
            </Link>
            <Link href="/en" className="text-link" lang="en" hrefLang="en">
              English
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
