import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Listing = {
  id: string;
  title: string;
  priceAmount: string;
  currency: string;
  game: { name: string };
  seller: { displayName: string; trustScore: string };
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.search) qs.set('search', sp.search);
  if (sp.sort) qs.set('sort', sp.sort);
  const res = await fetch(`${API}/catalog/listings?${qs}`, { next: { revalidate: 30 } });
  const data = res.ok ? ((await res.json()) as { items: Listing[] }) : { items: [] };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Каталог</h1>
      <form className="flex flex-wrap gap-2" action="/catalog" method="get">
        <input
          name="search"
          placeholder="Поиск..."
          defaultValue={sp.search}
          className="min-w-[200px] flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          name="sort"
          defaultValue={sp.sort ?? 'new'}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="new">Новые</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена (убыв.)</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-white"
        >
          Найти
        </button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => (
          <Link
            key={item.id}
            href={`/listing/${item.id}`}
            className="rounded-xl border border-zinc-200 p-4 transition hover:border-accent hover:shadow-md dark:border-zinc-800"
          >
            <div className="text-xs text-zinc-500">{item.game.name}</div>
            <div className="mt-1 font-medium">{item.title}</div>
            <div className="mt-2 text-lg font-semibold text-accent">
              {item.priceAmount} {item.currency}
            </div>
            <div className="mt-2 text-sm text-zinc-500">{item.seller.displayName}</div>
          </Link>
        ))}
      </div>
      {data.items.length === 0 && (
        <p className="text-zinc-500">Нет лотов. Запустите API и seed: npm run db:seed</p>
      )}
    </div>
  );
}
