import {
  PrismaClient,
  SoilType,
  SeasonStatus,
  HarvestPlanStatus,
  DealStage,
} from './generated-client/index.js';

const prisma = new PrismaClient();
const COMPANY_ID = 'test-company-1';

function polygon(lon: number, lat: number) {
  return {
    type: 'Polygon',
    coordinates: [[[lon, lat], [lon + 0.01, lat], [lon + 0.01, lat + 0.01], [lon, lat + 0.01], [lon, lat]]],
  };
}

function point(lon: number, lat: number) {
  return { type: 'Point', coordinates: [lon, lat] };
}

async function main() {
  const company = await prisma.company.findUnique({ where: { id: COMPANY_ID } });
  if (!company) throw new Error(`Company ${COMPANY_ID} not found`);

  const rapeseed = await prisma.rapeseed.upsert({
    where: { id: 'demo-t1-rapeseed-main' },
    update: {
      name: 'Rapeseed Main',
      type: 'SPRING',
      vegetationPeriod: 112,
      version: 1,
      isLatest: true,
      companyId: COMPANY_ID,
    },
    create: {
      id: 'demo-t1-rapeseed-main',
      name: 'Rapeseed Main',
      type: 'SPRING',
      vegetationPeriod: 112,
      version: 1,
      isLatest: true,
      companyId: COMPANY_ID,
    },
  });

  const accountsData = [
    { id: 'demo-t1-acc-1', name: 'North Agro LLC', inn: '9951001001', jurisdiction: 'North Cluster' },
    { id: 'demo-t1-acc-2', name: 'South Fields JSC', inn: '9951001002', jurisdiction: 'South Cluster' },
    { id: 'demo-t1-acc-3', name: 'Delta Crops LLC', inn: '9951001003', jurisdiction: 'Delta Cluster' },
    { id: 'demo-t1-acc-4', name: 'Volga Harvest LLC', inn: '9951001004', jurisdiction: 'Volga Cluster' },
  ];

  const accounts: Array<{ id: string; name: string }> = [];
  for (const a of accountsData) {
    const account = await prisma.account.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        inn: a.inn,
        type: 'CLIENT',
        status: 'ACTIVE',
        jurisdiction: a.jurisdiction,
        riskCategory: 'LOW',
        strategicValue: 'B',
        companyId: COMPANY_ID,
      },
      create: {
        id: a.id,
        name: a.name,
        inn: a.inn,
        type: 'CLIENT',
        status: 'ACTIVE',
        jurisdiction: a.jurisdiction,
        riskCategory: 'LOW',
        strategicValue: 'B',
        companyId: COMPANY_ID,
      },
    });
    accounts.push({ id: account.id, name: account.name });
  }

  const fieldsData = [
    { id: 'demo-t1-field-01', cad: '99:10:0001001:001', name: 'North-01', area: 120.5, soil: SoilType.CHERNOZEM, acc: 'demo-t1-acc-1', lon: 37.60, lat: 55.70 },
    { id: 'demo-t1-field-02', cad: '99:10:0001001:002', name: 'North-02', area: 98.2, soil: SoilType.LOAM, acc: 'demo-t1-acc-1', lon: 37.64, lat: 55.72 },
    { id: 'demo-t1-field-03', cad: '99:10:0001001:003', name: 'North-03', area: 143.0, soil: SoilType.CLAY, acc: 'demo-t1-acc-1', lon: 37.68, lat: 55.74 },

    { id: 'demo-t1-field-04', cad: '99:20:0002002:001', name: 'South-01', area: 110.7, soil: SoilType.CHESTNUT, acc: 'demo-t1-acc-2', lon: 38.10, lat: 54.90 },
    { id: 'demo-t1-field-05', cad: '99:20:0002002:002', name: 'South-02', area: 87.4, soil: SoilType.SANDY, acc: 'demo-t1-acc-2', lon: 38.13, lat: 54.93 },
    { id: 'demo-t1-field-06', cad: '99:20:0002002:003', name: 'South-03', area: 156.8, soil: SoilType.LOAM, acc: 'demo-t1-acc-2', lon: 38.16, lat: 54.96 },

    { id: 'demo-t1-field-07', cad: '99:30:0003003:001', name: 'Delta-01', area: 132.1, soil: SoilType.GRAY_FOREST, acc: 'demo-t1-acc-3', lon: 39.00, lat: 55.20 },
    { id: 'demo-t1-field-08', cad: '99:30:0003003:002', name: 'Delta-02', area: 104.6, soil: SoilType.PODZOLIC, acc: 'demo-t1-acc-3', lon: 39.03, lat: 55.24 },
    { id: 'demo-t1-field-09', cad: '99:30:0003003:003', name: 'Delta-03', area: 91.3, soil: SoilType.CHERNOZEM, acc: 'demo-t1-acc-3', lon: 39.06, lat: 55.27 },

    { id: 'demo-t1-field-10', cad: '99:40:0004004:001', name: 'Volga-01', area: 140.9, soil: SoilType.CHERNOZEM, acc: 'demo-t1-acc-4', lon: 40.00, lat: 55.60 },
    { id: 'demo-t1-field-11', cad: '99:40:0004004:002', name: 'Volga-02', area: 96.7, soil: SoilType.LOAM, acc: 'demo-t1-acc-4', lon: 40.03, lat: 55.63 },
    { id: 'demo-t1-field-12', cad: '99:40:0004004:003', name: 'Volga-03', area: 119.5, soil: SoilType.SODDY, acc: 'demo-t1-acc-4', lon: 40.06, lat: 55.66 },
  ];

  for (const f of fieldsData) {
    await prisma.field.upsert({
      where: { id: f.id },
      update: {
        cadastreNumber: f.cad,
        name: f.name,
        area: f.area,
        coordinates: polygon(f.lon, f.lat),
        centroid: point(f.lon + 0.005, f.lat + 0.005),
        soilType: f.soil,
        status: 'ACTIVE',
        clientId: f.acc,
        companyId: COMPANY_ID,
      },
      create: {
        id: f.id,
        cadastreNumber: f.cad,
        name: f.name,
        area: f.area,
        coordinates: polygon(f.lon, f.lat),
        centroid: point(f.lon + 0.005, f.lat + 0.005),
        soilType: f.soil,
        status: 'ACTIVE',
        clientId: f.acc,
        companyId: COMPANY_ID,
      },
    });
  }

  const statuses: HarvestPlanStatus[] = [
    HarvestPlanStatus.DRAFT,
    HarvestPlanStatus.REVIEW,
    HarvestPlanStatus.APPROVED,
    HarvestPlanStatus.ACTIVE,
    HarvestPlanStatus.DONE,
    HarvestPlanStatus.ARCHIVE,
    HarvestPlanStatus.ACTIVE,
    HarvestPlanStatus.REVIEW,
    HarvestPlanStatus.DRAFT,
    HarvestPlanStatus.APPROVED,
  ];

  const fieldIds = fieldsData.slice(0, 10).map((f) => f.id);
  for (let i = 0; i < 10; i++) {
    const fieldId = fieldIds[i];
    const field = fieldsData.find((x) => x.id === fieldId)!;
    const seasonId = `demo-t1-season-2026-${String(i + 1).padStart(2, '0')}`;
    const planId = `demo-t1-plan-${String(i + 1).padStart(2, '0')}`;

    await prisma.season.upsert({
      where: { id: seasonId },
      update: {
        year: 2026,
        status: SeasonStatus.ACTIVE,
        fieldId,
        rapeseedId: rapeseed.id,
        companyId: COMPANY_ID,
        expectedYield: 2.4 + i * 0.08,
      },
      create: {
        id: seasonId,
        year: 2026,
        status: SeasonStatus.ACTIVE,
        fieldId,
        rapeseedId: rapeseed.id,
        companyId: COMPANY_ID,
        expectedYield: 2.4 + i * 0.08,
      },
    });

    await prisma.harvestPlan.upsert({
      where: { id: planId },
      update: {
        accountId: field.acc,
        companyId: COMPANY_ID,
        seasonId,
        targetMetric: 'YIELD_TON_HA',
        period: `SEASON_2026_BATCH_${i + 1}`,
        minValue: 2.1,
        optValue: 2.8 + i * 0.05,
        maxValue: 3.5,
        baselineValue: 2.5,
        status: statuses[i],
      },
      create: {
        id: planId,
        accountId: field.acc,
        companyId: COMPANY_ID,
        seasonId,
        targetMetric: 'YIELD_TON_HA',
        period: `SEASON_2026_BATCH_${i + 1}`,
        minValue: 2.1,
        optValue: 2.8 + i * 0.05,
        maxValue: 3.5,
        baselineValue: 2.5,
        status: statuses[i],
      },
    });
  }

  for (let i = 0; i < accounts.length; i++) {
    const a = accounts[i];
    await prisma.deal.upsert({
      where: { id: `demo-t1-deal-${i + 1}` },
      update: {
        name: `Service Expansion ${a.name}`,
        stage: i % 2 === 0 ? DealStage.OFFER : DealStage.QUALIFICATION,
        amount: 1200000 + i * 350000,
        probability: 0.45 + i * 0.1,
        expectedDate: new Date(`2026-0${(i % 6) + 3}-15T00:00:00.000Z`),
        clientId: a.id,
        companyId: COMPANY_ID,
      },
      create: {
        id: `demo-t1-deal-${i + 1}`,
        name: `Service Expansion ${a.name}`,
        stage: i % 2 === 0 ? DealStage.OFFER : DealStage.QUALIFICATION,
        amount: 1200000 + i * 350000,
        probability: 0.45 + i * 0.1,
        expectedDate: new Date(`2026-0${(i % 6) + 3}-15T00:00:00.000Z`),
        clientId: a.id,
        companyId: COMPANY_ID,
      },
    });

    await prisma.contract.upsert({
      where: { id: `demo-t1-contract-${i + 1}` },
      update: {
        number: `T1-CTR-2026-${String(i + 1).padStart(3, '0')}`,
        type: 'SERVICE',
        status: 'ACTIVE',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        amount: 900000 + i * 250000,
        clientId: a.id,
        companyId: COMPANY_ID,
      },
      create: {
        id: `demo-t1-contract-${i + 1}`,
        number: `T1-CTR-2026-${String(i + 1).padStart(3, '0')}`,
        type: 'SERVICE',
        status: 'ACTIVE',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        amount: 900000 + i * 250000,
        clientId: a.id,
        companyId: COMPANY_ID,
      },
    });
  }

  const [accCount, fieldCount, planCount, dealCount, contractCount] = await Promise.all([
    prisma.account.count({ where: { companyId: COMPANY_ID } }),
    prisma.field.count({ where: { companyId: COMPANY_ID } }),
    prisma.harvestPlan.count({ where: { companyId: COMPANY_ID } }),
    prisma.deal.count({ where: { companyId: COMPANY_ID } }),
    prisma.contract.count({ where: { companyId: COMPANY_ID } }),
  ]);

  console.log(`Done for ${COMPANY_ID}: accounts=${accCount}, fields=${fieldCount}, plans=${planCount}, deals=${dealCount}, contracts=${contractCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
