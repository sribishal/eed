import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Binary Encoder Decoder Convert Text to Binary Online',
  description: 'Convert text to binary and binary to text online. Free binary encoder decoder with ASCII and UTF-8 support.',
  openGraph: {
    title: 'Binary Encoder Decoder - Convert Text to Binary Online',
    description: 'Convert text to binary and binary to text online. Free binary encoder decoder with ASCII and UTF-8 support.',
    url: 'https://easyencoderdecoder.com/binary-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BinaryEncodeDecodeLayout({
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
