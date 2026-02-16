---
id: DOC-OPS-RUN-003
layer: Operations
type: Runbook
status: draft
version: 0.1.0
---

# Tenant Middleware Rollout Plan (Shadow -> Enforce)

Р”Р°С‚Р°: 2026-02-15  
РћР±Р»Р°СЃС‚СЊ: `apps/api`  
РљРѕРјРїРѕРЅРµРЅС‚: `Prisma tenant middleware` (`TENANT_MIDDLEWARE_MODE`)

## 1. Р¦РµР»СЊ
РџРµСЂРµР№С‚Рё РѕС‚ РЅР°Р±Р»СЋРґРµРЅРёСЏ РЅР°СЂСѓС€РµРЅРёР№ tenant-РєРѕРЅС‚СЂР°РєС‚Р° (`shadow`) Рє РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРјСѓ Р±Р»РѕРєРёСЂРѕРІР°РЅРёСЋ (`enforce`) Р±РµР· РґРµРіСЂР°РґР°С†РёРё production.

## 2. Р РµР¶РёРјС‹
1. `off`: middleware РѕС‚РєР»СЋС‡С‘РЅ.
2. `shadow`: middleware РЅРµ Р±Р»РѕРєРёСЂСѓРµС‚, С‚РѕР»СЊРєРѕ Р»РѕРіРёСЂСѓРµС‚ РЅР°СЂСѓС€РµРЅРёСЏ.
3. `enforce`: middleware Р±Р»РѕРєРёСЂСѓРµС‚ РѕРїРµСЂР°С†РёРё Р±РµР· `companyId` contract.

## 3. Progressive rollout
1. Р¤Р°Р·Р° A (shadow baseline, 3-5 РґРЅРµР№):
- РЎРѕР±СЂР°С‚СЊ baseline РЅР°СЂСѓС€РµРЅРёР№ РїРѕ РјРѕРґСѓР»СЏРј Рё action type.
- РСЃРєР»СЋС‡РёС‚СЊ Р»РѕР¶РЅС‹Рµ СЃСЂР°Р±Р°С‚С‹РІР°РЅРёСЏ.

2. Р¤Р°Р·Р° B (shadow + gate warn, 3-5 РґРЅРµР№):
- Р’РєР»СЋС‡РёС‚СЊ `gate:invariants:warn` РІ CI.
- Р‘Р»РѕРєРёСЂРѕРІР°С‚СЊ С‚РѕР»СЊРєРѕ РєСЂРёС‚РёС‡РµСЃРєРёРµ СЂРµРіСЂРµСЃСЃС‹ РІСЂСѓС‡РЅСѓСЋ.

3. Р¤Р°Р·Р° C (partial enforce РІ canary):
- РџРµСЂРµРєР»СЋС‡РёС‚СЊ canary cohort РЅР° `enforce`.
- РЎР»РµРґРёС‚СЊ Р·Р° 4xx/5xx/latency Рё violation-rate.

4. Р¤Р°Р·Р° D (full enforce):
- Р’РєР»СЋС‡РёС‚СЊ `TENANT_MIDDLEWARE_MODE=enforce` РґР»СЏ РІСЃРµРіРѕ РєРѕРЅС‚СѓСЂР°.
- Р’РєР»СЋС‡РёС‚СЊ `gate:invariants:enforce` РєР°Рє merge blocker.

## 4. РњРµС‚СЂРёРєРё Рё Р°Р»РµСЂС‚С‹
1. `tenant_violation_rate` (РїРѕ tenant Рё РјРѕРґСѓР»СЋ)
2. `cross_tenant_access_attempts_total`
3. `api_error_rate` Рё `p95` (СЂРµРіСЂРµСЃСЃ РїРѕСЃР»Рµ enforce)

РЎС‚РѕРї-РєСЂРёС‚РµСЂРёРё rollout:
1. Р РµР·РєРёР№ СЂРѕСЃС‚ 4xx/5xx РІС‹С€Рµ РїРѕСЂРѕРіР°.
2. Р РѕСЃС‚ latency РІС‹С€Рµ РїРѕСЂРѕРіР°.
3. РќРѕРІС‹Рµ РєСЂРёС‚РёС‡РµСЃРєРёРµ tenant violations.

## 5. Rollback strategy
1. Р‘С‹СЃС‚СЂС‹Р№ rollback: РїРµСЂРµРєР»СЋС‡РёС‚СЊ `TENANT_MIDDLEWARE_MODE=shadow`.
2. Р•СЃР»Рё РёРЅС†РёРґРµРЅС‚ РїСЂРѕРґРѕР»Р¶Р°РµС‚СЃСЏ: РїРµСЂРµРєР»СЋС‡РёС‚СЊ `off` РєР°Рє РІСЂРµРјРµРЅРЅСѓСЋ РјРµСЂСѓ.
3. РћС‚РєСЂС‹С‚СЊ P0 incident Рё РІРєР»СЋС‡РёС‚СЊ forensic log review.
4. Р’С‹РїСѓСЃС‚РёС‚СЊ hotfix Рё РїРѕРІС‚РѕСЂРёС‚СЊ rollout СЃ canary.

## 6. Go/No-Go РєСЂРёС‚РµСЂРёРё РЅР° enforce
1. `controllers_without_guards = 0`
2. `tenant_middleware_present = true`
3. РўСЂРµРЅРґ violation-rate СЃС‚Р°Р±РёР»РµРЅ Рё СѓР±С‹РІР°РµС‚.
4. РќРµС‚ РѕС‚РєСЂС‹С‚С‹С… Critical РїРѕ tenant-leakage.



## Cohort/Canary переключение
- `TENANT_ENFORCE_COHORT=<companyId1,companyId2,...>`
- Поведение:
- при `TENANT_MIDDLEWARE_MODE=enforce`:
- tenants из `TENANT_ENFORCE_COHORT` работают в `enforce`,
- остальные tenants временно обслуживаются как `shadow` (progressive rollout).
- One-click rollback command:
- `pnpm rollback:tenant-middleware`
- (sets `TENANT_MIDDLEWARE_MODE=shadow`, clears `TENANT_ENFORCE_COHORT` in `.env`)
