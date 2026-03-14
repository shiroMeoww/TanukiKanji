import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tanuki Kanji - Learn Japanese',
  description: 'Learn Japanese kanji and vocabulary with spaced repetition',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
