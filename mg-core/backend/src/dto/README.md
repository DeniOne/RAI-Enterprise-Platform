# MatrixGin v2.0 API DTOs

TypeScript интерфейсы и Data Transfer Objects для MatrixGin v2.0 API с полной поддержкой валидации через class-validator.

## 📦 Установка

```bash
cd src/dto
npm install
```

## 🏗️ Структура

```
dto/
├── common/              # Общие типы и enum
│   ├── common.types.ts  # Базовые типы (UUID, ISODateTime, ApiResponse, Pagination)
│   ├── common.enums.ts  # Все enum (UserRole, TaskStatus, Currency, etc.)
│   └── index.ts
├── auth/                # Аутентификация
│   ├── auth.dto.ts      # Register, Login, User, Permissions
│   └── index.ts
├── employees/           # Сотрудники
│   ├── employee.dto.ts  # CRUD, Analytics, Filters
│   └── index.ts
├── departments/         # Департаменты
│   ├── department.dto.ts # Department, KPI, Muda Analysis
│   └── index.ts
├── tasks/               # Задачи
│   ├── task.dto.ts      # CRUD, NLP, Comments, Filters
│   └── index.ts
├── economy/             # Экономика (MatrixCoin)
│   ├── economy.dto.ts   # Wallet, Transactions, Auctions, Store
│   └── index.ts
├── index.ts             # Главный экспорт
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Использование

### Импорт

```typescript
// Импорт всех DTOs
import * from '@matrixgin/dto';

// Или выборочный импорт
import {
  LoginRequestDto,
  UserResponseDto,
  TaskStatus,
  EmployeeRank,
  CreateTaskRequestDto
} from '@matrixgin/dto';
```

### Примеры использования

#### 1. Аутентификация

```typescript
import { LoginRequestDto, RegisterRequestDto } from '@matrixgin/dto';

// Login
const loginDto = new LoginRequestDto();
loginDto.email = 'ivan@photomatrix.ru';
loginDto.password = 'SecurePass123!';

// Register
const registerDto = new RegisterRequestDto();
registerDto.email = 'new@photomatrix.ru';
registerDto.password = 'SecurePass123!';
registerDto.firstName = 'Иван';
registerDto.lastName = 'Иванов';
registerDto.phoneNumber = '+79991234567';
registerDto.acceptedNDA = true;
```

#### 2. Создание задачи

```typescript
import { CreateTaskRequestDto, TaskPriority } from '@matrixgin/dto';

const taskDto = new CreateTaskRequestDto();
taskDto.title = 'Проверить принтеры';
taskDto.description = 'Необходимо проверить работоспособность всех принтеров на филиале';
taskDto.priority = TaskPriority.HIGH;
taskDto.tags = ['техника', 'филиал-мира'];
```

#### 3. NLP создание задачи

```typescript
import { NLPTaskRequestDto } from '@matrixgin/dto';

const nlpDto = new NLPTaskRequestDto();
nlpDto.text = 'Проверить принтеры на Мира завтра в 10:00';
```

#### 4. Работа с сотрудниками

```typescript
import { CreateEmployeeRequestDto, EmployeeStatus, EmployeeRank } from '@matrixgin/dto';

const employeeDto = new CreateEmployeeRequestDto();
employeeDto.userId = '550e8400-e29b-41d4-a716-446655440000';
employeeDto.departmentId = '660e8400-e29b-41d4-a716-446655440000';
employeeDto.position = 'Фотограф';
employeeDto.hireDate = '2025-11-21';
employeeDto.salary = 50000;
employeeDto.status = EmployeeStatus.PHOTON;
employeeDto.rank = EmployeeRank.COLLECTOR;
```

#### 5. Экономика (MatrixCoin)

```typescript
import { CreateTransactionRequestDto, Currency, TransactionType } from '@matrixgin/dto';

// Перевод MC
const transactionDto = new CreateTransactionRequestDto();
transactionDto.type = TransactionType.TRANSFER;
transactionDto.currency = Currency.MC;
transactionDto.amount = 100;
transactionDto.recipientId = '770e8400-e29b-41d4-a716-446655440000';
transactionDto.description = 'Перевод за помощь с задачей';

// Активация сейфа
import { ActivateSafeRequestDto } from '@matrixgin/dto';

const safeDto = new ActivateSafeRequestDto();
safeDto.amount = 500; // Минимум 100 MC
```

#### 6. Фильтрация и пагинация

```typescript
import { PaginationParamsDto, TaskFiltersDto, TaskStatus } from '@matrixgin/dto';

