import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'HMAC Generator Free Online Client Side Tool',
  description: 'Free online HMAC generator tool. Generate HMAC hashes with SHA-256, SHA-1, MD5 algorithms. Validate HMAC signatures, create secure authentication tokens with real-time generation.',
  openGraph: {
    title: 'Free HMAC Generator - Secure Hash Calculator & Validator',
    description: 'Generate HMAC hashes online with SHA-256, SHA-1, MD5 algorithms. Validate signatures, create authentication tokens with real-time generation and verification.',
    url: 'https://easyencoderdecoder.com/hmac-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HMACGeneratorLayout({
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
