'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSession } from '@/store/session';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    api<Record<string, unknown>>('/users/me')
      .then(setData)
      .catch(() => setData(null));
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мой профиль</h1>
      {data ? (
        <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <p className="text-lg font-semibold">{String(data.displayName)}</p>
          <p className="text-zinc-500">{String(data.email ?? '')}</p>
          <p className="mt-4 text-sm">Роль: {String(data.role)}</p>
          <p className="text-sm">Сделок: {String((data as { dealsCount?: number }).dealsCount ?? '—')}</p>
          <p className="text-sm">Доверие: {String(data.trustScore)}</p>
          <Link href={`/profile/${user.id}`} className="mt-4 inline-block text-accent">
            Публичная страница →
          </Link>
        </div>
      ) : (
        <p>Загрузка…</p>
      )}
    </div>
  );
}
