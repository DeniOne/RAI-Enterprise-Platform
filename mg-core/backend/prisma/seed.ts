import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
        where: { email: 'admin@photomatrix.ru' }
    });

    if (!existingAdmin) {
        // Create Admin user
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        const adminUser = await prisma.user.create({
            data: {
                email: 'admin@photomatrix.ru',
                password_hash: hashedPassword,
                first_name: 'System',
                last_name: 'Administrator',
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });

        console.log('✅ Admin user created:', adminUser.email);

        // Create Employee record for Admin
        const adminEmployee = await prisma.employee.create({
            data: {
                user_id: adminUser.id,
                position: 'System Administrator',
                employee_number: 'ADM-001',
                status: 'UNIVERSE',
                rank: 'MAGNATE',
                hired_at: new Date(),
                mc_balance: 10000,
                gmc_balance: 1000
            }
        });

        console.log('✅ Admin employee record created');

        // Create Wallet for Admin
        await prisma.wallet.create({
            data: {
                user_id: adminUser.id,
                mc_balance: 10000,
                gmc_balance: 1000
            }
        });

        console.log('✅ Admin wallet created');
    } else {
        console.log('✅ Admin user already exists');
    }

    // Create 7 Academies for Corporate University (if not exist)
    const existingAcademies = await prisma.academy.count();

    if (existingAcademies === 0) {
        const academies = [
            {
                name: 'PhotoCraft Academy',
                description: 'Техника съемки, свет, композиция, обработка'
            },
            {
                name: 'Sales Excellence Academy',
                description: 'Психология продаж, переговоры, кросс-продажи'
            },
            {
                name: 'Service & Customer Care Academy',
                description: 'Сервис, работа с клиентами, решение конфликтов'
            },
            {
                name: 'Values & Culture Academy',
                description: 'Миссия, этика, командная работа'
            },
            {
                name: 'Soft Skills Academy',
                description: 'Эмоциональный интеллект, тайм-менеджмент, коммуникации'
            },
            {
                name: 'Equipment & Tech Academy',
                description: 'Оборудование, ПО, IT-безопасность'
            },
            {
                name: 'Leadership & Management Academy',
                description: 'Управление, финансы, стратегия'
            }
        ];

        for (const academy of academies) {
            await prisma.academy.create({
                data: academy
            });
        }

        console.log('✅ Created 7 academies for Corporate University');
    } else {
        console.log('✅ Academies already exist');
    }

    // ==========================================================================
    // PHASE 0.2 - Seed Roles and RoleContracts
    // Canon: Нет роли без контракта
    // ==========================================================================

    const existingRoles = await prisma.role.count();

    if (existingRoles === 0) {
        console.log('\n📋 Creating Roles and RoleContracts (Phase 0.2)...');

        const effectiveFrom = new Date('2026-01-01T00:00:00.000Z');

        // Role 1: Фотограф
        const photographerRole = await prisma.role.create({
            data: {
                name: 'Фотограф',
                code: 'PHOTOGRAPHER',
                description: 'Специалист по фотосъёмке',
                is_active: true
            }
        });

        await prisma.roleContract.create({
            data: {
                role_id: photographerRole.id,
                mission: 'Создавать качественные фотографии, которые превышают ожидания клиентов',
                value_product: 'Готовые фотосессии с высоким уровнем удовлетворённости клиентов (NPS > 80)',
                responsibility_zones: [
                    'Проведение фотосессий согласно расписанию',
                    'Качество снимков и соблюдение стандартов',
                    'Коммуникация с клиентом во время съёмки',
                    'Своевременная передача материалов на ретушь'
                ],
                kpi_definitions: [
                    {
                        name: 'Количество сессий в день',
                        formula: 'COUNT(sessions WHERE date = today AND photographer_id = user_id)',
                        target: 8,
                        threshold_warning: 6,
                        threshold_critical: 4,
                        unit: 'сессий',
                        calculation_period: 'daily'
                    },
                    {
                        name: 'Процент качественных снимков',
                        formula: 'COUNT(photos WHERE quality_score >= 4) / COUNT(photos) * 100',
                        target: 95,
                        threshold_warning: 90,
                        threshold_critical: 85,
                        unit: '%',
                        calculation_period: 'weekly'
                    }
                ],
                permissions: [
                    { resource: 'sessions', actions: ['read', 'update'] },
                    { resource: 'photos', actions: ['create', 'read'] }
                ],
                growth_paths: [
                    {
                        from_level: 1,
                        to_level: 2,
                        requirements: ['3 месяца опыта', 'NPS > 85', 'Пройден курс Studio Lighting'],
                        estimated_duration_months: 3
                    }
                ],
                version: 1,
                is_active: true,
                effective_from: effectiveFrom
            }
        });

        console.log('  ✅ Created Role: Фотограф + RoleContract');

        // Role 2: Ретушер
        const retoucherRole = await prisma.role.create({
            data: {
                name: 'Ретушёр',
                code: 'RETOUCHER',
                description: 'Специалист по обработке фотографий',
                is_active: true
            }
        });

        await prisma.roleContract.create({
            data: {
                role_id: retoucherRole.id,
                mission: 'Обеспечивать высококачественную обработку фотографий в установленные сроки',
                value_product: 'Обработанные фотографии, готовые к печати, в срок до 24 часов',
                responsibility_zones: [
                    'Обработка фотографий согласно стандартам качества',
                    'Соблюдение сроков обработки',
                    'Коммуникация с фотографом по спорным снимкам',
                    'Передача готовых материалов на печать'
                ],
                kpi_definitions: [
                    {
                        name: 'Среднее время обработки сессии',
                        formula: 'AVG(retouch_completed_at - retouch_started_at)',
                        target: 120,
                        threshold_warning: 180,
                        threshold_critical: 240,
                        unit: 'минут',
                        calculation_period: 'daily'
                    },
                    {
                        name: 'Количество обработанных сессий',
                        formula: 'COUNT(sessions WHERE retoucher_id = user_id AND status = RETOUCHED)',
                        target: 10,
                        threshold_warning: 7,
                        threshold_critical: 5,
                        unit: 'сессий',
                        calculation_period: 'daily'
                    }
                ],
                permissions: [
                    { resource: 'sessions', actions: ['read', 'update'] },
                    { resource: 'photos', actions: ['read', 'update'] }
                ],
                growth_paths: [
                    {
                        from_level: 1,
                        to_level: 2,
                        requirements: ['6 месяцев опыта', 'Среднее время < 100 мин', 'Пройден курс Advanced Retouching'],
                        estimated_duration_months: 6
                    }
                ],
                version: 1,
                is_active: true,
                effective_from: effectiveFrom
            }
        });

        console.log('  ✅ Created Role: Ретушёр + RoleContract');

        // Role 3: Помощник
        const assistantRole = await prisma.role.create({
            data: {
                name: 'Помощник',
                code: 'ASSISTANT',
                description: 'Специалист по печати и подготовке материалов',
                is_active: true
            }
        });

        await prisma.roleContract.create({
            data: {
                role_id: assistantRole.id,
                mission: 'Обеспечивать качественную печать и своевременную подготовку материалов к выдаче',
                value_product: 'Готовые печатные материалы без брака, переданные продавцу в срок',
                responsibility_zones: [
                    'Печать фотографий согласно заказу',
                    'Контроль качества печати',
                    'Подготовка материалов к выдаче',
                    'Уход за печатным оборудованием'
                ],
                kpi_definitions: [
                    {
                        name: 'Количество напечатанных заказов',
                        formula: 'COUNT(orders WHERE printer_id = user_id AND status = PRINTED)',
                        target: 15,
                        threshold_warning: 10,
                        threshold_critical: 7,
                        unit: 'заказов',
                        calculation_period: 'daily'
                    },
                    {
                        name: 'Процент брака',
                        formula: 'COUNT(orders WHERE has_defect = true) / COUNT(orders) * 100',
                        target: 1,
                        threshold_warning: 3,
                        threshold_critical: 5,
                        unit: '%',
                        calculation_period: 'weekly'
                    }
                ],
                permissions: [
                    { resource: 'orders', actions: ['read', 'update'] },
                    { resource: 'equipment', actions: ['read'] }
                ],
                growth_paths: [
                    {
                        from_level: 1,
                        to_level: 2,
                        requirements: ['3 месяца опыта', 'Брак < 1%', 'Пройден курс Equipment Maintenance'],
                        estimated_duration_months: 3
                    }
                ],
                version: 1,
                is_active: true,
                effective_from: effectiveFrom
            }
        });

        console.log('  ✅ Created Role: Помощник + RoleContract');

        // Role 4: Продавец
        const sellerRole = await prisma.role.create({
            data: {
                name: 'Продавец',
                code: 'SELLER',
                description: 'Специалист по продажам и работе с клиентами',
                is_active: true
            }
        });

        await prisma.roleContract.create({
            data: {
                role_id: sellerRole.id,
                mission: 'Обеспечивать максимальную выручку и удовлетворённость клиентов при выдаче заказов',
                value_product: 'Выполненные продажи с чеком выше плана и NPS > 90',
                responsibility_zones: [
                    'Выдача готовых заказов клиентам',
                    'Допродажи и кросс-продажи',
                    'Работа с возражениями',
                    'Сбор обратной связи от клиентов'
                ],
                kpi_definitions: [
                    {
                        name: 'Средний чек',
                        formula: 'SUM(order_total) / COUNT(orders) WHERE seller_id = user_id',
                        target: 5000,
                        threshold_warning: 4000,
                        threshold_critical: 3000,
                        unit: 'руб',
                        calculation_period: 'daily'
                    },
                    {
                        name: 'Конверсия в допродажу',
                        formula: 'COUNT(orders WHERE upsell = true) / COUNT(orders) * 100',
                        target: 40,
                        threshold_warning: 30,
                        threshold_critical: 20,
                        unit: '%',
                        calculation_period: 'weekly'
                    }
                ],
                permissions: [
                    { resource: 'orders', actions: ['read', 'update'] },
                    { resource: 'clients', actions: ['read', 'update'] },
                    { resource: 'payments', actions: ['create', 'read'] }
                ],
                growth_paths: [
                    {
                        from_level: 1,
                        to_level: 2,
                        requirements: ['6 месяцев опыта', 'Средний чек > 6000', 'Пройден курс Sales Excellence'],
                        estimated_duration_months: 6
                    }
                ],
                version: 1,
                is_active: true,
                effective_from: effectiveFrom
            }
        });

        console.log('  ✅ Created Role: Продавец + RoleContract');

        // Role 5: Администратор
        const adminRole = await prisma.role.create({
            data: {
                name: 'Администратор',
                code: 'BRANCH_ADMIN',
                description: 'Администратор филиала',
                is_active: true
            }
        });

        await prisma.roleContract.create({
            data: {
                role_id: adminRole.id,
                mission: 'Обеспечивать эффективную работу филиала и достижение плановых показателей',
                value_product: 'Филиал, работающий без сбоев с выполнением плана > 100%',
                responsibility_zones: [
                    'Управление сменами и расписанием',
                    'Контроль выполнения KPI сотрудников',
                    'Решение оперативных проблем',
                    'Отчётность перед руководством'
                ],
                kpi_definitions: [
                    {
                        name: 'Выполнение плана филиала',
                        formula: 'SUM(branch_revenue) / branch_plan * 100',
                        target: 105,
                        threshold_warning: 95,
                        threshold_critical: 85,
                        unit: '%',
                        calculation_period: 'monthly'
                    },
                    {
                        name: 'Средний NPS филиала',
                        formula: 'AVG(nps_score) WHERE branch_id = user_branch_id',
                        target: 85,
                        threshold_warning: 75,
                        threshold_critical: 65,
                        unit: 'points',
                        calculation_period: 'monthly'
                    }
                ],
                permissions: [
                    { resource: 'employees', actions: ['read', 'update'] },
                    { resource: 'shifts', actions: ['create', 'read', 'update', 'delete'] },
                    { resource: 'reports', actions: ['read'] },
                    { resource: 'orders', actions: ['read'] }
                ],
                growth_paths: [
                    {
                        from_level: 1,
                        to_level: 2,
                        requirements: ['12 месяцев опыта', 'План > 110%', 'Пройден курс Leadership'],
                        estimated_duration_months: 12
                    }
                ],
                version: 1,
                is_active: true,
                effective_from: effectiveFrom
            }
        });

        console.log('  ✅ Created Role: Администратор + RoleContract');

        console.log('✅ Phase 0.2: All 5 Roles and RoleContracts created');
    } else {
        console.log('✅ Roles already exist');
    }

    // ==========================================================================
    // PHASE 0.3 - Seed Canonical Events
    // Canon: События — единственный источник фактов
    // Canon: Каждому EventType соответствует строго один canonical payload
    // ==========================================================================

    const existingEvents = await prisma.event.count();

    if (existingEvents === 0) {
        console.log('\n📋 Creating Canonical Events (Phase 0.3)...');

        // Get photographer role for events
        const photographerRole = await prisma.role.findFirst({
            where: { code: 'PHOTOGRAPHER' }
        });

        // Get admin user for events
        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@photomatrix.ru' }
        });

        if (photographerRole && adminUser) {
            const shiftId1 = '11111111-1111-1111-1111-111111111111';
            const shiftId2 = '22222222-2222-2222-2222-222222222222';
            const branchId = '33333333-3333-3333-3333-333333333333';

            // Event 1: SHIFT_STARTED (shift 1)
            await prisma.event.create({
                data: {
                    type: 'SHIFT_STARTED',
                    source: 'system',
                    subject_id: adminUser.id,
                    subject_type: 'user',
                    payload: {
                        shift_id: shiftId1,
                        user_id: adminUser.id,
                        role_id: photographerRole.id,
                        branch_id: branchId,
                        planned_start: '2026-01-09T09:00:00.000Z',
                        actual_start: '2026-01-09T09:05:00.000Z',
                        planned_end: '2026-01-09T18:00:00.000Z'
                    },
                    metadata: { test_seed: true },
                    timestamp: new Date('2026-01-09T09:05:00.000Z')
                }
            });

            // Event 2: SHIFT_COMPLETED (shift 1)
            await prisma.event.create({
                data: {
                    type: 'SHIFT_COMPLETED',
                    source: 'system',
                    subject_id: adminUser.id,
                    subject_type: 'user',
                    payload: {
                        shift_id: shiftId1,
                        user_id: adminUser.id,
                        role_id: photographerRole.id,
                        branch_id: branchId,
                        actual_end: '2026-01-09T18:15:00.000Z',
                        duration_minutes: 550,
                        plan: {
                            sessions_count: 8,
                            revenue: 40000
                        },
                        fact: {
                            sessions_count: 9,
                            revenue: 45000,
                            nps_average: 8.5
                        },
                        problems: ['Задержка клиента на 15 минут'],
                        improvements: ['Подготовить запасной комплект освещения'],
                        conclusions: 'Смена прошла хорошо, план перевыполнен'
                    },
                    metadata: { test_seed: true },
                    timestamp: new Date('2026-01-09T18:15:00.000Z')
                }
            });

            // Event 3: SHIFT_STARTED (shift 2)
            await prisma.event.create({
                data: {
                    type: 'SHIFT_STARTED',
                    source: 'system',
                    subject_id: adminUser.id,
                    subject_type: 'user',
                    payload: {
                        shift_id: shiftId2,
                        user_id: adminUser.id,
                        role_id: photographerRole.id,
                        branch_id: branchId,
                        planned_start: '2026-01-10T09:00:00.000Z',
                        actual_start: '2026-01-10T08:55:00.000Z',
                        planned_end: '2026-01-10T18:00:00.000Z'
                    },
                    metadata: { test_seed: true },
                    timestamp: new Date('2026-01-10T08:55:00.000Z')
                }
            });

            // Event 4: SHIFT_COMPLETED (shift 2)
            await prisma.event.create({
                data: {
                    type: 'SHIFT_COMPLETED',
                    source: 'system',
                    subject_id: adminUser.id,
                    subject_type: 'user',
                    payload: {
                        shift_id: shiftId2,
                        user_id: adminUser.id,
                        role_id: photographerRole.id,
                        branch_id: branchId,
                        actual_end: '2026-01-10T18:00:00.000Z',
                        duration_minutes: 545,
                        plan: {
                            sessions_count: 8,
                            revenue: 40000
                        },
                        fact: {
                            sessions_count: 7,
                            revenue: 35000,
                            nps_average: 9.0
                        },
                        conclusions: 'Одна сессия отменена клиентом'
                    },
                    metadata: { test_seed: true },
                    timestamp: new Date('2026-01-10T18:00:00.000Z')
                }
            });

            // Event 5: FEEDBACK_SUBMITTED (session 1)
            await prisma.event.create({
                data: {
                    type: 'FEEDBACK_SUBMITTED',
                    source: 'api',
                    subject_id: adminUser.id,
                    subject_type: 'session',
                    payload: {
                        session_id: '44444444-4444-4444-4444-444444444444',
                        user_id: adminUser.id,
                        nps_score: 9,
                        comment: 'Отличная фотосессия!',
                        tags: ['professional', 'friendly']
                    },
                    metadata: { test_seed: true },
                    timestamp: new Date('2026-01-09T15:00:00.000Z')
                }
            });

            // Event 6: FEEDBACK_SUBMITTED (session 2)
            await prisma.event.create({
                data: {
                    type: 'FEEDBACK_SUBMITTED',
                    source: 'api',
                    subject_id: adminUser.id,
                    subject_type: 'session',
                    payload: {
                        session_id: '55555555-5555-5555-5555-555555555555',
                        user_id: adminUser.id,
                        nps_score: 10,
                        comment: 'Лучший фотограф!',
                        tags: ['excellent', 'recommend']
                    },
                    metadata: { test_seed: true },
                    timestamp: new Date('2026-01-10T14:30:00.000Z')
                }
            });

            console.log('  ✅ Created 2 SHIFT_STARTED events');
            console.log('  ✅ Created 2 SHIFT_COMPLETED events');
            console.log('  ✅ Created 2 FEEDBACK_SUBMITTED events');
            console.log('✅ Phase 0.3: All 6 Canonical Events created');
        } else {
            console.log('⚠️ Could not create events: missing role or user');
        }
    } else {
        console.log('✅ Events already exist');
    }

    // ==========================================================================
    // REGISTRY MODULE - Seed Entity Types (Foundation Entities)
    // Canon: All 47 Foundation Entity Types from system_registry_migration.sql
    // ==========================================================================

    const existingRegistryEntities = await prisma.registryEntity.count();

    if (existingRegistryEntities === 0) {
        console.log('\n📋 Creating Registry Entity Types...');

        const entityTypes = [
            // SECURITY DOMAIN
            { urn: 'urn:mg:type:user-account', name: 'Учётная запись пользователя', domain: 'security' },
            { urn: 'urn:mg:type:role', name: 'Роль', domain: 'security' },
            { urn: 'urn:mg:type:permission', name: 'Разрешение', domain: 'security' },
            { urn: 'urn:mg:type:role-permission', name: 'Связь Роль-Разрешение', domain: 'security' },
            { urn: 'urn:mg:type:access-scope', name: 'Область доступа', domain: 'security' },

            // LEGAL DOMAIN
            { urn: 'urn:mg:type:legal-entity', name: 'Юридическое лицо', domain: 'legal' },
            { urn: 'urn:mg:type:document', name: 'Документ', domain: 'legal' },

            // HUMAN CAPITAL
            { urn: 'urn:mg:type:person', name: 'Физическое лицо', domain: 'registry' },
            { urn: 'urn:mg:type:employee', name: 'Сотрудник', domain: 'registry' },
            { urn: 'urn:mg:type:external-actor', name: 'Внешний актор', domain: 'registry' },
            { urn: 'urn:mg:type:ai-agent', name: 'AI-агент', domain: 'registry' },

            // ORG STRUCTURE
            { urn: 'urn:mg:type:organization', name: 'Организация', domain: 'registry' },
            { urn: 'urn:mg:type:org-unit', name: 'Организационная единица', domain: 'registry' },
            { urn: 'urn:mg:type:org-unit-type', name: 'Тип подразделения', domain: 'registry' },
            { urn: 'urn:mg:type:org-relation', name: 'Связь структур', domain: 'registry' },
            { urn: 'urn:mg:type:structural-role', name: 'Структурная роль', domain: 'registry' },

            // FUNCTIONAL DOMAIN
            { urn: 'urn:mg:type:function-group', name: 'Функциональный домен', domain: 'registry' },
            { urn: 'urn:mg:type:function', name: 'Функция', domain: 'registry' },

            // POSITION & WORK
            { urn: 'urn:mg:type:position', name: 'Должность', domain: 'registry' },
            { urn: 'urn:mg:type:appointment', name: 'Назначение', domain: 'registry' },

            // STATUS & QUALIFICATION
            { urn: 'urn:mg:type:status', name: 'Статус', domain: 'registry' },
            { urn: 'urn:mg:type:status-rule', name: 'Правило статуса', domain: 'registry' },
            { urn: 'urn:mg:type:qualification', name: 'Квалификация', domain: 'registry' },
            { urn: 'urn:mg:type:qualification-level', name: 'Уровень квалификации', domain: 'registry' },

            // CPK (VALUE PRODUCTS)
            { urn: 'urn:mg:type:cpk', name: 'Ценный конечный продукт', domain: 'registry' },
            { urn: 'urn:mg:type:cpk-hierarchy', name: 'Иерархия ЦКП', domain: 'registry' },
            { urn: 'urn:mg:type:cpk-owner', name: 'Владелец ЦКП', domain: 'registry' },

            // TASK & OPERATIONS
            { urn: 'urn:mg:type:task-type', name: 'Тип задачи', domain: 'registry' },
            { urn: 'urn:mg:type:task-state', name: 'Состояние задачи', domain: 'registry' },
            { urn: 'urn:mg:type:workflow', name: 'Рабочий процесс', domain: 'registry' },

            // ECONOMY
            { urn: 'urn:mg:type:value-token', name: 'Токен ценности', domain: 'registry' },
            { urn: 'urn:mg:type:reward-rule', name: 'Правило вознаграждения', domain: 'registry' },
            { urn: 'urn:mg:type:penalty-rule', name: 'Правило штрафа', domain: 'registry' },

            // KNOWLEDGE & UNIVERSITY
            { urn: 'urn:mg:type:faculty', name: 'Факультет', domain: 'registry' },
            { urn: 'urn:mg:type:program', name: 'Программа', domain: 'registry' },
            { urn: 'urn:mg:type:course', name: 'Курс', domain: 'registry' },
            { urn: 'urn:mg:type:knowledge-unit', name: 'Единица знаний', domain: 'registry' },
            { urn: 'urn:mg:type:expert', name: 'Эксперт', domain: 'registry' },
            { urn: 'urn:mg:type:methodology', name: 'Методология', domain: 'registry' },
            { urn: 'urn:mg:type:research-artifact', name: 'Артефакт исследования', domain: 'registry' },

            // CONTENT & ARCHIVE
            { urn: 'urn:mg:type:content-item', name: 'Контент', domain: 'registry' },
            { urn: 'urn:mg:type:tag', name: 'Тег', domain: 'registry' },

            // INTEGRATION
            { urn: 'urn:mg:type:integration', name: 'Интеграция', domain: 'registry' },
            { urn: 'urn:mg:type:webhook', name: 'Вебхук', domain: 'registry' },
            { urn: 'urn:mg:type:data-import', name: 'Импорт данных', domain: 'registry' },

            // SYSTEM/META
            { urn: 'urn:mg:type:policy-rule', name: 'Правило политики', domain: 'registry' },
            { urn: 'urn:mg:type:retention-policy', name: 'Политика хранения', domain: 'registry' },
        ];

        for (const et of entityTypes) {
            await prisma.registryEntity.create({
                data: {
                    urn: et.urn,
                    entity_type_urn: 'urn:mg:meta:entity-type',
                    name: et.name,
                    description: `Foundation Entity Type: ${et.name}`,
                    attributes: { domain: et.domain, is_foundation: true },
                    fsm_state: 'active',
                    is_system: true,
                    is_active: true
                }
            });
        }

        console.log(`  ✅ Created ${entityTypes.length} Foundation Entity Types`);
        console.log('✅ Registry Entity Types seeded successfully');
    } else {
        console.log('✅ Registry Entity Types already exist');
    }

    // ==========================================================================
    // MODULE 09 - PARTICIPATION STATUS & RANKS
    // Canon: Status = Governance influence, Rank = GMC-based calculation
    // ==========================================================================

    const existingStatuses = await prisma.participationStatus.count();

    if (existingStatuses === 0) {
        console.log('\n📋 Creating Participation Statuses (Module 09)...');

        // Status 1: PHOTON (Entry level)
        await prisma.participationStatus.create({
            data: {
                code: 'PHOTON',
                description: 'Начальный статус участия — новичок в системе',
                governance_flags: {
                    can_mentor: false,
                    vote_weight: 1,
                    can_propose_ideas: true,
                    can_vote_on_ideas: false
                },
                is_active: true
            }
        });

        // Status 2: TOPCHIK (Active participant)
        await prisma.participationStatus.create({
            data: {
                code: 'TOPCHIK',
                description: 'Активный участник — вовлечён в процессы',
                governance_flags: {
                    can_mentor: true,
                    vote_weight: 2,
                    can_propose_ideas: true,
                    can_vote_on_ideas: true
                },
                is_active: true
            }
        });

        // Status 3: STAR (Recognized contributor)
        await prisma.participationStatus.create({
            data: {
                code: 'STAR',
                description: 'Признанный участник — значимый вклад',
                governance_flags: {
                    can_mentor: true,
                    vote_weight: 3,
                    can_propose_ideas: true,
                    can_vote_on_ideas: true,
                    can_review_proposals: true
                },
                is_active: true
            }
        });

        // Status 4: UNIVERSE (Top contributor)
        await prisma.participationStatus.create({
            data: {
                code: 'UNIVERSE',
                description: 'Высший статус участия — лидер сообщества',
                governance_flags: {
                    can_mentor: true,
                    vote_weight: 5,
                    can_propose_ideas: true,
                    can_vote_on_ideas: true,
                    can_review_proposals: true,
                    can_approve_governance: true
                },
                is_active: true
            }
        });

        console.log('  ✅ Created 4 Participation Statuses');
    } else {
        console.log('✅ Participation Statuses already exist');
    }

    const existingRanks = await prisma.participationRank.count();

    if (existingRanks === 0) {
        console.log('\n📋 Creating Participation Ranks (Module 09)...');

        // Rank 1: COLLECTOR (Entry level)
        await prisma.participationRank.create({
            data: {
                code: 'COLLECTOR',
                description: 'Начальный ранг — собиратель GMC',
                conditions: {
                    min_gmc: 0,
                    min_duration_days: 0
                },
                is_active: true
            }
        });

        // Rank 2: INVESTOR (Mid level)
        await prisma.participationRank.create({
            data: {
                code: 'INVESTOR',
                description: 'Инвестор — накопил значимый GMC',
                conditions: {
                    min_gmc: 10,
                    min_duration_days: 30
                },
                is_active: true
            }
        });

        // Rank 3: MAGNATE (High level)
        await prisma.participationRank.create({
            data: {
                code: 'MAGNATE',
                description: 'Магнат — крупный держатель GMC',
                conditions: {
                    min_gmc: 100,
                    min_duration_days: 90
                },
                is_active: true
            }
        });

        // Rank 4: DIAMOND_HAND (Top level)
        await prisma.participationRank.create({
            data: {
                code: 'DIAMOND_HAND',
                description: 'Алмазные руки — долгосрочный держатель',
                conditions: {
                    min_gmc: 500,
                    min_duration_days: 180
                },
                is_active: true
            }
        });

        console.log('  ✅ Created 4 Participation Ranks');
    } else {
        console.log('✅ Participation Ranks already exist');
    }

    // Assign default PHOTON status to all existing users without participation status
    const usersWithoutStatus = await prisma.user.findMany({
        where: {
            current_participation_status: null
        },
        select: { id: true }
    });

    if (usersWithoutStatus.length > 0) {
        console.log(`\n📋 Assigning default PHOTON status to ${usersWithoutStatus.length} users...`);

        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@photomatrix.ru' }
        });

        if (adminUser) {
            for (const user of usersWithoutStatus) {
                await prisma.userParticipationStatus.create({
                    data: {
                        user_id: user.id,
                        status_code: 'PHOTON',
                        assigned_by: adminUser.id,
                        reason: 'Initial system assignment',
                        assigned_at: new Date()
                    }
                });

                // Log to history
                await prisma.participationStatusHistory.create({
                    data: {
                        user_id: user.id,
                        old_status: null,
                        new_status: 'PHOTON',
                        reason: 'Initial system assignment',
                        changed_by: adminUser.id,
                        changed_at: new Date()
                    }
                });
            }

            console.log(`  ✅ Assigned PHOTON status to ${usersWithoutStatus.length} users`);
        }
    }

    // ==========================================================================
    // CORPORATE UNIVERSITY - Seed Foundational Bundle (Priority 1)
    // ==========================================================================

    console.log('\n📋 Seeding Mandatory Foundational Bundle...');

    const valuesAcademy = await prisma.academy.findFirst({
        where: { name: 'Values & Culture Academy' }
    });

    if (valuesAcademy) {
        const foundationalCourses = [
            {
                title: 'Конституция',
                description: 'Основной закон и принципы фотоматрицы. Системное мировоззрение.',
                academy_id: valuesAcademy.id,
                type: 'FOUNDATIONAL' as const,
                is_mandatory: true,
                required_grade: 'INTERN' as const,
                recognition_mc: 100,
                target_metric: 'QUALITY' as const,
                expected_effect: 'Понимание системных правил',
                scope: 'GENERAL' as const
            },
            {
                title: 'Кодекс',
                description: 'Свод правил поведения, чести и профессиональных стандартов.',
                academy_id: valuesAcademy.id,
                type: 'FOUNDATIONAL' as const,
                is_mandatory: true,
                required_grade: 'INTERN' as const,
                recognition_mc: 100,
                target_metric: 'QUALITY' as const,
                expected_effect: 'Соблюдение профессиональных стандартов',
                scope: 'GENERAL' as const
            },
            {
                title: 'Этика / Границы',
                description: 'Нормы общения, субординация и границы ответственности.',
                academy_id: valuesAcademy.id,
                type: 'FOUNDATIONAL' as const,
                is_mandatory: true,
                required_grade: 'INTERN' as const,
                recognition_mc: 100,
                target_metric: 'QUALITY' as const,
                expected_effect: 'Экологичное общение и взаимодействие',
                scope: 'GENERAL' as const
            }
        ];

        for (const course of foundationalCourses) {
            // Check if exists by title
            const existing = await prisma.course.findFirst({
                where: { title: course.title }
            });

            if (!existing) {
                await prisma.course.create({
                    data: course
                });
                console.log(`  ✅ Created Foundational Course: ${course.title}`);
            } else {
                // Update to ensure it's foundational and mandatory
                await prisma.course.update({
                    where: { id: existing.id },
                    data: {
                        type: 'FOUNDATIONAL',
                        is_mandatory: true
                    }
                });
                console.log(`  🔄 Updated Foundational Course: ${course.title}`);
            }
        }
        console.log('✅ Foundational Bundle seeded.');
    } else {
        console.error('⚠️ Values & Culture Academy not found! Skipping foundational courses.');
    }

    // ==========================================================================
    // MODULE 07 - FOUNDATION BLOCKS (Admission Gate)
    // ==========================================================================
    const existingFoundationBlocks = await prisma.foundationBlock.count();

    if (existingFoundationBlocks === 0) {
        console.log('\n📋 Creating Foundation Blocks and Materials for Admission Gate...');

        const foundationBlocks = [
            {
                id: 'CONSTITUTION',
                material_id: 'foundation-block-1',
                title: 'Внутренняя Конституция',
                description: 'Высший Устав Компании. Права, Иерархия и Власть.',
                order: 1,
                content: 'Конституция — это наш основной закон. Здесь определены правила взаимодействия, иерархия и верховная власть системы.'
            },
            {
                id: 'CODEX',
                material_id: 'foundation-block-2',
                title: 'Код поведения и антифрод',
                description: 'Кодекс Чести, борьба с мошенничеством и этические границы.',
                order: 2,
                content: 'Кодекс определяет этические стандарты. Мы не терпим обмана и мошенничества. Любое нарушение карается обнулением заслуг.'
            },
            {
                id: 'GOLDEN_STANDARD',
                material_id: 'foundation-block-3',
                title: 'Золотой Стандарт Фотоматрицы',
                description: 'Ценности: "Клиент — это Гость", Чистота, Скорость.',
                order: 3,
                content: 'Наш стандарт: Клиент — это Гость. Мы работаем быстро, чисто и с любовью к конечному продукту.'
            },
            {
                id: 'ROLE_MODEL',
                material_id: 'foundation-block-4',
                title: 'Ролевая модель и ответственность',
                description: 'Как работают Роли, Результаты и Зоны Ответственности.',
                order: 4,
                content: 'Система основана на ролях. Каждая роль — это контракт с четкими KPI и ответственностью за результат.'
            },
            {
                id: 'MOTIVATION',
                material_id: 'foundation-block-5',
                title: 'Мотивация и последствия',
                description: 'Экономика Заслуг: MC, GMC и последствия нарушений.',
                order: 5,
                content: 'Экономика MatrixGin — это баланс между MC (внутренней валютой) и GMC (влиянием). Ваши действия определяют ваше будущее.'
            }
        ];

        for (const block of foundationBlocks) {
            // Ensure material exists
            await prisma.material.upsert({
                where: { id: block.material_id },
                create: {
                    id: block.material_id,
                    type: 'TEXT',
                    title: block.title,
                    content_text: block.content,
                    status: 'PUBLISHED'
                },
                update: {
                    title: block.title,
                    content_text: block.content,
                    status: 'PUBLISHED'
                }
            });

            // Create foundation block link
            await prisma.foundationBlock.create({
                data: {
                    id: block.id,
                    material_id: block.material_id,
                    title: block.title,
                    description: block.description,
                    order: block.order,
                    mandatory: true
                }
            });
        }

        console.log('  ✅ Created 5 Foundation Blocks and Materials');
    } else {
        console.log('✅ Foundation Blocks already exist');
    }

    // Foundation Version Seed
    const existingVersion = await prisma.foundationVersion.findUnique({
        where: { version: '2.2' }
    });

    if (!existingVersion) {
        await prisma.foundationVersion.create({
            data: {
                version: '2.2',
                is_active: true,
                description: 'Geit Canon V2.2 - Unified System Foundation'
            }
        });
        console.log('  ✅ Created Foundation Version 2.2');
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@photomatrix.ru');
    console.log('Password: Admin123!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
