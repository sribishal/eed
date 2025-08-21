import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'RSA Key Generator Online Free RSA Public Private Key Generator',
  description: 'Free online RSA key generator. Create secure RSA public-private key pairs with 1024, 2048, 4096-bit encryption. Client-side processing.',
  openGraph: {
    title: 'RSA Key Generator Online - Free RSA Public Private Key Generator',
    description: 'Free online RSA key generator. Create secure RSA public-private key pairs with 1024, 2048, 4096-bit encryption. Client-side processing.',
    url: 'https://easyencoderdecoder.com/rsa-encrypt-decrypt-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RSAEncryptDecryptToolLayout({
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
