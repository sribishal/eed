import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'UUID GUID Generator Free Online UUID v1, v4, v5 Generator Tool',
  description: 'Free online UUID generator. Create unique identifiers with UUID v1, v4, v5, and GUID formats. Generate random UUIDs, timestamp-based UUIDs, and bulk UUID generation for databases, APIs, and applications instantly.',
  openGraph: {
    title: 'UUID GUID Generator Free Online UUID v1, v4, v5 Generator Tool',
    description: 'Free online UUID generator. Create unique identifiers with UUID v1, v4, v5, and GUID formats. Generate random UUIDs, timestamp-based UUIDs, and bulk UUID generation for databases, APIs, and applications instantly.',
    url: 'https://easyencoderdecoder.com/uuid-guid-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function UUIDGeneratorLayout({
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
