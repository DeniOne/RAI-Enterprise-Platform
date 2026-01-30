import * as fs from 'fs';
import * as path from 'path';

// Полный словарь замен (English -> Russian)
const LABEL_REPLACEMENTS: Record<string, string> = {
    // Attributes
    'Relation Type': 'Тип связи',
    'Short Name': 'Краткое название',
    'Full Name': 'Полное название',
    'First Name': 'Имя',
    'Last Name': 'Фамилия',
    'Middle Name': 'Отчество',
    'Birth Date': 'Дата рождения',
    'User Name': 'Имя пользователя',
    'Is Locked': 'Заблокирован',
    'Is System': 'Системный',
    'Is Active': 'Активен',
    'Rule Type': 'Тип правила',
    'Action': 'Действие',
    'Resource': 'Ресурс',
    'Scope': 'Область',
    'Module': 'Модуль',
    'Parent Urn': 'Родительский URN',
    'Legal Name': 'Юридическое название',
    'State Code': 'Код состояния',
    'Status Code': 'Код статуса',
    'Retry Count': 'Количество попыток',
    'Last Sync': 'Последняя синхронизация',

    // Relationships
    'From Unit': 'Из подразделения',
    'To Unit': 'В подразделение',
    'Legal Entity': 'Юридическое лицо',
    'Org Unit Type': 'Тип подразделения',
    'Org Unit': 'Подразделение',
    'Organization': 'Организация',
    'User Account': 'Учётная запись',
    'Access Scope': 'Область доступа',
    'Task Type': 'Тип задачи',
    'Task State': 'Состояние задачи',
    'Workflow': 'Рабочий процесс',
    'Program': 'Программа',
    'Course': 'Курс',
    'Faculty': 'Факультет'
};

const ENTITY_FILES = [
    '00_meta/01_entity_type.entity.json',
    '00_meta/02_attribute_definition.entity.json',
    '00_meta/03_relationship_definition.entity.json',
    '00_meta/04_fsm_definition.entity.json',
    '01_security/01_user_account.entity.json',
    '01_security/02_role.entity.json',
    '01_security/03_permission.entity.json',
    '01_security/04_role_permission.entity.json',
    '01_security/05_access_scope.entity.json',
    '01_security/06_policy_rule.entity.json',
    '01_security/07_retention_policy.entity.json',
    '02_human/01_person.entity.json',
    '02_human/02_employee.entity.json',
    '02_human/03_external_actor.entity.json',
    '02_human/04_ai_agent.entity.json',
    '02_human/05_expert.entity.json',
    '03_structure/01_organization.entity.json',
    '03_structure/02_org_unit_type.entity.json',
    '03_structure/03_org_unit.entity.json',
    '03_structure/04_org_relation.entity.json',
    '03_structure/05_structural_role.entity.json',
    '03_structure/06_position.entity.json',
    '04_functional/01_function_group.entity.json',
    '04_functional/02_function.entity.json',
    '05_hierarchy/01_status.entity.json',
    '05_hierarchy/02_status_rule.entity.json',
    '05_hierarchy/03_qualification.entity.json',
    '05_hierarchy/04_qualification_level.entity.json',
    '05_hierarchy/05_appointment.entity.json',
    '06_value/01_cpk.entity.json',
    '06_value/02_cpk_hierarchy.entity.json',
    '06_value/03_cpk_owner.entity.json',
    '07_process/01_task_type.entity.json',
    '07_process/02_task_state.entity.json',
    '07_process/03_workflow.entity.json',
    '08_economy/01_value_token.entity.json',
    '08_economy/02_reward_rule.entity.json',
    '08_economy/03_penalty_rule.entity.json',
    '09_knowledge/01_faculty.entity.json',
    '09_knowledge/02_program.entity.json',
    '09_knowledge/03_course.entity.json',
    '09_knowledge/04_knowledge_unit.entity.json',
    '09_knowledge/05_methodology.entity.json',
    '09_knowledge/06_research_artifact.entity.json',
    '09_knowledge/07_content_item.entity.json',
    '09_knowledge/08_tag.entity.json',
    '10_legal/01_legal_entity.entity.json',
    '10_legal/02_document.entity.json',
    '11_integration/01_integration.entity.json',
    '11_integration/02_webhook.entity.json'
];

async function replaceEnglishLabels() {
    console.log('Замена английских labels на русские...\n');

    let updated = 0;

    for (const file of ENTITY_FILES) {
        const fullPath = path.resolve(process.cwd(), 'src/registry/bootstrap', file);

        if (!fs.existsSync(fullPath)) {
            continue;
        }

        try {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;

            // Заменить каждый английский label на русский
            for (const [english, russian] of Object.entries(LABEL_REPLACEMENTS)) {
                const pattern = `"label": "${english}"`;
                const replacement = `"label": "${russian}"`;

                if (content.includes(pattern)) {
                    content = content.replace(new RegExp(pattern, 'g'), replacement);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`✓ ОБНОВЛЕНО: ${file}`);
                updated++;
            }
        } catch (err: any) {
            console.error(`❌ Ошибка в ${file}:`, err.message);
        }
    }

    console.log(`\n=== ИТОГ ===`);
    console.log(`Обновлено: ${updated} файлов`);
}

replaceEnglishLabels().catch(console.error);
