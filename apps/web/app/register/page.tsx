'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setTokens } from '@/lib/api';
import { useSession } from '@/store/session';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
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
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, displayName, password }),
        auth: false,
      });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      router.push('/catalog');
    } catch {
      setErr('Не удалось зарегистрироваться (email занят?)');
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Регистрация</h1>
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
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Имя"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Пароль (мин. 8 символов)"
        />
        <button type="submit" className="w-full rounded-xl bg-accent py-2 font-medium text-white">
          Создать аккаунт
        </button>
      </form>
      <p className="text-sm text-zinc-500">
        Уже есть аккаунт? <Link href="/login" className="text-accent">Войти</Link>
      </p>
    </div>
  );
}
