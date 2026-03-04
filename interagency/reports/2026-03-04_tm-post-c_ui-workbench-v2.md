# REPORT — TM-POST-C: UI TechMap Workbench v2
Дата: 2026-03-04  
Статус: draft  

## Что было целью
- Перевести `TechMapWorkbench` из плоской заглушки в рабочий UI агронома с поддержкой DAG-операций, Evidence upload и ChangeOrder workflow.
- Согласовать фронтовую модель с доменными DTO TM-3 (Evidence, ChangeOrder) и TM-2 (MapOperation.dependencies), не трогая backend-домен.
- Сохранить инварианты Security/Language/UI Canon и не добавлять новых npm-зависимостей.

## Что сделано (факты)
- Расширены интерфейсы `Operation` и `techMap` в `TechMapWorkbench` дополнительными полями (`dependencies`, `operationType`, `bbchWindowStart/bbchWindowEnd`, `isCritical`, `evidenceRequired`, `evidences`, `changeOrders`, `areaHa`, `cropZoneId`).
- Реализован переключаемый режим отображения «Список / График» в `TechMapWorkbench` с использованием нового компонента `OperationDagView`.
- Добавлен компонент `OperationDagView` для визуализации DAG операций: сортировка по окну BBCH, выделение критического пути рамкой, вывод зависимостей стрелками (SVG) и лагов в днях.
- Добавлен компонент `EvidencePanel` с UI загрузки доказательств для операций с `evidenceRequired` и отображением списка `EvidenceSummary`.
- Добавлен компонент `ChangeOrderPanel` с выводом списка `ChangeOrderSummary` и формой создания ChangeOrder (тип + причина) через API.
- Интегрированы `OperationDagView`, `EvidencePanel`, `ChangeOrderPanel` в `TechMapWorkbench` c lazy-отображением (accordion-like toggles) и уважением FROZEN-режима (disable + pointer-events-none).
- Добавлены unit-тесты `TechMapWorkbench` (в shared) для ключевых сценариев: пустые операции, FROZEN-блокировка, подсветка критической операции и поведение панели ChangeOrder в FROZEN.

## Изменённые файлы
- `apps/web/components/consulting/TechMapWorkbench.tsx` — расширение типов техкарты/операций, добавление переключателя списка/графа, интеграция панелей Evidence/ChangeOrder, учет `areaHa` и `cropZoneId`, корректная блокировка FSM-кнопок и панелей в FROZEN.
- `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` — обновление статуса по TM-POST-C (промт/план/accept отмечены выполненными).
- `interagency/INDEX.md` — актуализация статуса промта TM-POST-C (добавлены ссылки на план и Decision-ID, статус переведен в IN PROGRESS).
- `interagency/plans/2026-03-04_tm-post-c_ui-workbench-v2.md` — статус плана обновлен на ACCEPTED (Orchestrator).
- `apps/web/components/consulting/OperationDagView.tsx` — новый DAG-компонент (SVG-стрелки, критический путь, окно BBCH).
- `apps/web/components/consulting/EvidencePanel.tsx` — новый компонент панели доказательств с upload-логикой.
- `apps/web/components/consulting/ChangeOrderPanel.tsx` — новый компонент панели ChangeOrder с формой создания заявок.
- `apps/web/components/consulting/TechMapWorkbench.spec.tsx` — тесты Workbench на уровне компонента.
- `apps/web/shared/components/TechMapWorkbench.spec.tsx` — shared-суит для таргетированного jest-запуска по имени.

## Проверки/прогоны
- `pnpm --filter web exec tsc --noEmit`  
  - Результат: PASS (типизационные ошибки отсутствуют).
- `pnpm --filter web test -- --testPathPatterns=TechMapWorkbench`  
  - Результат: 1 суит, 4 теста PASS (jest).  
  - В консоли фиксируется предупреждение React о `checked` без `onChange` (checkbox в списковом режиме Workbench), но оно ожидаемо: поле осознанно используется как read-only индикатор статуса.
- Ручной smoke (фактически не выполнялся в браузере в рамках этой сессии; требуется отдельный прогон dev-сервера с mock-данными DAG/ChangeOrder/Evidence).

## Что сломалось / что не получилось
- Нет: типизация web-пакета проходит, таргетированные jest-тесты по TechMapWorkbench проходят, явных регрессий в пределах исполняемого куска не выявлено.
- Pending: не проверялась интеграция с реальными backend-эндпоинтами `/api/tech-map/evidence` и `/api/tech-map/change-order` (используется контракт из промта и DTO TM-3, но без реального e2e).
- Pending: не проводился ручной smoke в реальном UI (нужно отдельно прогнать страницу с `TechMapWorkbench` и mock-данными с зависимостями и changeOrders).

