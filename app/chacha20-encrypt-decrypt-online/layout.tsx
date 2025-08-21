import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ChaCha20 Encrypt Decrypt Online - Free ChaCha20 Cipher Tool',
  description: 'Free online ChaCha20 encryption and decryption tool. Secure modern stream cipher with high-speed processing and client-side encryption.',
  openGraph: {
    title: 'ChaCha20 Encrypt Decrypt Online - Free ChaCha20 Cipher Tool',
    description: 'Free online ChaCha20 encryption and decryption tool. Secure modern stream cipher with high-speed processing and client-side encryption.',
    url: 'https://easyencoderdecoder.com/chacha20-encrypt-decrypt-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ChaCha20Poly1305ToolLayout({
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
