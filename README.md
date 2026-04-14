# GameMarket — маркетплейс цифровых игровых товаров

Монорепозиторий без npm workspaces (на Windows без symlink): отдельные `node_modules` в `apps/api` и `apps/web`.

## Быстрый старт (локально)

1. Поднимите PostgreSQL и Redis (например `docker compose up -d postgres redis`).
2. Скопируйте переменные из `.env.example` в `apps/api/.env` и `apps/web/.env.local`.
3. Установите зависимости и схему БД:

```bash
npm install --prefix apps/api
npm install --prefix apps/web
npm install
cd apps/api && npx prisma generate && npx prisma db push && npx prisma db seed
```

4. Запуск:

```bash
npm run dev
```

- Фронт: http://localhost:3000  
- API: http://localhost:3001  
- После seed: `admin@marketplace.local` / `Admin12345!`, продавец `seller@marketplace.local` / `Seller12345!`

## Docker (всё вместе)

```bash
docker compose up --build
```

API при старте выполняет `prisma db push`. Для первичных данных выполните seed вручную в контейнере API или локально с `DATABASE_URL` на контейнер.

## Что реализовано (MVP)

- Регистрация, вход, JWT + refresh, brute-force lock через Redis  
- Каталог, карточка лота, демо-оплата (`POST /payments/mock/:orderId`)  
- Escrow: статусы, автоподтверждение по таймеру, спор, арбитраж в админке  
- Чат по сделке: REST + Socket.IO (`join`, `chat.message`, `message.created`)  
- Отзывы после завершения сделки  
- Админка: споры, пользователи, аналитика (ADMIN)  
- PWA manifest, тёмная/светлая тема  

Дальше: реальные платежи (webhook), OAuth, 2FA, загрузка файлов в S3, очереди, полнотекстовый поиск.
