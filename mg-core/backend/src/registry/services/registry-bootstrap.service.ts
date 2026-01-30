import { prisma } from '../../config/prisma';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../config/logger';

interface RegistryEntityBootstrap {
    urn: string;
    [key: string]: any;
}

export class RegistryBootstrapService {
    private readonly BOOTSTRAP_DIR = path.join(__dirname, '../bootstrap');
    private readonly REQUIRED_FILES = [
        '01-fsm-default-registry-lifecycle.json',
        '02-entity-type-entity_type.json',
        '03-entity-type-attribute_definition.json',
        '04-entity-type-fsm_definition.json',
        '05-attributes-entity_type.json',
        '06-attributes-attribute_definition.json',
        '07-attributes-fsm_definition.json',
        '08-entity-type-relationship_definition.json',
        '09-attributes-relationship_definition.json',
        // Security Essentials
        '01_security/01_user_account.entity.json',
        '01_security/02_role.entity.json',
        '01_security/03_permission.entity.json',
        '01_security/04_role_permission.entity.json',
        '01_security/05_access_scope.entity.json',
        '01_security/06_policy_rule.entity.json',
        '01_security/07_retention_policy.entity.json'
    ];

    async run(): Promise<void> {
        logger.info('Starting Registry Bootstrap...');

        // 1. Check if registry is empty
        const count = await prisma.registryEntity.count();
        if (count > 0) {
            logger.warn('Registry is not empty. Bootstrap aborted.');
            throw new Error('Registry is not empty. Bootstrap can only run on a fresh system.');
        }

        // 2. Load and parse files
        const data = await this.loadBootstrapData();

        // 3. Transactional insert
        await prisma.$transaction(async (tx) => {
            logger.info('Inserting bootstrap entities...');

            // 3.1 Insert FSM (01)
            await this.insertEntity(tx, data['01-fsm-default-registry-lifecycle.json'], 'fsm_definition');

            // 3.2 Insert Entity Types (02, 03, 04)
            await this.insertEntity(tx, data['02-entity-type-entity_type.json'], 'entity_type');
            await this.insertEntity(tx, data['03-entity-type-attribute_definition.json'], 'entity_type');
            await this.insertEntity(tx, data['04-entity-type-fsm_definition.json'], 'entity_type');

            // 3.3 Insert Attributes (05, 06, 07) - ARRAYs
            await this.insertAttributes(tx, data['05-attributes-entity_type.json'], 'attribute_definition');
            await this.insertAttributes(tx, data['06-attributes-attribute_definition.json'], 'attribute_definition');
            await this.insertAttributes(tx, data['07-attributes-fsm_definition.json'], 'attribute_definition');

            // 3.4 Audit Log
            await tx.registryAuditEvent.create({
                data: {
                    action: 'BOOTSTRAP',
                    actor_urn: 'urn:mg:system:bootstrap',
                    payload: { files: this.REQUIRED_FILES },
                    entity_urn: 'urn:mg:system:registry'
                }
            });
        });

        logger.info('Registry Bootstrap completed successfully.');
    }

    private async loadBootstrapData(): Promise<Record<string, any>> {
        const data: Record<string, any> = {};
        for (const file of this.REQUIRED_FILES) {
            const filePath = path.join(this.BOOTSTRAP_DIR, file);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                data[file] = JSON.parse(content);
            } catch (error) {
                logger.error(`Failed to load bootstrap file: ${file}`, error);
                throw new Error(`Failed to load bootstrap file: ${file}`);
            }
        }
        return data;
    }

    private async insertEntity(tx: any, item: RegistryEntityBootstrap, typeUrn: string) {
        // Extract known fields, put rest in attributes
        const { urn, name, description, version, is_system, is_active, lifecycle_fsm_urn, ...attributes } = item;

        // For FSM, we might have specific fields, but generally we map to RegistryEntity
        // entity_type_urn is passed as argument or derived
        // For 02, 03, 04, they ARE entity_types, so their entity_type_urn is 'urn:mg:entity-type:entity_type:v1' usually?
        // Wait, 02 represents 'entity_type'. Its entity_type is 'urn:mg:entity-type:entity_type:v1'? YES.
        // But in the JSON 02, it doesn't have 'entity_type_urn'.
        // Registry architecture says: "Everything has a URN".
        // Use mapping based on input typeUrn.

        let actualEntityTypeUrn = '';
        if (typeUrn === 'fsm_definition') actualEntityTypeUrn = 'urn:mg:entity-type:fsm_definition:v1';
        else if (typeUrn === 'entity_type') actualEntityTypeUrn = 'urn:mg:entity-type:entity_type:v1';
        else if (typeUrn === 'attribute_definition') actualEntityTypeUrn = 'urn:mg:entity-type:attribute_definition:v1';

        await tx.registryEntity.create({
            data: {
                urn: urn,
                entity_type_urn: actualEntityTypeUrn,
                version: version || 1,
                name: name,
                description: description,
                is_system: is_system ?? true,
                is_active: true, // Bootstrap always makes active
                fsm_state: 'active', // Bootstrap bypasses FSM transitions for speed, directly ACTIVE
                attributes: attributes
            }
        });
    }

    private async insertAttributes(tx: any, items: RegistryEntityBootstrap[], typeUrn: string) {
        for (const item of items) {
            // Attributes don't have their OWN urn in the JSON array usually?
            // Check JSON 05: No top-level URN.
            // Attributes are usually sub-resources or weak entities.
            // BUT Registry Architecture says "Everything has URN".
            // If they don't have URN in JSON, we must generate one?
            // Or maybe they are Value Objects in this version?
            // Re-reading JSON 05:
            // { "entity_type_urn": "...", "name": "urn", ... }
            // It seems they are stored as `attribute_definition` entities.
            // We need to generate URNs for them if missing.
            // Convention: urn:mg:attribute:[entity_type_name]:[attribute_name]:v1

            const entityTypeUrn = item.entity_type_urn;
            // extracts entity name from URN, e.g. urn:mg:entity-type:entity_type:v1 -> entity_type
            const entityName = entityTypeUrn.split(':')[3];
            const attrUrn = `urn:mg:attribute:${entityName}:${item.name}:v1`;

            const { name, description, version, is_system, ...attributes } = item;

            await tx.registryEntity.create({
                data: {
                    urn: attrUrn,
                    entity_type_urn: 'urn:mg:entity-type:attribute_definition:v1',
                    version: 1,
                    name: name,
                    description: description,
                    is_system: true,
                    is_active: true,
                    fsm_state: 'active',
                    attributes: attributes
                }
            });
        }
    }
}

export const registryBootstrapService = new RegistryBootstrapService();
