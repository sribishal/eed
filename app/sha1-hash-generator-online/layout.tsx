import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'SHA1 Hash Generator Online Free SHA-1 Checksum Calculator',
  description: 'Free online SHA1 hash generator. Generate SHA-1 hashes from text and files for data integrity verification. Client-side processing.',
  openGraph: {
    title: 'SHA1 Hash Generator Online - Free SHA-1 Checksum Calculator',
    description: 'Free online SHA1 hash generator. Generate SHA-1 hashes from text and files for data integrity verification. Client-side processing.',
    url: 'https://easyencoderdecoder.com/sha1-hash-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Sha1HashGeneratorLayout({
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
