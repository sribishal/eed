import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Morse Code Translator Free Online Text to Morse Code & Morse to Text Converter',
  description: 'Free online Morse Code translator tool. Convert text to Morse code and Morse code to text instantly with audio playback and International Morse Code support.',
  openGraph: {
    title: 'Free Morse Code Translator - Text ⟷ Morse Converter',
    description: 'Convert text to Morse code and decode Morse back to text. Supports International Morse Code with real-time translation and audio playback.',
    url: 'https://easyencoderdecoder.com/morse-code-translator-online',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MorseCodeTranslatorLayout({
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
