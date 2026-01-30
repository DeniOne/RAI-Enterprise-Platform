# MatrixGin v2.0 - Database Migrations & Seeds

> **PostgreSQL 16** миграции и seed данные для MatrixGin v2.0

---

## 📋 Структура

```
database/
├── migrations/          # SQL миграции (timestamped)
│   ├── 20250121000001_init_extensions.sql
│   ├── 20250121000002_create_roles_table.sql
│   ├── 20250121000003_create_departments_table.sql
│   ├── 20250121000004_create_users_table.sql
│   ├── 20250121000005_create_permissions_tables.sql
│   ├── 20250121000006_create_refresh_tokens_table.sql
│   ├── 20250121000007_create_employees_table.sql
│   ├── 20250121000008_create_employee_documents_table.sql
│   ├── 20250121000009_create_tasks_tables.sql
│   ├── 20250121000010_create_kpi_tables.sql
│   ├── 20250121000011_create_economy_tables.sql
│   ├── 20250121000012_create_compliance_tables.sql
│   ├── 20250121000013_create_emotional_analytics_table.sql
│   └── 20250121000014_create_utility_functions.sql
│
└── seeds/               # Seed данные для тестирования
    ├── 01_seed_roles_and_permissions.sql
    ├── 02_seed_departments.sql
    ├── 03_seed_test_users.sql
    └── 04_seed_test_data.sql
```

---

## 🚀 Быстрый старт

### Предварительные требования

- PostgreSQL 16+
- `psql` CLI tool
- Права на создание баз данных

### 1. Создать базу данных

```bash
# Создать базу данных
createdb matrixgin_dev

# Или через psql
psql -U postgres -c "CREATE DATABASE matrixgin_dev;"
```

### 2. Применить миграции

```bash
# Применить все миграции по порядку
cd database/migrations

# Вариант 1: Через цикл (Windows PowerShell)
Get-ChildItem -Filter "*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "Applying migration: $($_.Name)"
    psql -U postgres -d matrixgin_dev -f $_.FullName
}

# Вариант 2: Через цикл (Linux/Mac)
for file in *.sql; do
    echo "Applying migration: $file"
    psql -U postgres -d matrixgin_dev -f "$file"
done

# Вариант 3: Вручную (по одной)
psql -U postgres -d matrixgin_dev -f 20250121000001_init_extensions.sql
psql -U postgres -d matrixgin_dev -f 20250121000002_create_roles_table.sql
# ... и так далее
```

### 3. Загрузить seed данные

```bash
cd ../seeds

# Применить все seeds по порядку
psql -U postgres -d matrixgin_dev -f 01_seed_roles_and_permissions.sql
psql -U postgres -d matrixgin_dev -f 02_seed_departments.sql
psql -U postgres -d matrixgin_dev -f 03_seed_test_users.sql
psql -U postgres -d matrixgin_dev -f 04_seed_test_data.sql
```

### 4. Проверить результат

```bash
# Подключиться к БД
psql -U postgres -d matrixgin_dev

# Проверить таблицы
\dt

# Проверить пользователей
SELECT email, first_name, last_name FROM users;

# Проверить роли и разрешения
SELECT r.name, COUNT(rp.permission_id) as permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.name;

# Проверить балансы
SELECT u.email, w.mc_balance, w.gmc_balance
FROM users u
JOIN wallets w ON u.id = w.user_id;
```

---

## 📊 Созданные таблицы

### Authentication & Authorization (6 таблиц)
- `roles` - Роли пользователей
- `permissions` - Разрешения RBAC
- `role_permissions` - Связь ролей и разрешений
- `users` - Пользователи системы
- `refresh_tokens` - Refresh токены JWT

### Employee Management (3 таблицы)
- `departments` - Департаменты (с ltree иерархией)
- `employees` - Сотрудники
- `employee_documents` - Кадровые документы

