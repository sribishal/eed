import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'XOR Cipher Encrypt Decrypt Free Online Tool',
  description: 'XOR cipher tool for encryption and decryption. Perfect for learning cryptography concepts and simple obfuscation. Client-side processing with bitwise operations.',
  openGraph: {
    title: 'XOR Cipher Encrypt Decrypt Free Online Tool',
    description: 'XOR cipher tool for encryption and decryption. Perfect for learning cryptography concepts and simple obfuscation. Client-side processing with bitwise operations.',
    url: 'https://easyencoderdecoder.com/xor-encrypt-decrypt-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function XorCipherToolLayout({
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
