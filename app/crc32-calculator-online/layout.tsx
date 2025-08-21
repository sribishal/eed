import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'CRC32 Calculator Online Free CRC32 Checksum Generator',
  description: 'Free online CRC32 calculator for text and files. Generate CRC32 checksums for data integrity verification with hex and decimal output.',
  openGraph: {
    title: 'CRC32 Calculator Online - Free CRC32 Checksum Generator',
    description: 'Free online CRC32 calculator for text and files. Generate CRC32 checksums for data integrity verification with hex and decimal output.',
    url: 'https://easyencoderdecoder.com/crc32-calculator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Crc32ToolLayout({
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
