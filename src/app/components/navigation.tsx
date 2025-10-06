'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NavItemProps {
  text: string;
  href: string;
}
interface NavbarProps {
  brandName: string;
  navItems?: NavItemProps[];
}

export const Navbar = (props: NavbarProps) => {
  const text = props.brandName ?? 'Civitas';
  const pathname = usePathname();
  const [theme, setTheme] = useState<'civitas' | 'civitas-dark'>('civitas');

  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored === 'civitas-dark' || stored === 'civitas') setTheme(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('theme', theme);
      } catch {}
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme(t => (t === 'civitas' ? 'civitas-dark' : 'civitas'));

  return (
    <div className='navbar bg-base-100/90 border-b border-base-300 backdrop-blur supports-[backdrop-filter]:bg-base-100/70'>
      <div className='max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6'>
        <a className='font-semibold text-primary text-lg' href='/'>
          {text}
        </a>
        <nav className='flex items-center gap-1' aria-label='Main navigation'>
          {props.navItems?.map((item, index) => {
            const active = pathname === `/${item.href}`;
            return (
              <a
                key={index}
                href={`/${item.href}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-content shadow-sm' : 'text-neutral/70 hover:text-neutral hover:bg-base-200/70'}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.text}
              </a>
            );
          })}
        </nav>
        <div className='ml-auto flex items-center gap-2'>
          <button
            type='button'
            onClick={toggleTheme}
            className='btn btn-xs gap-1'
            aria-label='Toggle color theme'
          >
            {theme === 'civitas' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>
    </div>
  );
};