// Пагинация
const pagination = new PaginationParamsDto();
pagination.page = 1;
pagination.limit = 20;
pagination.sortBy = 'createdAt';
pagination.sortOrder = 'desc';

// Фильтры задач
const filters = new TaskFiltersDto();
filters.status = TaskStatus.IN_PROGRESS;
filters.priority = TaskPriority.HIGH;
filters.assigneeId = '880e8400-e29b-41d4-a716-446655440000';
```

## ✅ Валидация

Все DTOs используют декораторы class-validator для автоматической валидации:

```typescript
import { validate } from 'class-validator';
import { LoginRequestDto } from '@matrixgin/dto';

const loginDto = new LoginRequestDto();
loginDto.email = 'invalid-email'; // Невалидный email
loginDto.password = '123'; // Слишком короткий пароль

const errors = await validate(loginDto);
if (errors.length > 0) {
  console.log('Validation failed:', errors);
}
```

### Правила валидации

#### Пароли
- Минимум 8 символов
- Хотя бы одна заглавная буква
- Хотя бы одна строчная буква
- Хотя бы одна цифра
- Хотя бы один спецсимвол (@$!%*?&)

#### Телефоны
- Формат: `+7XXXXXXXXXX` (российский номер)

#### Номер сотрудника
- Формат: `EMP-XXXXXX` (6 цифр)

#### Код департамента
- Формат: 2-5 заглавных букв (например, `COMM`, `HR`)

## 📊 Enum типы

### UserRole
- `admin` - Администратор системы
- `hr_manager` - HR менеджер
- `department_head` - Руководитель департамента
- `branch_manager` - Управляющий филиалом
- `employee` - Сотрудник

### EmployeeStatus (иерархия)
- `UNIVERSE` - Высший статус (основатели)
- `Звезда` - Топ-менеджмент
- `Кремень/Углерод` - Опытные сотрудники (1+ год)
- `Топчик` - Прошедшие испытательный срок
- `Фотон` - Новички

### EmployeeRank (на основе GMC)
- `Коллекционер` - 1-9 GMC
- `Инвестор` - 10-99 GMC
- `Магнат` - 100+ GMC

### TaskStatus
- `pending` - Ожидает выполнения
- `in_progress` - В процессе
- `completed` - Завершена
- `cancelled` - Отменена

### TaskPriority
- `low` - Низкий
- `medium` - Средний
- `high` - Высокий
- `urgent` - Срочный

### Currency
- `MC` - MatrixCoin (сгораемые)
- `GMC` - Golden MatrixCoin (вечные)
- `RUB` - Российский рубль

### TransactionType
- `earn` - Заработок
- `spend` - Трата
- `transfer` - Перевод
- `reward` - Награда
- `penalty` - Штраф
- `auction_bid` - Ставка на аукционе
- `auction_win` - Выигрыш на аукционе
- `store_purchase` - Покупка в магазине
- `safe_activation` - Активация сейфа

## 🔧 Компиляция

```bash
# Сборка
npm run build

# Сборка с отслеживанием изменений
npm run build:watch

# Очистка
npm run clean
```

## 📝 Типы ответов API

Все API ответы обернуты в `ApiResponse<T>`:

```typescript
{
  success: true,
  data: T,
  meta?: {
    timestamp: string,
    requestId: string,
    version: string
  }
}
```

Ошибки возвращаются в формате `ApiErrorDto`:

```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | ...,
    message: string,
    details?: object
  }
}
```

## 🎯 Пагинированные ответы

```typescript
{
  items: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

## 📚 Дополнительная информация

- Все DTOs основаны на OpenAPI спецификации MatrixGin v2.0
- Используется строгая типизация TypeScript
- Поддержка декораторов для валидации
- Готовы для использования как на фронтенде, так и на бэкенде

## 🔗 Связанные документы

- [API Specification OpenAPI FULL](../../documentation/02-technical-specs/API-Specification-OpenAPI-FULL.yaml)
- [API Endpoints Catalog](../../documentation/02-technical-specs/API-Endpoints-Catalog.md)
- [MatrixGin Architecture v2](../../documentation/01-strategic/MatrixGin-Architecture-v2.md)

---

**Версия:** 2.0.0  
**Автор:** Photomatrix Development Team  
**Лицензия:** Proprietary
