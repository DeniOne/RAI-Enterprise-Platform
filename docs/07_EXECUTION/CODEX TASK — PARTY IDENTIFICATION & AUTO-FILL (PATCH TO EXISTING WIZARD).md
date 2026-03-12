---
id: DOC-EXE-07-EXECUTION-CODEX-TASK-PARTY-IDENTIFICATI-VOFF
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
---
0. ВАЖНО

Все новые слова и фразы должны быть на русском языке.

Существующий Wizard НЕ переписывать.

Шаг “Юрисдикция” (dropdown) оставить как есть.

Добавить новый шаг “Идентификация” после “Юрисдикция”.

Не удалять текущие шаги.

Не менять существующую логику создания Party.

1️⃣ Добавить шаг Wizard: Идентификация
Расположение

Тип → Юрисдикция → Идентификация (NEW) → Профиль → Реквизиты → Связи

1.1 UI логика шага

Компонент:
PartyIdentificationStep.tsx

Поля отображаются в зависимости от jurisdictionId:

RU

LEGAL_ENTITY:

inn (обязательное, 10 цифр)

kpp (опционально, 9 цифр)

IP / KFH:

inn (обязательное, 12 цифр)

BY

unp (обязательное)

KZ

bin (обязательное, 12 цифр)

1.2 Поведение

debounce 800ms

кнопка “Найти по реквизитам”

блокировка кнопки “Далее” во время поиска

loader

preview карточка результата

кнопка “Применить данные”

кнопка “Заполнить вручную”

2️⃣ Backend Endpoint

Создать endpoint:

POST /api/party-lookup

Request:

{
  "jurisdictionId": "RU|BY|KZ",
  "partyType": "LEGAL_ENTITY|IP|KFH",
  "query": {
    "inn": "...",
    "kpp": "...",
    "unp": "...",
    "bin": "..."
  }
}

Response:

{
  "status": "FOUND|NOT_FOUND|ERROR",
  "source": "DADATA",
  "fetchedAt": "ISO",
  "result": {
    "legalName": "...",
    "shortName": "...",
    "requisites": {
      "inn": "...",
      "kpp": "...",
      "ogrn": "...",
      "ogrnip": "...",
      "unp": "...",
      "bin": "..."
    },
    "addresses": [
      { "type": "LEGAL", "full": "..." }
    ],
    "meta": {
      "status": "ACTIVE",
      "managerName": "...",
      "okved": "...",
      "registeredAt": "ISO_DATE"
    }
  }
}
3️⃣ Provider abstraction (обязательно)

Создать:

interface CounterpartyLookupProvider {
  supports(jurisdictionId: string): boolean;
  lookup(req: PartyLookupRequest): Promise<PartyLookupResponse>;
}

Реализация:

DaDataProvider (RU)

Stub для BY/KZ (возвращает NOT_SUPPORTED)

Конфигурация:

LOOKUP_PROVIDER_PRIMARY=DADATA
4️⃣ Валидация ИНН RU (обязательно)

Добавить checksum validation.

Не отправлять lookup, если ИНН невалиден.

5️⃣ Кеширование

Redis:

party_lookup:{jurisdiction}:{identifier}
TTL 86400
6️⃣ Применение результата

Добавить функцию:

applyLookupResult(result)

Обновляет wizardState:

legalName

requisites

addresses

dataProvenance {
lookupSource,
fetchedAt,
requestKey
}

Если пользователь уже вводил значения — показать diff-dialog.

7️⃣ Audit логирование

При каждом lookup записывать:

userId

tenantId

identifier

provider

status

timestamp

8️⃣ UI бейдж

В шаге Профиль показать:

Заполнено из DADATA 12.03.2026
9️⃣ Acceptance Criteria

RU → ввод ИНН → автопоиск → preview → применить → заполнены:

legalName

INN

KPP

OGRN

адрес

Данные можно редактировать после автозаполнения.

Повторный ввод того же ИНН берёт данные из кеша.

Юрисдикция dropdown остался без изменений.

BY/KZ поддерживаются архитектурно, но lookup может возвращать NOT_SUPPORTED.

🔟 Не делать

Не скрейпить HTML egrul.nalog.ru

Не хардкодить реквизиты в UI

Не перетирать пользовательские значения без подтверждения

Итог задачи

После выполнения:

Wizard перестаёт быть “формой ради формы”.

Работает автозаполнение как в 1С.

Архитектура готова к BY/KZ.

Нет дублирования контрагентов.

Нет хаоса в реквизитах.

---

## ✅ Статус выполнения (чеклист)

- [x] Существующий Wizard не переписан.
- [x] Шаг `Юрисдикция` оставлен без изменений (dropdown сохранён).
- [x] Добавлен шаг `Идентификация` после `Юрисдикция`.
- [x] Последовательность шагов реализована: `Тип → Юрисдикция → Идентификация → Профиль → Реквизиты → Связи`.
- [x] Добавлен компонент `PartyIdentificationStep.tsx` с полями по `jurisdictionId`:
  - [x] RU + LEGAL_ENTITY: `inn (10, required)`, `kpp (9, optional)`.
  - [x] RU + IP/KFH: `inn (12, required)`.
  - [x] BY: `unp (required)`.
  - [x] KZ: `bin (12, required)`.
- [x] Реализовано поведение шага:
  - [x] debounce `800ms`,
  - [x] кнопка `Найти по реквизитам`,
  - [x] блокировка `Далее` во время поиска,
  - [x] loader,
  - [x] preview карточка,
  - [x] кнопки `Применить данные` и `Заполнить вручную`.
- [x] Создан backend endpoint `POST /api/party-lookup`.
- [x] Реализован provider abstraction `CounterpartyLookupProvider`.
- [x] Реализованы провайдеры:
  - [x] `DaDataProvider` (RU),
  - [x] BY/KZ stub (`NOT_SUPPORTED`).
- [x] Добавлена конфигурация `LOOKUP_PROVIDER_PRIMARY=DADATA` (в `.env.example`).
- [x] Добавлена checksum-валидация ИНН RU и блок отправки lookup при невалидном ИНН.
- [x] Реализовано кеширование Redis:
  - [x] ключ `party_lookup:{jurisdiction}:{identifier}`,
  - [x] TTL `86400`.
- [x] Реализована функция применения результата (`applyLookupResult`) с обновлением:
  - [x] `legalName`,
  - [x] `requisites`,
  - [x] `addresses`,
  - [x] `dataProvenance`.
- [x] Реализован `diff-dialog` перед перезаписью пользовательских значений.
- [x] Реализовано audit-логирование каждого lookup:
  - [x] `userId`,
  - [x] `tenantId`,
  - [x] `identifier`,
  - [x] `provider`,
  - [x] `status`,
  - [x] `timestamp`.
- [x] В шаге `Профиль` добавлен бейдж: `Заполнено из DADATA <дата>`.
- [x] Lookup-данные сохраняются в `registrationData` при создании `Party`.
- [x] Данные автозаполнения отображаются в карточке контрагента (вкладки `Профиль` и `Реквизиты`).
