import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Base58 Encoder Decoder Online Bitcoin and Blockchain Tool',
  description: 'Free online Base58 encoder and decoder. Convert text to Base58 and decode Base58 for Bitcoin and blockchain applications.',
  openGraph: {
    title: 'Base58 Encoder Decoder Online - Bitcoin and Blockchain Tool',
    description: 'Free online Base58 encoder and decoder. Convert text to Base58 and decode Base58 for Bitcoin and blockchain applications.',
    url: 'https://easyencoderdecoder.com/base58-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Base58ConverterLayout({
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
