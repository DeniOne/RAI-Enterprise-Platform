# Implementation Plan: Sprint 5a — Architecture Debt Resolution

**Дата:** 2026-02-03  
**Sprint:** 5a (Technical Debt)  
**Phase:** Alpha  
**Статус:** PLANNING

---

## Цель

Закрыть критический технический долг, выявленный Architecture Audit Sprint 4:
- **ARCH-DEBT-001:** Multi-tenancy отсутствует (CRITICAL)
- **ARCH-DEBT-002:** Auth Repository отсутствует (HIGH)
- **ARCH-DEBT-003:** Web Orchestrator не реализован (MEDIUM)

---

## User Review Required

> [!WARNING]
> **Breaking Changes**
> - Prisma schema изменится: добавится `User.companyId` (NOT NULL)
> - Все существующие пользователи должны быть привязаны к Company
> - API endpoints изменят поведение: фильтрация по `companyId`

> [!IMPORTANT]
> **Migration Strategy**
> - Создать default Company для существующих пользователей
> - Миграция данных: `UPDATE users SET companyId = <default_company_id>`
> - После миграции: тестирование multi-tenancy изоляции

---

## Proposed Changes

### ARCH-DEBT-001: Multi-tenancy Implementation

#### Prisma Schema Changes

##### [MODIFY] [schema.prisma](file:///f:/RAI_EP/packages/prisma-client/prisma/schema.prisma)

**Изменения:**
1. Добавить `companyId` в модель [User](file:///f:/RAI_EP/apps/web/app/dashboard/page.tsx#5-10):
   ```prisma
   model User {
     id        String   @id @default(uuid())
     email     String   @unique
     name      String?
     companyId String   // NEW: NOT NULL
     company   Company  @relation(fields: [companyId], references: [id])
     // ... existing fields
   }
   ```

2. Добавить relation в модель `Company`:
   ```prisma
   model Company {
     id    String @id @default(uuid())
     name  String
     users User[] // NEW: reverse relation
     // ... existing fields
   }
   ```

3. Создать миграцию:
   ```bash
   cd packages/prisma-client
   pnpm prisma migrate dev --name add_user_company_relation
   ```

---

#### Auth Module Changes

##### [MODIFY] [auth.service.ts](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.service.ts)

**Изменения:**
1. Обновить [validateUser()](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.service.ts#13-32):
   ```typescript
   async validateUser(email: string, password: string): Promise<any> {
     const user = await this.prisma.user.findUnique({
       where: { email },
       include: { company: true }, // NEW: include company
     });
     // ... validation logic
   }
   ```

2. Обновить [login()](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.service.ts#33-51):
   ```typescript
   async login(email: string, password: string) {
     const user = await this.validateUser(email, password);
     
     const payload = {
       email: user.email,
       sub: user.id,
       companyId: user.companyId, // NEW: from user.companyId
     };
     // ... rest
   }
   ```

3. Обновить [getProfile()](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.controller.ts#21-24):
   ```typescript
   async getProfile(userId: string) {
     return this.prisma.user.findUnique({
       where: { id: userId },
       include: { company: true }, // NEW: include company
     });
   }
   ```

---

#### API Endpoints: Multi-tenancy Filtering

##### [MODIFY] [tasks.service.ts](file:///f:/RAI_EP/apps/api/src/agro/tasks/tasks.service.ts)

**Изменения:**
Добавить фильтрацию по `companyId` во все методы:

```typescript
async findAll(companyId: string) {
  return this.prisma.task.findMany({
    where: { companyId }, // NEW: filter by companyId
  });
}

async findOne(id: string, companyId: string) {
  return this.prisma.task.findFirst({
    where: { id, companyId }, // NEW: filter by companyId
  });
}

async create(data: CreateTaskDto, companyId: string) {
  return this.prisma.task.create({
    data: { ...data, companyId }, // NEW: set companyId
  });
}
```

**Аналогично для:**
- `fields.service.ts`
- `seasons.service.ts`
- `crops.service.ts`

---

#### Controllers: Extract companyId from JWT

##### [MODIFY] [tasks.controller.ts](file:///f:/RAI_EP/apps/api/src/agro/tasks/tasks.controller.ts)

**Изменения:**
Извлекать `companyId` из JWT payload:

```typescript
@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  async findAll(@Request() req) {
    const companyId = req.user.companyId; // NEW: from JWT
    return this.tasksService.findAll(companyId);
  }

  @Post()
  async create(@Body() data: CreateTaskDto, @Request() req) {
    const companyId = req.user.companyId; // NEW: from JWT
    return this.tasksService.create(data, companyId);
  }
}
```

**Аналогично для:**
- `fields.controller.ts`
- `seasons.controller.ts`

---

#### Dashboard: Multi-tenancy Awareness

##### [MODIFY] [dashboard/page.tsx](file:///f:/RAI_EP/apps/web/app/dashboard/page.tsx)

**Изменения:**
Dashboard уже использует JWT с `companyId`, но нужно добавить отображение:

```typescript
async function getUserData(): Promise<User | null> {
  // ... existing code
  const data = await response.json();
  return data; // теперь включает company: { id, name }
}

export default async function DashboardPage() {
  const user = await getUserData();
  
  return (
    <div>
      <h1>Привет, {user.name}!</h1>
      <p>Компания: {user.company.name}</p> {/* NEW */}
      {/* ... rest */}
    </div>
  );
}
```

---

### ARCH-DEBT-002: Auth Repository Pattern

#### Repository Interface

##### [NEW] [user.repository.interface.ts](file:///f:/RAI_EP/apps/api/src/shared/auth/repositories/user.repository.interface.ts)

```typescript
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
}
```

---

#### Repository Implementation

##### [NEW] [user.repository.ts](file:///f:/RAI_EP/apps/api/src/shared/auth/repositories/user.repository.ts)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rai/prisma-client';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async create(data: any) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }
}
```

---

#### Auth Service: Use Repository

##### [MODIFY] [auth.service.ts](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.service.ts)

**Изменения:**
Заменить `PrismaService` на `UserRepository`:

```typescript
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository, // NEW: inject repository
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email); // NEW: use repository
    // ... validation logic
  }

  async getProfile(userId: string) {
    return this.userRepository.findById(userId); // NEW: use repository
  }
}
```

---

#### Auth Module: Register Repository

##### [MODIFY] [auth.module.ts](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.module.ts)

```typescript
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [PrismaModule, PassportModule, JwtModule.register({...})],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    JwtStrategy,
    UserRepository, // NEW: register repository
  ],
  exports: [AuthService, UserRepository], // NEW: export repository
})
export class AuthModule {}
```

---

### ARCH-DEBT-003: Web Orchestrator (OPTIONAL для Sprint 5a)

> [!NOTE]
> Web Orchestrator — MEDIUM priority. Можно отложить на Sprint 6.

#### Orchestrator Service

##### [NEW] [web-orchestrator.service.ts](file:///f:/RAI_EP/apps/api/src/orchestrator/web-orchestrator.service.ts)

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebOrchestratorService {
  async createTaskFlow(data: CreateTaskDto, userId: string) {
    // 1. Validate task data
    // 2. Create task
    // 3. Update statistics
    // 4. Send notification (future)
    // 5. Return result
  }
}
```