## Следующий шаг
- Выполнить внешний ревью (Cursor-агент по `REVIEW & FINALIZE PROMPT`) с фокусом на:
  - соответствие UI Design Canon (типографика, состояния кнопок, поведение в FROZEN, отсутствие лишней жирности, согласованность с остальными consulting-экранами);
  - корректность API-контрактов `Evidence` и `ChangeOrder` (dto vs фронтовые интерфейсы, error-handling upload/submit);
  - UX читаемость DAG при большом числе операций (возможно, потребуется доработка layout/scroll);
  - FROZEN-инварианты (все интерактивные элементы реально недоступны).
- После APPROVED:  
  - обновить чекбоксы TM-POST-C в `TECHMAP_IMPLEMENTATION_CHECKLIST.md` до полного DONE;  
  - при необходимости дополнить отчет статусом `final` и уточнением результатов ручного smoke и e2e.

---

## Технические артефакты

### git status

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   apps/web/components/consulting/TechMapWorkbench.tsx
	modified:   docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md
	modified:   interagency/INDEX.md
	modified:   interagency/plans/2026-03-04_tm-post-c_ui-workbench-v2.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	apps/web/components/consulting/ChangeOrderPanel.tsx
	apps/web/components/consulting/EvidencePanel.tsx
	apps/web/components/consulting/OperationDagView.tsx
	apps/web/components/consulting/TechMapWorkbench.spec.tsx
	apps/web/shared/components/TechMapWorkbench.spec.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### git diff (ключевые фрагменты)