### Task Management (3 таблицы)
- `tasks` - Задачи
- `task_comments` - Комментарии к задачам
- `task_history` - История изменений (партиционировано)

### KPI & Analytics (3 таблицы)
- `kpi_templates` - Шаблоны KPI
- `kpi_metrics` - KPI метрики сотрудников
- `kpi_snapshots` - Снимки KPI (партиционировано)

### MatrixCoin Economy (2 таблицы)
- `wallets` - Кошельки (MC + GMC)
- `transactions` - Транзакции (партиционировано)

### Legal & Compliance (2 таблицы)
- `audit_logs` - Журнал аудита (партиционировано)
- `consent_records` - Согласия 152-ФЗ

### Emotional Analytics (1 таблица)
- `emotional_analytics` - Эмоциональная аналитика (партиционировано)

**Итого:** 20 таблиц + партиции

---

## 🔑 Тестовые пользователи

После загрузки seeds доступны следующие пользователи:

| Email | Пароль | Роль | Департамент |
|-------|--------|------|-------------|
| admin@photomatrix.ru | Test123!@# | Администратор | IT |
| hr@photomatrix.ru | Test123!@# | HR Менеджер | HR |
| manager@photomatrix.ru | Test123!@# | Руководитель департамента | Коммерческий |
| photographer@photomatrix.ru | Test123!@# | Сотрудник | Производственный |
| sales@photomatrix.ru | Test123!@# | Сотрудник | Коммерческий |

**⚠️ ВАЖНО:** Эти пользователи только для разработки и тестирования! Не используйте в production!

---

## 🔧 Полезные функции

### Создание партиций

```sql
-- Создать партиции на год вперед для всех партиционированных таблиц
SELECT create_monthly_partitions('audit_logs', '2026-01-01', '2027-01-01');
SELECT create_monthly_partitions('transactions', '2026-01-01', '2027-01-01');
SELECT create_monthly_partitions('emotional_analytics', '2026-01-01', '2027-01-01');
SELECT create_monthly_partitions('task_history', '2026-01-01', '2027-01-01');
```

### Удаление старых партиций

```sql
-- Удалить партиции старше 24 месяцев
SELECT drop_old_partitions('audit_logs', 24);
SELECT drop_old_partitions('task_history', 24);

-- Удалить партиции старше 12 месяцев
SELECT drop_old_partitions('emotional_analytics', 12);
```

### Проверка разрешений

```sql
-- Получить все разрешения пользователя
SELECT * FROM get_user_permissions('USER_UUID_HERE');

-- Проверить конкретное разрешение
SELECT user_has_permission('USER_UUID_HERE', 'employees.read');
```

### Иерархия департаментов

```sql
-- Получить департамент и всех подчиненных
SELECT * FROM get_department_hierarchy('DEPARTMENT_UUID_HERE');
```

---

## 📈 Индексы и оптимизация

### Созданные индексы

- **B-tree индексы:** Primary keys, Foreign keys, часто фильтруемые поля
- **GIN индексы:** Full-text search, JSONB поля, массивы
- **GIST индексы:** ltree (иерархия департаментов)
- **Partial индексы:** Для активных записей (WHERE deleted_at IS NULL)
- **Composite индексы:** Для частых запросов (assignee_id + status)

### Статистика

- **Таблицы:** 20+
- **Индексы:** 60+
- **Constraints:** 30+
- **Triggers:** 8+
- **Functions:** 6+
- **Партиционированные таблицы:** 4

---

## 🔄 Партиционирование

### Партиционированные таблицы

1. **audit_logs** - по месяцам (retention: 24 месяца)
2. **transactions** - по месяцам (retention: бессрочно)
3. **emotional_analytics** - по месяцам (retention: 12 месяцев)
4. **task_history** - по месяцам (retention: 24 месяца)
5. **kpi_snapshots** - по кварталам (retention: 12 месяцев)

### Автоматическое создание

Партиции на 2025 год создаются автоматически при применении миграций.

