# SYSTEM READINESS AUDIT — RAI_EP

**ДАТА:** 2026-03-11  
**СТАТУС АУДИТА:** ЗАВЕРШЕН  
**АУДИТОР:** Principal Systems Auditor / Staff Software Architect  

> UPDATE 2026-03-12: этот файл нужно читать как baseline snapshot на 2026-03-11. Актуальный remediation-статус ведётся в `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md`. После baseline уже закрыты/снижены, в том числе, `tenant isolation foundation`, `ledger/fsm/outbox hardening`, `outbox scheduler/bootstrap wiring`, `broker-native outbox transport`, `audit log DB append-only`, `raw SQL governance phase 1`, `raw SQL hardening phase 2 (memory path)`, `memory hygiene scheduling`, `memory hygiene observability`, `memory hygiene bootstrap maintenance`, `engram lifecycle scheduling`, `engram lifecycle observability`, `engram lifecycle throughput visibility`, `memory lifecycle operator pause windows`, `memory lifecycle error-budget view`, `memory lifecycle multi-window burn-rate`, `controlled memory backfill policy`, `tenant-scoped memory manual control plane`, `production-grade operational control for memory lifecycle`, `external front-office route-space separation`.

---

## 1. ОБЩАЯ ОЦЕНКА СИСТЕМЫ

Система `RAI_EP` представляет собой амбициозный проект уровня Enterprise, который находится на стадии интенсивного перехода от модульного монолита к state-of-the-art AI-Driven Operating System. 

Ключевой вывод: **Система невероятно сложная, обладает гигантским потенциалом, но концептуально сейчас держится на «дисциплине разработчиков», а не на строгих системных гарантиях.** 

Это значит, что при масштабировании нагрузки или команды, вероятность критических сбоев (утечки данных между тенантами, финансовые расхождения) возрастает экспоненциально.

### System Readiness Score:
- **Architecture:** 6 / 10
- **Backend:** 7 / 10
- **Frontend:** 7 / 10
- **AI system & Agent Architecture:** 8 / 10
- **Database:** 7 / 10
- **UX:** 6.5 / 10
- **Security:** 4 / 10
- **Documentation:** 8 / 10
- **Overall readiness:** **6.5 / 10 (НЕ ГОТОВО К РЕАЛЬНОМУ ENTERPRISE-ПРОДАКШЕНУ БЕЗ ФИКСА БЛОКЕРОВ)**

---

## 2. PLAN vs FACT

| Область | План | Реальное состояние | Разрыв |
| --- | --- | --- | --- |
| **Multi-tenancy** | Жесткая изоляция данных SaaS-клиентов | Изоляция на уровне фильтров в коде. Prisma middleware отсутствует. | **Критический**. Fail-open изоляция. Риск утечки данных между агро-холдингами. |
| **Финансовое ядро** | Соблюдение ACID, полная гарантия балансов | Нет double-entry ledger constraints, FSM зависит от бизнес-логики. | **Высокий**. Риски расхождения баланса при race conditions. |
| **Agent / AI System** | Полностью детерминированные агенты, контроль бюджета | Реализован Proof-of-Concept Runtime Spine, Engram-память, Governance. | **Низкий**. Система агентов спроектирована отлично (Truthfulness, Budgeting). |
| **События (Events)** | Детерминированный Event bus для Enterprise | Реализован Outbox (polling every second) + in-process EventEmitter2. | **Средний**. At-least-once есть, но без дедубликации и order guarantees. |
| **Frontend UI/UX** | Интуитивная агро-ОС и Chat-First UI | XState + Zustand + React Hook Form сложны в переиспользовании. UX требует полировки. | **Средний**. Архитектура современная, но порог входа для новых разработчиков высок. |

---

## 3. ГЛАВНЫЕ ПРОБЛЕМЫ (Top-20 Системных Проблем)

