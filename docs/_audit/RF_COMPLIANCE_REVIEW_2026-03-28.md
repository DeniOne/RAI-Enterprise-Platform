---
id: DOC-ARV-AUDIT-RF-COMPLIANCE-REVIEW-20260328
layer: Archive
type: Research
status: approved
version: 1.0.0
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

Причина: в коде и документации есть явные признаки работы с PII/tenant data, но нет подтверждённого operator artifact pack, notification/localization evidence, transborder decision register и единого legal inventory по OSS/IP.

## 3. Applied Table

| Норма / источник | Применимость | Что требует | Что есть в проекте | Gap | Риск | Что сделать |
|---|---|---|---|---|---|---|
| 152-ФЗ `О персональных данных` | `применимо` | определить роли оператора/обработчика, основания обработки, цели, состав данных, меры защиты | есть PII masking, incident logging, auth/user/company/trace контуры, telegram/web входы | нет формального operator pack, нет единого data inventory | юридический + организационный + технический | собрать реестр обработок, роли, основания, категории данных |
| Notification в РКН | `вероятно применимо` | уведомление об обработке ПДн при наступлении обязанностей оператора | локального evidence не найдено | нет подтверждения notification status | юридический + организационный | провести отдельную юр.валидацию и зафиксировать статус notification |
| Локализация ПДн граждан РФ | `вероятно применимо` | первичное хранение/актуализация баз ПДн граждан РФ на территории РФ | локальный Postgres/infra контур есть, но production hosting geography не подтверждена | нет topology/evidence по actual hosting и data residency | юридический + технический | зафиксировать hosting matrix, residency decision и control evidence |
| Трансграничная передача ПДн | `требует отдельной валидации` | оценить передачу вне РФ, правовые основания, страны/получателей | возможны AI/tool/cloud paths, но текущий runtime provider matrix не подтверждён | нет register по внешним провайдерам и transfer decision log | юридический + организационный | собрать provider inventory и отдельный transborder register |
| Права субъектов данных, удаление, прекращение обработки | `применимо` | процессы доступа, удаления, исправления, прекращения обработки, сроки хранения | есть отдельные deletion/reconciliation semantics в части DB governance и incident trail | нет единого privacy workflow и SLA для subject rights | юридический + организационный | оформить privacy runbook и lifecycle policy |
| ФСТЭК: меры защиты ПДн | `вероятно применимо` | классификация ИСПДн и набор орг/тех мер по классу системы | есть tenant lint, guards, audit, WORM, auth/governance contours | нет формальной классификации, model of threats, measure registry | организационный + технический | провести threat model и security measure mapping |
| ФСБ / лицензирование криптосредств | `требует отдельной валидации` | определить, используется ли регулируемая криптография и нужны ли лицензируемые/сертифицированные средства | есть `crypto`, JWT, signatures, Level F artifacts, но нет evidence по regulated crypto contour | applicability не подтверждена | юридический + технический | провести crypto applicability review с профильным юристом/ИБ |
| 149-ФЗ и общая защита информации | `применимо` | организационные и технические меры защиты информации | есть часть security controls и audit contours | нет unified security policy pack и evidence registry | организационный + технический | собрать security governance packet |
| OSS license compliance | `применимо` | учёт лицензий, совместимость, права использования | в package.json есть `UNLICENSED`/workspace mix, но repo-level license inventory отсутствует | нет OSS register и compatibility review | юридический + организационный | провести license audit и зафиксировать obligations |
| Права на ПО / программа для ЭВМ / БД | `применимо` | непрерывная цепочка прав, договоры, возможность регистрации | локального evidence по правовой цепочке нет | нет IP rights pack и ownership/legal folder | юридический + организационный | собрать chain-of-title и рассмотреть регистрацию в Роспатент |
| Реестр российского ПО | `требует отдельной валидации` | юридическое лицо, права, состав компонентов, соответствие критериям | технологические и документальные предпосылки частично есть | нет пакета доказательств на включение | юридический + организационный | сначала закрыть IP/license/data residency, затем оценивать inclusion readiness |

## 4. Вывод По Осям Риска

- Юридический риск: высокий из-за отсутствия доказанного operator/legal pack.
- Организационный риск: высокий из-за отсутствия formal privacy/compliance workflows.
- Технический риск: средне-высокий; часть мер есть, но они не сведены в законодательно подтверждённый control framework.

## 5. Что Делать В Первую Очередь

1. Собрать `privacy/legal inventory`: data subjects, categories, systems, processors, hosting, providers.
2. Зафиксировать operator/processor roles и notification/localization status.
3. Провести OSS/IP audit и chain-of-title review.
4. Свести ФСТЭК/ИБ меры в отдельный evidentiary packet, а не только в кодовые разрозненные controls.
