import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Vigenère Cipher Encrypt Decrypt Free Online Tool',
  description: 'Free online Vigenère cipher tool. Encrypt and decrypt text using polyalphabetic substitution with custom keywords. Learn classical cryptography with client-side processing.',
  openGraph: {
    title: 'Vigenère Cipher Encrypt Decrypt Free Online Tool',
    description: 'Free online Vigenère cipher tool. Encrypt and decrypt text using polyalphabetic substitution with custom keywords. Learn classical cryptography with client-side processing.',
    url: 'https://easyencoderdecoder.com/vigenere-cipher-encrypt-decrypt-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VigenereCipherLayout({
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
