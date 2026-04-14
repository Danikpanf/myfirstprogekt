'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSession } from '@/store/session';
import { clearTokens } from '@/lib/api';
import { useEffect } from 'react';

const nav = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/orders', label: 'Сделки' },
  { href: '/profile', label: 'Профиль' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, setUser } = useSession();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, [setUser]);

  const logout = () => {
    clearTokens();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-semibold tracking-tight text-accent">
            GameMarket
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-1 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                  pathname === item.href ? 'text-accent' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {(user?.role === 'MODERATOR' || user?.role === 'ADMIN') && (
              <Link
                href="/admin"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                  pathname === '/admin' ? 'text-accent' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Админка
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800"
            >
              {theme === 'dark' ? 'Светлая' : 'Тёмная'}
            </button>
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Выйти
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dim"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Escrow · чат · модерация. Демо-платёж mock для разработки.
      </footer>
    </div>
  );
}
