import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'SHA512 Hash Generator Online Free SHA-512 Checksum Calculator',
  description: 'Free online SHA512 hash generator. Generate ultra-secure SHA-512 hashes from text and files for maximum security and enterprise applications. Client-side processing.',
  openGraph: {
    title: 'SHA512 Hash Generator Online - Free SHA-512 Checksum Calculator',
    description: 'Free online SHA512 hash generator. Generate ultra-secure SHA-512 hashes from text and files for maximum security and enterprise applications. Client-side processing.',
    url: 'https://easyencoderdecoder.com/sha512-hash-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Sha512HashGeneratorLayout({
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
