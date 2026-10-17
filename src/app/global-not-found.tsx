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
        <main className="mx-auto flex min-h-svh max-w-[1600px] flex-col justify-center px-5 py-20 sm:px-8 lg:px-12">
          <p className="label mb-6">404</p>
          <h1 className="serif text-[clamp(1.75rem,5vw,3rem)] leading-snug">
            ページが見つかりません。
          </h1>
          <p className="mt-2 text-bone-2" lang="en">
            This page could not be found.
          </p>
          <p className="mt-10 flex gap-8">
            <Link href="/" className="row-link font-mono text-sm">
              トップへ
            </Link>
            <Link href="/en" className="row-link font-mono text-sm" lang="en" hrefLang="en">
              English
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
