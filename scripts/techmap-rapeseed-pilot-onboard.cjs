#!/usr/bin/env node
/* eslint-disable no-console */
const dotenv = require("dotenv");
const path = require("path");
const { PrismaClient } = require("../packages/prisma-client");

const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env") });

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function buildDeterministicInn(companyId) {
  let hash = 0;
  for (const ch of companyId) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 1000000000;
  }

  const value = 1000000000 + hash;
  return String(value).padStart(10, "0").slice(0, 10);
}

function buildPolygon(lon, lat) {
  return {
    type: "Polygon",
    coordinates: [
      [
        [lon, lat],
        [lon + 0.01, lat],
        [lon + 0.01, lat + 0.01],
        [lon, lat + 0.01],
        [lon, lat],
      ],
    ],
  };
}

async function main() {
  const companyId = getArg("company-id", "pilot-rapeseed-kuban-company");
  const companyName = getArg("company-name", "Pilot Rapeseed Kuban");
  const regionName = getArg("region-name", "Кубанский pilot region");
  const seasonYear = Number(getArg("season-year", "2026"));
  const accountInn = getArg("inn", buildDeterministicInn(companyId));

  const ids = {
    holdingId: `${companyId}-holding`,
    accountId: `${companyId}-account`,
    fieldId: `${companyId}-field`,
    seasonId: `${companyId}-season-${seasonYear}`,
    harvestPlanId: `${companyId}-harvest-plan-${seasonYear}`,
    cropZoneId: `${companyId}-crop-zone-${seasonYear}`,
    soilProfileId: `${companyId}-soil-profile`,
    regionProfileId: `${companyId}-region-profile`,
  };

  const prisma = new PrismaClient();

  try {
    const company = await prisma.company.upsert({
      where: { id: companyId },
      update: {
        name: companyName,
      },
      create: {
        id: companyId,
        name: companyName,
      },
    });

    const holding = await prisma.holding.upsert({
      where: { id: ids.holdingId },
      update: {
        name: `${companyName} Holding`,
        description: "Operational pilot tenant for canonical rapeseed cutover.",
        companyId: company.id,
      },
      create: {
        id: ids.holdingId,
        name: `${companyName} Holding`,
        description: "Operational pilot tenant for canonical rapeseed cutover.",
        companyId: company.id,
      },
    });

    const account = await prisma.account.upsert({
      where: { id: ids.accountId },
      update: {
        name: `${companyName} Account`,
        inn: accountInn,
        type: "CLIENT",
        status: "ACTIVE",
        jurisdiction: "Краснодарский край",
        riskCategory: "LOW",
        strategicValue: "A",
        companyId: company.id,
        holdingId: holding.id,
      },
      create: {
        id: ids.accountId,
        name: `${companyName} Account`,
        inn: accountInn,
        type: "CLIENT",
        status: "ACTIVE",
        jurisdiction: "Краснодарский край",
        riskCategory: "LOW",
        strategicValue: "A",
        companyId: company.id,
        holdingId: holding.id,
      },
    });

    const field = await prisma.field.upsert({
      where: { id: ids.fieldId },
      update: {
        cadastreNumber: `${companyId}:23:45:${seasonYear}:001`,
        name: `${companyName} Field`,
        area: 132.4,
        coordinates: buildPolygon(39.15, 45.04),
        centroid: { type: "Point", coordinates: [39.155, 45.045] },
        soilType: "CHERNOZEM",
        clientId: account.id,
        companyId: company.id,
        status: "ACTIVE",
      },
      create: {
        id: ids.fieldId,
        cadastreNumber: `${companyId}:23:45:${seasonYear}:001`,
        name: `${companyName} Field`,
        area: 132.4,
        coordinates: buildPolygon(39.15, 45.04),
        centroid: { type: "Point", coordinates: [39.155, 45.045] },
        soilType: "CHERNOZEM",
        clientId: account.id,
        companyId: company.id,
        status: "ACTIVE",
      },
    });

    const season = await prisma.season.upsert({
      where: { id: ids.seasonId },
      update: {
        year: seasonYear,
        status: "ACTIVE",
        fieldId: field.id,
        expectedYield: 3.9,
        actualYield: null,
        startDate: new Date(`${seasonYear - 1}-08-25T00:00:00.000Z`),
        endDate: new Date(`${seasonYear}-07-25T00:00:00.000Z`),
        companyId: company.id,
      },
      create: {
        id: ids.seasonId,
        year: seasonYear,
        status: "ACTIVE",
        fieldId: field.id,
        expectedYield: 3.9,
        actualYield: null,
        startDate: new Date(`${seasonYear - 1}-08-25T00:00:00.000Z`),
        endDate: new Date(`${seasonYear}-07-25T00:00:00.000Z`),
        companyId: company.id,
      },
    });

    const harvestPlan = await prisma.harvestPlan.upsert({
      where: { id: ids.harvestPlanId },
      update: {
        accountId: account.id,
        companyId: company.id,
        seasonId: season.id,
        contextSnapshot: {
          weatherScenario: "pilot_base",
          soilMoisture: 22.1,
          inflation: 0.08,
        },
        targetMetric: "YIELD_TON_HA",
        period: `SEASON_${seasonYear}`,
        minValue: 3.2,
        optValue: 3.9,
        maxValue: 4.5,
        baselineValue: 3.5,
        status: "ACTIVE",
      },
      create: {
        id: ids.harvestPlanId,
        accountId: account.id,
        companyId: company.id,
        seasonId: season.id,
        contextSnapshot: {
          weatherScenario: "pilot_base",
          soilMoisture: 22.1,
          inflation: 0.08,
        },
        targetMetric: "YIELD_TON_HA",
        period: `SEASON_${seasonYear}`,
        minValue: 3.2,
        optValue: 3.9,
        maxValue: 4.5,
        baselineValue: 3.5,
        status: "ACTIVE",
      },
    });

    const cropZone = await prisma.cropZone.upsert({
      where: { id: ids.cropZoneId },
      update: {
        fieldId: field.id,
        seasonId: season.id,
        cropType: "RAPESEED",
        cropForm: "RAPESEED_WINTER",
        varietyHybrid: "Северин Pilot",
        predecessorCrop: "Пшеница озимая",
        targetYieldTHa: 3.9,
        assumptions: {
          rotationYearsSinceRapeseed: 5,
          clubrootHistory: false,
          yearsSinceClubroot: 8,
        },
        constraints: {
          sowingWindow: `${seasonYear - 1}-09-01..${seasonYear - 1}-09-10`,
        },
        confidence: 0.88,
        companyId: company.id,
      },
      create: {
        id: ids.cropZoneId,
        fieldId: field.id,
        seasonId: season.id,
        cropType: "RAPESEED",
        cropForm: "RAPESEED_WINTER",
        varietyHybrid: "Северин Pilot",
        predecessorCrop: "Пшеница озимая",
        targetYieldTHa: 3.9,
        assumptions: {
          rotationYearsSinceRapeseed: 5,
          clubrootHistory: false,
          yearsSinceClubroot: 8,
        },
        constraints: {
          sowingWindow: `${seasonYear - 1}-09-01..${seasonYear - 1}-09-10`,
        },
        confidence: 0.88,
        companyId: company.id,
      },
    });

    const soilProfile = await prisma.soilProfile.upsert({
      where: { id: ids.soilProfileId },
      update: {
        fieldId: field.id,
        sampleDate: new Date(`${seasonYear - 1}-08-10T00:00:00.000Z`),
        ph: 6.3,
        humusPercent: 4.6,
        p2o5MgKg: 42,
        k2oMgKg: 315,
        sMgKg: 14.2,
        bMgKg: 0.74,
        nMineralMgKg: 28,
        bulkDensityGCm3: 1.21,
        compactionDetected: false,
        granulometricType: "LOAM",
        provenance: {
          source: "pilot_onboarding",
          note: "Bootstrap soil profile for canonical rapeseed cutover.",
        },
        confidence: 0.93,
        companyId: company.id,
      },
      create: {
        id: ids.soilProfileId,
        fieldId: field.id,
        sampleDate: new Date(`${seasonYear - 1}-08-10T00:00:00.000Z`),
        ph: 6.3,
        humusPercent: 4.6,
        p2o5MgKg: 42,
        k2oMgKg: 315,
        sMgKg: 14.2,
        bMgKg: 0.74,
        nMineralMgKg: 28,
        bulkDensityGCm3: 1.21,
        compactionDetected: false,
        granulometricType: "LOAM",
        provenance: {
          source: "pilot_onboarding",
          note: "Bootstrap soil profile for canonical rapeseed cutover.",
        },
        confidence: 0.93,
        companyId: company.id,
      },
    });

    const regionProfile = await prisma.regionProfile.upsert({
      where: { id: ids.regionProfileId },
      update: {
        name: regionName,
        climateType: "STEPPE_DRY",
        agroclimaticZone: "KUBAN_STEPPE",
        satAvg: 2450,
        winterType: "stable_winter",
        gddBaseTempC: 5,
        avgGddSeason: 2380,
        precipitationMm: 540,
        frostRiskIndex: 0.31,
        droughtRiskIndex: 0.42,
        waterloggingRiskIndex: 0.12,
        updateSource: "pilot_onboarding",
        companyId: company.id,
      },
      create: {
        id: ids.regionProfileId,
        name: regionName,
        climateType: "STEPPE_DRY",
        agroclimaticZone: "KUBAN_STEPPE",
        satAvg: 2450,
        winterType: "stable_winter",
        gddBaseTempC: 5,
        avgGddSeason: 2380,
        precipitationMm: 540,
        frostRiskIndex: 0.31,
        droughtRiskIndex: 0.42,
        waterloggingRiskIndex: 0.12,
        updateSource: "pilot_onboarding",
        companyId: company.id,
      },
    });

    console.log("[techmap-rapeseed-pilot-onboard] summary");
    console.log(`- company_id=${company.id}`);
    console.log(`- company_name=${company.name}`);
    console.log(`- account_id=${account.id}`);
    console.log(`- field_id=${field.id}`);
    console.log(`- season_id=${season.id}`);
    console.log(`- harvest_plan_id=${harvestPlan.id}`);
    console.log(`- crop_zone_id=${cropZone.id}`);
    console.log(`- soil_profile_id=${soilProfile.id}`);
    console.log(`- region_profile_id=${regionProfile.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[techmap-rapeseed-pilot-onboard] error");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
