import { PrismaClient } from "../generated-client";

async function main() {
  const prisma = new PrismaClient();

  const latestRapeseeds = await prisma.rapeseed.findMany({
    where: { isLatest: true },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  let linkedSeasons = 0;

  for (const r of latestRapeseeds) {
    const existing = await (prisma as any).cropVariety.findFirst({
      where: {
        name: r.name,
        cropType: "RAPESEED",
        companyId: r.companyId,
        version: r.version,
      },
    });

    const variety =
      existing ??
      (await (prisma as any).cropVariety.create({
        data: {
          name: r.name,
          variety: r.variety,
          reproduction: r.reproduction,
          type: r.type,
          cropType: "RAPESEED",
          oilContent: r.oilContent,
          erucicAcid: r.erucicAcid,
          glucosinolates: r.glucosinolates,
          vegetationPeriod: r.vegetationPeriod,
          sowingNormMin: r.sowingNormMin,
          sowingNormMax: r.sowingNormMax,
          sowingDepthMin: r.sowingDepthMin,
          sowingDepthMax: r.sowingDepthMax,
          version: r.version,
          isLatest: r.isLatest,
          companyId: r.companyId,
        },
      }));

    if (!existing) {
      created += 1;
    }

    const updated = await prisma.season.updateMany({
      where: {
        rapeseedId: r.id,
        cropVarietyId: null,
      } as any,
      data: {
        cropVarietyId: variety.id,
      } as any,
    });
    linkedSeasons += updated.count;
  }

  console.log(
    JSON.stringify(
      {
        migratedRapeseedToCropVariety: created,
        linkedSeasons,
        sourceLatestRapeseeds: latestRapeseeds.length,
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
