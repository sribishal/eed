import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Rail Fence Cipher Encoder Decoder Free Online Client Side Tool',
  description: 'Free online Rail Fence cipher tool. Encrypt and decrypt text using the classic zigzag Rail Fence cipher algorithm with customizable rail counts. Interactive visualization and educational content.',
  openGraph: {
    title: 'Free Rail Fence Cipher - Classical Zigzag Encryption & Decryption Tool',
    description: 'Encrypt and decrypt text using the historic Rail Fence cipher algorithm. Interactive zigzag visualization, customizable rail counts, and educational content for cryptography learning.',
    url: 'https://easyencoderdecoder.com/rail-fence-cipher-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RailFenceCipherLayout({
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
