
import { PrismaClient } from '@rai/prisma-client';

async function checkData() {
    const prisma = new PrismaClient();
    try {
        console.log('--- Checking default-rai-company ---');
        const company = await prisma.company.findUnique({
            where: { id: 'default-rai-company' }
        });
        console.log('Company exists:', !!company);

        const techMaps = await prisma.techMap.findMany({
            where: { companyId: 'default-rai-company' }
        });
        console.log('TechMaps found:', techMaps.length);
        techMaps.forEach(tm => {
            console.log(`- TechMap ID: ${tm.id}, SeasonId: ${tm.seasonId}, Version: ${tm.version}`);
        });

        const harvestPlans = await prisma.harvestPlan.findMany({
            where: { companyId: 'default-rai-company' }
        });
        console.log('HarvestPlans found:', harvestPlans.length);
        harvestPlans.forEach(hp => {
            console.log(`- HarvestPlan ID: ${hp.id}, ActiveTechMapId: ${hp.activeTechMapId}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
