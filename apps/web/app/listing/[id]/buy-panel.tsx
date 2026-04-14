'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/store/session';
import { api } from '@/lib/api';
import { useState } from 'react';

export function BuyPanel({ listingId, sellerId }: { listingId: string; sellerId: string }) {
  const { user } = useSession();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    setErr(null);
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.id === sellerId) {
      setErr('Это ваш лот');
      return;
    }
    setLoading(true);
    try {
      const order = await api<{ id: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({ listingId }),
      });
      await api(`/payments/mock/${order.id}`, { method: 'POST', body: '{}' });
      router.push(`/orders`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {err && <p className="text-sm text-red-500">{err}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={buy}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-dim disabled:opacity-50"
      >
        {loading ? '…' : 'Купить (демо-оплата)'}
      </button>
      <p className="text-xs text-zinc-500">
        В демо сразу вызывается mock-оплата и открывается сделка. В проде — реальный платёж.
      </p>
    </div>
  );
}
