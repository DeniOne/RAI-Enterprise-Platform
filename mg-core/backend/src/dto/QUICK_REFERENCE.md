# MatrixGin v2.0 DTOs - Quick Reference

## 🚀 Быстрый старт

### Установка

```bash
cd "e:\Google Drive\Photomatrix_Global\РЕФОРМА\Matrix_Gin\src\dto"
npm install
npm run build
```

### Импорт

```typescript
// Все DTOs
import * from '@matrixgin/dto';

// Выборочно
import {
  LoginRequestDto,
  CreateTaskRequestDto,
  TaskStatus,
  EmployeeRank,
  Currency
} from '@matrixgin/dto';
```

---

## 📋 Основные DTOs

### Authentication

```typescript
// Регистрация
const registerDto = new RegisterRequestDto();
registerDto.email = 'user@photomatrix.ru';
registerDto.password = 'SecurePass123!';
registerDto.firstName = 'Иван';
registerDto.lastName = 'Иванов';
registerDto.phoneNumber = '+79991234567';
registerDto.acceptedNDA = true;

// Вход
const loginDto = new LoginRequestDto();
loginDto.email = 'user@photomatrix.ru';
loginDto.password = 'SecurePass123!';
```

### Tasks

```typescript
// Создание задачи
const taskDto = new CreateTaskRequestDto();
taskDto.title = 'Проверить принтеры';
taskDto.description = 'Проверить работоспособность всех принтеров на филиале';
taskDto.priority = TaskPriority.HIGH;
taskDto.tags = ['техника', 'филиал'];

// NLP создание
const nlpDto = new NLPTaskRequestDto();
nlpDto.text = 'Проверить принтеры на Мира завтра в 10:00';
```

### Employees

```typescript
// Создание сотрудника
const employeeDto = new CreateEmployeeRequestDto();
employeeDto.userId = 'uuid-here';
employeeDto.departmentId = 'uuid-here';
employeeDto.position = 'Фотограф';
employeeDto.hireDate = '2025-11-21';
employeeDto.salary = 50000;
employeeDto.status = EmployeeStatus.PHOTON;
employeeDto.rank = EmployeeRank.COLLECTOR;
```

### Economy

```typescript
// Перевод MC
const transactionDto = new CreateTransactionRequestDto();
transactionDto.type = TransactionType.TRANSFER;
transactionDto.currency = Currency.MC;
transactionDto.amount = 100;
transactionDto.recipientId = 'uuid-here';
transactionDto.description = 'Перевод за помощь';

// Активация сейфа
const safeDto = new ActivateSafeRequestDto();
safeDto.amount = 500; // Минимум 100 MC

// Ставка на аукционе
const bidDto = new PlaceBidRequestDto();
bidDto.amount = 1500;

// Покупка в магазине
const purchaseDto = new PurchaseItemRequestDto();
purchaseDto.itemId = 'uuid-here';
purchaseDto.quantity = 1;
```

---

## 🔍 Фильтрация и пагинация

```typescript
// Пагинация
const pagination = new PaginationParamsDto();
pagination.page = 1;
pagination.limit = 20;
pagination.sortBy = 'createdAt';
pagination.sortOrder = 'desc';

// Фильтры задач
const taskFilters = new TaskFiltersDto();
taskFilters.status = TaskStatus.IN_PROGRESS;
taskFilters.priority = TaskPriority.HIGH;
taskFilters.assigneeId = 'uuid-here';
taskFilters.search = 'принтер';

// Фильтры сотрудников
const employeeFilters = new EmployeeFiltersDto();
employeeFilters.departmentId = 'uuid-here';
employeeFilters.status = EmployeeStatus.STAR;
employeeFilters.rank = EmployeeRank.INVESTOR;
employeeFilters.minEmotionalTone = 2.5;
employeeFilters.search = 'Иван';
```

---

## 📊 Enum типы

### UserRole
```typescript
UserRole.ADMIN              // admin
UserRole.HR_MANAGER         // hr_manager
UserRole.DEPARTMENT_HEAD    // department_head
UserRole.BRANCH_MANAGER     // branch_manager
UserRole.EMPLOYEE           // employee
```

### EmployeeStatus (иерархия)
```typescript
EmployeeStatus.UNIVERSE       // UNIVERSE - Основатели
EmployeeStatus.STAR           // Звезда - Топ-менеджмент
EmployeeStatus.FLINT_CARBON   // Кремень/Углерод - Опытные (1+ год)
EmployeeStatus.TOPCHIK        // Топчик - Прошли испытательный срок
EmployeeStatus.PHOTON         // Фотон - Новички
```

### EmployeeRank (по GMC)
```typescript
EmployeeRank.COLLECTOR  // Коллекционер - 1-9 GMC
EmployeeRank.INVESTOR   // Инвестор - 10-99 GMC
EmployeeRank.MAGNATE    // Магнат - 100+ GMC
```

### TaskStatus
```typescript
TaskStatus.PENDING       // pending
TaskStatus.IN_PROGRESS   // in_progress
TaskStatus.COMPLETED     // completed
TaskStatus.CANCELLED     // cancelled
```

