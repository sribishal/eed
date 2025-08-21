import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Playfair Cipher Encrypt Decrypt Free Online Client Side Tool',
  description: 'Free online Playfair cipher tool. Encrypt and decrypt text using the classic Playfair cipher algorithm with custom keywords. Interactive cipher matrix generator and educational content.',
  openGraph: {
    title: 'Free Playfair Cipher - Classical Encryption & Decryption Tool',
    description: 'Encrypt and decrypt text using the historic Playfair cipher algorithm. Interactive matrix generation, custom keywords, and educational content for cryptography learning.',
    url: 'https://easyencoderdecoder.com/playfair-cipher-encrypt-decrypt-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PlayfairCipherLayout({
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
