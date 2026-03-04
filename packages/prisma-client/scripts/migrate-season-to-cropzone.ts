import { PrismaClient } from "../generated-client";

function mapCropType(rawName?: string | null): string {
  if (!rawName) return "RAPESEED";
  const normalized = rawName.toLowerCase();
  if (normalized.includes("wheat")) return "WINTER_WHEAT";
  if (normalized.includes("corn")) return "CORN";
  if (normalized.includes("sunflower")) return "SUNFLOWER";
  if (normalized.includes("barley")) return "BARLEY";
  return "RAPESEED";
}

async function main() {
  const prisma = new PrismaClient();
  const seasons = await prisma.season.findMany({
    where: { fieldId: { not: null } as any },
    include: { rapeseed: true },
    orderBy: { createdAt: "asc" },
  });

  let createdCropZones = 0;
  let linkedTechMaps = 0;

  for (const season of seasons) {
    if (!season.fieldId) continue;

    let cropZone = await (prisma as any).cropZone.findFirst({
      where: {
        fieldId: season.fieldId,
        seasonId: season.id,
        companyId: season.companyId,
      },
    });

    if (!cropZone) {
      cropZone = await (prisma as any).cropZone.create({
        data: {
          fieldId: season.fieldId,
          seasonId: season.id,
          companyId: season.companyId,
          cropType: mapCropType((season as any).rapeseed?.name ?? null),
          cropVarietyId: (season as any).cropVarietyId ?? null,
          varietyHybrid: (season as any).rapeseed?.variety ?? null,
        },
      });
      createdCropZones += 1;
    }

    const updated = await prisma.techMap.updateMany({
      where: {
        seasonId: season.id,
        fieldId: season.fieldId,
        cropZoneId: { not: cropZone.id },
      },
      data: {
        cropZoneId: cropZone.id,
      },
    });
    linkedTechMaps += updated.count;
  }

  console.log(
    JSON.stringify(
      {
        seasonsProcessed: seasons.length,
        createdCropZones,
        linkedTechMaps,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