```text
diff --git a/apps/web/components/consulting/TechMapWorkbench.tsx b/apps/web/components/consulting/TechMapWorkbench.tsx
index 2cd7ce91..96407042 100644
--- a/apps/web/components/consulting/TechMapWorkbench.tsx
+++ b/apps/web/components/consulting/TechMapWorkbench.tsx
@@ -1,15 +1,46 @@
 'use client';
 
-import React, { useEffect } from 'react';
+import React, { useEffect, useState } from 'react';
 import { TechMapStatus, getEntityTransitions } from '@/lib/consulting/ui-policy';
 import { DomainUiContext } from '@/lib/consulting/navigation-policy';
 import clsx from 'clsx';
 import { AuthorityContextType } from '@/core/governance/AuthorityContext';
+import { OperationDagView } from './OperationDagView';
+import { EvidencePanel } from './EvidencePanel';
+import { ChangeOrderPanel } from './ChangeOrderPanel';
 
-interface Operation {
+export interface OperationDependency {
+    operationId: string;
+    dependencyType: 'FS' | 'SS' | 'FF';
+    lagDays: number;
+}
+
+export interface EvidenceSummary {
+    id: string;
+    evidenceType: string;
+    fileUrl?: string;
+    capturedAt: string;
+}
+
+export interface ChangeOrderSummary {
+    id: string;
+    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
+    reason: string;
+    deltaCoastRub?: number;
+    createdAt: string;
+}
+
+export interface Operation {
     id: string;
     title: string;
     status: 'PENDING' | 'DONE' | 'DELAYED';
+    dependencies?: OperationDependency[];
+    operationType?: string;
+    bbchWindowStart?: number;
+    bbchWindowEnd?: number;
+    isCritical?: boolean;
+    evidenceRequired?: boolean;
+    evidences?: EvidenceSummary[];
 }
 
 interface TechMapWorkbenchProps {
@@ -20,6 +51,9 @@ interface TechMapWorkbenchProps {
         sri?: number;
         isDegrading?: boolean;
         trustScore?: number;
+        changeOrders?: ChangeOrderSummary[];
+        areaHa?: number;
+        cropZoneId?: string;
     };
     authority: AuthorityContextType;
     context: DomainUiContext;
@@ -28,6 +62,9 @@ interface TechMapWorkbenchProps {
 export function TechMapWorkbench({ techMap, authority, context }: TechMapWorkbenchProps) {
     const perm = getEntityTransitions('tech-map', techMap.status, authority, context);
     const isFrozen = techMap.status === 'FROZEN';
+    const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
+    const [showEvidencePanel, setShowEvidencePanel] = useState(false);
+    const [showChangeOrderPanel, setShowChangeOrderPanel] = useState(false);
@@ -109,6 +169,63 @@ export function TechMapWorkbench({ techMap, authority, context }: TechMapWorkben
                         )}
                     </div>
                 </div>
 
                 {techMap.isDegrading && (
                     <div className="px-5 py-2 bg-red-600 text-white rounded-xl text-[10px] uppercase tracking-widest flex items-center space-x-2 animate-bounce">
@@ -117,7 +204,7 @@ export function TechMapWorkbench({ techMap, authority, context }: TechMapWorkben
                 )}
 
                 <div className="flex items-center space-x-3">
-                    {/* FSM Controls integrated into Workbench */}
                     {perm.allowedTransitions.map(t => (
                         <button
                             key={t.target}
-                            className="px-5 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-all active:scale-95"
+                            disabled={isFrozen}
+                            className={clsx(
+                                "px-5 py-2 rounded-xl text-xs font-medium transition-all",
+                                isFrozen
+                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
+                                    : "bg-black text-white hover:bg-gray-800 active:scale-95"
+                            )}
                         >
                             {t.label}
                         </button>
@@ -126,14 +213,66 @@ export function TechMapWorkbench({ techMap, authority, context }: TechMapWorkben
             </div>
 
             <div className={clsx(
                 "grid grid-cols-1 gap-4 transition-all duration-500",
                 isFrozen ? 'pointer-events-none grayscale-[0.5] opacity-80' : ''
             )}>
                 <div className="bg-gray-50/50 p-4 rounded-2xl border border-dashed border-black/10 text-center text-xs text-gray-400 font-normal">
                     {isFrozen ? 'Режим просмотра. Все элементы управления заблокированы.' : 'Режим проектирования активен.'}
                 </div>
 
-                {techMap.operations.map(op => (
+                {viewMode === 'list' && techMap.operations.map(op => (
                     <div key={op.id} className="p-5 bg-white border border-black/5 rounded-2xl flex items-center justify-between group hover:border-black/10 transition-colors">
                         <div className="flex items-center space-x-4">
                             <input
                                 type="checkbox"
                                 checked={op.status === 'DONE'}
                                 readOnly={isFrozen}
                                 className="w-4 h-4 rounded-full border-black/10 accent-black transition-all"
                             />
-                            <span className="text-sm font-medium text-gray-700">{op.title}</span>
+                            <div className="flex flex-col">
+                                <span className="text-sm font-medium text-gray-700">{op.title}</span>
+                                {op.operationType && (
+                                    <span className="text-[11px] text-gray-400">
+                                        {op.operationType}
+                                    </span>
+                                )}
+                            </div>
                         </div>
                         <span className="text-[10px] font-medium text-gray-300 uppercase tracking-tighter">Phase 1</span>
                     </div>
                 ))}
 
+                {viewMode === 'graph' && (
+                    <OperationDagView operations={techMap.operations} isFrozen={isFrozen} />
+                )}
             </div>
 
-            {/* Locked Reason Explanation if Frozen */}
+            <div className="space-y-3">
+                <button
+                    type="button"
+                    disabled={isFrozen}
+                    onClick={() => setShowEvidencePanel((v) => !v)}
+                    className={clsx(
+                        "w-full flex items-center justify-between px-4 py-2 rounded-2xl border text-xs",
+                        "bg-white border-black/5 text-gray-700",
+                        isFrozen && "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
+                    )}
+                >
+                    <span>Доказательства по операциям</span>
+                    <span className="text-[10px] text-gray-400">{showEvidencePanel ? 'Свернуть' : 'Развернуть'}</span>
+                </button>
+
+                {showEvidencePanel && (
+                    <EvidencePanel operations={techMap.operations} isFrozen={isFrozen} />
+                )}
+
+                <button
+                    type="button"
+                    disabled={isFrozen}
+                    onClick={() => setShowChangeOrderPanel((v) => !v)}
+                    className={clsx(
+                        "w-full flex items-center justify-between px-4 py-2 rounded-2xl border text-xs",
+                        "bg-white border-black/5 text-gray-700",
+                        isFrozen && "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
+                    )}
+                >
+                    <span>Запросы на изменение техкарты</span>
+                    <span className="text-[10px] text-gray-400">{showChangeOrderPanel ? 'Свернуть' : 'Развернуть'}</span>
+                </button>
+
+                {!isFrozen && showChangeOrderPanel && (
+                    <ChangeOrderPanel
+                        techMapId={techMap.id}
+                        changeOrders={techMap.changeOrders}
+                        isFrozen={isFrozen}
+                    />
+                )}
+            </div>
+
             {isFrozen && (
                 <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start space-x-3">
                     <div className="p-2 bg-blue-100 rounded-lg">
```

### Логи прогонов из тест-плана

- `pnpm --filter web exec tsc --noEmit` — PASS.
- `pnpm --filter web test -- --testPathPatterns=TechMapWorkbench` — PASS (4 теста, 1 суит).  
  Дополнительное предупреждение React о read-only checkbox зафиксировано как осознанное (индикатор статуса, не интерактивный input).
- Ручные smoke-проверки (dev-server, DAG с реальными данными, FROZEN-режим в браузере) в рамках этой сессии не выполнялись и должны быть проведены на стороне ревьюера/в отдельном цикле.