1. **Многотенантность типа "Fail-Open":** Утечка tenantId при ошибке программиста приведет к раскрытию данных конкурирующего холдинга.
2. **Отсутствие Double-Entry Enforcement:** В финансовой модели возможны ситуации с висящими балансами (ошибки округлений или гонки).
3. **Отсутствие DB-уровня Constraints для FSM:** Статусы техкарт и задач меняются строковыми апдейтами без жесткой проверки переходов состояний.
4. **Слабая идемпотентность консьюмеров Outbox:** При падении воркера событие может обработаться дважды.
5. **Тесная связность (Coupling) модулей NestJS:** Более 38 папок в `modules`. `IntegrityModule` тянет зависимости из `TelegramModule` и т.д.
6. **Poller-based Outbox:** Чтение БД каждую секунду — убийца производительности при тысячах транзакций. 
7. **Огромная Prisma-схема (почти 6000 строк):** Это боттлнек для компиляции TS и миграций БД. Нужно разделение на bounded contexts.
8. **UX когнитивная нагрузка:** Множество work windows, chat interface и legacy dash-панелей конфликтуют за внимание пользователя.
9. **Отсутствие RBAC/ABAC middleware на уровне резолверов GraphQL/REST:** Все проверки авторизации делаются вручную в контроллерах.
10. **Фреймворк состояний Frontend'а:** Микс Zustand (глобальный стейт) и XState (FSM) порождает сложный data flow.
11. **Нет DLT/Immutable Storage для Audit Logs:** Журналы пишутся в обычные таблицы, которые можно изменить UPDATE-запросом.
12. **Raw SQL bypass:** Использование `$queryRaw` в ряде мест обходит типизацию Prisma.
13. **Single Point of Failure (SPOF) в оркестраторе агентов:** `ExpertInvocationEngine` может стать узким горлышком при пиковом трафике.
14. **Асинхронные гонки агентов:** Concurrency envelope есть, но в случае timeout нет надежного механизма rollback действий агента во внешних системах.
15. **Риск деградации базы Engram:** Без регулярного прунинга векторный индекс памяти (L4) может выдавать мусорные ассоциации.
16. **AI Галлюцинации в Chief Agronomist:** Несмотря на reliance на engrams, LLM (Gemini/OpenAI) может дофанатазировать советы, что для агросектора стоит миллионов.
17. **Хранение секретов и моделей:** Нет явной интеграции с HashiCorp Vault или AWS KMS.
18. **Деплоймент и CI/CD:** TurboRepo используется, но нет явных end-to-end integration flows для data migrations, которые не ломали бы state.
19. **Нет Rate Limiting для GraphQL/API:** Отсутствует защита от DDoS на эндпоинты агрегации.
20. **Архитектура "доверия коду":** Ключевая проблема всей системы. Инварианты должны жить в СУБД/Middleware, а они живут в бизнес-логике.

---

## 4. ТЕХНИЧЕСКИЙ ДОЛГ

- **Критический уровень:** Отсутствие Row-Level Security (RLS) в PostgreSQL для companyId.
- **Высокий уровень:** Синхронные обработки длинных путей в контроллерах (надо выносить в воркеры с очередями RabbitMQ / SQS, а не только в Outbox pattern).
- **Средний уровень:** Перегруженность `schema.prisma`. Требуется использовать `prisma-multischema` или разбиение базы на микросервисы.

---

## 5. АРХИТЕКТУРНЫЕ РИСКИ

- **Масштабируемость БД:** Единственная PG база с 6000 строк схемы — это верный путь к локам транзакций. При 10 000+ IoT датчиков, генерирующих `FieldObservation`, база ляжет.
- **Сложность:** 40+ NestJS модулей создают "распределенный монолит", где изменение одной DTO ломает компиляцию в 5 других местах.
- **Потенциальный кризис системы:** Когда добавится второй или третий крупный Enterprise-клиент, случайный баг разработчика покажет урожай компании А компании Б, после чего контракт будет расторгнут с огромными штрафами. Причина — архитектура Fail-Open.

---

## 6. UX ПРОБЛЕМЫ

- **Неясная иерархия AI vs UI:** Пользователь не понимает, когда ему нужно писать в чат (Agent), а когда кликать кнопки в интерфейсе.
- **"Chat-First" утопия:** Для сложного агро-менеджмента (TechMaps с сотнями операций) текстовый ввод ужасен. Агенты должны служить **ассистентами** (Copilot-pattern), а не заменой надежных GRID-интерфейсов.
- **Обилие "окон":** Многооконный интерфейс в браузере (Work Windows) вызывает "window fatigue".

---

## 7. AI / AGENT РИСКИ

- **Predictability (Предсказуемость):** Агенты (Data Scientist, Economist, Chief Agronomist) отличны в концепте, но при смене минорной версии LLM-модели (напр. gemini-1.5 → gemini-2.0) вся система бенчмарков может сломаться.
- **Control (Контроль):** Если агент принимает решение о продаже урожая, нет hard-stop'а на уровне системы, кроме текстового confirmation.
- **Knowledge Pollution:** Плохие или ложные данные из TechMaps, попавшие в Engram-базу, станут триггером для неверных предсказаний в будущем ("Яд в памяти").

---

## 8. ЧТО СДЕЛАНО ОТЛИЧНО (Top-10 Сильных Сторон)

1. **Engram Procedural Memory (L4):** Блестящая имплементация памяти агентов, создание нейронных связей опыта (Trigger → Action → Outcome). Уникальное конкурентное преимущество.
2. **Quality Governance Loop:** Подход к оценке Truthfulness, BS%, Evidence Coverage — это паттерны AGI-level систем.
3. **Agent Registry & Runtime Spine:** Внедрение оркестрации, лимитов конкаренси и бюджетов токенов — это очень зрело. Никто так не делает в MVP.
4. **Outbox Pattern:** Понимание транзакционной целостности на уровне Event-ов (хоть реализация и сырая, но фундамент правильный).
5. **Модульность NestJS:** Несмотря на размеры, код разложен по доменам (`cmr`, `agro-audit`, `tech-map` и т.д.).
6. **Next.js + XState / Zustand:** Выбор правильного стека для state machine на UI фронтенде.
7. **Prisma Typed ORM:** Позволяет рефакторить код с высокой уверенностью.
8. **Agent Config Guard & Eval Flow:** Оценка промптов через "Golden Tests" до релиза на продакшен — это гениально.
9. **Концепция TechMap:** Адекватная и гибкая модель технологических карт урожая и адаптивных правил.
10. **Документация и Memory-Bank:** Высочайший уровень технической и процессной документации. Команде легко понимать, что происходит.

