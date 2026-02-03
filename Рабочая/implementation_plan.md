# Спринт 4: Веб-интерфейс — Implementation Plan

> **Статус:** DRAFT | **Дата:** 2026-02-03 | **Роль:** TECHLEAD  
> **Scope:** Phase Alpha, Sprint 4 (05.08 - 19.08)

---

## FOUNDATION CHECK ✅

### 1. Проверка канонических документов

#### ✅ CANON.md
- Соответствие: **ДА**
- Модульность: Веб-приложение будет отдельным модулем в `apps/web`
- Admission Principle: JWT-аутентификация через Identity Service
- Трассируемость: Все решения зафиксированы в данном плане

#### ✅ ARCHITECTURAL_AXIOMS.md
- Модульная структура: `apps/web` — отдельная зона ответственности
- Нет скрытых зависимостей: Взаимодействие только через API
- Admission: Все входы через JWT-токены

#### ✅ FORBIDDEN.md
- Не создаём новые сущности в БД
- Не меняем публичные интерфейсы API
- Не оптимизируем без запроса

#### ✅ LANGUAGE_POLICY.md
- Весь текст интерфейса: **СТРОГО НА РУССКОМ**
- Английский только для: имён файлов, переменных, функций, API endpoints

#### ✅ UI_DESIGN_CANON.md
- **Статус:** СОЗДАН
- **Путь:** [docs/01-ARCHITECTURE/PRINCIPLES/UI_DESIGN_CANON.md](file:///f:/RAI_EP/docs/01-ARCHITECTURE/PRINCIPLES/UI_DESIGN_CANON.md)
- **Версия:** v0.1
- **Требования:**
  - Шрифт: `Geist`
  - Заголовки: `font-medium` (weight: 500)
  - Основной текст: `font-normal` (weight: 400)
  - **ЗАПРЕЩЕНО:** `font-bold`, `font-semibold`
  - Светлая тема, `bg-white`, `border-black/10`, `rounded-2xl`

#### ✅ DECISIONS.log
- **Статус:** СОЗДАН
- **Путь:** [DECISIONS.log](file:///f:/RAI_EP/DECISIONS.log) (корень проекта)
- **Decision-ID:** `SPRINT4-WEB-001` (PENDING USER APPROVAL)
- **Decision-ID:** `UI-CANON-001` (ACCEPTED)

#### ✅ Multi-tenancy
- Все запросы к API будут включать `companyId` через JWT

#### ✅ Security Canon
- JWT-аутентификация
- HttpOnly cookies для токенов
- CORS настройка для API

---

## User Review Required

> [!CAUTION]
> **КРИТИЧЕСКИЙ BLOCKER — требует немедленного решения:**

### Dashboard: новый или обновление существующего?

**Проблема:**  
В [SCOPE.md](file:///f:/RAI_EP/docs/06-IMPLEMENTATION/PHASE_ALPHA/SCOPE.md) стоит галочка:
```
- [x] Dashboard: Обновление UI по Canon
```

Но в плане указано:
```
[NEW] src/app/dashboard/page.tsx
```

Это **логическое противоречие**.

**Варианты:**
1. **Dashboard УЖЕ существует** → нужно обновить существующий файл по UI Canon
2. **Dashboard НЕ существует** → создаём новый `apps/web/src/app/dashboard/page.tsx`
3. **Dashboard в другом месте** (не в `apps/web`) → нужно уточнить путь

**Без ответа на этот вопрос план нельзя считать утверждённым.**

---

> [!NOTE]
> **Решённые проблемы (больше не требуют утверждения):**
> 
> ✅ **UI_DESIGN_CANON.md** — создан как [docs/01-ARCHITECTURE/PRINCIPLES/UI_DESIGN_CANON.md](file:///f:/RAI_EP/docs/01-ARCHITECTURE/PRINCIPLES/UI_DESIGN_CANON.md) v0.1  
> ✅ **DECISIONS.log** — создан в корне проекта с Decision-ID: `SPRINT4-WEB-001` и `UI-CANON-001`

---

## Proposed Changes

### Компонент 1: Инфраструктура Next.js

#### [NEW] [apps/web](file:///f:/RAI_EP/apps/web)

**Структура:**
```
apps/web/
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.local
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   └── auth/
│   │       └── LoginForm.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── auth.ts
│   └── styles/
│       └── globals.css
```

**Технологии:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS (для Geist шрифта и утилит)
- React Hook Form (формы)
- Zod (валидация)

**Зависимости:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "geist": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

### Компонент 2: Аутентификация (JWT)

#### [NEW] [src/lib/auth.ts](file:///f:/RAI_EP/apps/web/src/lib/auth.ts)

**Функциональность:**
- Хранение JWT в HttpOnly cookies
- Middleware для защиты роутов
- Автоматическое обновление токенов
- Logout функция

**API Integration:**
- POST `/api/auth/login` → получение JWT
- GET `/api/users/me` → получение профиля
- POST `/api/auth/logout` → выход

#### [NEW] [src/components/auth/LoginForm.tsx](file:///f:/RAI_EP/apps/web/src/components/auth/LoginForm.tsx)

**UI Требования:**
- Форма: email, password
- Кнопка "Войти" (font-medium, rounded-2xl)
- Ошибки валидации на русском
- Светлая тема, bg-white карточка

---

### ⚠️ JWT Authentication Constraints (КРИТИЧНО)

> [!IMPORTANT]
> **Архитектурное ограничение для предотвращения проблем с SSR и Edge Runtime**

#### Проблема
Next.js 14 App Router работает в трёх контекстах:
- **Server Components** (Node.js Runtime)
- **Edge Middleware** (Edge Runtime, ограничения Node.js API)
- **Client Components** (Browser)

JWT + HttpOnly cookies требуют чёткого разделения ответственности.

#### Решение (ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ)

**1. Auth работает через Server Actions / Route Handlers**

```typescript
// app/api/auth/login/route.ts (Server-side)
export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // Вызов внешнего API
  const response = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  const { token } = await response.json();
  
  // Установка HttpOnly cookie
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return NextResponse.json({ success: true });
}
```

**2. Axios ТОЛЬКО для client-side API calls**

```typescript
// lib/api.ts
import axios from 'axios';

// Axios используется ТОЛЬКО в Client Components
// для запросов, которые НЕ требуют SSR
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Отправляет cookies автоматически
});
```

**3. Middleware читает cookies на Edge Runtime**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

**4. Server Components получают данные через fetch**

```typescript
// app/dashboard/page.tsx (Server Component)
import { cookies } from 'next/headers';

async function getDashboardData() {
  const token = cookies().get('auth_token')?.value;
  
  const response = await fetch('http://localhost:4000/api/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return response.json();
}

export default async function DashboardPage() {
  const user = await getDashboardData();
  return <div>Привет, {user.name}</div>;
}
```

#### Запрещено

❌ Использовать axios в Server Components  
❌ Читать cookies в Client Components  
❌ Использовать Node.js API в Middleware (Edge Runtime)  
❌ Хранить JWT в localStorage (только HttpOnly cookies)  

#### Проверка

- [ ] Auth логика в `app/api/auth/**/route.ts` (Server-side)
- [ ] Middleware использует только Edge-совместимые API
- [ ] Server Components используют `fetch` с `Authorization` header
- [ ] Client Components используют axios ТОЛЬКО для client-side запросов
- [ ] JWT хранится в HttpOnly cookies

---

### Компонент 3: Dashboard

#### [NEW] [src/app/dashboard/page.tsx](file:///f:/RAI_EP/apps/web/src/app/dashboard/page.tsx)

**Функциональность:**
- Приветствие пользователя (имя из JWT)
- Статистика: количество задач, полей, сезонов
- Карточки с метриками
- Навигация к форме создания задачи

**UI Требования (Canon):**
- Шрифт: Geist
- Заголовки: font-medium (не bold!)
- Карточки: bg-white, border-black/10, rounded-2xl
- Светлая тема
- Пространство между элементами (breathing design)

**API Calls:**
- GET `/api/users/me`
- GET `/api/tasks` (для статистики)
- GET `/api/fields` (для статистики)

---

### Компонент 4: Форма создания задачи

#### [NEW] [src/app/dashboard/tasks/create/page.tsx](file:///f:/RAI_EP/apps/web/src/app/dashboard/tasks/create/page.tsx)

**Поля формы:**
- Название задачи (текст)
- Описание (textarea)
- Поле (select, данные из `/api/fields`)
- Тип задачи (select)
- Дата начала (date picker)
- Приоритет (select)

**Валидация:**
- Zod schema
- Сообщения об ошибках на русском

**API Integration:**
- POST `/api/tasks` → создание задачи
- GET `/api/fields` → список полей для select

**UI Требования:**
- Форма в карточке (bg-white, rounded-2xl)
- Кнопка "Создать задачу" (font-medium)
- Inputs: border-black/10, rounded-lg
- Labels: font-normal

---

### Компонент 5: UI Kit (Переиспользуемые компоненты)

#### [NEW] [src/components/ui/Button.tsx](file:///f:/RAI_EP/apps/web/src/components/ui/Button.tsx)

**Варианты:**
- Primary: bg-black, text-white, rounded-2xl, font-medium
- Secondary: bg-white, border-black/10, rounded-2xl, font-medium

#### [NEW] [src/components/ui/Card.tsx](file:///f:/RAI_EP/apps/web/src/components/ui/Card.tsx)

**Стиль:**
- bg-white
- border-black/10
- rounded-2xl
- padding: p-6

#### [NEW] [src/components/ui/Input.tsx](file:///f:/RAI_EP/apps/web/src/components/ui/Input.tsx)

**Стиль:**
- border-black/10
- rounded-lg
- font-normal
- focus:ring-black/20

---

### Компонент 6: Конфигурация

#### [NEW] [tailwind.config.js](file:///f:/RAI_EP/apps/web/tailwind.config.js)

**Настройки:**
```js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
}
```

#### [NEW] [src/styles/globals.css](file:///f:/RAI_EP/apps/web/src/styles/globals.css)

**Импорт Geist:**
```css
@import 'geist/font/sans';
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Geist', sans-serif;
  font-weight: 400; /* font-normal */
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 500; /* font-medium */
}
```

---

### Компонент 7: API Client

#### [NEW] [src/lib/api.ts](file:///f:/RAI_EP/apps/web/src/lib/api.ts)

**Функциональность:**
- Axios instance с baseURL
- Автоматическое добавление JWT из cookies
- Обработка ошибок (401 → redirect to login)
- Типизация запросов/ответов

**Endpoints:**
```typescript
export const api = {
  auth: {
    login: (email: string, password: string) => POST('/auth/login'),
    logout: () => POST('/auth/logout'),
    me: () => GET('/users/me'),
  },
  tasks: {
    list: () => GET('/tasks'),
    create: (data: CreateTaskDto) => POST('/tasks', data),
  },
  fields: {
    list: () => GET('/fields'),
  },
}
```

---

### Компонент 8: Обновление Monorepo

#### [MODIFY] [package.json](file:///f:/RAI_EP/package.json)

**Добавить скрипт:**
```json
{
  "scripts": {
    "dev:web": "turbo dev --filter=web",
    "build:web": "turbo build --filter=web"
  }
}
```

#### [MODIFY] [turbo.json](file:///f:/RAI_EP/turbo.json)

**Добавить конфигурацию для web:**
```json
{
  "pipeline": {
    "web#dev": {
      "cache": false,
      "persistent": true
    },
    "web#build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**"]
    }
  }
}
```

---

## Verification Plan

### Definition of Done (ОБЯЗАТЕЛЬНЫЕ КРИТЕРИИ)

> [!IMPORTANT]
> **Sprint 4 считается завершённым ТОЛЬКО если выполнены ВСЕ критерии:**

- [ ] **End-to-End Flow работает:**
  - [ ] Login → Dashboard → Create Task выполняется без ошибок
  - [ ] Редиректы работают корректно (login → dashboard, logout → login)
  - [ ] Данные отображаются корректно на всех экранах

- [ ] **UI Canon соблюдён:**
  - [ ] Шрифт: Geist (проверка в DevTools)
  - [ ] Заголовки: font-weight: 500 (НЕ 600/700)
  - [ ] Основной текст: font-weight: 400
  - [ ] Карточки: bg-white, border-black/10, rounded-2xl
  - [ ] Кнопки: rounded-2xl, font-medium
  - [ ] НЕТ font-bold или font-semibold нигде в коде

- [ ] **Language Policy соблюдена:**
  - [ ] Все тексты интерфейса на русском языке
  - [ ] Английский только в: файлах, переменных, API endpoints
  - [ ] Нет смешения языков в одном блоке

- [ ] **JWT Authentication работает:**
  - [ ] JWT сохраняется в HttpOnly cookies
  - [ ] Сессия сохраняется после перезагрузки страницы
  - [ ] Logout корректно очищает токен
  - [ ] Middleware защищает приватные роуты

- [ ] **Build & Lint проходят:**
  - [ ] `pnpm build` выполняется без ошибок
  - [ ] `pnpm lint` проходит без warnings
  - [ ] TypeScript компиляция успешна

- [ ] **API Integration работает:**
  - [ ] POST `/api/auth/login` возвращает JWT
  - [ ] GET `/api/users/me` возвращает профиль
  - [ ] GET `/api/tasks` возвращает список задач
  - [ ] GET `/api/fields` возвращает список полей
  - [ ] POST `/api/tasks` создаёт задачу

---

### Rollback Conditions (КРИТИЧНЫЕ БЛОКЕРЫ)

> [!CAUTION]
> **Спринт НЕМЕДЛЕННО ОСТАНАВЛИВАЕТСЯ если:**

#### 1. API не готов
**Проблема:**
- Отсутствуют endpoints: `/auth/login`, `/users/me`, `/tasks`, `/fields`
- API возвращает ошибки 500/404
- Схема данных не соответствует ожиданиям фронтенда

**Действия:**
1. Остановка работы над веб-интерфейсом
2. Фиксация проблемы в [DECISIONS.log](file:///f:/RAI_EP/DECISIONS.log) (новый Decision-ID)
3. Запрос уточнения у USER: исправить API или создать моки?
4. Возврат к PLANNING mode

#### 2. JWT не стабилен
**Проблема:**
- Токены не генерируются корректно
- Ошибки 401/403 при валидных токенах
- HttpOnly cookies не устанавливаются

**Действия:**
1. Остановка работы над аутентификацией
2. Фиксация проблемы в [DECISIONS.log](file:///f:/RAI_EP/DECISIONS.log)
3. Запрос уточнения у USER: исправить Identity Service или использовать заглушки?
4. Возврат к PLANNING mode

#### 3. Next.js 14 несовместим с инфраструктурой
**Проблема:**
- Конфликты зависимостей в monorepo
- Turbo не может собрать `apps/web`
- Edge Runtime не работает с текущей конфигурацией

**Действия:**
1. Остановка работы над веб-приложением
2. Фиксация проблемы в [DECISIONS.log](file:///f:/RAI_EP/DECISIONS.log)
3. Запрос уточнения у USER: изменить инфраструктуру или использовать другой фреймворк?
4. Возврат к PLANNING mode

#### 4. Dashboard scope не определён
**Проблема:**
- USER не ответил на вопрос: новый Dashboard или обновление существующего?

**Действия:**
1. Блокировка работы над Dashboard
2. Продолжение работы над другими компонентами (Auth, UI Kit)
3. Ожидание ответа USER

---

### Automated Tests

#### 1. API Integration Tests
**Команда:**
```bash
cd apps/api
pnpm test
```

**Проверка:**
- Существующие тесты для `/auth/login`, `/users/me`, `/tasks`, `/fields` должны проходить
- Убедиться, что API возвращает корректные данные для веб-интерфейса

**Критерий успеха:**
- Все тесты проходят (0 failed)

#### 2. Next.js Build Test
**Команда:**
```bash
cd apps/web
pnpm build
```

**Проверка:**
- Сборка проходит без ошибок
- Нет TypeScript ошибок
- Нет Tailwind CSS ошибок

**Критерий успеха:**
- Build завершается успешно
- Создаётся директория `.next/`

#### 3. Lint Check
**Команда:**
```bash
cd apps/web
pnpm lint
```

**Проверка:**
- Код соответствует ESLint правилам
- Нет warnings

**Критерий успеха:**
- 0 errors, 0 warnings

---

### Manual Verification

#### 1. Запуск веб-приложения
**Шаги:**
1. Запустить API: `cd apps/api && pnpm start:dev`
2. Запустить Web: `cd apps/web && pnpm dev`
3. Открыть браузер: `http://localhost:3000`

**Ожидаемый результат:**
- Страница логина отображается корректно
- Форма логина работает
- После логина редирект на Dashboard

#### 2. Проверка UI Canon
**Шаги:**
1. Открыть Dashboard в браузере
2. Открыть DevTools → Elements → Computed Styles
3. Проверить каждый заголовок (h1, h2, h3)

**Проверка:**
- Шрифт: Geist (font-family: Geist, sans-serif)
- Заголовки: font-weight: 500 (font-medium)
- Основной текст: font-weight: 400 (font-normal)
- Карточки: background-color: #FFFFFF, border-radius: 1rem (16px)
- **НЕТ** font-weight: 600 или 700 (bold/semibold)

**Критерий успеха:**
- Все элементы соответствуют UI Canon
- Нет нарушений типографики

#### 3. Проверка аутентификации
**Шаги:**
1. Логин с корректными данными
2. Открыть DevTools → Application → Cookies
3. Проверить наличие `auth_token` cookie
4. Проверить флаги: HttpOnly, Secure (в production), SameSite
5. Перезагрузить страницу (F5)
6. Проверить, что пользователь остался залогинен
7. Нажать "Выйти"
8. Проверить редирект на страницу логина
9. Проверить, что cookie удалён

**Ожидаемый результат:**
- JWT токен сохраняется в HttpOnly cookie
- Сессия сохраняется после перезагрузки
- Logout корректно очищает токен
- Редиректы работают

#### 4. Проверка формы создания задачи
**Шаги:**
1. Залогиниться
2. Перейти на Dashboard
3. Нажать "Создать задачу"
4. Заполнить форму (все поля)
5. Отправить форму
6. Проверить Network → POST `/api/tasks`
7. Проверить, что задача создана (статус 201)

**Ожидаемый результат:**
- Форма отображается корректно
- Валидация работает (сообщения на русском)
- POST запрос к `/api/tasks` выполняется успешно
- После создания редирект на список задач или Dashboard

#### 5. Проверка языковой политики
**Шаги:**
1. Пройтись по всем страницам (Login, Dashboard, Create Task)
2. Проверить все тексты: заголовки, кнопки, labels, ошибки

**Проверка:**
- Все тексты на русском языке
- Английский только в: именах файлов, переменных, API endpoints
- Нет смешения языков в одном блоке (например, "Создать task")

**Критерий успеха:**
- 100% текстов на русском
- Нет нарушений Language Policy

---

### Browser Testing (РЕШЕНИЕ)

> [!NOTE]
> **Решение по автоматическому браузерному тестированию:**

**НЕ ДЕЛАЕМ** автоматическое браузерное тестирование в рамках Спринта 4.

**Обоснование:**
1. Manual Verification достаточно для MVP
2. Автоматизация браузерных тестов — отдельная задача (Sprint 5-6)
3. Приоритет: работающий функционал, а не автоматизация тестов

**Альтернатива:**
- Скриншоты ключевых экранов для walkthrough.md
- Ручная проверка по чек-листу выше

**Если USER настаивает:**
- Можно использовать `browser_subagent` для скриншотов и записи видео user flow
- Но это НЕ блокирует завершение спринта

---

## Risks & Mitigations

### ✅ Решённые риски

#### ~~Риск 1: Отсутствие UI_DESIGN_CANON.md~~
**Статус:** РЕШЕНО  
**Митигация:** Создан [docs/01-ARCHITECTURE/PRINCIPLES/UI_DESIGN_CANON.md](file:///f:/RAI_EP/docs/01-ARCHITECTURE/PRINCIPLES/UI_DESIGN_CANON.md) v0.1

#### ~~Риск 2: Отсутствие DECISIONS.log~~
**Статус:** РЕШЕНО  
**Митигация:** Создан [DECISIONS.log](file:///f:/RAI_EP/DECISIONS.log) с Decision-ID: `SPRINT4-WEB-001` и `UI-CANON-001`

---

### ⚠️ Актуальные риски

#### Риск 1: Dashboard scope не определён (BLOCKER)
**Проблема:** Неясно, создавать новый Dashboard или обновлять существующий  
**Митигация:**  
- Блокировка работы над Dashboard до ответа USER
- Продолжение работы над другими компонентами (Auth, UI Kit, Form)
- Запрос уточнения через notify_user

#### Риск 2: API может не быть готов
**Проблема:** Endpoints `/auth/login`, `/users/me`, `/tasks`, `/fields` могут отсутствовать или работать некорректно  
**Митигация:**  
- Проверка API перед началом работы (PLANNING mode)
- Если API не готов → Rollback Condition активируется
- Альтернатива: создание моков для разработки (требует утверждения USER)

#### Риск 3: SSR + JWT проблемы
**Проблема:** Next.js 14 Edge Runtime может иметь проблемы с JWT и cookies  
**Митигация:**  
- Жёсткие constraints зафиксированы в плане (Server Actions, Edge-compatible API)
- Проверка на ранних этапах (первая итерация auth)
- Если проблемы критичны → Rollback Condition активируется

#### Риск 4: Конфликты зависимостей в monorepo
**Проблема:** Next.js 14 может конфликтовать с существующими зависимостями  
**Митигация:**  
- Использование `pnpm` для изоляции зависимостей
- Проверка `pnpm install` перед началом работы
- Если конфликты критичны → Rollback Condition активируется

---

## Next Steps

### 1. USER Review (КРИТИЧНО)
**Требуется немедленное решение:**
- ❓ **Dashboard: новый или обновление существующего?**
  - Вариант 1: Dashboard УЖЕ существует → обновить по UI Canon
  - Вариант 2: Dashboard НЕ существует → создать новый
  - Вариант 3: Dashboard в другом месте → уточнить путь

**Без ответа на этот вопрос план нельзя считать утверждённым.**

---

### 2. После утверждения USER

#### EXECUTION Mode
1. Переход в EXECUTION mode
2. Создание `apps/web` структуры
3. Реализация компонентов по плану
4. Обновление чек-листов

#### Checklist Update
Обновить следующие документы:
- [ ] [task.md](file:///C:/Users/DeniOne/.gemini/antigravity/brain/f41d7ada-add6-4d77-afc3-5db3bbb46e4a/task.md) (отметить начало работы)
- [ ] [FULL_PROJECT_WBS.md](file:///f:/RAI_EP/docs/06-IMPLEMENTATION/FULL_PROJECT_WBS.md) (отметить Sprint 4 в процессе)
- [ ] [TECHNICAL_DEVELOPMENT_PLAN.md](file:///f:/RAI_EP/docs/06-IMPLEMENTATION/TECHNICAL_DEVELOPMENT_PLAN.md) (отметить Frontend задачи)
- [ ] [DECISIONS.log](file:///f:/RAI_EP/DECISIONS.log) (обновить статус SPRINT4-WEB-001: PENDING → ACCEPTED)

---

### 3. Финализация (после завершения)

#### Verification
1. Выполнить все проверки из Definition of Done
2. Убедиться, что все критерии выполнены
3. Создать скриншоты для walkthrough.md

#### Documentation
1. Создать `walkthrough.md` с результатами
2. Обновить [SCOPE.md](file:///f:/RAI_EP/docs/06-IMPLEMENTATION/PHASE_ALPHA/SCOPE.md) (отметить завершение Sprint 4)
3. Обновить [progress.md](file:///f:/RAI_EP/memory-bank/progress.md) (добавить Milestone)
4. Commit и Push изменений

#### Reporting
1. Доложить USER о завершении
2. Предоставить walkthrough.md для review

---

## Decision ID

**SPRINT4-WEB-001**
- **Дата:** 2026-02-03
- **Решение:** Создание веб-интерфейса на Next.js 14 с JWT-аутентификацией
- **Scope:** Sprint 4, Phase Alpha
- **Статус:** PENDING USER APPROVAL
