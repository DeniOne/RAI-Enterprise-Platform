import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Очистка базы данных ---');

    // Удаляем историю шагов
    const deletedHistory = await prisma.registrationStepHistory.deleteMany({});
    console.log(`Удалено записей истории шагов: ${deletedHistory.count}`);

    // Удаляем заявки
    const deletedRequests = await prisma.employeeRegistrationRequest.deleteMany({});
    console.log(`Удалено заявок на регистрацию: ${deletedRequests.count}`);

    // Удаляем пользователей, кроме ADMIN
    // Если у нас несколько админов, оставим того, кто был создан первым (обычно это суперюзер)
    const users = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        orderBy: { created_at: 'asc' }
    });

    if (users.length === 0) {
        console.log('⚠️ Админы не найдены!');
    } else {
        const superUserId = users[0].id;
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                id: { not: superUserId }
            }
        });
        console.log(`Оставлен суперюзер: ${users[0].email}`);
        console.log(`Удалено прочих пользователей: ${deletedUsers.count}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