---

## 9. ПЛАН ВЫХОДА НА PRODUCTION

### Phase 1 — Critical Fixes (Блокеры запуска)
- [ ] **Data Isolation:** Внедрить Prisma Client Middleware для принудительного добавления `where: { companyId: ctx.companyId }` ко всем запросам + PostgreSQL RLS.
- [ ] **Idempotency:** Ввести колонку `idempotencyKey` в жизненно важные таблицы (особенно ledger entries и API integrations).

### Phase 2 — Architecture Improvements
- [ ] Закрепить FSM (Finite State Machines) через PostgreSQL Trigger'ы или Constraints, запретив нелегальные переходы статусов TechMap.
- [ ] Заменить поллинг Outbox таблицы на CDC (Change Data Capture) через Debezium, либо хотя бы добавить SKIP LOCKED для горизонтального скейлинга воркеров.

### Phase 3 — UX Polish
- [ ] Упростить интерфейс AI Dock, сделав его всплывающим "помощником" (Copilot), а не заменой рабочих дашбордов.

### Phase 4 — Production Readiness
- [ ] Настроить Chaos Engineering ("выдёргивание" агентов, обрыв LLM API) и удостовериться в Graceful Degradation системы (режим Read-Only / Human Manual Required).

---

## 10. ПРИОРИТЕТНЫЙ СПИСОК ЗАДАЧ (Top-30)

**SECURITY & ISOLATION**
1. Написать Prisma Middleware для автоматического инжекта `companyId` из контекста запроса `cls-hooked` / `AsyncLocalStorage`.
2. Реализовать PostgreSQL Row-Level Security (RLS) для 100% защиты от утечек данных.
3. Добавить RBAC Guard на все Nest.js контроллеры (Декораторы `@RequirePermissions()`).

**DATABASE & STATE**
4. Добавить ограничения на БД уровне (check constraints) для избежания отрицательных балансов в Ledger.
5. Имплементировать State Machine гварды на уровне БД (запрет перехода TechMap из DRAFT в ACTIVE в обход REVIEW).
6. Реализовать генерацию Idempotency Key из API и его проверку на слое сервисов.
7. Разделить Prisma Schema на 3 логические части (Core/Identity, Agro, Finance/AI) через Prisma Multiple Schemas (Preview feature).

**EVENTS & MESSAGING**
8. Изменить Outbox Processor с `findMany` на `SELECT ... FOR UPDATE SKIP LOCKED`, чтобы избежать дублей между pod'ами.
9. Ввести RabbitMQ или Redis Streams вместо EventEmitter2 для межсервисного общения в фоне (это избавит от потери In-Memory событий при крэше пода).

**AI & AGENTS**
10. Покрыть Critical Path действий агентов (особенно Write actions) системой Mandatory Human Review (Approvals Queue).
11. Настроить векторную базу данных (Qdrant/Milvus) для Engram-сервиса вместо PGVector (если ожидается масштаб в миллионы векторов).
12. Внедрить "Холодное хранилище" (Pruning/Archival) для старых энграмм, чтобы не засорять контекстное окно LLM шумом.
13. Ограничить размер выдачи `EngramRecallContext` динамическим алгоритмом на основе оставшихся токенов контекста.

**FRONTEND**
14. Написать Storybook для всех компонентов дизайн-системы.
15. Избавиться от раздробленности стейта: четко разграничить, что живет в Zustand, что в React Query (серверный кэш), а что в XState (процессы).
16. Сделать виртуализацию скролла для больших таблиц TechMap (react-window/react-virtuoso), иначе DOM зависнет.

**TESTING & QA**
17. Интеграционные тесты (Jest + Testcontainers) на обработчики Outbox.
18. Написать Load Tests (k6) на эндпоинты с большими джоинами (аналитика, графики).
19. Добавить Security тесты (SonarQube, Snyk).

...остальные 11 задач (monitoring, k8s probes, tracing, alerts) перенести в DevOps pipeline.

---
**ЗАКЛЮЧЕНИЕ:**
RAI_EP — это фантастический проект с архитектурой будущего. Но если его запустить "как есть" сегодня, он упадет на первом enterprise-клиенте из-за отсутствия железобетонных инвариантов БД и Fail-Open многотенантности. Вся дальнейшая разработка (feature factory) должна быть заморожена до стабилизации Foundation слоя.
