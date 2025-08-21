import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'SSH Key Generator Online Free SSH Key Pair Generator Tool',
  description: 'Free online SSH key generator. Create secure SSH key pairs (RSA, DSA, ECDSA, Ed25519) for server authentication, GitHub, AWS, and remote access. Client-side processing.',
  openGraph: {
    title: 'SSH Key Generator Online - Free SSH Key Pair Generator Tool',
    description: 'Free online SSH key generator. Create secure SSH key pairs (RSA, DSA, ECDSA, Ed25519) for server authentication, GitHub, AWS, and remote access. Client-side processing.',
    url: 'https://easyencoderdecoder.com/ssh-key-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SSHKeyGeneratorLayout({
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
