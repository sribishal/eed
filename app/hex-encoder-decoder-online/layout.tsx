import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Hex Encoder Decoder Online Text to Hex Converter Free',
  description: 'Free online hex encoder decoder. Convert text to hexadecimal and hex to text with ASCII and UTF-8 support and real-time conversion.',
  openGraph: {
    title: 'Hex Encoder Decoder Online - Text to Hex Converter Free',
    description: 'Free online hex encoder decoder. Convert text to hexadecimal and hex to text with ASCII and UTF-8 support and real-time conversion.',
    url: 'https://easyencoderdecoder.com/hex-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HexEncodeDecodeLayout({
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
