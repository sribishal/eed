import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'PBKDF2 Generator Free Online Password-Based Key Derivation Function Tool',
  description: 'Free online PBKDF2 generator tool. Generate secure cryptographic keys using PBKDF2 with SHA-256, SHA-1, SHA-512. Customizable iterations, salt, and key length for password hashing.',
  openGraph: {
    title: 'Free PBKDF2 Generator - Password-Based Key Derivation Tool',
    description: 'Generate secure cryptographic keys using PBKDF2 algorithm. Support for SHA-256, SHA-1, SHA-512 with customizable iterations and salt for password security.',
    url: 'https://easyencoderdecoder.com/pbkdf2-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PBKDF2ToolLayout({
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
