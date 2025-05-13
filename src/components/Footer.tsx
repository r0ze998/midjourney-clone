'use client';
import { FC } from 'react';
import Image from 'next/image';

const Footer: FC = () => {
  return (
    <footer className="py-8 border-t border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <Image
                src="/images/logo.png"
                alt="雪風"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold">株式会社雪風</span>
          </div>
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} 株式会社雪風. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
