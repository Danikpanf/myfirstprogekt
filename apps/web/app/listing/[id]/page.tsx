import Link from 'next/link';
import { BuyPanel } from './buy-panel';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/listings/${id}`, { next: { revalidate: 15 } });
  if (!res.ok) {
    return <p className="text-red-500">Лот не найден</p>;
  }
  const listing = await res.json();

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="text-sm text-zinc-500">
          {listing.game.name} · {listing.category.name} · {listing.subcategory.name}
        </div>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{listing.description}</p>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold">Продавец</h2>
          <Link href={`/profile/${listing.seller.id}`} className="mt-2 block text-accent hover:underline">
            {listing.seller.displayName}
          </Link>
          <p className="text-sm text-zinc-500">
            Доверие: {listing.seller.trustScore}
            {listing.seller.sellerVerified ? ' · верифицирован' : ''}
          </p>
          {listing.sellerRatingAvg != null && (
            <p className="text-sm">Средняя оценка: {listing.sellerRatingAvg.toFixed(1)}</p>
          )}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="text-3xl font-bold text-accent">
            {listing.priceAmount} {listing.currency}
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Срок: до {listing.deliveryTimeHours} ч.
          </p>
          <BuyPanel listingId={listing.id} sellerId={listing.seller.id} />
        </div>
      </aside>
    </div>
  );
}
