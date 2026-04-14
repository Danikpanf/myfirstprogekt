'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useSession } from '@/store/session';

type Order = {
  id: string;
  status: string;
  priceAmount: string;
  currency: string;
  autoConfirmAt: string | null;
  listing: { title: string };
};

export default function OrdersPage() {
  const { user } = useSession();
  const router = useRouter();
  const [buyer, setBuyer] = useState<Order[]>([]);
  const [seller, setSeller] = useState<Order[]>([]);

  const load = () => {
    if (!user) return;
    api<Order[]>('/orders/mine?role=buyer').then(setBuyer).catch(() => setBuyer([]));
    api<Order[]>('/orders/mine?role=seller').then(setSeller).catch(() => setSeller([]));
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    load();
  }, [user, router]);

  const confirm = async (id: string) => {
    await api(`/orders/${id}/confirm`, { method: 'POST', body: '{}' });
    load();
  };

  if (!user) return null;

  const OrderTable = ({ title, items, isBuyer }: { title: string; items: Order[]; isBuyer: boolean }) => (
    <div className="mt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-2">
        {items.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div>
              <div className="font-medium">{o.listing.title}</div>
              <div className="text-sm text-zinc-500">
                {o.status} · {o.priceAmount} {o.currency}
              </div>
              {o.autoConfirmAt && o.status === 'IN_DELIVERY' && (
                <div className="text-xs text-amber-600">
                  Автоподтверждение: {new Date(o.autoConfirmAt).toLocaleString('ru')}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/chat/${o.id}`}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-600"
              >
                Чат
              </Link>
              {isBuyer && o.status === 'IN_DELIVERY' && (
                <button
                  type="button"
                  onClick={() => confirm(o.id)}
                  className="rounded-lg bg-accent px-3 py-1 text-sm text-white"
                >
                  Подтвердить
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-zinc-500">Пусто</p>}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Сделки</h1>
      <OrderTable title="Покупки" items={buyer} isBuyer />
      <OrderTable title="Продажи" items={seller} isBuyer={false} />
    </div>
  );
}
