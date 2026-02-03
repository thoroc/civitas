import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

export const dynamic = 'force-static';
import { Navbar } from './components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Civitas – Democratic Insights',
  description: 'Visual exploration of parliamentary data and election insights',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' data-theme='civitas'>
      <body className={inter.className}>
        <Navbar
          brandName='Civitas'
          navItems={[
            { text: 'Chamber', href: 'parliament' },
            { text: 'Elections', href: 'constituency' },
            { text: 'Cat', href: 'cat' },
          ]}
        />
        <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6'>
          {children}
        </main>
      </body>
    </html>
  );
}
