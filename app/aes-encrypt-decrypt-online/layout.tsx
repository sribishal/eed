import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'AES Encrypt Decrypt Online Free AES 128 256 Tool',
  description: 'Free online AES encryption and decryption tool. Secure AES-128 and AES-256 encryption with client-side processing.',
  openGraph: {
    title: 'AES Encrypt Decrypt Online - Free AES 128 256 Tool',
    description: 'Free online AES encryption and decryption tool. Secure AES-128 and AES-256 encryption with client-side processing.',
    url: 'https://easyencoderdecoder.com/aes-encrypt-decrypt-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AESEncryptDecryptLayout({
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
