import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Password Generator Free Online Secure Random Client Side Password Generator Tool',
  description: 'Free online password generator tool with entropy, crack time, and passphrase support. Create strong, secure random passwords with customizable length, characters, and symbols.',
  openGraph: {
    title: 'Free Password Generator - Secure Random Password Creator',
    description: 'Generate strong, secure passwords online. Customizable length and character sets with password strength analysis. Create multiple unique passwords for better security.',
    url: 'https://easyencoderdecoder.com/password-generator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PasswordGeneratorLayout({
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
