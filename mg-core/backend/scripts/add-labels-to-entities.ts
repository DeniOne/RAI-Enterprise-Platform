import * as fs from 'fs';
import * as path from 'path';

// Словарь переводов полей
const FIELD_LABELS: Record<string, string> = {
    // Common
    'code': 'Код',
    'name': 'Название',
    'short_name': 'Краткое название',
    'full_name': 'Полное название',
    'description': 'Описание',
    'title': 'Заголовок',
    'type': 'Тип',
    'status': 'Статус',
    'level': 'Уровень',
    'order': 'Порядок',
    'weight': 'Вес',
    'priority': 'Приоритет',
    'value': 'Значение',
    'label': 'Метка',
    'key': 'Ключ',
    'data': 'Данные',
    'config': 'Конфигурация',
    'settings': 'Настройки',
    'metadata': 'Метаданные',

    // Person/Employee
    'first_name': 'Имя',
    'last_name': 'Фамилия',
    'middle_name': 'Отчество',
    'birth_date': 'Дата рождения',
    'phone': 'Телефон',
    'email': 'Email',
    'address': 'Адрес',
    'gender': 'Пол',

    // Security
    'username': 'Имя пользователя',
    'password_hash': 'Хэш пароля',
    'is_locked': 'Заблокирован',
    'is_system': 'Системный',
    'is_active': 'Активен',
    'is_required': 'Обязательно',
    'is_public': 'Публичный',
    'is_internal': 'Внутренний',
    'rule_type': 'Тип правила',
    'enforcement': 'Уровень применения',
    'action': 'Действие',
    'resource': 'Ресурс',
    'scope': 'Область',
    'module': 'Модуль',
    'permission': 'Разрешение',
    'role_name': 'Название роли',

    // Structure
    'parent_urn': 'Родительский URN',
    'path': 'Путь',
    'legal_entity': 'Юридическое лицо',
    'org_unit_type': 'Тип подразделения',
    'org_unit': 'Подразделение',
    'organization': 'Организация',
    'relation_type': 'Тип связи',
    'from_unit': 'Из подразделения',
    'to_unit': 'В подразделение',
    'legal_name': 'Юридическое название',
    'registration_number': 'Регистрационный номер',
    'tax_id': 'ИНН',

    // Dates
    'created_at': 'Дата создания',
    'updated_at': 'Дата обновления',
    'deleted_at': 'Дата удаления',
    'valid_from': 'Действует с',
    'valid_until': 'Действует до',
    'start_date': 'Дата начала',
    'end_date': 'Дата окончания',
    'published_at': 'Дата публикации',

    // Economy
    'amount': 'Сумма',
    'currency': 'Валюта',
    'rate': 'Ставка',
    'price': 'Цена',
    'cost': 'Стоимость',
    'balance': 'Баланс',

    // Knowledge
    'content': 'Содержание',
    'body': 'Тело документа',
    'summary': 'Краткое содержание',
    'author': 'Автор',
    'tags': 'Теги',
    'duration': 'Продолжительность',
    'credits': 'Кредиты',
    'difficulty': 'Сложность',
    'category': 'Категория',

    // Process
    'state': 'Состояние',
    'state_code': 'Код состояния',
    'assignee': 'Исполнитель',
    'due_date': 'Срок выполнения',
    'owner': 'Владелец',
    'responsible': 'Ответственный',
    'handler': 'Обработчик',

    // Integration
    'url': 'URL',
    'endpoint': 'Конечная точка',
    'method': 'Метод',
    'headers': 'Заголовки',
    'payload': 'Полезная нагрузка',
    'response': 'Ответ',
    'status_code': 'Код статуса',
    'retry_count': 'Количество попыток',
    'last_sync': 'Последняя синхронизация',

    // FSM
    'initial_state': 'Начальное состояние',
    'final_states': 'Конечные состояния',
    'trigger': 'Триггер',
    'condition': 'Условие',
    'guard': 'Ограничение'
};

// Словарь переводов relationship names
const RELATIONSHIP_LABELS: Record<string, string> = {
    // Structure
    'legal_entity': 'Юридическое лицо',
    'org_unit_type': 'Тип подразделения',
    'organization': 'Организация',
    'parent': 'Родитель',
    'from_unit': 'Из подразделения',
    'to_unit': 'В подразделение',

    // Security
    'role': 'Роль',
    'permission': 'Разрешение',
    'user': 'Пользователь',
    'user_account': 'Учётная запись',
    'access_scope': 'Область доступа',

    // Common
    'owner': 'Владелец',
    'responsible': 'Ответственный',
    'author': 'Автор',
    'assignee': 'Исполнитель',
    'creator': 'Создатель',
    'modifier': 'Изменивший',

    // Knowledge
    'faculty': 'Факультет',
    'program': 'Программа',
    'course': 'Курс',
    'methodology': 'Методология',

    // Process
    'workflow': 'Рабочий процесс',
    'task_type': 'Тип задачи',
    'task_state': 'Состояние задачи'
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

function toTitleCase(str: string): string {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function addLabelsToEntities() {
    console.log('Добавление русских labels во все entity.json файлы...\n');

    let updated = 0;
    let skipped = 0;

    for (const file of ENTITY_FILES) {
        const fullPath = path.resolve(process.cwd(), 'src/registry/bootstrap', file);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠ Пропущен (не найден): ${file}`);
            skipped++;
            continue;
        }

        try {
            const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            let modified = false;

            // Добавить labels в attributes
            if (content.entity_type?.schema?.attributes) {
                for (const attr of content.entity_type.schema.attributes) {
                    if (!attr.label) {
                        attr.label = FIELD_LABELS[attr.name] || toTitleCase(attr.name);
                        modified = true;
                    }
                }
            }

            // Добавить labels в relationships
            if (content.entity_type?.schema?.relationships) {
                for (const rel of content.entity_type.schema.relationships) {
                    if (!rel.label) {
                        rel.label = RELATIONSHIP_LABELS[rel.name] || toTitleCase(rel.name);
                        modified = true;
                    }
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, JSON.stringify(content, null, 4), 'utf-8');
                console.log(`✓ ОБНОВЛЕНО: ${file}`);
                updated++;
            } else {
                console.log(`- Без изменений: ${file}`);
            }
        } catch (err: any) {
            console.error(`❌ Ошибка в ${file}:`, err.message);
        }
    }

    console.log(`\n=== ИТОГ ===`);
    console.log(`Обновлено: ${updated}`);
    console.log(`Пропущено: ${skipped}`);
}

addLabelsToEntities().catch(console.error);
