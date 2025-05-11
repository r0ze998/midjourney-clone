'use client';

import Link from 'next/link';

/**
 * Hero section with a title, description, and call-to-action buttons.
 */
export default function Hero() {
  return (
    <section className="relative bg-gray-900 text-white py-20 px-6 sm:px-12 md:px-24 lg:px-32">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-extrabold mb-6">
          Create AI-generated images with ease
        </h1>
        <p className="text-lg mb-8">
          Transform your ideas into stunning visuals in seconds using our
          AI-powered image generator.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/generate"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold"
          >
            Generate Image
          </Link>
          <Link
            href="/gallery"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-semibold"
          >
            View Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}
