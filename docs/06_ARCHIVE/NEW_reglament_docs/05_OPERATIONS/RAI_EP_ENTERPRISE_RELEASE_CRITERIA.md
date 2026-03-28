# RAI_EP — Enterprise release criteria

**Назначение:** зафиксировать, какие оси должны быть закрыты для разных моделей запуска.

---

## 1. Модели релиза

### Controlled pilot
Ограниченный запуск в контролируемом контуре.

### Self-host / localized deployment
Основной реалистичный путь внедрения на текущем этапе.

### Managed deployment
Управляемое внедрение с сервисным контуром.

### External production
Полноценный внешний production, в том числе при обработке ПДн граждан РФ.

---

## 2. Обязательные оси readiness

1. Product core readiness
2. Architecture and domain integrity
3. AI governance readiness
4. Security / AppSec readiness
5. Privacy / legal / residency readiness
6. Deployment / backup / DR readiness
7. Installability / support boundary readiness
8. Access governance and release approval readiness

---

## 3. Минимум для controlled pilot

Должно быть:
- зелёный build/test/gates baseline по основному контуру;
- зафиксированный TechMap core и основные domain workflows;
- advisory-first AI behavior;
- ограниченный deployment perimeter;
- понятный owner set;
- отсутствие критичного governance drift.

Не должно быть:
- внешнего массового rollout;
- неограниченной агентной автономии;
- неподтверждённой работы с чувствительными данными вне допустимого perimeter.

---

## 4. Минимум для self-host / localized

Должно быть:
- install/upgrade packet;
- deployment topology;
- backup/restore runbook и свежий execution evidence;
- release checklist;
- базовая support model;
- формализованные data-boundary rules.

---

## 5. Минимум для managed deployment

Дополнительно к self-host:
- подтверждённые support responsibilities;
- evidence по access governance;
- monitoring / incident / escalation contour;
- обновляемая release discipline и rollback logic.

---

## 6. Минимум для external production

Должно быть всё ниже:

### Product and domain
- TechMap operating core замкнут;
- critical workflows покрыты и проверяемы;
- план/факт/отклонения работают как единая система.

### AI
- formal safety eval suite;
- tool matrix;
- HITL matrix;
- scorecards и incident discipline.

### Security
- критичный dependency debt закрыт до релизного порога;
- secret hygiene подтверждён;
- SAST/SCA/SBOM cycle реально отработан;
- access governance подтверждён.

### Privacy / Legal
- оператор и роли определены;
- статус уведомления и legal basis понятны;
- residency / localization подтверждены;
- processor contracts и chain-of-title собраны;
- transborder decisions оформлены.

### Operations
- backup/restore/DR evidence актуален;
- installability подтверждена;
- support boundary формализована;
- release approval и rollback порядок зафиксированы.

---

## 7. Release stop conditions

Релиз не должен идти дальше, если:
- legal/compliance остаётся в состоянии `NO-GO`;
- high-impact AI flows не покрыты HITL;
- критичный dependency/AppSec риск не опущен до допустимого уровня;
- нет актуального backup/restore evidence;
- архитектурный периметр релиза не описан честно.

---

## 8. Практическое правило

До отдельного закрытия всех внешних legal и ops evidence каноническим путём для `RAI_EP` надо считать приоритетным маршрут:

`self-host / localized first -> controlled pilot -> managed -> external production`

А не наоборот.
