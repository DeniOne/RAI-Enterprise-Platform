
import { PrismaClient } from '@rai/prisma-client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const correctId = '441610858';
  const email = 'admin@example.com';

  console.log(`Setting Telegram ID to ${correctId} for ${email}`);

  // 1. Ensure Default Company exists
  const company = await prisma.company.upsert({
    where: { id: 'default-rai-company' },
    update: {},
    create: {
      id: 'default-rai-company',
      name: 'RAI Enterprise',
    },
  });

  const updated = await prisma.user.upsert({
    where: { email },
    update: {
      telegramId: correctId,
      company: { connect: { id: company.id } }
    },
    create: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      telegramId: correctId,
      company: { connect: { id: company.id } },
    },
  });

  console.log(`✅ Success: ${updated.email} linked to ${updated.telegramId}`);
}

main()
  .catch(e => console.error('Script Error:', e))
  .finally(() => prisma.$disconnect());
