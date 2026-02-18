import { PrismaClient } from '../packages/prisma-client/generated-client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Level D Hardening Verification (FIXED)...');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found in DB.');
        return;
    }
    const companyId = company.id;
    const testId = crypto.randomBytes(4).toString('hex');

    // 1. Lineage Integrity Test
    console.log('🔹 Testing Lineage Integrity (Genesis v1)...');
    try {
        const genesisHash = `hash_g_${testId}`;
        await prisma.modelVersion.create({
            data: {
                name: `model_${testId}`,
                version: 1,
                hash: genesisHash,
                signature: 'sig_initial',
                artifactPath: `s3://bucket/model_${testId}/v1`,
                companyId,
                status: 'SHADOW'
            }
        });
        console.log('✅ Genesis model created.');

        console.log('🔹 Testing Lineage (Invalid Parent Hash)...');
        try {
            await prisma.modelVersion.create({
                data: {
                    name: `model_${testId}`,
                    version: 2,
                    hash: `hash_v2_${testId}`,
                    parentHash: 'non_existent_hash',
                    signature: 'sig2',
                    artifactPath: `s3://bucket/model_${testId}/v2`,
                    companyId,
                    status: 'SHADOW'
                }
            });
            console.error('❌ BUG: Invalid parentHash allowed!');
        } catch (e: any) {
            console.log('✅ Correctly blocked invalid parentHash.');
        }

        // 2. FSM Status Transition Test
        console.log('🔹 Testing FSM Transitions (Invalid SHADOW -> ACTIVE directly)...');
        const model = await prisma.modelVersion.findFirst({ where: { hash: genesisHash } });
        if (model) {
            try {
                await prisma.modelVersion.update({
                    where: { id: model.id },
                    data: { status: 'ACTIVE' }
                });
                console.error('❌ BUG: Invalid transition SHADOW -> ACTIVE allowed!');
            } catch (e: any) {
                console.log('✅ Correctly blocked invalid FSM transition (SHADOW -> ACTIVE).');
            }

            console.log('🔹 Testing FSM Transitions (Valid SHADOW -> CANARY -> ACTIVE)...');
            try {
                await prisma.modelVersion.update({
                    where: { id: model.id },
                    data: { status: 'CANARY' }
                });
                console.log('✅ SHADOW -> CANARY: OK');

                await prisma.modelVersion.update({
                    where: { id: model.id },
                    data: { status: 'ACTIVE' }
                });
                console.log('✅ CANARY -> ACTIVE: OK');
            } catch (e: any) {
                console.error(`❌ FSM path failed: ${e.message}`);
            }
        }

        // 3. Immutability Test
        console.log('🔹 Testing Immutability (Tampering Hash)...');
        if (model) {
            try {
                await prisma.modelVersion.update({
                    where: { id: model.id },
                    data: { hash: 'tampered_hash_value' }
                });
                console.error('❌ BUG: Tampering of hash allowed!');
            } catch (e: any) {
                console.log('✅ Correctly blocked hash tampering.');
            }
        }
    } catch (e: any) {
        console.error('❌ Test execution error:', e.message);
    }

    console.log('🏁 Verification Finished.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
