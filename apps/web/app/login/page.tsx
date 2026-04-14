'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setTokens } from '@/lib/api';
import { useSession } from '@/store/session';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string | null; displayName: string; role: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        auth: false,
      });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      router.push('/catalog');
    } catch (e) {
      setErr('Неверный email или пароль');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Вход</h1>
      <form onSubmit={submit} className="space-y-4">
        {err && <p className="text-sm text-red-500">{err}</p>}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Email"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Пароль"
        />
        <button type="submit" className="w-full rounded-xl bg-accent py-2 font-medium text-white">
          Войти
        </button>
      </form>
      <p className="text-sm text-zinc-500">
        Нет аккаунта? <Link href="/register" className="text-accent">Регистрация</Link>
      </p>
      <p className="text-xs text-zinc-400">
        Демо: admin@marketplace.local / Admin12345!
      </p>
    </div>
  );
}
