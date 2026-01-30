import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting OFS seeding...');

    // 1. Seed Hierarchy Levels
    const levels = [
        { number: 1, name: 'Founders Council', nameRu: 'Совет учредителей' },
        { number: 2, name: 'Board of Directors', nameRu: 'Совет директоров' },
        { number: 3, name: 'Management AI', nameRu: 'Цифровые сотрудники уровня управления (MatrixGin)' },
        { number: 4, name: 'Departments', nameRu: 'Департаменты' },
        { number: 5, name: 'Divisions', nameRu: 'Отделы' },
        { number: 6, name: 'Functions and Roles', nameRu: 'Функции и Должности' },
        { number: 7, name: 'Operational AI', nameRu: 'Цифровые сотрудники операционного уровня' },
    ];

    for (const level of levels) {
        await prisma.orgHierarchyLevel.upsert({
            where: { level_number: level.number },
            update: {
                level_name: level.name,
                level_name_ru: level.nameRu,
            },
            create: {
                level_number: level.number,
                level_name: level.name,
                level_name_ru: level.nameRu,
            },
        });
    }
    console.log('Hierarchy levels seeded.');

    // 2. Seed Locations
    const locations = [
        { name: 'Центральный офис', city: 'Москва', address: 'ул. Тверская, 1' },
        { name: 'Фотостудия "Матрица"', city: 'Москва', address: 'ул. Арбат, 10' },
    ];

    for (const loc of locations) {
        await prisma.location.upsert({
            where: { name: loc.name },
            update: {
                city: loc.city,
                address: loc.address,
            },
            create: {
                name: loc.name,
                city: loc.city,
                address: loc.address,
            },
        });
    }
    console.log('Locations seeded.');

    // 3. Seed Positions
    const positions = [
        { name: 'Фотограф' },
        { name: 'Менеджер по продажам' },
        { name: 'Руководитель департамента' },
        { name: 'Администратор' },
    ];

    for (const pos of positions) {
        await prisma.position.upsert({
            where: { name: pos.name },
            update: {},
            create: { name: pos.name },
        });
    }
    console.log('Positions seeded.');

    // 4. Seed Departments (Level 4)
    const departments = [
        { name: 'ДЕПАРТАМЕНТ ПОСТРОЕНИЯ ОРГАНИЗАЦИИ', code: 'D1' },
        { name: 'КОММЕРЧЕСКИЙ ДЕПАРТАМЕНТ', code: 'D2' },
        { name: 'ФИНАНСОВЫЙ ДЕПАРТАМЕНТ', code: 'D3' },
        { name: 'ПРОИЗВОДСТВЕННЫЙ ДЕПАРТАМЕНТ', code: 'D4' },
        { name: 'ДЕПАРТАМЕНТ КВАЛИФИКАЦИИ', code: 'D5' },
        { name: 'ДЕПАРТАМЕНТ РАЗВИТИЯ', code: 'D6' },
    ];

    for (const dept of departments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: {
                name: dept.name,
                hierarchy_level: 4,
            },
            create: {
                name: dept.name,
                code: dept.code,
                hierarchy_level: 4,
            },
        });
    }
    console.log('Departments seeded.');

    console.log('OFS seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
