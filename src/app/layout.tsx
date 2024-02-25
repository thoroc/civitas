import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from './components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={inter.className}>
        <Navbar
          brandName="IMBC"
          navItems={[
            { text: 'Chamber Composition', href: 'parliament' },
            { text: 'Election Map', href: 'constituency' },
            { text: 'cat', href: 'cat' },
          ]}
        ></Navbar>
        <main className="">{children}</main>
      </body>
    </html>
  );
}
