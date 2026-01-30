import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import *  as path from 'path';

const prisma = new PrismaClient();

async function loadEntityTypes() {
    console.log('Loading additional entity types...');

    const filesToLoad = [
        'src/registry/bootstrap/02_human/01_person.entity.json',
        'src/registry/bootstrap/03_structure/05_structural_role.entity.json'
    ];

    for (const file of filesToLoad) {
        const fullPath = path.resolve(process.cwd(), file);

        if (!fs.existsSync(fullPath)) {
            console.error(`File not found: ${fullPath}`);
            continue;
        }

        const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const entityType = content.entity_type;

        console.log(`Processing ${entityType.urn}...`);

        const existing = await prisma.registryEntity.findUnique({
            where: { urn: entityType.urn }
        });

        if (existing) {
            console.log(`  UPDATING existing entity type`);
            await prisma.registryEntity.update({
                where: { urn: entityType.urn },
                data: {
                    name: entityType.name,
                    description: entityType.description,
                    attributes: {
                        ...entityType,
                        schema: entityType.schema,
                        views: entityType.views,
                        domain: entityType.domain,
                        class: entityType.class
                    }
                }
            });
        } else {
            console.log(`  CREATING new entity type`);
            await prisma.registryEntity.create({
                data: {
                    urn: entityType.urn,
                    entity_type_urn: 'urn:mg:type:entity_type',
                    name: entityType.name,
                    description: entityType.description,
                    fsm_state: 'active',
                    is_system: true,
                    attributes: {
                        ...entityType,
                        schema: entityType.schema,
                        views: entityType.views,
                        domain: entityType.domain,
                        class: entityType.class
                    }
                }
            });
        }

        console.log(`  ✓ ${entityType.urn} loaded`);
    }

    console.log('\nAll entity types loaded successfully!');
}

loadEntityTypes()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
