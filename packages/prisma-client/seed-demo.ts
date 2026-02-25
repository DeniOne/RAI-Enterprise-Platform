import { PrismaClient, BudgetCategory, DealStage, HarvestPlanStatus, IntegrityStatus, ObservationIntent, ObservationType, SeasonStatus, SoilType, TaskStatus, UserAccessLevel, UserRole, MachineryType, AssetStatus, StockItemType, BudgetStatus, BudgetType, TechMapStatus } from './generated-client/index.js';

const prisma = new PrismaClient();

const COMPANY_ID = 'default-rai-company';

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('Starting demo seeding (non-destructive)...');

  const company = await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: { name: 'RAI Enterprise' },
    create: { id: COMPANY_ID, name: 'RAI Enterprise' },
  });

  const holdingSouth = await prisma.holding.upsert({
    where: { id: 'demo-holding-south' },
    update: { name: 'Южный агрохолдинг', description: 'Краснодарский и Ростовский кластер', companyId: company.id },
    create: {
      id: 'demo-holding-south',
      name: 'Южный агрохолдинг',
      description: 'Краснодарский и Ростовский кластер',
      companyId: company.id,
    },
  });

  const holdingVolga = await prisma.holding.upsert({
    where: { id: 'demo-holding-volga' },
    update: { name: 'Поволжский агрохолдинг', description: 'Саратовско-Волгоградский контур', companyId: company.id },
    create: {
      id: 'demo-holding-volga',
      name: 'Поволжский агрохолдинг',
      description: 'Саратовско-Волгоградский контур',
      companyId: company.id,
    },
  });

  const accKuban = await prisma.account.upsert({
    where: { id: 'demo-account-kuban' },
    update: {
      name: 'ООО Кубань Рапс',
      inn: '2312998877',
      type: 'CLIENT',
      status: 'ACTIVE',
      jurisdiction: 'Краснодарский край',
      riskCategory: 'LOW',
      strategicValue: 'A',
      companyId: company.id,
      holdingId: holdingSouth.id,
    },
    create: {
      id: 'demo-account-kuban',
      name: 'ООО Кубань Рапс',
      inn: '2312998877',
      type: 'CLIENT',
      status: 'ACTIVE',
      jurisdiction: 'Краснодарский край',
      riskCategory: 'LOW',
      strategicValue: 'A',
      companyId: company.id,
      holdingId: holdingSouth.id,
    },
  });

  const accDon = await prisma.account.upsert({
    where: { id: 'demo-account-don' },
    update: {
      name: 'АО Донские Поля',
      inn: '6165884412',
      type: 'CLIENT',
      status: 'ACTIVE',
      jurisdiction: 'Ростовская область',
      riskCategory: 'MEDIUM',
      strategicValue: 'B',
      companyId: company.id,
      holdingId: holdingSouth.id,
    },
    create: {
      id: 'demo-account-don',
      name: 'АО Донские Поля',
      inn: '6165884412',
      type: 'CLIENT',
      status: 'ACTIVE',
      jurisdiction: 'Ростовская область',
      riskCategory: 'MEDIUM',
      strategicValue: 'B',
      companyId: company.id,
      holdingId: holdingSouth.id,
    },
  });

  const accVolga = await prisma.account.upsert({
    where: { id: 'demo-account-volga' },
    update: {
      name: 'ООО Волга Агро',
      inn: '6454123401',
      type: 'CLIENT',
      status: 'ACTIVE',
      jurisdiction: 'Саратовская область',
      riskCategory: 'LOW',
      strategicValue: 'A',
      companyId: company.id,
      holdingId: holdingVolga.id,
    },
    create: {
      id: 'demo-account-volga',
      name: 'ООО Волга Агро',
      inn: '6454123401',
      type: 'CLIENT',
      status: 'ACTIVE',
      jurisdiction: 'Саратовская область',
      riskCategory: 'LOW',
      strategicValue: 'A',
      companyId: company.id,
      holdingId: holdingVolga.id,
    },
  });

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ceo@rai.local' },
      update: { name: 'Алексей Генеральный', role: UserRole.CEO, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accKuban.id, phone: '+79000000001', telegramId: 'demo_ceo', emailVerified: true },
      create: { email: 'ceo@rai.local', name: 'Алексей Генеральный', role: UserRole.CEO, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accKuban.id, phone: '+79000000001', telegramId: 'demo_ceo', emailVerified: true },
    }),
    prisma.user.upsert({
      where: { email: 'manager1@rai.local' },
      update: { name: 'Ирина Менеджер', role: UserRole.MANAGER, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accKuban.id, phone: '+79000000002', telegramId: 'demo_manager_1', emailVerified: true },
      create: { email: 'manager1@rai.local', name: 'Ирина Менеджер', role: UserRole.MANAGER, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accKuban.id, phone: '+79000000002', telegramId: 'demo_manager_1', emailVerified: true },
    }),
    prisma.user.upsert({
      where: { email: 'manager2@rai.local' },
      update: { name: 'Николай Менеджер', role: UserRole.MANAGER, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accDon.id, phone: '+79000000003', telegramId: 'demo_manager_2', emailVerified: true },
      create: { email: 'manager2@rai.local', name: 'Николай Менеджер', role: UserRole.MANAGER, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accDon.id, phone: '+79000000003', telegramId: 'demo_manager_2', emailVerified: true },
    }),
    prisma.user.upsert({
      where: { email: 'agronom1@rai.local' },
      update: { name: 'Мария Агроном', role: UserRole.AGRONOMIST, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accKuban.id, phone: '+79000000004', telegramId: 'demo_agronom_1', emailVerified: true },
      create: { email: 'agronom1@rai.local', name: 'Мария Агроном', role: UserRole.AGRONOMIST, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accKuban.id, phone: '+79000000004', telegramId: 'demo_agronom_1', emailVerified: true },
    }),
    prisma.user.upsert({
      where: { email: 'agronom2@rai.local' },
      update: { name: 'Денис Агроном', role: UserRole.AGRONOMIST, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accVolga.id, phone: '+79000000005', telegramId: 'demo_agronom_2', emailVerified: true },
      create: { email: 'agronom2@rai.local', name: 'Денис Агроном', role: UserRole.AGRONOMIST, accessLevel: UserAccessLevel.ACTIVE, companyId: company.id, accountId: accVolga.id, phone: '+79000000005', telegramId: 'demo_agronom_2', emailVerified: true },
    }),
  ]);

  const [ceo, manager1, manager2, agronom1, agronom2] = users;

  const rapeseed = await prisma.rapeseed.upsert({
    where: { id: 'demo-rapeseed-winter-v1' },
    update: {
      name: 'Рапс озимый',
      variety: 'Северин',
      reproduction: 'РС1',
      type: 'WINTER',
      oilContent: 44.1,
      erucicAcid: 0.2,
      glucosinolates: 12,
      vegetationPeriod: 280,
      sowingNormMin: 3.5,
      sowingNormMax: 5.2,
      sowingDepthMin: 2,
      sowingDepthMax: 4,
      version: 1,
      isLatest: true,
      companyId: company.id,
    },
    create: {
      id: 'demo-rapeseed-winter-v1',
      name: 'Рапс озимый',
      variety: 'Северин',
      reproduction: 'РС1',
      type: 'WINTER',
      oilContent: 44.1,
      erucicAcid: 0.2,
      glucosinolates: 12,
      vegetationPeriod: 280,
      sowingNormMin: 3.5,
      sowingNormMax: 5.2,
      sowingDepthMin: 2,
      sowingDepthMax: 4,
      version: 1,
      isLatest: true,
      companyId: company.id,
    },
  });

  const fields = [
    {
      id: 'demo-field-kuban-1',
      cadastreNumber: '23:45:1001001:101',
      name: 'Поле Кубань-1',
      area: 145.5,
      soilType: SoilType.CHERNOZEM,
      accountId: accKuban.id,
      lon: 39.12,
      lat: 45.03,
    },
    {
      id: 'demo-field-kuban-2',
      cadastreNumber: '23:45:1001001:102',
      name: 'Поле Кубань-2',
      area: 210.7,
      soilType: SoilType.LOAM,
      accountId: accKuban.id,
      lon: 39.18,
      lat: 45.06,
    },
    {
      id: 'demo-field-don-1',
      cadastreNumber: '61:12:2002002:201',
      name: 'Поле Дон-1',
      area: 188.3,
      soilType: SoilType.CHESTNUT,
      accountId: accDon.id,
      lon: 40.19,
      lat: 47.21,
    },
    {
      id: 'demo-field-volga-1',
      cadastreNumber: '64:33:3003003:301',
      name: 'Поле Волга-1',
      area: 164.9,
      soilType: SoilType.GRAY_FOREST,
      accountId: accVolga.id,
      lon: 46.03,
      lat: 51.53,
    },
  ];

  for (const f of fields) {
    await prisma.field.upsert({
      where: { id: f.id },
      update: {
        cadastreNumber: f.cadastreNumber,
        name: f.name,
        area: f.area,
        coordinates: {
          type: 'Polygon',
          coordinates: [[[f.lon, f.lat], [f.lon + 0.01, f.lat], [f.lon + 0.01, f.lat + 0.01], [f.lon, f.lat + 0.01], [f.lon, f.lat]]],
        },
        centroid: { type: 'Point', coordinates: [f.lon + 0.005, f.lat + 0.005] },
        soilType: f.soilType,
        clientId: f.accountId,
        companyId: company.id,
        status: 'ACTIVE',
      },
      create: {
        id: f.id,
        cadastreNumber: f.cadastreNumber,
        name: f.name,
        area: f.area,
        coordinates: {
          type: 'Polygon',
          coordinates: [[[f.lon, f.lat], [f.lon + 0.01, f.lat], [f.lon + 0.01, f.lat + 0.01], [f.lon, f.lat + 0.01], [f.lon, f.lat]]],
        },
        centroid: { type: 'Point', coordinates: [f.lon + 0.005, f.lat + 0.005] },
        soilType: f.soilType,
        clientId: f.accountId,
        companyId: company.id,
        status: 'ACTIVE',
      },
    });
  }

  const season = await prisma.season.upsert({
    where: { id: 'demo-season-2026-kuban-1' },
    update: {
      year: 2026,
      status: SeasonStatus.ACTIVE,
      fieldId: 'demo-field-kuban-1',
      rapeseedId: rapeseed.id,
      expectedYield: 3.8,
      actualYield: 3.4,
      startDate: new Date('2025-08-20T00:00:00.000Z'),
      endDate: new Date('2026-07-25T00:00:00.000Z'),
      companyId: company.id,
      currentStageId: '06_FERTILIZATION',
    },
    create: {
      id: 'demo-season-2026-kuban-1',
      year: 2026,
      status: SeasonStatus.ACTIVE,
      fieldId: 'demo-field-kuban-1',
      rapeseedId: rapeseed.id,
      expectedYield: 3.8,
      actualYield: 3.4,
      startDate: new Date('2025-08-20T00:00:00.000Z'),
      endDate: new Date('2026-07-25T00:00:00.000Z'),
      companyId: company.id,
      currentStageId: '06_FERTILIZATION',
    },
  });

  await prisma.seasonStageProgress.upsert({
    where: { id: 'demo-season-stage-1' },
    update: {
      seasonId: season.id,
      stageId: '04_SOWING',
      completedAt: new Date('2025-09-05T00:00:00.000Z'),
      metadata: { moisture: 21.3, sowingRate: 4.2, notes: 'Посев в технологическое окно' },
    },
    create: {
      id: 'demo-season-stage-1',
      seasonId: season.id,
      stageId: '04_SOWING',
      completedAt: new Date('2025-09-05T00:00:00.000Z'),
      metadata: { moisture: 21.3, sowingRate: 4.2, notes: 'Посев в технологическое окно' },
    },
  });

  const harvestPlan = await prisma.harvestPlan.upsert({
    where: { id: 'demo-harvest-plan-2026-kuban-1' },
    update: {
      accountId: accKuban.id,
      companyId: company.id,
      seasonId: season.id,
      contextSnapshot: { weatherScenario: 'base', soilMoisture: 21.3, inflation: 0.09 },
      targetMetric: 'YIELD_TON_HA',
      period: 'SEASON_2026',
      minValue: 3.1,
      optValue: 3.8,
      maxValue: 4.4,
      baselineValue: 3.4,
      status: HarvestPlanStatus.ACTIVE,
    },
    create: {
      id: 'demo-harvest-plan-2026-kuban-1',
      accountId: accKuban.id,
      companyId: company.id,
      seasonId: season.id,
      contextSnapshot: { weatherScenario: 'base', soilMoisture: 21.3, inflation: 0.09 },
      targetMetric: 'YIELD_TON_HA',
      period: 'SEASON_2026',
      minValue: 3.1,
      optValue: 3.8,
      maxValue: 4.4,
      baselineValue: 3.4,
      status: HarvestPlanStatus.ACTIVE,
    },
  });

  const techCard = await prisma.technologyCard.upsert({
    where: { id: 'demo-tech-card-rapeseed-2026' },
    update: {
      name: 'Технологическая карта озимого рапса 2026',
      description: 'Базовый производственный регламент с адаптацией под юг РФ',
      companyId: company.id,
    },
    create: {
      id: 'demo-tech-card-rapeseed-2026',
      name: 'Технологическая карта озимого рапса 2026',
      description: 'Базовый производственный регламент с адаптацией под юг РФ',
      companyId: company.id,
    },
  });

  const cardOp1 = await prisma.technologyCardOperation.upsert({
    where: { id: 'demo-tech-card-op-1' },
    update: { name: 'Подготовка почвы', sequence: 1, technologyCardId: techCard.id, stageId: '03_SOIL_PREP', description: 'Глубокорыхление и выравнивание' },
    create: { id: 'demo-tech-card-op-1', name: 'Подготовка почвы', sequence: 1, technologyCardId: techCard.id, stageId: '03_SOIL_PREP', description: 'Глубокорыхление и выравнивание' },
  });

  const cardOp2 = await prisma.technologyCardOperation.upsert({
    where: { id: 'demo-tech-card-op-2' },
    update: { name: 'Посев рапса', sequence: 2, technologyCardId: techCard.id, stageId: '04_SOWING', description: 'Сеялка с контролем нормы и глубины' },
    create: { id: 'demo-tech-card-op-2', name: 'Посев рапса', sequence: 2, technologyCardId: techCard.id, stageId: '04_SOWING', description: 'Сеялка с контролем нормы и глубины' },
  });

  await prisma.technologyCardResource.upsert({
    where: { id: 'demo-tech-card-resource-1' },
    update: { operationId: cardOp2.id, type: 'SEED', name: 'Семена рапса Северин', dosage: 4.2, unit: 'кг/га' },
    create: { id: 'demo-tech-card-resource-1', operationId: cardOp2.id, type: 'SEED', name: 'Семена рапса Северин', dosage: 4.2, unit: 'кг/га' },
  });

  const task1 = await prisma.task.upsert({
    where: { id: 'demo-task-1' },
    update: {
      name: 'Провести посев Поле Кубань-1',
      status: TaskStatus.IN_PROGRESS,
      seasonId: season.id,
      operationId: cardOp2.id,
      fieldId: 'demo-field-kuban-1',
      assigneeId: agronom1.id,
      responsibleId: manager1.id,
      plannedDate: daysFromNow(3),
      slaExpiration: daysFromNow(7),
      companyId: company.id,
    },
    create: {
      id: 'demo-task-1',
      name: 'Провести посев Поле Кубань-1',
      status: TaskStatus.IN_PROGRESS,
      seasonId: season.id,
      operationId: cardOp2.id,
      fieldId: 'demo-field-kuban-1',
      assigneeId: agronom1.id,
      responsibleId: manager1.id,
      plannedDate: daysFromNow(3),
      slaExpiration: daysFromNow(7),
      companyId: company.id,
    },
  });

  const task2 = await prisma.task.upsert({
    where: { id: 'demo-task-2' },
    update: {
      name: 'Внесение азотных удобрений Поле Кубань-1',
      status: TaskStatus.PENDING,
      seasonId: season.id,
      operationId: cardOp1.id,
      fieldId: 'demo-field-kuban-1',
      assigneeId: agronom1.id,
      responsibleId: manager2.id,
      plannedDate: daysFromNow(10),
      slaExpiration: daysFromNow(14),
      companyId: company.id,
    },
    create: {
      id: 'demo-task-2',
      name: 'Внесение азотных удобрений Поле Кубань-1',
      status: TaskStatus.PENDING,
      seasonId: season.id,
      operationId: cardOp1.id,
      fieldId: 'demo-field-kuban-1',
      assigneeId: agronom1.id,
      responsibleId: manager2.id,
      plannedDate: daysFromNow(10),
      slaExpiration: daysFromNow(14),
      companyId: company.id,
    },
  });

  const techMap = await prisma.techMap.upsert({
    where: { id: 'demo-tech-map-2026-kuban-1-v1' },
    update: {
      harvestPlanId: harvestPlan.id,
      seasonId: season.id,
      crop: 'Рапс озимый',
      soilType: SoilType.CHERNOZEM,
      moisture: 21.3,
      precursor: 'Пшеница озимая',
      status: TechMapStatus.ACTIVE,
      version: 1,
      isLatest: true,
      fieldId: 'demo-field-kuban-1',
      companyId: company.id,
      approvedAt: new Date('2025-08-15T00:00:00.000Z'),
      operationsSnapshot: [{ op: 'Посев', date: '2025-09-05' }, { op: 'Подкормка', date: '2025-10-01' }],
      resourceNormsSnapshot: [{ name: 'Семена', amount: 4.2, unit: 'кг/га' }, { name: 'КАС-32', amount: 120, unit: 'л/га' }],
      generationMetadata: { modelId: 'det-v1', modelVersion: '1.0.0', seed: 42, hash: 'demo-hash' },
    },
    create: {
      id: 'demo-tech-map-2026-kuban-1-v1',
      harvestPlanId: harvestPlan.id,
      seasonId: season.id,
      crop: 'Рапс озимый',
      soilType: SoilType.CHERNOZEM,
      moisture: 21.3,
      precursor: 'Пшеница озимая',
      status: TechMapStatus.ACTIVE,
      version: 1,
      isLatest: true,
      fieldId: 'demo-field-kuban-1',
      companyId: company.id,
      approvedAt: new Date('2025-08-15T00:00:00.000Z'),
      operationsSnapshot: [{ op: 'Посев', date: '2025-09-05' }, { op: 'Подкормка', date: '2025-10-01' }],
      resourceNormsSnapshot: [{ name: 'Семена', amount: 4.2, unit: 'кг/га' }, { name: 'КАС-32', amount: 120, unit: 'л/га' }],
      generationMetadata: { modelId: 'det-v1', modelVersion: '1.0.0', seed: 42, hash: 'demo-hash' },
    },
  });

  const mapStage = await prisma.mapStage.upsert({
    where: { id: 'demo-map-stage-1' },
    update: { name: 'Посевная кампания', sequence: 1, techMapId: techMap.id, aplStageId: '04_SOWING' },
    create: { id: 'demo-map-stage-1', name: 'Посевная кампания', sequence: 1, techMapId: techMap.id, aplStageId: '04_SOWING' },
  });

  const mapOperation = await prisma.mapOperation.upsert({
    where: { id: 'demo-map-operation-1' },
    update: {
      name: 'Посев рапса СЗ-5.4',
      description: 'Контроль нормы высева и глубины',
      mapStageId: mapStage.id,
      plannedStartTime: new Date('2025-09-05T05:00:00.000Z'),
      plannedEndTime: new Date('2025-09-05T14:00:00.000Z'),
      durationHours: 9,
      requiredMachineryType: MachineryType.TRACTOR,
    },
    create: {
      id: 'demo-map-operation-1',
      name: 'Посев рапса СЗ-5.4',
      description: 'Контроль нормы высева и глубины',
      mapStageId: mapStage.id,
      plannedStartTime: new Date('2025-09-05T05:00:00.000Z'),
      plannedEndTime: new Date('2025-09-05T14:00:00.000Z'),
      durationHours: 9,
      requiredMachineryType: MachineryType.TRACTOR,
    },
  });

  await prisma.mapResource.upsert({
    where: { id: 'demo-map-resource-1' },
    update: { mapOperationId: mapOperation.id, type: 'SEED', name: 'Семена Северин', amount: 4.2, unit: 'кг/га', costPerUnit: 380 },
    create: { id: 'demo-map-resource-1', mapOperationId: mapOperation.id, type: 'SEED', name: 'Семена Северин', amount: 4.2, unit: 'кг/га', costPerUnit: 380 },
  });

  const budgetPlan = await prisma.budgetPlan.upsert({
    where: { id: 'demo-budget-plan-2026-kuban-1-v1' },
    update: {
      harvestPlanId: harvestPlan.id,
      version: 1,
      type: BudgetType.OPERATIONAL,
      status: BudgetStatus.ACTIVE,
      totalPlannedAmount: '4580000.0000',
      totalActualAmount: '1610000.0000',
      techMapSnapshotId: techMap.id,
      derivationHash: 'demo-derivation-hash-v1',
      companyId: company.id,
      seasonId: season.id,
    },
    create: {
      id: 'demo-budget-plan-2026-kuban-1-v1',
      harvestPlanId: harvestPlan.id,
      version: 1,
      type: BudgetType.OPERATIONAL,
      status: BudgetStatus.ACTIVE,
      totalPlannedAmount: '4580000.0000',
      totalActualAmount: '1610000.0000',
      techMapSnapshotId: techMap.id,
      derivationHash: 'demo-derivation-hash-v1',
      companyId: company.id,
      seasonId: season.id,
    },
  });

  await prisma.budgetItem.upsert({
    where: { id: 'demo-budget-item-seed' },
    update: {
      budgetPlanId: budgetPlan.id,
      category: BudgetCategory.SEEDS,
      plannedNorm: '4.2000',
      plannedPrice: '380.0000',
      plannedAmount: '602000.0000',
      actualAmount: '592000.0000',
      companyId: company.id,
    },
    create: {
      id: 'demo-budget-item-seed',
      budgetPlanId: budgetPlan.id,
      category: BudgetCategory.SEEDS,
      plannedNorm: '4.2000',
      plannedPrice: '380.0000',
      plannedAmount: '602000.0000',
      actualAmount: '592000.0000',
      companyId: company.id,
    },
  });

  await prisma.budgetItem.upsert({
    where: { id: 'demo-budget-item-fertilizer' },
    update: {
      budgetPlanId: budgetPlan.id,
      category: BudgetCategory.FERTILIZER,
      plannedNorm: '120.0000',
      plannedPrice: '58.0000',
      plannedAmount: '1249000.0000',
      actualAmount: '1018000.0000',
      companyId: company.id,
    },
    create: {
      id: 'demo-budget-item-fertilizer',
      budgetPlanId: budgetPlan.id,
      category: BudgetCategory.FERTILIZER,
      plannedNorm: '120.0000',
      plannedPrice: '58.0000',
      plannedAmount: '1249000.0000',
      actualAmount: '1018000.0000',
      companyId: company.id,
    },
  });

  await prisma.harvestPlan.update({
    where: { id: harvestPlan.id },
    data: {
      activeTechMapId: techMap.id,
      activeBudgetPlanId: budgetPlan.id,
    },
  });

  await prisma.fieldObservation.upsert({
    where: { id: 'demo-observation-1' },
    update: {
      type: ObservationType.MEASUREMENT,
      intent: ObservationIntent.MONITORING,
      integrityStatus: IntegrityStatus.STRONG_EVIDENCE,
      content: 'Фаза 4 листа, густота 58 растений/м2, влажность 20.8%',
      photoUrl: 'https://example.local/demo/field-kuban-1-photo.jpg',
      telemetryJson: { speed: 4.1, trackLengthKm: 2.7 },
      coordinates: { type: 'Point', coordinates: [39.125, 45.035] },
      taskId: task1.id,
      fieldId: 'demo-field-kuban-1',
      seasonId: season.id,
      budgetPlanId: budgetPlan.id,
      authorId: agronom1.id,
      companyId: company.id,
    },
    create: {
      id: 'demo-observation-1',
      type: ObservationType.MEASUREMENT,
      intent: ObservationIntent.MONITORING,
      integrityStatus: IntegrityStatus.STRONG_EVIDENCE,
      content: 'Фаза 4 листа, густота 58 растений/м2, влажность 20.8%',
      photoUrl: 'https://example.local/demo/field-kuban-1-photo.jpg',
      telemetryJson: { speed: 4.1, trackLengthKm: 2.7 },
      coordinates: { type: 'Point', coordinates: [39.125, 45.035] },
      taskId: task1.id,
      fieldId: 'demo-field-kuban-1',
      seasonId: season.id,
      budgetPlanId: budgetPlan.id,
      authorId: agronom1.id,
      companyId: company.id,
    },
  });

  await prisma.deal.upsert({
    where: { id: 'demo-deal-1' },
    update: {
      name: 'Расширение сопровождения: ООО Кубань Рапс',
      stage: DealStage.OFFER,
      amount: 2850000,
      probability: 0.72,
      expectedDate: new Date('2026-04-15T00:00:00.000Z'),
      clientId: accKuban.id,
      companyId: company.id,
    },
    create: {
      id: 'demo-deal-1',
      name: 'Расширение сопровождения: ООО Кубань Рапс',
      stage: DealStage.OFFER,
      amount: 2850000,
      probability: 0.72,
      expectedDate: new Date('2026-04-15T00:00:00.000Z'),
      clientId: accKuban.id,
      companyId: company.id,
    },
  });

  await prisma.contract.upsert({
    where: { id: 'demo-contract-1' },
    update: {
      number: 'RAI-2026-001',
      type: 'SERVICE',
      status: 'ACTIVE',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      amount: 2100000,
      clientId: accKuban.id,
      companyId: company.id,
    },
    create: {
      id: 'demo-contract-1',
      number: 'RAI-2026-001',
      type: 'SERVICE',
      status: 'ACTIVE',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      amount: 2100000,
      clientId: accKuban.id,
      companyId: company.id,
    },
  });

  await prisma.cashAccount.upsert({
    where: { id: 'demo-cash-main' },
    update: {
      name: 'Основной расчётный счёт',
      balance: '12450000.0000',
      version: 3,
      currency: 'RUB',
      isActive: true,
      companyId: company.id,
    },
    create: {
      id: 'demo-cash-main',
      name: 'Основной расчётный счёт',
      balance: '12450000.0000',
      version: 3,
      currency: 'RUB',
      isActive: true,
      companyId: company.id,
    },
  });

  await prisma.machinery.upsert({
    where: { id: 'demo-machine-1' },
    update: {
      name: 'Трактор John Deere 8R',
      brand: 'John Deere',
      serialNumber: 'JD8R-DEMO-001',
      type: MachineryType.TRACTOR,
      status: AssetStatus.ACTIVE,
      idempotencyKey: 'machinery-demo-1',
      companyId: company.id,
      accountId: accKuban.id,
      confirmedByUserId: manager1.id,
      confirmedAt: new Date('2026-01-20T00:00:00.000Z'),
    },
    create: {
      id: 'demo-machine-1',
      name: 'Трактор John Deere 8R',
      brand: 'John Deere',
      serialNumber: 'JD8R-DEMO-001',
      type: MachineryType.TRACTOR,
      status: AssetStatus.ACTIVE,
      idempotencyKey: 'machinery-demo-1',
      companyId: company.id,
      accountId: accKuban.id,
      confirmedByUserId: manager1.id,
      confirmedAt: new Date('2026-01-20T00:00:00.000Z'),
    },
  });

  await prisma.stockItem.upsert({
    where: { id: 'demo-stock-seed-1' },
    update: {
      name: 'Семена рапса Северин',
      type: StockItemType.SEED,
      status: AssetStatus.ACTIVE,
      quantity: 14200,
      unit: 'кг',
      idempotencyKey: 'stock-demo-seed-1',
      companyId: company.id,
      accountId: accKuban.id,
      confirmedByUserId: manager1.id,
      confirmedAt: new Date('2026-01-18T00:00:00.000Z'),
    },
    create: {
      id: 'demo-stock-seed-1',
      name: 'Семена рапса Северин',
      type: StockItemType.SEED,
      status: AssetStatus.ACTIVE,
      quantity: 14200,
      unit: 'кг',
      idempotencyKey: 'stock-demo-seed-1',
      companyId: company.id,
      accountId: accKuban.id,
      confirmedByUserId: manager1.id,
      confirmedAt: new Date('2026-01-18T00:00:00.000Z'),
    },
  });

  await prisma.budget.upsert({
    where: { id: 'demo-budget-1' },
    update: {
      name: 'Операционный бюджет 2026',
      limit: '8000000.0000',
      consumed: '2100000.0000',
      remaining: '5900000.0000',
      status: BudgetStatus.ACTIVE,
      periodStart: new Date('2026-01-01T00:00:00.000Z'),
      periodEnd: new Date('2026-12-31T00:00:00.000Z'),
      companyId: company.id,
    },
    create: {
      id: 'demo-budget-1',
      name: 'Операционный бюджет 2026',
      limit: '8000000.0000',
      consumed: '2100000.0000',
      remaining: '5900000.0000',
      status: BudgetStatus.ACTIVE,
      periodStart: new Date('2026-01-01T00:00:00.000Z'),
      periodEnd: new Date('2026-12-31T00:00:00.000Z'),
      companyId: company.id,
    },
  });

  await prisma.budgetLine.upsert({
    where: { id: 'demo-budget-line-seeds' },
    update: {
      budgetId: 'demo-budget-1',
      category: 'SEEDS',
      limit: 2500000,
      consumed: 592000,
    },
    create: {
      id: 'demo-budget-line-seeds',
      budgetId: 'demo-budget-1',
      category: 'SEEDS',
      limit: 2500000,
      consumed: 592000,
    },
  });

  await prisma.harvestResult.upsert({
    where: { id: 'demo-harvest-result-1' },
    update: {
      planId: harvestPlan.id,
      seasonId: season.id,
      companyId: company.id,
      fieldId: 'demo-field-kuban-1',
      crop: 'Рапс озимый',
      plannedYield: '38.0000',
      actualYield: '34.2000',
      harvestedArea: '140.2000',
      totalOutput: '479.4840',
      marketPrice: '28700.0000',
      costSnapshot: '1610000.0000',
      budgetPlanId: budgetPlan.id,
      budgetVersion: 1,
      qualityClass: '1 класс',
      harvestDate: new Date('2026-07-20T00:00:00.000Z'),
    },
    create: {
      id: 'demo-harvest-result-1',
      planId: harvestPlan.id,
      seasonId: season.id,
      companyId: company.id,
      fieldId: 'demo-field-kuban-1',
      crop: 'Рапс озимый',
      plannedYield: '38.0000',
      actualYield: '34.2000',
      harvestedArea: '140.2000',
      totalOutput: '479.4840',
      marketPrice: '28700.0000',
      costSnapshot: '1610000.0000',
      budgetPlanId: budgetPlan.id,
      budgetVersion: 1,
      qualityClass: '1 класс',
      harvestDate: new Date('2026-07-20T00:00:00.000Z'),
    },
  });

  await prisma.agronomicStrategy.upsert({
    where: { id: 'demo-strategy-rapeseed-south-v1' },
    update: {
      name: 'Стратегия рапса Юг РФ',
      description: 'План операций с учетом влаги и температурного окна',
      cropId: rapeseed.id,
      regionId: 'RU-SOUTH',
      operations: [
        { stage: 'SOIL_PREP', op: 'Глубокорыхление', window: '2025-08-15..2025-08-30' },
        { stage: 'SOWING', op: 'Посев', window: '2025-09-01..2025-09-10' },
      ],
      constraints: [
        { key: 'soil_moisture_min', value: 18 },
        { key: 'wind_speed_max', value: 8 },
      ],
      status: 'PUBLISHED',
      version: 1,
      hash: 'demo-strategy-hash-v1',
      publishedAt: new Date('2025-08-10T00:00:00.000Z'),
      explainability: { rationale: 'Снижение климатического риска и перерасхода ресурсов' },
      companyId: company.id,
    },
    create: {
      id: 'demo-strategy-rapeseed-south-v1',
      name: 'Стратегия рапса Юг РФ',
      description: 'План операций с учетом влаги и температурного окна',
      cropId: rapeseed.id,
      regionId: 'RU-SOUTH',
      operations: [
        { stage: 'SOIL_PREP', op: 'Глубокорыхление', window: '2025-08-15..2025-08-30' },
        { stage: 'SOWING', op: 'Посев', window: '2025-09-01..2025-09-10' },
      ],
      constraints: [
        { key: 'soil_moisture_min', value: 18 },
        { key: 'wind_speed_max', value: 8 },
      ],
      status: 'PUBLISHED',
      version: 1,
      hash: 'demo-strategy-hash-v1',
      publishedAt: new Date('2025-08-10T00:00:00.000Z'),
      explainability: { rationale: 'Снижение климатического риска и перерасхода ресурсов' },
      companyId: company.id,
    },
  });

  console.log('Demo seed completed. Created/updated: company, 2 holdings, 3 accounts, 5 users, 4 fields, season, harvest plan, tech card, tech map, budget plan, tasks, observations, CRM, finance, assets, result.');
  console.log(`Reference users: CEO=${ceo.email}, manager=${manager1.email}, agronomist=${agronom2.email}, additional task=${task2.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
