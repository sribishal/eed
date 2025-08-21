import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ROT Cipher Encoder Decoder Free Online Tool | ROT13, ROT47',
  description: 'Free online ROT cipher tool. Encode and decode text using ROT13, ROT47, and custom ROT shifts. Simple interactive rotation cipher with educational content.',
  openGraph: {
    title: 'Free ROT Cipher - ROT13, ROT47 Encoder & Decoder',
    description: 'Encode and decode text using ROT13, ROT47, and custom ROT ciphers. Interactive rotation cipher tool with educational content for learning classical cryptography.',
    url: 'https://easyencoderdecoder.com/rot-cipher-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CustomRotCipherToolLayout({
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
