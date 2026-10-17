import Image from 'next/image';
import type { Content } from '../content/site';

export default function Intro({ intro }: { intro: Content['intro'] }) {
  const [first, ...rest] = intro.title.split('\n');
  return (
    <section id="top" aria-labelledby="top-heading" className="container-site">
      <div className="grid grid-cols-12 gap-x-6 lg:gap-x-10 pt-12 pb-14 md:pt-20 md:pb-20">
        <div className="col-span-12 md:col-span-8">
          <p className="label flex items-center gap-3 mb-6 md:mb-8">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-ink" />
            {intro.kicker}
          </p>
          <h1
            id="top-heading"
            className="display text-[clamp(2.25rem,6.6vw,4.75rem)] leading-[1.18] tracking-[-0.005em]"
          >
            {first}
            {rest.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-8 md:mt-10 max-w-[38em] text-[1.0625rem] md:text-lg leading-[1.95] text-ink-2">
            {intro.lead}
          </p>

          <a
            href={intro.current.href}
            className="group mt-10 md:mt-12 flex max-w-xl items-start gap-4 border-y border-rule py-4 hover:border-ink transition-colors"
          >
            <span className="label shrink-0 mt-[0.2rem] flex items-center gap-2 !text-accent">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              {intro.current.label}
            </span>
            <span className="flex-1">{intro.current.text}</span>
            <span aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </a>
        </div>

        {/* ロゴはそのまま使う（白地を紙色に馴染ませるため乗算のみ） */}
        <div className="hidden md:flex md:col-span-4 items-center justify-center">
          <Image
            src="/images/logo.png"
            alt=""
            width={1080}
            height={1080}
            priority
            sizes="(min-width: 1280px) 400px, 33vw"
            className="w-full max-w-[26rem] h-auto mix-blend-multiply"
          />
        </div>
      </div>
    </section>
  );
}
