import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trading Logbook',
  description: 'Shared trading logbook with gamification for accountability',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
