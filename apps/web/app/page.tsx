import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Маркетплейс игровых товаров с безопасной сделкой
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Аккаунты, валюта, услуги и предметы. Деньги замораживаются до подтверждения — как на крупных
          площадках.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-dim"
          >
            В каталог
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 font-medium dark:border-zinc-700"
          >
            Регистрация
          </Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Escrow', 'Автоподтверждение и споры с арбитражем'],
          ['Чат', 'Переписка по сделке в реальном времени'],
          ['Репутация', 'Отзывы только после завершённых заказов'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