Для создания партиций на следующий год используйте функцию `create_monthly_partitions()`.

---

## 🛡️ Безопасность

### Constraints

- Email validation (regex)
- Phone validation (российский формат +7XXXXXXXXXX)
- Positive amounts
- Date ranges validation
- Status enums
- Foreign key constraints (CASCADE, RESTRICT, SET NULL)

### Triggers

- `update_updated_at_column()` - Автообновление updated_at
- `create_wallet_for_user()` - Автосоздание кошелька при регистрации
- `generate_employee_number()` - Автогенерация номера сотрудника
- `update_wallet_balances()` - Автообновление балансов при транзакциях
- `update_department_path()` - Автообновление ltree пути

---

## 📝 Миграции в деталях

### 1. Extensions (20250121000001)
- uuid-ossp
- pgcrypto
- ltree
- pg_trgm

### 2. Roles (20250121000002)
- RBAC роли
- Иерархия уровней (0-100)

### 3. Departments (20250121000003)
- Ltree для иерархии
- Материализованный путь

### 4. Users (20250121000004)
- Аутентификация (email + password)
- Telegram integration
- Full-text search
- Soft delete

### 5. Permissions (20250121000005)
- RBAC разрешения
- Many-to-many с ролями

### 6. Refresh Tokens (20250121000006)
- JWT refresh tokens
- Metadata (IP, User-Agent)

### 7. Employees (20250121000007)
- Расширение users
- Автогенерация employee_number
- Иерархия менеджеров

### 8. Employee Documents (20250121000008)
- Кадровые документы
- КЭДО (электронная подпись)

### 9. Tasks (20250121000009)
- Smart Task Management
- NLP metadata
- Full-text search
- Партиционированная история

### 10. KPI (20250121000010)
- Шаблоны KPI
- Метрики с вычисляемыми полями
- Партиционированные снимки

### 11. Economy (20250121000011)
- Кошельки (MC + GMC)
- Партиционированные транзакции
- Автообновление балансов через triggers

### 12. Compliance (20250121000012)
- Партиционированный audit log
- Согласия 152-ФЗ

### 13. Emotional Analytics (20250121000013)
- Эмоциональный тон (0.0-4.0)
- Партиционировано по месяцам
- View для среднего состояния

### 14. Utility Functions (20250121000014)
- Управление партициями
- RBAC функции
- Business logic helpers

---

## 🔍 Проверка целостности

```sql
-- Проверить все таблицы
SELECT schemaname, tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Проверить все индексы
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Проверить все constraints
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;

-- Проверить все triggers
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgisinternal = FALSE
ORDER BY tgrelid::regclass::text;

-- Проверить партиции
SELECT 
    parent.relname AS parent_table,
    child.relname AS partition_name
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
ORDER BY parent.relname, child.relname;
```

---

## 🐛 Troubleshooting

### Ошибка: "extension already exists"
```sql
-- Нормально, расширения уже установлены
-- Миграции используют IF NOT EXISTS
```

### Ошибка: "relation already exists"
```sql
-- Таблица уже существует
-- Удалите БД и создайте заново:
DROP DATABASE matrixgin_dev;
CREATE DATABASE matrixgin_dev;
```

### Ошибка: "insufficient balance"
```sql
-- Trigger проверяет баланс перед транзакцией
-- Убедитесь что у пользователя достаточно MC/GMC
SELECT * FROM wallets WHERE user_id = 'USER_UUID';
```

---

## 📚 Дополнительная информация

- [Database ERD Schema](../documentation/02-technical-specs/Database-ERD-Schema.md)
- [API Specification](../documentation/02-technical-specs/API-Specification-OpenAPI-FULL.yaml)
- [Architecture Document](../documentation/01-strategic/MatrixGin-Architecture-v2.md)

---

**Версия:** 1.0  
**Дата:** 2025-01-21  
**Статус:** Production Ready
