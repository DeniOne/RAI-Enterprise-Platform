---
id: DOC-ARV-AUDIT-RF-COMPLIANCE-REVIEW-20260328
layer: Archive
type: Research
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-28
---
# RF COMPLIANCE REVIEW 2026-03-28

## 1. Использованные Официальные Источники

- 152-ФЗ и актуальные изменения:
  - <https://publication.pravo.gov.ru/document/0001202408080031>
  - <https://publication.pravo.gov.ru/document/0001202502280034>
- Роскомнадзор:
  - <https://pd.rkn.gov.ru/>
  - <https://rkn.gov.ru/>
- ФСТЭК: <https://fstec.ru/>
- ФСБ / криптосредства: <https://clsz.fsb.ru/>
- Реестр российского ПО: <https://reestr.digital.gov.ru/>
- Роспатент: <https://rospatent.gov.ru/>

## 2. Итоговый Compliance Verdict

`NO-GO` для внешнего запуска с обработкой ПДн граждан РФ.

Причина: теперь в проекте уже есть активный legal/privacy packet, но ключевые внешние доказательства всё ещё отсутствуют:
- не подтверждён оператор и его реквизиты;
- не подтверждён notification status в РКН;
- не подтверждена actual localization / hosting geography;
- нет processor contracts / chain-of-title pack.

## 3. Что Улучшилось Относительно Раннего Snapshot

- Создан active privacy/operator register.
- Создан active hosting/transborder/deployment matrix.
- Создан active OSS/IP register.
- Создан subject-rights / retention runbook.

Это снижает хаос reasoning-а и делает legal backlog управляемым, но не заменяет внешнюю юридическую валидацию.

## 4. Applied Table

| Норма / источник | Применимость | Что требует | Что уже есть | Gap | Риск | Что сделать |
|---|---|---|---|---|---|---|
| 152-ФЗ `О персональных данных` | `применимо` | operator roles, lawful basis, цели, состав данных, меры защиты | active privacy register, data-flow map, subject-rights runbook, code-backed PII controls | юридическое лицо оператора и final lawful basis pack не подтверждены | юридический + организационный + технический | собрать внешний operator/legal packet поверх новых регистров |
| Notification в РКН | `вероятно применимо` | уведомление об обработке ПДн при наступлении обязанностей оператора | technical register создан, но самого evidence по notification нет | status `не подтверждено` | юридический + организационный | провести отдельную юр.валидацию и зафиксировать статус notification |
| Локализация ПДн граждан РФ | `вероятно применимо` | первичное хранение/актуализация баз ПДн граждан РФ на территории РФ | self-host/localized path описан в deployment matrix | actual hosting geography и contracts не подтверждены | юридический + технический | зафиксировать hosting matrix и residency evidence вне repo |
| Трансграничная передача ПДн | `требует отдельной валидации` | оценить передачи вне РФ, страны/получателей, правовые основания | provider inventory теперь есть (`OpenRouter`, `Telegram`, `DaData`) | transfer decision log и legal basis отсутствуют | юридический + организационный | завести transborder register и owner decision по каждому external provider |
| Права субъектов данных, удаление, прекращение обработки | `применимо` | workflow доступа, удаления, ограничения, прекращения обработки | отдельный privacy runbook создан | нет внешнего SLA/owner evidence и public-facing process | юридический + организационный | назначить owner и связать runbook с legal log |
| ФСТЭК: меры защиты ПДн | `вероятно применимо` | классификация ИСПДн, threat model, набор мер | security baseline, audit trail, secret scanning, schema validate, WORM contour | нет formal threat model и measure mapping | организационный + технический | провести threat model и зафиксировать measure register |
| ФСБ / лицензирование криптосредств | `требует отдельной валидации` | определить applicability регулируемой криптографии | код использует JWT, signatures, crypto services | applicability и licensing contour не подтверждены | юридический + технический | провести профильный crypto applicability review |
| 149-ФЗ и общая защита информации | `применимо` | организационные и технические меры защиты информации | active security policy, CodeQL/dependency review/security audit workflows | branch protection/access settings и external evidence не подтверждены | организационный + технический | собрать governance/settings evidence вне repo |
| OSS license compliance | `применимо` | учёт лицензий, совместимость, права использования | reproducible license inventory есть | `33 unknown licenses`, compatibility/legal review не завершён | юридический + организационный | закрыть manual license triage и notice obligations |
| Права на ПО / программа для ЭВМ / БД | `применимо` | непрерывная цепочка прав, возможность регистрации | active OSS/IP register создан | chain-of-title не подтверждён | юридический + организационный | собрать chain-of-title и определить policy по регистрации |
| Реестр российского ПО | `требует отдельной валидации` | юридическое лицо, права, состав компонентов, критерии включения | prerequisites описаны | нет полного доказательного пакета | юридический + организационный | сначала закрыть IP/license/data residency, затем оценивать inclusion readiness |

## 5. Вывод По Осям Риска

- Юридический риск: высокий.
- Организационный риск: высокий, но теперь лучше структурирован.
- Технический риск: средне-высокий; кодовые privacy/security controls усилились, но без внешней юр./ops валидации этого недостаточно.

## 6. Прямой следующий legal/compliance шаг
Собрать внешний пакет подтверждений поверх уже созданных активных регистров:
- кто оператор;
- статус уведомления в РКН;
- где реально хранятся и обрабатываются данные;
- какие процессоры и какие договоры действуют;
- кто владеет правами на ПО и БД.

Эффект:
- `Legal / Compliance` перестанет быть чисто архивным красным блоком и превратится в верифицируемый enterprise decision layer.
