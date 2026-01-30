import * as fs from 'fs';
import * as path from 'path';

// **ПОЛНЫЙ** словарь замен - ВСЕ английские labels
const ALL_LABELS: Record<string, string> = {
    // Только что нашли
    'Color': 'Цвет',
    'Value Metrics': 'Метрики ценности',

    // Из последнего grep
    'Parent Cpk': 'Родительский ЦПК',
    'Child Cpk': 'Дочерний ЦПК',
    'Position': 'Должность',
    'Employee': 'Сотрудник',
    'Person': 'Физическое лицо',
    'Agent Type': 'Тип агента',
    'Model Id': 'ID модели',
    'Capabilities': 'Возможности',
    'Actor Type': 'Тип актора',
    'Contact Email': 'Контактный Email',
    'Contact Phone': 'Контактный телефон',
    'Hire Date': 'Дата найма',
    'Termination Date': 'Дата увольнения',
    'Retention Days': 'Дни хранения',
    'Days': 'Дни',
    'Retention Period (Days)': 'Период хранения (дни)',
    'Action on Expiry': 'Действие по истечении',
    'Type': 'Тип',
    'Enforcement': 'Применение',
    'Enforcement Level': 'Уровень применения',
    'Scope Type': 'Тип области',
    'Username': 'Имя пользователя',
    'Status': 'Статус',
    'Active': 'Активен',
    'Inactive': 'Неактивен',
    'Created At': 'Дата создания',
    'Roles': 'Роли',
    'Registered': 'Зарегистрирован',
    'Initial Status': 'Начальный статус',
    'Initial State Code': 'Код начального состояния',
    'States': 'Состояния',
    'Transitions': 'Переходы',
    'From Entity Type Urn': 'URN типа сущности (от)',
    'To Entity Type Urn': 'URN типа сущности (к)',
    'Cardinality': 'Множественность',
    'Data Type': 'Тип данных',
    'Is Unique': 'Уникальное',
    'Ui Visibility': 'Видимость в UI',
    'Urn': 'URN',
    'Version': 'Версия',
    'Is Abstract': 'Абстрактный',
    'Lifecycle Fsm Urn': 'URN жизненного цикла FSM',

    // Из предыдущих прогонов
    'Relation Type': 'Тип связи',
    'Short Name': 'Краткое название',
    'Full Name': 'Полное название',
    'First Name': 'Имя',
    'Last Name': 'Фамилия',
    'Middle Name': 'Отчество',
    'Birth Date': 'Дата рождения',
    'Rule Type': 'Тип правила',
    'Action': 'Действие',
    'Resource': 'Ресурс',
    'Scope': 'Область',
    'Module': 'Модуль',
    'From Unit': 'Из подразделения',
    'To Unit': 'В подразделение',
    'Legal Entity': 'Юридическое лицо',
    'Org Unit Type': 'Тип подразделения',
    'Org Unit': 'Подразделение',
    'Organization': 'Организация',
    'Parent': 'Родитель',
    'User Account': 'Учётная запись',
    'Access Scope': 'Область доступа',
    'Task Type': 'Тип задачи',
    'Task State': 'Состояние задачи',
    'Workflow': 'Рабочий процесс',
    'Program': 'Программа',
    'Course': 'Курс',
    'Faculty': 'Факультет',
    'Target Url': 'URL назначения',
    'Events': 'События',
    'Secret': 'Секрет',
    'System Type': 'Тип системы',
    'Endpoint Url': 'URL конечной точки',
    'Auth Type': 'Тип аутентификации',
    'Document Type': 'Тип документа',
    'Template Urn': 'URN шаблона',
    'Inn': 'ИНН',
    'Kpp': 'КПП',
    'Ogrn': 'ОГРН',
    'Legal Address': 'Юридический адрес',
    'Content Type': 'Тип контента',
    'Duration Hours': 'Продолжительность (часы)',
    'Duration Weeks': 'Продолжительность (недели)',
    'Trigger Event': 'Событие-триггер',
    'Default Priority': 'Приоритет по умолчанию',
    'State Order': 'Порядок состояния',
    'Is Final': 'Конечное',
    'Token': 'Токен',
    'Symbol': 'Символ',
    'Is Transferable': 'Передаваемый',
    'Category': 'Категория',
    'Level Order': 'Порядок уровня',
    'Qualification': 'Квалификация',
    'Cpk': 'ЦПК',
    'Owner Position': 'Должность владельца',
    'Function Group': 'Группа функций',
    'Headcount': 'Численность',
    'Structural Role': 'Структурная роль'
};

async function replaceAllLabels() {
    console.log('Финальная замена ВСЕХ английских labels...\n');

    const files = fs.readdirSync('src/registry/bootstrap', { recursive: true, withFileTypes: true });
    const entityFiles = files
        .filter(f => f.isFile() && f.name.endsWith('.entity.json'))
        .map(f => path.join(f.path, f.name));

    let updated = 0;
    let totalReplacements = 0;

    for (const file of entityFiles) {
        try {
            let content = fs.readFileSync(file, 'utf-8');
            let fileModified = false;
            let fileReplacements = 0;

            for (const [english, russian] of Object.entries(ALL_LABELS)) {
                const pattern = `"label": "${english}"`;
                const replacement = `"label": "${russian}"`;

                const count = (content.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                if (count > 0) {
                    content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
                    fileModified = true;
                    fileReplacements += count;
                    totalReplacements += count;
                }
            }

            if (fileModified) {
                fs.writeFileSync(file, content, 'utf-8');
                console.log(`✓ ${path.relative('src/registry/bootstrap', file)} — ${fileReplacements} замен`);
                updated++;
            }
        } catch (err: any) {
            console.error(`❌ ${file}:`, err.message);
        }
    }

    console.log(`\n=== ФИНАЛЬНЫЙ ИТОГ ===`);
    console.log(`Обновлено файлов: ${updated}`);
    console.log(`Всего замен: ${totalReplacements}`);
}

replaceAllLabels().catch(console.error);