### TaskPriority
```typescript
TaskPriority.LOW      // low
TaskPriority.MEDIUM   // medium
TaskPriority.HIGH     // high
TaskPriority.URGENT   // urgent
```

### Currency
```typescript
Currency.MC   // MatrixCoin (сгораемые)
Currency.GMC  // Golden MatrixCoin (вечные)
Currency.RUB  // Российский рубль
```

### TransactionType
```typescript
TransactionType.EARN              // earn
TransactionType.SPEND             // spend
TransactionType.TRANSFER          // transfer
TransactionType.REWARD            // reward
TransactionType.PENALTY           // penalty
TransactionType.AUCTION_BID       // auction_bid
TransactionType.AUCTION_WIN       // auction_win
TransactionType.STORE_PURCHASE    // store_purchase
TransactionType.SAFE_ACTIVATION   // safe_activation
```

---

## ✅ Валидация

### Автоматическая валидация

```typescript
import { validate } from 'class-validator';

const dto = new LoginRequestDto();
dto.email = 'invalid-email';
dto.password = '123';

const errors = await validate(dto);
if (errors.length > 0) {
  console.log('Validation errors:', errors);
}
```

### Правила валидации

#### Пароль
- ✅ Минимум 8 символов
- ✅ Хотя бы одна заглавная буква
- ✅ Хотя бы одна строчная буква
- ✅ Хотя бы одна цифра
- ✅ Хотя бы один спецсимвол (@$!%*?&)

Пример: `SecurePass123!`

#### Телефон
- ✅ Формат: `+7XXXXXXXXXX`

Пример: `+79991234567`

#### Номер сотрудника
- ✅ Формат: `EMP-XXXXXX`

Пример: `EMP-000123`

#### Код департамента
- ✅ Формат: 2-5 заглавных букв

Примеры: `COMM`, `HR`, `SALES`

#### Email
- ✅ Стандартный email формат
- ✅ Минимум 5 символов
- ✅ Максимум 255 символов

Пример: `ivan@photomatrix.ru`

---

## 🎯 API Response

### Успешный ответ

```typescript
{
  success: true,
  data: {
    // Данные ответа
  },
  meta: {
    timestamp: '2025-11-21T15:30:00Z',
    requestId: 'uuid-here',
    version: '2.0.0'
  }
}
```

### Ошибка

```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Описание ошибки',
    details: {
      // Дополнительные детали
    }
  }
}
```

### Пагинированный ответ

```typescript
{
  items: [
    // Массив элементов
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

---

## 🔧 Backend Integration (NestJS)

```typescript
import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import {
  LoginRequestDto,
  AuthResponseDto,
  CreateTaskRequestDto,
  TaskResponseDto,
  PaginationParamsDto,
  TaskFiltersDto,
  PaginatedResponse
} from '@matrixgin/dto';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    // Автоматическая валидация
    return this.authService.login(dto);
  }
}

@Controller('tasks')
export class TasksController {
  @Post()
  async create(@Body() dto: CreateTaskRequestDto): Promise<TaskResponseDto> {
    return this.tasksService.create(dto);
  }

  @Get()
  async findAll(
    @Query() pagination: PaginationParamsDto,
    @Query() filters: TaskFiltersDto
  ): Promise<PaginatedResponse<TaskResponseDto>> {
    return this.tasksService.findAll(pagination, filters);
  }
}
```

---

## 💻 Frontend Integration

### React

```typescript
import { useState } from 'react';
import { LoginRequestDto, TaskStatus } from '@matrixgin/dto';
import { validate } from 'class-validator';

function LoginForm() {
  const [dto] = useState(new LoginRequestDto());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = await validate(dto);
    if (errors.length > 0) {
      console.error('Validation errors:', errors);
      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });

    const data = await response.json();
    // Обработка ответа
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={dto.email}
        onChange={(e) => dto.email = e.target.value}
      />
      <input
        type="password"
        value={dto.password}
        onChange={(e) => dto.password = e.target.value}
      />
      <button type="submit">Войти</button>
    </form>
  );
}
```

### Vue

```typescript
import { ref } from 'vue';
import { LoginRequestDto } from '@matrixgin/dto';
import { validate } from 'class-validator';

export default {
  setup() {
    const dto = ref(new LoginRequestDto());

    const handleLogin = async () => {
      const errors = await validate(dto.value);
      if (errors.length > 0) {
        console.error('Validation errors:', errors);
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto.value)
      });

      const data = await response.json();
      // Обработка ответа
    };

    return { dto, handleLogin };
  }
};
```

---

## 📚 Полезные ссылки

- [README.md](./README.md) - Полная документация
- [Walkthrough](../../../.gemini/antigravity/brain/f9cf698d-99f8-414e-96b0-b177994c9330/walkthrough.md) - Обзор реализации
- [OpenAPI Spec](../../documentation/02-technical-specs/API-Specification-OpenAPI-FULL.yaml) - API спецификация
- [class-validator docs](https://github.com/typestack/class-validator) - Документация валидатора

---

**Версия:** 2.0.0  
**Обновлено:** 2025-11-21
