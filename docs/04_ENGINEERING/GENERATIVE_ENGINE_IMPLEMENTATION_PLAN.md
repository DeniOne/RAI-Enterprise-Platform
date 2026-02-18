GENERATIVE_ENGINE_IMPLEMENTATION_PLAN.md
0. Статус документа

Система: RAI_Enterprise_Platform

Компонент: Generative Engine (Level B)

Фаза: Implementation Planning

Предусловие:

LEVEL_B_FORMAL_TEST_MATRIX.md — D3

PROPERTY_BASED_TEST_SPEC.md — D3

Document Maturity Level: D1 (Planning Baseline)

1. Purpose

Данный документ определяет поэтапный план реализации Generative Engine для Level B с жёсткой привязкой к:

Инвариантам I15–I28

Formal Test Matrix (61 тест)

Property-Based Testing Spec (20 + 5 cross properties)

Реализация ДОЛЖНА быть:

Инвариант-ориентированной

Test-driven

Deterministic-first

Без архитектурного дрейфа

2. Implementation Principles
2.1 Invariant-First Development

Каждый инвариант реализуется как:

Domain Rule → Validation Layer → Test Coverage → PBT Coverage


Ни одна функция генерации не реализуется без:

L4 теста

PBT свойства

Trace ID

2.2 Determinism by Construction

B1 режим ДОЛЖЕН быть:

Побайтово детерминированным

Без скрытых источников энтропии

Без неявных timestamp-зависимостей

Любой источник недетерминизма запрещён.

2.3 Immutability as Core Constraint

После создания:

GenerationRecord — immutable

Published Strategy — immutable

Hash — immutable

Изменение возможно только через version increment.

3. Архитектурная структура модуля
/generative-engine
  /domain
    DraftFactory
    DeterministicGenerator
    ExplainabilityBuilder
    MetadataBuilder
    ConstraintPropagator

  /validation
    IntegrityGate
    DeterminismValidator
    ImmutabilityGuard

  /fsm
    DraftStateManager

  /simulation
    ScenarioExecutor (B2+)

  /record
    GenerationRecordService

  /tests
    L3-L6 tests
    PBT tests
    Adversarial tests

4. Этапы реализации
ЭТАП 1 — Domain Core (I15, I16, I21)
Цель:

Создать минимально детерминированный DraftFactory.

Реализовать:

GENERATED_DRAFT создание

generationMetadata заполнение

constraint propagation

explainability skeleton

Инварианты:

I15 — изоляция черновика

I16 — провенанс

I21 — распространение ограничений

Тесты:

L3 + L4 для I15, I16, I21

PBT-I15-01

PBT-I16-01

PBT-I21-01

Exit Criteria:
Все L4 и PBT тесты зелёные.

ЭТАП 2 — Deterministic Engine (I19)
Цель:

Обеспечить строгий B1 детерминизм.

Реализовать:

DeterministicGenerator

Fixed seed strategy

Canonical sorting

Stable hashing

Инвариант:

I19 — детерминированная генерация

Тесты:

I19-L4-01

I19-L5-01

PBT-I19-01

CP-1

CP-4

Exit Criteria:
generate(P)₀ = generate(P)ₙ для 10,000 образцов.

ЭТАП 3 — Immutability Layer (I18, I28)
Реализовать:

Immutable Strategy guard

GenerationRecord immutability

Hash consistency enforcement

Инварианты:

I18 — стратегия immutable

I28 — запись генерации immutable

Тесты:

I18-L4-01

I28-L4-01

PBT-I18-01

PBT-I28-01

CP-2

Exit Criteria:
Ни один adversarial immutability тест не проходит.

ЭТАП 4 — Explainability Engine (I24)
Реализовать:

ExplainabilityBuilder

limitationsDisclosed enforcement

Factor extraction logic

Инвариант:

I24 — обязательная объяснимость

Тесты:

I24-L4-01

PBT-I24-01

CP-1

CP-4

Exit Criteria:
Explainability присутствует во 100% сущностей.

ЭТАП 5 — Yield Model B1 (I20)
Реализовать:

Deterministic forecast

modelVersion enforcement

inputData immutability

Forecast hash

Инвариант:

I20 — прослеживаемость

Тесты:

I20-L4-01

PBT-I20-01

CP-4

ЭТАП 6 — Simulation Module (I22)
Реализовать:

SimulationRun executor

isProduction = false enforcement

FSM isolation

Инвариант:

I22 — изоляция симуляций

Тесты:

I22-L4-01

PBT-I22-01

PBT-I22-02

CP-3

ЭТАП 7 — Probability Layer (B2+) (I25–I27)
Реализовать:

Probability distribution builder

Normalization enforcement

Confidence interval validation

Expectation calculation

Инварианты:

I25 — нормализация

I26 — границы

I27 — доверие

Тесты:

PBT-I25-01

PBT-I26-01

PBT-I27-01

CP-5

5. Реализация через Test-Driven Flow

Каждый этап:

Написать L4 тест

Написать PBT тест

Убедиться, что тест падает

Реализовать минимальный код

Добиться зелёного

Проверить adversarial

6. Risk Matrix
Риск	Причина	Митигирование
Недетерминизм	Timestamp, Random	Centralized entropy control
Drift FSM	Неправильные переходы	FSM unit tests
Нарушение immutable	Прямой доступ к БД	Guard layer
Probability drift	Floating point errors	Tolerance enforcement
Metadata loss	Partial object serialization	Strict schema validation
7. Implementation Gates
Gate	Условие
G-IMPL-1	Все L4 тесты зелёные
G-IMPL-2	Все 61 базовый тест зелёный
G-IMPL-3	Все 20 PBT свойства зелёные
G-IMPL-4	Все 5 Cross-Invariant свойства зелёные
G-IMPL-5	Все 14 adversarial тестов заблокированы
8. Definition of Done (D4 Readiness)

Generative Engine считается реализованным, если:

100% Test Matrix проходит

100% Property-Based проходит

Cross-invariant свойства замкнуты

Нет failing counterexamples

Нет bypass adversarial сценариев

Hash стабилен

Повторяемость генерации подтверждена

9. Implementation Order Summary

Domain Core

Determinism

Immutability

Explainability

Yield Model B1

Simulation

Probability B2+