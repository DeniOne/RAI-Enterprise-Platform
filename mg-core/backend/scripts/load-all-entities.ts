import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Все модули и их файлы
const ENTITY_FILES = [
    // 00_meta
    '00_meta/01_entity_type.entity.json',
    '00_meta/02_attribute_definition.entity.json',
    '00_meta/03_relationship_definition.entity.json',
    '00_meta/04_fsm_definition.entity.json',

    // 01_security - уже загружены, но обновим
    '01_security/01_user_account.entity.json',
    '01_security/02_role.entity.json',
    '01_security/03_permission.entity.json',
    '01_security/04_role_permission.entity.json',
    '01_security/05_access_scope.entity.json',
    '01_security/06_policy_rule.entity.json',
    '01_security/07_retention_policy.entity.json',

    // 02_human
    '02_human/01_person.entity.json',
    '02_human/02_employee.entity.json',
    '02_human/03_external_actor.entity.json',
    '02_human/04_ai_agent.entity.json',
    '02_human/05_expert.entity.json',

    // 03_structure
    '03_structure/01_organization.entity.json',
    '03_structure/02_org_unit_type.entity.json',
    '03_structure/03_org_unit.entity.json',
    '03_structure/04_org_relation.entity.json',
    '03_structure/05_structural_role.entity.json',
    '03_structure/06_position.entity.json',

    // 04_functional
    '04_functional/01_function_group.entity.json',
    '04_functional/02_function.entity.json',

    // 05_hierarchy
    '05_hierarchy/01_status.entity.json',
    '05_hierarchy/02_status_rule.entity.json',
    '05_hierarchy/03_qualification.entity.json',
    '05_hierarchy/04_qualification_level.entity.json',
    '05_hierarchy/05_appointment.entity.json',

    // 06_value
    '06_value/01_cpk.entity.json',
    '06_value/02_cpk_hierarchy.entity.json',
    '06_value/03_cpk_owner.entity.json',

    // 07_process
    '07_process/01_task_type.entity.json',
    '07_process/02_task_state.entity.json',
    '07_process/03_workflow.entity.json',

    // 08_economy
    '08_economy/01_value_token.entity.json',
    '08_economy/02_reward_rule.entity.json',
    '08_economy/03_penalty_rule.entity.json',

    // 09_knowledge
    '09_knowledge/01_faculty.entity.json',
    '09_knowledge/02_program.entity.json',
    '09_knowledge/03_course.entity.json',
    '09_knowledge/04_knowledge_unit.entity.json',
    '09_knowledge/05_methodology.entity.json',
    '09_knowledge/06_research_artifact.entity.json',
    '09_knowledge/07_content_item.entity.json',
    '09_knowledge/08_tag.entity.json',

    // 10_legal
    '10_legal/01_legal_entity.entity.json',
    '10_legal/02_document.entity.json',

    // 11_integration
    '11_integration/01_integration.entity.json',
    '11_integration/02_webhook.entity.json',
    '11_integration/03_sync_log.entity.json'
];

async function loadAllEntities() {
    console.log(`Загрузка ${ENTITY_FILES.length} типов сущностей...`);

    let loaded = 0;
    let updated = 0;
    let errors = 0;

    for (const file of ENTITY_FILES) {
        const fullPath = path.resolve(process.cwd(), 'src/registry/bootstrap', file);

        if (!fs.existsSync(fullPath)) {
            console.error(`❌ Файл не найден: ${file}`);
            errors++;
            continue;
        }

        try {
            const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            const entityType = content.entity_type;

            if (!entityType || !entityType.urn) {
                console.error(`❌ Некорректный файл (нет urn): ${file}`);
                errors++;
                continue;
            }

            const existing = await prisma.registryEntity.findUnique({
                where: { urn: entityType.urn }
            });

            if (existing) {
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
                console.log(`✓ ОБНОВЛЕНО: ${entityType.urn}`);
                updated++;
            } else {
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
                console.log(`✓ СОЗДАНО: ${entityType.urn}`);
                loaded++;
            }
        } catch (err: any) {
            console.error(`❌ Ошибка при загрузке ${file}:`, err.message);
            errors++;
        }
    }

    console.log(`\n=== ИТОГ ===`);
    console.log(`Создано: ${loaded}`);
    console.log(`Обновлено: ${updated}`);
    console.log(`Ошибок: ${errors}`);
    console.log(`Всего обработано: ${loaded + updated + errors}`);
}

loadAllEntities()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
