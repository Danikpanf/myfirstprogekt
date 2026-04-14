import { PrismaClient, UserRole, CategoryKind } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin12345!', 11);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.local' },
    update: {},
    create: {
      email: 'admin@marketplace.local',
      displayName: 'Администратор',
      passwordHash,
      role: UserRole.ADMIN,
      referralCode: 'ADMIN1',
    },
  });

  const mod = await prisma.user.upsert({
    where: { email: 'mod@marketplace.local' },
    update: {},
    create: {
      email: 'mod@marketplace.local',
      displayName: 'Модератор',
      passwordHash,
      role: UserRole.MODERATOR,
      referralCode: 'MOD001',
    },
  });

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, balance: 0, currency: 'RUB' },
    update: {},
  });
  await prisma.wallet.upsert({
    where: { userId: mod.id },
    create: { userId: mod.id, balance: 0, currency: 'RUB' },
    update: {},
  });

  const game = await prisma.game.upsert({
    where: { slug: 'dota-2' },
    update: {},
    create: { slug: 'dota-2', name: 'Dota 2', isActive: true },
  });

  const catAcc = await prisma.category.upsert({
    where: { gameId_slug: { gameId: game.id, slug: 'accounts' } },
    update: {},
    create: {
      gameId: game.id,
      slug: 'accounts',
      name: 'Аккаунты',
      kind: CategoryKind.ACCOUNT,
    },
  });

  const sub = await prisma.subcategory.upsert({
    where: { categoryId_slug: { categoryId: catAcc.id, slug: 'high-mmr' } },
    update: {},
    create: {
      categoryId: catAcc.id,
      slug: 'high-mmr',
      name: 'Высокий MMR',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@marketplace.local' },
    update: { sellerVerified: true },
    create: {
      email: 'seller@marketplace.local',
      displayName: 'Демо Продавец',
      passwordHash: await bcrypt.hash('Seller12345!', 11),
      sellerVerified: true,
      referralCode: 'SELL01',
    },
  });

  await prisma.wallet.upsert({
    where: { userId: seller.id },
    create: { userId: seller.id, balance: 0, currency: 'RUB' },
    update: {},
  });

  await prisma.listing.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      sellerId: seller.id,
      gameId: game.id,
      categoryId: catAcc.id,
      subcategoryId: sub.id,
      title: 'Аккаунт 6000 MMR, полный доступ',
      description: 'Чистый аккаунт, без бана. Передача через семью Steam.',
      priceAmount: 2499,
      currency: 'RUB',
      deliveryTimeHours: 12,
      status: 'ACTIVE',
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'first-deal' },
    update: {},
    create: {
      slug: 'first-deal',
      name: 'Первая сделка',
      description: 'Завершите первую покупку или продажу',
    },
  });

  await prisma.achievement.upsert({
    where: { slug: 'trusted-seller' },
    update: {},
    create: {
      slug: 'trusted-seller',
      name: 'Надёжный продавец',
      description: '10 успешных сделок подряд',
    },
  });

  console.log('Seed OK. admin@marketplace.local / Admin12345!');
  console.log('seller@marketplace.local / Seller12345!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
