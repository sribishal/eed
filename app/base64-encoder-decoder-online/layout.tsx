import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Base64 Encoder Decoder Online Free Text and File Converter',
  description: 'Free online Base64 encoder and decoder. Convert text and files to Base64 format and decode Base64 back to original format.',
  openGraph: {
    title: 'Base64 Encoder Decoder Online - Free Text and File Converter',
    description: 'Free online Base64 encoder and decoder. Convert text and files to Base64 format and decode Base64 back to original format.',
    url: 'https://easyencoderdecoder.com/base64-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Base64EncodeDecodeLayout({
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
