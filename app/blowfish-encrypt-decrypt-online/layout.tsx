import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Blowfish Encrypt Decrypt Online Free Blowfish Cipher Tool',
  description: 'Free online Blowfish encryption and decryption tool. Encrypt and decrypt text using Blowfish cipher with secure client-side processing.',
  openGraph: {
    title: 'Blowfish Encrypt Decrypt Online - Free Blowfish Cipher Tool',
    description: 'Free online Blowfish encryption and decryption tool. Encrypt and decrypt text using Blowfish cipher with secure client-side processing.',
    url: 'https://easyencoderdecoder.com/blowfish-encrypt-decrypt-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlowfishToolLayout({
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
