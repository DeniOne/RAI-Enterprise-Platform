Consulting Lifecycle & FSM

1. Назначение документа

Описание жизненного цикла консалтингового кейса и его состояний.

2. Lifecycle (верхний уровень)
Context
 → Harvest Planning
 → TechMap Design
 → Execution
 → Deviation Handling
 → Performance Settlement
 → Knowledge Capture

3. FSM: HarvestPlan
Draft
 → Reviewed
 → Approved
 → Active
 → Completed
 → Archived

4. FSM: TechMap
Draft
 → Validated
 → Active
 → Frozen
 → Archived

5. FSM: DeviationReview
Detected
 → Analyzing
 → DecisionRequired
 → Decided
 → Closed

6. FSM: PerformanceContract
Initialized
 → Active
 → Calculating
 → Settled
 → Closed

7. Ключевые события

HarvestPlanApproved

TechMapActivated

DeviationDetected

DecisionRecorded

PerformanceCalculated

CaseClosed

8. Канонический принцип

FSM защищает результат от хаоса.
Всё, что не прошло событие — не существует в системе.