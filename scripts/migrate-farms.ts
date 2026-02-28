
import { PrismaClient } from '../packages/prisma-client/generated-client/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Starting Parties to Farms migration...');

    const parties = await prisma.party.findMany({
        where: {
            registrationData: {
                path: ['farm'],
                not: null,
            },
        },
    });

    console.log(`🔍 Found ${parties.length} parties with potential farm data.`);

    let migratedCount = 0;

    for (const party of parties) {
        const registrationData = party.registrationData as any;
        const farmData = registrationData.farm;

        if (!farmData || !farmData.name) {
            console.log(`⚠️ Skip party ${party.id}: no valid farm name.`);
            continue;
        }

        console.log(`📦 Migrating farm "${farmData.name}" from party "${party.legalName}"...`);

        try {
            // 1. Create Account (Asset:FARM)
            // Note: we use Account with type CLIENT as a surrogate for FARM for now, 
            // as per asset-role.service.ts implementation.
            const account = await prisma.account.create({
                data: {
                    name: farmData.name,
                    companyId: party.companyId,
                    type: 'CLIENT', // Using CLIENT as the designated type for Farms in this architecture
                    status: 'ACTIVE',
                    jurisdiction: party.jurisdictionId, // Inherit from party or use specific mapping
                    // holdingId: could be resolved from farmData.holdingName if needed
                },
            });

            // 2. Create AssetPartyRole
            await prisma.assetPartyRole.create({
                data: {
                    companyId: party.companyId,
                    assetId: account.id,
                    assetType: 'FARM',
                    partyId: party.id,
                    role: farmData.isOwner ? 'OWNER' : 'OPERATOR',
                    validFrom: new Date(),
                },
            });

            // 3. Remove farm from registrationData (optional, but keep for now to be safe, 
            // or mark as migrated)
            const updatedRegistrationData = { ...registrationData };
            updatedRegistrationData._migratedFarm = updatedRegistrationData.farm;
            delete updatedRegistrationData.farm;

            await prisma.party.update({
                where: { id: party.id },
                data: {
                    registrationData: updatedRegistrationData,
                },
            });

            migratedCount++;
            console.log(`✅ Successfully migrated farm "${farmData.name}".`);
        } catch (error) {
            console.error(`❌ Failed to migrate farm for party ${party.id}:`, error);
        }
    }

    console.log(`🏁 Migration finished. Migrated ${migratedCount} farms.`);
}

migrate()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
