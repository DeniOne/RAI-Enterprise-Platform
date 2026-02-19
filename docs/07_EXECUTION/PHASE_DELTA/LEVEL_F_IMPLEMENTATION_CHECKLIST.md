---
id: DOC-EXE-LVLF-CHK
type: Checklist
layer: Execution
status: Enforced
owners: [@techlead, @program_manager]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ИНСТИТУЦИОНАЛЬНЫЙ ЧЕК-ЛИСТ ИМПЛЕМЕНТАЦИИ (LEVEL_F_IMPLEMENTATION_CHECKLIST)

Данный документ является строгим трекером (Hard-Gated Tracker) для сборки архитектуры Level F (Institutional Oracle Standard). Закрытие задачи (Checkbox) допускается **ТОЛЬКО** при наличии покрывающего теста и пройденного Security-Review.

---

## Фаза 1: Криптографическое Ядро (Cryptographic Core)
- [ ] **HSM Integration:** Интегрировать HashiCorp Vault / AWS KMS для генерации `Ed25519` Intermediate-ключей без извлечения в RAM (Анклавное подписание).
- [ ] **M-of-N Governance:** Разработать сервис мультиподписи (Multisig). Требование `5-of-7` для обновления корневых ключей / версий формул.
- [ ] **Idempotency & Replay Cache:** Поднять Redis-кластер. Написать middleware для отлова дубликатов `jti` (JWT ID) и заголовков `Idempotency-Key` с отбивкой (latency $<10$ms).
- [ ] **Canonical JSON Builder:** Написать библиотеку сериализации RFC 8785 (пред-хэширование). Написать unit-тесты на падение при смене порядка ключей.

---

## Фаза 2: Пайплайн Данных (Data Pipeline & Snapshotting)
- [ ] **Snapshot Controller:** Реализовать cron-job для извлечения Read-Only срезов (tuples) из Level E PostgreSQL.
- [ ] **Merkle DAG Serialization:** Внедрить логику сшивания. Снимок $N$ обязан содержать `previous_hash` снимка $N-1$ и `merkle_root_level_e`.
- [ ] **WORM Storage Integration:** Настроить AWS S3 bucket с `Object Lock (Compliance Mode)` на 10 лет. Написать CI-тест: скрипт пытается удалить файл через SDK ключом администратора и *обязан получить отказ*.
- [ ] **Temporal Consistency Sync:** Реализовать блокировку генерации (Drop Frame), если Level E сигнализирует о дрифте времени (NTP skew $> 300$s).

---

## Фаза 3: Движок Сертификации и Рейтингов (Stateless Engines)
- [ ] **Float-Math Sandbox:** Собрать Rating Engine внутри V8 Isolate / WASM с отключенным аппаратным FPU (Strict IEEE-754 Soft-float).
- [ ] **Assertion Fences:** Закодировать $5$ инвариантов FRS/RCS (вкл. $FRS \le 1000$ и "нулючий" RCS при $P05 \ge 0.10$). Прибить `Panic` при их пробитии.
- [ ] **Certification Gates (AND-Logic):** Реализовать 5 гейтов: $G1$ (Contract), $G2$ (Depth $\ge 2$), $G3$ ($SRI\_Delta \ge 0$), $G4$ ($P05 < 0.05$), $G5$ (No Violations). Покрыть каждый гейт негативным тестом.
- [ ] **JWT Minter:** Реализовать выдачу Сертификата в формате JWT с Ed25519 подписью и TTL $= 365$ days.

---

## Фаза 4: Внешний Шлюз (Institutional API Gateway)
- [ ] **mTLS Firewall:** Настроить Envoy / NGINX на rejection любых запросов без клиентского x.509 сертификата для Tier-2/Tier-3 путей.
- [ ] **Rate-Limiting (Token Bucket):** Сконфигурировать $1000$ req/min per `Tenant` и $10000$ per `Subnet /24`.
- [ ] **Privacy Schema Handler (k-anonymity):** Реализовать фильтрацию. Отдавать `403` при запросе макро-данных, если выборка (Cohort) $< 5$ ферм. Транкейтить (округлять) GPS-координаты до 3 знаков.
- [ ] **RFC 7807 Exception Filter:** Написать глобальный Exception Handler, который подавляет Stack Traces и возвращает URN-ошибки (`"type": "urn:rai:error:auth:token_expired"`).

---

## Фаза 5: Инфраструктура Споров (Dispute & Immutable Audit)
- [ ] **Deterministic Replay API:** Создать закрытый эндпоинт `/api/internal/replay`, принимающий `model_hash` и старый Payload, и сравнивающий $H_{replay} == H_{recorded}$.
- [ ] **Smart Contract Anchoring:** Написать и развернуть Solidity-контракт в Testnet (Sepolia/Polygon) для публикации Merkle Roots раз в $24$ часа.
- [ ] **Fallback Anchor Logic:** Написать Node-Watcher. Если RPC Layer 1 отвалился на $>24$ часа, автоматически переключаться на Secondary Consortium Ledger (Fabric/Quorum).
- [ ] **CRL Lifecycle (Revocations):** Реализовать Redis Bloom Filter для контроля отозванных сертификатов (`certificate_id`) и триггеры рассылки Webhook'ов страховым компаниям при отзыве.

---

## Фаза 6: Хардкорные Симуляции (Hardcore Test Specs)
- [ ] **BFT Attack Test:** Симуляция лживых данных от 33% оракулов Level E $\rightarrow$ Ожидаем успешный блок на этапе кросс-валидации (Reject).
- [ ] **Zip Bomb Test:** Отправить $256.1$ KB payload в API $\rightarrow$ Ожидаем `413 Payload Too Large` на балансировщике.
- [ ] **Replay Cache Test:** Отправить два identical PUSH-запроса с одинаковым `Nonce` с разницей в $1$ мс $\rightarrow$ Ожидаем, что база получит только первый, а второй прервется `400 / 401`.
- [ ] **Panic Halt Test:** Симуляция `3-of-7` Governance Override $\rightarrow$ Ожидаем мгновенный `503 Service Unavailable` по всему API.
