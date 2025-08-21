import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Unicode Encoder Decoder Free Online Client Side Tool',
  description: 'Free online Unicode encoder and decoder. Convert text to Unicode, hex, HTML entities, URL encoding, Base64, and more. Support for UTF-8, UTF-16, UTF-32 encoding formats with instant conversion.',
  openGraph: {
    title: 'Unicode Encoder Decoder Free Online Client Side Tool',
    description: 'Free online Unicode encoder and decoder. Convert text to Unicode, hex, HTML entities, URL encoding, Base64, and more. Support for UTF-8, UTF-16, UTF-32 encoding formats with instant conversion.',
    url: 'https://easyencoderdecoder.com/unicode-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function UnicodeEncodeDecodeLayout({
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
