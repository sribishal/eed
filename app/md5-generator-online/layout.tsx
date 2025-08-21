import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'MD5 Hash Generator Free Online Client Side Tool',
  description: 'Free online MD5 hash generator tool. Generate MD5 hashes from text, verify MD5 checksums, create file fingerprints instantly with real-time MD5 generation.',
  openGraph: {
    title: 'Free MD5 Generator - Online MD5 Hash Calculator & Checksum',
    description: 'Generate MD5 hashes online from text input. Verify checksums, create file fingerprints with real-time MD5 generation for data integrity verification.',
    url: 'https://easyencoderdecoder.com/md5-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MD5GeneratorLayout({
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
