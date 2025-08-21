import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Epoch Timestamp Converter Unix Time to Date Converter Online',
  description: 'Free online epoch timestamp converter. Convert Unix timestamps to human-readable dates and dates to Unix timestamps with UTC and local timezone support.',
  openGraph: {
    title: 'Epoch Timestamp Converter - Unix Time to Date Converter Online',
    description: 'Free online epoch timestamp converter. Convert Unix timestamps to human-readable dates and dates to Unix timestamps with UTC and local timezone support.',
    url: 'https://easyencoderdecoder.com/epoch-timestamp-converter-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function EpochTimeConverterLayout({
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
