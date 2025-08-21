import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'SHA256 Hash Generator Online Free SHA-256 Checksum Calculator',
  description: 'Free online SHA256 hash generator. Generate secure SHA-256 hashes from text and files for blockchain, cryptocurrency, and data integrity. Client-side processing.',
  openGraph: {
    title: 'SHA256 Hash Generator Online - Free SHA-256 Checksum Calculator',
    description: 'Free online SHA256 hash generator. Generate secure SHA-256 hashes from text and files for blockchain, cryptocurrency, and data integrity. Client-side processing.',
    url: 'https://easyencoderdecoder.com/sha256-hash-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Sha256HashGeneratorLayout({
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
