const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/users/${id}/public`, { next: { revalidate: 20 } });
  if (!res.ok) return <p>Пользователь не найден</p>;
  const u = await res.json();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h1 className="text-2xl font-bold">{u.displayName}</h1>
        <p className="text-sm text-zinc-500">
          На сайте с {new Date(u.createdAt).toLocaleDateString('ru')} · доверие {u.trustScore}
          {u.sellerVerified ? ' · верифицирован' : ''}
        </p>
        {u.ratingAvg != null && (
          <p className="mt-2">Рейтинг: {Number(u.ratingAvg).toFixed(1)}</p>
        )}
      </div>
      <div>
        <h2 className="font-semibold">Отзывы</h2>
        <ul className="mt-2 space-y-3">
          {(u.reviews as { id: string; rating: number; text: string; reviewer: { displayName: string } }[]).map(
            (r) => (
              <li key={r.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="text-sm font-medium">{r.reviewer.displayName}</div>
                <div className="text-amber-500">
                  {'★'.repeat(r.rating)}
                  {'\u2606'.repeat(5 - r.rating)}
                </div>
                <p className="mt-1 text-sm">{r.text}</p>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
