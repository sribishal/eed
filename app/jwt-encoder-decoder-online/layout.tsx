import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'JWT Encoder Decoder & Validator Free Online Tool',
  description: 'Free online JWT decoder tool. Decode and validate JSON Web Tokens (JWT), view header, payload, signature. Supports HS256, RS256, ES256 algorithms with real-time decoding.',
  openGraph: {
    title: 'Free JWT Decoder - JSON Web Token Validator & Parser',
    description: 'Decode and validate JWT tokens online. View header, payload, and signature with algorithm support. Real-time JWT analysis for developers and security professionals.',
    url: 'https://easyencoderdecoder.com/jwt-encoder-decoder-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function JWTEncoderDecoderLayout({
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
