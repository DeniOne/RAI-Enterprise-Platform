
import { PrismaClient } from '@prisma/client';

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
  
  const updated = await prisma.user.upsert({
    where: { email },
    update: { telegramId: correctId },
    create: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      telegramId: correctId,
    },
  });
  
  console.log(`✅ Success: ${updated.email} linked to ${updated.telegramId}`);
}

main()
  .catch(e => console.error('Script Error:', e))
  .finally(() => prisma.$disconnect());
