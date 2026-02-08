---
id: risk-impl-gamma-register
type: risk
status: review
owners: [architects, security-officers]
aligned_with: [principle-gamma-vision-scope]
---

# Phase Gamma: Реестр рисков

## Риски и Отказы (Failure Modes)

| Тип отказа | Описание | Критичность | Мера |
|------------|----------|-------------|------|
| **False Positive Fatigue** | Слишком много ложных алертов (пользователь начинает их игнорировать). | HIGH | Регулярная калибровка порогов (Confidence Score). |
| **Overconfidence** | Модель выдает совет с высокой уверенностью при малых данных. | CRITICAL | Принудительное понижение веса при малом объеме исторических аналогов. |
| **Data Drift** | Изменение внешних условий, к которым модель не готова. | MEDIUM | Shadow Modeモニторинга и ручной аудит деградации. |
| **By-passing Risk Engine** | Ошибка интеграции, когда совет идет в обход фильтров безопасности. | FATAL | Жесткий интеграционный тест в пайплайне. |

## Меры и Интеграция
- **Risk Engine Loop:** Все советы проходят через `Admission Verdict`. Gamma Advisory -> Risk Engine.
- **Explainability:** Каждое решение «Почему» блокирует принятие «на вещах».
- **Human-in-the-loop:** Физическая кнопка «Принять» в боте обязательна.

