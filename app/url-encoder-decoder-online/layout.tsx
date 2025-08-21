import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'URL Encoder Decoder FREE Online Client Side Tool',
  description: 'Free online URL encoder and decoder. Encode text to URL-safe format with percent encoding. Convert spaces, special characters, and international text for safe URL transmission instantly.',
  openGraph: {
    title: 'URL Encoder Decoder FREE Online Client Side Tool',
    description: 'Free online URL encoder and decoder. Encode text to URL-safe format with percent encoding. Convert spaces, special characters, and international text for safe URL transmission instantly.',
    url: 'https://easyencoderdecoder.com/url-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function URLEncodeDecodeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
