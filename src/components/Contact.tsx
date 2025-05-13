'use client';
import { FC } from 'react';
import Image from 'next/image';

const Contact: FC = () => {
  return (
    <section className="py-24 container mx-auto px-6">
      <h2 className="text-3xl font-bold text-center mb-12">Contact</h2>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* 画像セクション */}
          <div className="w-full md:w-1/3">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden">
              <Image
                src="/images/profile.jpg"
                alt="Profile"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* コンタクト情報セクション */}
          <div className="w-full md:w-2/3 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Name</h3>
              <p className="text-white/80">r0ze/Daichi Takehara</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p className="text-white/80">takehara998@gmail.com</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Location</h3>
              <p className="text-white/80">Kyoto, Japan</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Social</h3>
              <div className="flex gap-4">
                <a
                  href="https://twitter.com/r0ze_____"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="https://x.com/r0ze_____/articles"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Blog
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