**Решение:** Отложить на Sprint 6, сейчас не критично.

---

## Verification Plan

### Automated Tests

**Unit Tests:**
```bash
# Test UserRepository
cd apps/api
pnpm test user.repository.spec.ts

# Test AuthService with Repository
pnpm test auth.service.spec.ts
```

**Integration Tests:**
```bash
# Test multi-tenancy isolation
pnpm test:e2e auth.e2e-spec.ts
pnpm test:e2e tasks.e2e-spec.ts
```

### Manual Verification

**1. Multi-tenancy Isolation:**
- Создать 2 компании в БД
- Создать по 1 пользователю в каждой компании
- Залогиниться под User1 → проверить, что видны только задачи Company1
- Залогиниться под User2 → проверить, что видны только задачи Company2

**2. Auth Repository:**
- Проверить, что [AuthService](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.service.ts#6-69) не использует `PrismaService` напрямую
- Проверить, что все методы работают через `UserRepository`

**3. Dashboard:**
- Проверить, что отображается название компании
- Проверить, что метрики фильтруются по `companyId`

---

## Rollback Conditions

**Критичные проблемы:**
1. Миграция Prisma не применяется (ошибки в schema)
2. Существующие пользователи не могут залогиниться (нет `companyId`)
3. Multi-tenancy изоляция не работает (утечка данных между компаниями)

**Действия при rollback:**
1. Откатить миграцию: `pnpm prisma migrate resolve --rolled-back <migration_name>`
2. Восстановить предыдущую версию [auth.service.ts](file:///f:/RAI_EP/apps/api/src/shared/auth/auth.service.ts)
3. Зафиксировать проблему в DECISIONS.log
4. Запросить уточнение у USER

---

## Dependencies

- Prisma schema migration
- Существующие пользователи в БД
- Существующие компании в БД (или создать default)

---

## Risks

1. **Data Migration:** Все существующие пользователи должны быть привязаны к Company
2. **Breaking Changes:** API endpoints изменят поведение (фильтрация по `companyId`)
3. **Testing Complexity:** Нужно протестировать изоляцию между компаниями

---

## Timeline

**Sprint 5a (Technical Debt):**
- Day 1-2: ARCH-DEBT-001 (Multi-tenancy) — Prisma migration, Auth Service
- Day 3: ARCH-DEBT-001 (Multi-tenancy) — API endpoints, Controllers
- Day 4: ARCH-DEBT-002 (Auth Repository) — Repository pattern
- Day 5: Verification & Testing
- Day 6: ARCH-DEBT-003 (Web Orchestrator) — OPTIONAL, можно отложить

**Total:** 5-6 дней

---

## Next Steps (After Sprint 5a)

**Sprint 5b:**
- Swagger документация API
- Rate limiting для `/auth/login`
- Централизованная обработка ошибок

**Sprint 6:**
- Web Orchestrator (ARCH-DEBT-003)
- Пилот с тестовыми хозяйствами
- Сбор обратной связи
