import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobLeak | Stop leaking local jobs to competitors',
  description:
    'JobLeak helps roofers, HVAC companies, plumbers, and home-service businesses find missed local searches, competitor gaps, review gaps, and fixes that win more calls.',
  openGraph: {
    title: 'JobLeak | Stop leaking local jobs to competitors',
    description:
      'Get a free local growth scan and see where competitors are stealing jobs you should be winning.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
