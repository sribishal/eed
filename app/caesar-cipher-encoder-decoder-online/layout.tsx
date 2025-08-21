import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Caesar Cipher Encoder Decoder Free Online Tool',
  description: 'Free online Caesar cipher tool. Encrypt and decrypt text using Caesar shift cipher with custom shift values and ROT13 support.',
  openGraph: {
    title: 'Caesar Cipher Encoder Decoder - Free Online Tool',
    description: 'Free online Caesar cipher tool. Encrypt and decrypt text using Caesar shift cipher with custom shift values and ROT13 support.',
    url: 'https://easyencoderdecoder.com/caesar-cipher-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CaesarCipherEncoderDecoderLayout({
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
