'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSession } from '@/store/session';

type Dispute = {
  id: string;
  status: string;
  reasonCode: string;
  order: {
    id: string;
    listing: { title: string };
    buyer: { displayName: string };
    seller: { displayName: string };
  };
};

export default function AdminPage() {
  const { user } = useSession();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'MODERATOR' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    api<Dispute[]>('/admin/disputes')
      .then(setDisputes)
      .catch(() => setErr('Нет доступа'));
    if (user.role === 'ADMIN') {
      api<Record<string, number>>('/admin/analytics/summary').then(setSummary).catch(() => undefined);
    }
  }, [user, router]);

  const resolve = async (id: string, resolution: 'BUYER' | 'SELLER') => {
    await api(`/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution, note: 'Решение модератора (демо)' }),
    });
    setDisputes((d) => d.filter((x) => x.id !== id));
  };

  if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Админка</h1>
      {err && <p className="text-red-500">{err}</p>}
      {summary && (
        <div className="grid gap-2 sm:grid-cols-4">
          {Object.entries(summary).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-xs uppercase text-zinc-500">{k}</div>
              <div className="text-2xl font-bold">{v}</div>
            </div>
          ))}
        </div>
      )}
      <section>
        <h2 className="text-lg font-semibold">Споры</h2>
        <div className="mt-2 space-y-2">
          {disputes.map((d) => (
            <div key={d.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="font-medium">{d.order.listing.title}</div>
              <div className="text-sm text-zinc-500">
                {d.order.buyer.displayName} ↔ {d.order.seller.displayName} · {d.reasonCode} · {d.status}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => resolve(d.id, 'BUYER')}
                  className="rounded-lg bg-amber-600 px-3 py-1 text-sm text-white"
                >
                  В пользу покупателя
                </button>
                <button
                  type="button"
                  onClick={() => resolve(d.id, 'SELLER')}
                  className="rounded-lg bg-accent px-3 py-1 text-sm text-white"
                >
                  В пользу продавца
                </button>
              </div>
            </div>
          ))}
          {disputes.length === 0 && <p className="text-sm text-zinc-500">Нет открытых споров</p>}
        </div>
      </section>
    </div>
  );
}
