import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'HTML Encoder Decoder Free Online Client Side Tool',
  description: 'Free online HTML encoder decoder tool. Convert HTML entities, escape special characters, and decode HTML strings instantly with real-time conversion.',
  openGraph: {
    title: 'Free HTML Encoder Decoder - HTML Entity Converter Tool',
    description: 'Convert HTML entities and escape special characters online. Supports named entities, numeric entities with real-time conversion.',
    url: 'https://easyencoderdecoder.com/html-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HTMLEncodeDecodeLayout({
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
