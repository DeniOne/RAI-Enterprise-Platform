# Progress Report - Prisma, Agro Domain & RAI Chat Integration

## 2026-03-28

1. **Enterprise audit closeout: security/compliance/ops packet** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РІРѕСЃРїСЂРѕРёР·РІРѕРґРёРјС‹Р№ security baseline С‡РµСЂРµР· `pnpm security:audit:ci`, `pnpm gate:secrets`, `pnpm gate:db:schema-validate`, `pnpm security:licenses`, `pnpm security:sbom`.
  - Р’ СЂРµРїРѕР·РёС‚РѕСЂРёРё РїРѕСЏРІРёР»РёСЃСЊ РЅРѕРІС‹Рµ scripts:
    - `security-audit-ci.cjs`
    - `scan-secrets.cjs`
    - `prisma-validate-safe.cjs`
    - `generate-license-inventory.cjs`
    - `generate-sbom.cjs`
  - РЈСЃРёР»РµРЅ CI:
    - `security-audit.yml` С‚РµРїРµСЂСЊ РіРѕРЅСЏРµС‚ security baseline Рё РіСЂСѓР·РёС‚ Р°СЂС‚РµС„Р°РєС‚С‹
    - РґРѕР±Р°РІР»РµРЅС‹ `codeql-analysis.yml` Рё `dependency-review.yml`
  - `CODEOWNERS` СЂР°СЃС€РёСЂРµРЅ РЅР° workflows, scripts Рё РєСЂРёС‚РёС‡РЅС‹Рµ runtime paths.
  - РР· Git-РёРЅРґРµРєСЃР° СѓРґР°Р»РµРЅС‹ tracked env-С„Р°Р№Р»С‹ СЃ СЃРµРєСЂРµС‚Р°РјРё:
    - `mg-core/backend/.env`
    - `mg-core/backend/src/mg-chat/.env`
  - РќРѕРІС‹Р№ secret hygiene baseline:
    - `tracked_findings=0`
    - workspace-only secrets РѕСЃС‚Р°СЋС‚СЃСЏ Р»РѕРєР°Р»СЊРЅС‹Рј СЂРёСЃРєРѕРј Рё Р±РѕР»СЊС€Рµ РЅРµ СЃС‡РёС‚Р°СЋС‚СЃСЏ repo-tracked leakage
  - РЎРѕР·РґР°РЅ active ops/compliance packet РІ `docs/05_OPERATIONS`.
  - Audit-РїР°РєРµС‚ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ:
    - security Рё deployment baseline СѓСЃРёР»РµРЅС‹
    - `Legal / Compliance` РѕСЃС‚Р°Р»СЃСЏ `NO-GO` РёР·-Р·Р° РѕС‚СЃСѓС‚СЃС‚РІРёСЏ РІРЅРµС€РЅРµРіРѕ operator/legal evidence

2. **External legal evidence closeout packet** [DONE]:
  - РЎРѕР·РґР°РЅ `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md`.
  - РћСЃС‚Р°С‚РѕС‡РЅС‹Р№ legal/compliance gap РїРµСЂРµРІРµРґС‘РЅ РІ СЏРІРЅС‹Р№ owner-driven packet:
    - operator identity and role memo
    - Р РљРќ notification / exemption evidence
    - hosting/residency attestation
    - processor/subprocessor + DPA pack
    - transborder decision log
    - lawful basis / privacy notice pack
    - subject-rights operating evidence
    - retention/deletion approval
    - chain-of-title pack
    - OSS unknown-license triage
    - crypto applicability memo
  - РћР±РЅРѕРІР»РµРЅС‹ `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER`, `RF_COMPLIANCE_REVIEW`, `ENTERPRISE_DUE_DILIGENCE`, `ENTERPRISE_EVIDENCE_MATRIX`, `DELTA_VS_BASELINE`, `docs/README.md`, `docs/INDEX.md`, `docs/DOCS_MATRIX.md`.
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - `Legal / Compliance = NO-GO` РѕСЃС‚Р°С‘С‚СЃСЏ С‡РµСЃС‚РЅС‹Рј, РЅРѕ С‚РµРїРµСЂСЊ РёРјРµРµС‚ С‚РѕС‡РЅС‹Р№ closeout path;
    - enterprise due diligence РјРѕР¶РЅРѕ РѕР±РЅРѕРІР»СЏС‚СЊ РїРѕ С„Р°РєС‚Р°Рј РІРЅРµС€РЅРёС… Р°СЂС‚РµС„Р°РєС‚РѕРІ, Р° РЅРµ РїРѕ СЂР°СЃРїР»С‹РІС‡Р°С‚РѕРјСѓ backlog.

3. **External legal metadata tracking and restricted store bootstrap** [DONE]:
  - РЎРѕР·РґР°РЅ `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`.
  - Р’ СЂРµРіРёСЃС‚СЂРµ seeded `11` external evidence items СЃРѕ СЃС‚Р°С‚СѓСЃРѕРј `requested`, `reference_id`, review dates Рё linked docs.
  - Р’РЅРµ Git СЃРѕР·РґР°РЅ Р»РѕРєР°Р»СЊРЅС‹Р№ restricted scaffold:
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata`
  - Р’ restricted scaffold Р·Р°РІРµРґРµРЅС‹ `INDEX.md` Рё 11 metadata-РєР°СЂС‚РѕС‡РµРє `ELP-20260328-01 .. ELP-20260328-11`.
  - Audit-СЃР»РѕР№ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ:
    - `RF_COMPLIANCE_REVIEW`
    - `ENTERPRISE_DUE_DILIGENCE`
    - `ENTERPRISE_EVIDENCE_MATRIX`
    - `DELTA_VS_BASELINE`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - legal closeout С‚РµРїРµСЂСЊ РёРјРµРµС‚ СЂР°Р±РѕС‡СѓСЋ РѕС‡РµСЂРµРґСЊ РїСЂРёС‘РјРєРё, Р° РЅРµ С‚РѕР»СЊРєРѕ policy-level СЃРїРёСЃРѕРє;
    - РјРѕР¶РЅРѕ РґРІРёРіР°С‚СЊ СЃС‚Р°С‚СѓСЃС‹ `requested -> received -> reviewed -> accepted` Р±РµР· С…СЂР°РЅРµРЅРёСЏ СЃР°РјРёС… sensitive docs РІ Git.

4. **External legal acceptance workflow and owner routing** [DONE]:
  - РЎРѕР·РґР°РЅ `docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md`.
  - Р’ `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER` РґРѕР±Р°РІР»РµРЅ alias owner map Рё named owners РїРѕ РІСЃРµРј `ELP-20260328-01 .. 11`.
  - Р”Р»СЏ legal/privacy closeout docs СѓСЃРёР»РµРЅ review guard РІ `.github/CODEOWNERS`:
    - `@chief_legal_officer`
    - `@dpo`
    - `@board_of_directors`
    - СЃРѕРІРјРµСЃС‚РЅРѕ СЃ `@techlead` Рё `@backend-lead`
  - Audit-РїР°РєРµС‚ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ:
    - `RF_COMPLIANCE_REVIEW`
    - `ENTERPRISE_DUE_DILIGENCE`
    - `ENTERPRISE_EVIDENCE_MATRIX`
    - `DELTA_VS_BASELINE`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - Р»РѕРєР°Р»СЊРЅРѕ Р·Р°РєСЂС‹С‚ РІРµСЃСЊ РёСЃРїРѕР»РЅРёРјС‹Р№ РєСѓСЃРѕРє legal closeout;
    - РґР°Р»СЊС€Рµ blocker С‚РѕР»СЊРєРѕ РѕРґРёРЅ: С„Р°РєС‚РёС‡РµСЃРєРѕРµ РїРѕСЏРІР»РµРЅРёРµ РІРЅРµС€РЅРёС… РґРѕРєСѓРјРµРЅС‚РѕРІ РґР»СЏ РїРµСЂРµРІРѕРґР° РєР°СЂС‚РѕС‡РµРє РёР· `requested` РІ `received`.

5. **Reproducible legal evidence status gate** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-status.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅС‹:
    - `pnpm legal:evidence:status`
    - `pnpm gate:legal:evidence`
  - РЎРєСЂРёРїС‚ СЃРІРµСЂСЏРµС‚:
    - `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata/*.md`
    - `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata/INDEX.md`
  - РЎРєСЂРёРїС‚ РїРёС€РµС‚ РѕС‚С‡С‘С‚С‹:
    - `var/compliance/external-legal-evidence-status.json`
    - `var/compliance/external-legal-evidence-status.md`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - legal evidence lifecycle С‚РµРїРµСЂСЊ РїСЂРѕРІРµСЂСЏРµС‚СЃСЏ РєРѕРґРѕРј, Р° РЅРµ С‚РѕР»СЊРєРѕ РіР»Р°Р·Р°РјРё;
    - РїРѕСЃР»Рµ РїРѕСЏРІР»РµРЅРёСЏ РІРЅРµС€РЅРёС… РґРѕРєСѓРјРµРЅС‚РѕРІ РєРѕРјР°РЅРґР° СЃРјРѕР¶РµС‚ Р±С‹СЃС‚СЂРѕ Р»РѕРІРёС‚СЊ status drift Рё overdue items.

6. **Legal evidence intake automation** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-intake.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅР° РєРѕРјР°РЅРґР°:
    - `pnpm legal:evidence:intake -- --reference=ELP-... --source=/abs/path/file`
  - РЎРєСЂРёРїС‚ РІС‹РїРѕР»РЅСЏРµС‚ РѕРґРёРЅ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅС‹Р№ intake-РїСЂРѕС…РѕРґ:
    - РєРѕРїРёСЂСѓРµС‚ РІРЅРµС€РЅРёР№ С„Р°Р№Р» РІ restricted `artifacts/<reference_id>/`
    - РѕР±РЅРѕРІР»СЏРµС‚ restricted metadata card
    - РѕР±РЅРѕРІР»СЏРµС‚ restricted `INDEX.md`
    - РѕР±РЅРѕРІР»СЏРµС‚ repo-side `EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md` СЃРѕ СЃС‚Р°С‚СѓСЃРѕРј `received`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - РїРѕСЏРІР»РµРЅРёРµ СЂРµР°Р»СЊРЅРѕРіРѕ РІРЅРµС€РЅРµРіРѕ РґРѕРєСѓРјРµРЅС‚Р° Р±РѕР»СЊС€Рµ РЅРµ С‚СЂРµР±СѓРµС‚ СЂСѓС‡РЅРѕР№ РїСЂР°РІРєРё РЅРµСЃРєРѕР»СЊРєРёС… С„Р°Р№Р»РѕРІ;
    - legal closeout РјРѕР¶РЅРѕ РґРІРёРіР°С‚СЊ СЃРµСЂРёР№РЅРѕ Рё Р±РµР· СЂСѓС‡РЅРѕРіРѕ status drift.

7. **Legal evidence lifecycle transition automation** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-transition.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅР° РєРѕРјР°РЅРґР°:
    - `pnpm legal:evidence:transition -- --reference=ELP-... --status=reviewed|accepted|expired`
  - `scripts/legal-evidence-status.cjs` СѓСЃРёР»РµРЅ:
    - РґР»СЏ `received` С‚СЂРµР±СѓРµС‚ `received_at` Рё `artifact_path`
    - РґР»СЏ `reviewed` С‚СЂРµР±СѓРµС‚ `received_at`, `artifact_path`, `reviewed_at`
    - РґР»СЏ `accepted` С‚СЂРµР±СѓРµС‚ `received_at`, `artifact_path`, `reviewed_at`, `accepted_at`
    - РїСЂРѕРІРµСЂСЏРµС‚ СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ `artifact_path` Сѓ non-requested РєР°СЂС‚РѕС‡РµРє
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - РїРѕР»РЅС‹Р№ lifecycle `requested -> received -> reviewed -> accepted` С‚РµРїРµСЂСЊ Р·Р°РєСЂС‹РІР°РµС‚СЃСЏ РєРѕРґРѕРј;
    - gate Р»РѕРІРёС‚ СѓР¶Рµ РЅРµ С‚РѕР»СЊРєРѕ status drift, РЅРѕ Рё РЅРµРїРѕР»РЅС‹Рµ evidence-РєР°СЂС‚РѕС‡РєРё.

8. **Legal evidence template generation** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-template.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅР° РєРѕРјР°РЅРґР°:
    - `pnpm legal:evidence:template -- --reference=ELP-...`
  - Р“РµРЅРµСЂР°С‚РѕСЂ СЃРѕР±РёСЂР°РµС‚ С€Р°Р±Р»РѕРЅ РїРѕ `reference_id` Рё РїРёС€РµС‚ РµРіРѕ РІ restricted `templates/<reference_id>/`.
  - Р”Р»СЏ `ELP-20260328-01`, `03`, `04`, `06` РІРєР»СЋС‡РµРЅС‹ СЃРїРµС†РёР°Р»РёР·РёСЂРѕРІР°РЅРЅС‹Рµ СЃРµРєС†РёРё:
    - operator memo
    - hosting/residency matrix
    - processor/DPA register
    - lawful basis matrix
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - legal owners РЅРµ РЅР°С‡РёРЅР°СЋС‚ evidence-РґРѕРєСѓРјРµРЅС‚С‹ СЃ РїСѓСЃС‚РѕРіРѕ Р»РёСЃС‚Р°;
    - РїСЂРёРѕСЂРёС‚РµС‚РЅС‹Рµ Р°СЂС‚РµС„Р°РєС‚С‹ РјРѕР¶РЅРѕ СЃРѕР±РёСЂР°С‚СЊ Р±С‹СЃС‚СЂРµРµ Рё Р±РµР· С„РѕСЂРјР°Р»СЊРЅРѕРіРѕ drift РїРѕ СЃС‚СЂСѓРєС‚СѓСЂРµ.

9. **Machine-readable legal verdict automation** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-verdict.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅС‹ РєРѕРјР°РЅРґС‹:
    - `pnpm legal:evidence:verdict`
    - `pnpm gate:legal:evidence:verdict`
  - Verdict-СЃРєСЂРёРїС‚ РѕРїРёСЂР°РµС‚СЃСЏ РЅР°:
    - `var/compliance/external-legal-evidence-status.json`
    - `docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md`
    - decision rules РёР· request packet Рё acceptance runbook
  - РЎРєСЂРёРїС‚ РїРёС€РµС‚ РѕС‚С‡С‘С‚С‹:
    - `var/compliance/external-legal-evidence-verdict.json`
    - `var/compliance/external-legal-evidence-verdict.md`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - `Legal / Compliance` Р±РѕР»СЊС€Рµ РЅРµ РїРµСЂРµСЃС‡РёС‚С‹РІР°РµС‚СЃСЏ РІСЂСѓС‡РЅСѓСЋ РїРѕ С‚Р°Р±Р»РёС†Р°Рј;
    - РєРѕРјР°РЅРґР° РјРіРЅРѕРІРµРЅРЅРѕ РІРёРґРёС‚ С‚РµРєСѓС‰РёР№ verdict Рё С‚РѕС‡РЅС‹Р№ СЃРїРёСЃРѕРє blockers РґРѕ `CONDITIONAL GO` Рё `GO`.

10. **Repo-derived legal prefill drafts** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-prefill.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅР° РєРѕРјР°РЅРґР°:
    - `pnpm legal:evidence:prefill -- --reference=ELP-...`
    - `pnpm legal:evidence:prefill -- --priority=critical`
  - РљРѕРјР°РЅРґР° СЃРѕР·РґР°С‘С‚ СЂР°Р±РѕС‡РёРµ draft-С„Р°Р№Р»С‹ РІ restricted store РёР· СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹С… repo-facts.
  - РџСЂРёРЅС†РёРїРёР°Р»СЊРЅРѕРµ РѕРіСЂР°РЅРёС‡РµРЅРёРµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅРѕ РІ workflow:
    - prefill РЅРµ СЏРІР»СЏРµС‚СЃСЏ РІРЅРµС€РЅРёРј evidence;
    - prefill РЅРµ РїРµСЂРµРІРѕРґРёС‚ РєР°СЂС‚РѕС‡РєРё РІ `received`.
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - РІР»Р°РґРµР»СЊС†С‹ РїРѕР»СѓС‡Р°СЋС‚ РЅРµ РїСѓСЃС‚РѕР№ С€Р°Р±Р»РѕРЅ, Р° РїРѕС‡С‚Рё РіРѕС‚РѕРІС‹Р№ С‡РµСЂРЅРѕРІРёРє СЃ С‚РµРєСѓС‰РёРјРё repo-С„Р°РєС‚Р°РјРё Рё РїРµСЂРµС‡РЅРµРј РІРЅРµС€РЅРёС… РїСЂРѕР±РµР»РѕРІ;
    - РєСЂРёС‚РёС‡РЅС‹Рµ legal blockers РјРѕР¶РЅРѕ Р·Р°РєСЂС‹РІР°С‚СЊ Р±С‹СЃС‚СЂРµРµ Р±РµР· С„Р°Р»СЊС€РёРІРѕРіРѕ РёР·РјРµРЅРµРЅРёСЏ СЃС‚Р°С‚СѓСЃРѕРІ.
  - Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ generator СЂР°СЃС€РёСЂРµРЅ РґРѕ РїРѕР»РЅРѕРіРѕ РїРѕРєСЂС‹С‚РёСЏ:
    - `ELP-20260328-07`
    - `ELP-20260328-10`
    - `ELP-20260328-11`

11. **Owner-oriented legal handoff queue** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-handoff.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅС‹ РєРѕРјР°РЅРґС‹:
    - `pnpm legal:evidence:handoff`
    - `pnpm gate:legal:evidence:handoff`
  - Handoff-РѕС‚С‡С‘С‚ РёСЃРїРѕР»СЊР·СѓРµС‚:
    - `external-legal-evidence-status.json`
    - `external-legal-evidence-verdict.json`
    - restricted `drafts/INDEX.md`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - blockers РїРµСЂРµСЃС‚Р°Р»Рё Р±С‹С‚СЊ РїСЂРѕСЃС‚Рѕ СЃРїРёСЃРєРѕРј `ELP-*`;
    - Сѓ РєР°Р¶РґРѕРіРѕ owner С‚РµРїРµСЂСЊ РµСЃС‚СЊ СЃРІРѕСЏ РѕС‡РµСЂРµРґСЊ СЃ draft-РїСѓС‚СЏРјРё Рё РіРѕС‚РѕРІС‹РјРё intake-РєРѕРјР°РЅРґР°РјРё.

12. **Owner-specific legal packets** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-owner-packets.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅС‹ РєРѕРјР°РЅРґС‹:
    - `pnpm legal:evidence:owner-packets`
    - `pnpm gate:legal:evidence:owner-packets`
  - Р“РµРЅРµСЂР°С‚РѕСЂ РёСЃРїРѕР»СЊР·СѓРµС‚ machine-readable handoff report Рё РІС‹РїСѓСЃРєР°РµС‚ restricted bundle:
    - `owner-packets/INDEX.md`
    - `owner-packets/<owner>/HANDOFF.md`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - owner handoff Р±РѕР»СЊС€Рµ РЅРµ С‚СЂРµР±СѓРµС‚ СЂСѓС‡РЅРѕР№ СЃР±РѕСЂРєРё С„Р°Р№Р»РѕРІ РёР»Рё РєРѕРјР°РЅРґ;
    - РєР°Р¶РґС‹Р№ named owner РїРѕР»СѓС‡Р°РµС‚ РіРѕС‚РѕРІС‹Р№ packet РїРѕ СЃРІРѕРёРј blockers, С‡С‚Рѕ СѓСЃРєРѕСЂСЏРµС‚ intake СЂРµР°Р»СЊРЅС‹С… РІРЅРµС€РЅРёС… РґРѕРєСѓРјРµРЅС‚РѕРІ.

13. **Machine priority board for legal closeout** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `scripts/legal-evidence-priority-board.cjs`.
  - Р’ `package.json` РґРѕР±Р°РІР»РµРЅС‹ РєРѕРјР°РЅРґС‹:
    - `pnpm legal:evidence:priority-board`
    - `pnpm gate:legal:evidence:priority-board`
  - Generator РёСЃРїРѕР»СЊР·СѓРµС‚ machine-readable verdict Рё handoff reports Рё РІС‹РїСѓСЃРєР°РµС‚:
    - `var/compliance/external-legal-evidence-priority-board.json`
    - `var/compliance/external-legal-evidence-priority-board.md`
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - legal intake Р±РѕР»СЊС€Рµ РЅРµ СЃС‚Р°СЂС‚СѓРµС‚ СЃ СЂСѓС‡РЅРѕРіРѕ РІС‹Р±РѕСЂР° РїРѕСЂСЏРґРєР°;
    - РєРѕРјР°РЅРґР° РїРѕР»СѓС‡Р°РµС‚ РµРґРёРЅС‹Р№ machine-sorted РїРѕСЂСЏРґРѕРє Р·Р°РєСЂС‹С‚РёСЏ blockers РґРѕ `CONDITIONAL GO`.

14. **Audit executive brief and reading path** [DONE]:
  - РЎРѕР·РґР°РЅ `docs/_audit/AUDIT_EXECUTIVE_BRIEF_2026-03-28.md`.
  - РћР±РЅРѕРІР»РµРЅС‹ `docs/README.md` Рё `docs/INDEX.md`, С‡С‚РѕР±С‹ brief СЃС‚Р°Р» СЃР°РјС‹Рј Р±С‹СЃС‚СЂС‹Рј РІС…РѕРґРѕРј РІ enterprise-audit РїР°РєРµС‚.
  - РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚:
    - РёС‚РѕРіРѕРІС‹Р№ Р°СѓРґРёС‚ СЃС‚Р°Р»Рѕ РїСЂРѕС‰Рµ С‡РёС‚Р°С‚СЊ РєР°Рє Р·Р°РєРѕРЅС‡РµРЅРЅС‹Р№ deliverable;
    - РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РјРѕР¶РµС‚ Р±С‹СЃС‚СЂРѕ СѓРІРёРґРµС‚СЊ verdict, blockers Рё recommended reading order Р±РµР· РїСЂРѕС…РѕРґР° РїРѕ РІСЃРµРјСѓ РїР°РєРµС‚Сѓ СЃСЂР°Р·Сѓ.

1. **Ledger schema recovery Рё economy stress-suite stabilization** [DONE]:
  - `packages/prisma-client/fix_schema.ts` СЂР°СЃС€РёСЂРµРЅ РґРѕ РїРѕР»РЅРѕРіРѕ recovery-РїСЂРѕС…РѕРґР° РїРѕ hardened ledger-РєРѕРЅС‚СѓСЂСѓ, Р° РЅРµ С‚РѕР»СЊРєРѕ РґРѕ СЂРµРјРѕРЅС‚Р° `create_ledger_entry_v1`.
  - РЎРєСЂРёРїС‚ С‚РµРїРµСЂСЊ РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ `dblink`, `account_balances`, `check_tenant_state_hardened_v6`, `update_account_balance_v1`, `no_negative_cash`, trigger wiring Рё СЃР°Рј `create_ledger_entry_v1`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅРѕ, С‡С‚Рѕ Р»РѕРєР°Р»СЊРЅР°СЏ Р‘Р” РЅР°С…РѕРґРёР»Р°СЃСЊ РІ schema drift СЃРѕСЃС‚РѕСЏРЅРёРё: Р·Р°РїРёСЃСЊ Рѕ РјРёРіСЂР°С†РёРё РїСЂРёСЃСѓС‚СЃС‚РІРѕРІР°Р»Р°, РЅРѕ runtime-РѕР±СЉРµРєС‚С‹ ledger-РєРѕРЅС‚СѓСЂР° Р±С‹Р»Рё РЅРµРїРѕР»РЅС‹РјРё.
  - РџРѕСЃР»Рµ РїСЂРѕРіРѕРЅР° recovery-СЃРєСЂРёРїС‚Р° `src/modules/finance-economy/economy/application/economy.concurrency.spec.ts` РїСЂРѕС…РѕРґРёС‚ РїРѕР»РЅРѕСЃС‚СЊСЋ.

2. **Audit/consulting/smoke remediation batch** [DONE]:
  - `apps/api/src/shared/audit/audit.module.ts` РїРѕР»СѓС‡РёР» СЏРІРЅС‹Рµ РёРјРїРѕСЂС‚С‹ `CryptoModule` Рё `AnchorModule`, С‡С‚РѕР±С‹ `AuditNotarizationService` РЅРµ Р·Р°РІРёСЃРµР» РѕС‚ СЃР»СѓС‡Р°Р№РЅРѕРіРѕ РѕРєСЂСѓР¶Р°СЋС‰РµРіРѕ РјРѕРґСѓР»СЏ.
  - `src/modules/consulting/domain-rules/consulting.domain-rules.spec.ts` СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ: reject-Р°СЃСЃРµСЂС‚С‹ РїРµСЂРµРІРµРґРµРЅС‹ РЅР° single-promise pattern, С‡С‚Рѕ СѓР±СЂР°Р»Рѕ Р»РѕР¶РЅС‹Р№ `РџР»Р°РЅ СѓР±РѕСЂРєРё РЅРµ РЅР°Р№РґРµРЅ`.
  - `test/a_rai-live-api-smoke.spec.ts` РїСЂРёРІРµРґС‘РЅ Рє С‚РµРєСѓС‰РµРјСѓ runtime-РєРѕРЅС‚СЂР°РєС‚Сѓ:
    - РґРѕР±Р°РІР»РµРЅ `EventEmitterModule.forRoot()`
    - `ConfigService` РїРµСЂРµСЃС‚Р°Р» РіР»СѓС€РёС‚СЊ `process.env`
    - `Prisma` proxy РїРѕР»СѓС‡РёР» `$transaction`, raw-methods Рё safe raw wrappers
    - `Redis` mock РґРѕРїРѕР»РЅРµРЅ `isReady`
    - `IdempotencyInterceptor` overridden РєР°Рє no-op, С‡С‚РѕР±С‹ smoke РїСЂРѕРІРµСЂСЏР» HTTP/runtime РєРѕРЅС‚СЂР°РєС‚С‹, Р° РЅРµ РѕС‚РґРµР»СЊРЅС‹Р№ РёРґРµРјРїРѕС‚РµРЅС‚РЅС‹Р№ perimeter
  - Targeted РїСЂРѕРіРѕРЅ `test/a_rai-live-api-smoke.spec.ts` + `src/modules/consulting/domain-rules/consulting.domain-rules.spec.ts` С‚РµРїРµСЂСЊ Р·РµР»С‘РЅС‹Р№.

3. **РќРѕРІС‹Р№ РїРѕР»РЅС‹Р№ backend baseline** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РїРѕР»РЅС‹Р№ РїСЂРѕРіРѕРЅ `pnpm --filter api test -- --runInBand`.
  - РС‚РѕРі:
    - `Test Suites: 252 passed, 252 total`
    - `Tests: 1313 passed, 1 skipped, 1314 total`
  - Р—Р°С„РёРєСЃРёСЂРѕРІР°РЅРѕ СѓР»СѓС‡С€РµРЅРёРµ РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ РїСЂРµРґС‹РґСѓС‰РµРіРѕ baseline:
    - Р±С‹Р»Рѕ `7 failed, 245 passed, 252 total`
    - Р·Р°С‚РµРј Р±С‹Р»Рѕ `2 failed, 5 passed, 7 targeted`
    - С‚РµРїРµСЂСЊ backend `api` РїРѕР»РЅРѕСЃС‚СЊСЋ Р·РµР»С‘РЅС‹Р№ РІ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅРѕРј `runInBand`-СЂРµР¶РёРјРµ.

## 2026-03-27

1. **Р—Р°РїСѓСЃРє РґРµРІ-СЃРµСЂРІРµСЂР° Gripil Web** [DONE]:
  - РџРѕРґРЅСЏС‚ `next dev` РґР»СЏ `apps/gripil-web` РЅР° РїРѕСЂС‚Сѓ `3005`.
  - Р’РµСЂРёС„РёС†РёСЂРѕРІР°РЅ СЃС‚Р°С‚СѓСЃ `200 OK` С‡РµСЂРµР· `curl`.

2. **Production-Р±РёР»Рґ Gripil Web** [DONE]:
  - Р—Р°РїСѓС‰РµРЅР° Рё СѓСЃРїРµС€РЅРѕ Р·Р°РІРµСЂС€РµРЅР° СЃР±РѕСЂРєР° `pnpm build` РґР»СЏ `apps/gripil-web`.
  - РђСЂС‚РµС„Р°РєС‚С‹ СЃР±РѕСЂРєРё РіРѕС‚РѕРІС‹ Рє СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёСЋ.

## 2026-03-26

1. **РЎС‚Р°Р±РёР»РёР·Р°С†РёСЏ Gripil Web (Emergency Revert)** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РїРѕР»РЅС‹Р№ РѕС‚РєР°С‚ РєРѕРґРѕРІРѕР№ Р±Р°Р·С‹ Р»РµРЅРґРёРЅРіР° `apps/gripil-web` РґРѕ СЃС‚Р°Р±РёР»СЊРЅРѕРіРѕ РєРѕРјРјРёС‚Р° `f608995` ("bee") РїРѕСЃР»Рµ РЅРµСѓРґР°С‡РЅРѕР№ РїРѕРїС‹С‚РєРё РІРЅРµРґСЂРµРЅРёСЏ fluid-С‚РёРїРѕРіСЂР°С„РёРєРё.
  - РСЃРїСЂР°РІР»РµРЅС‹ РєСЂРёС‚РёС‡РµСЃРєРёРµ РѕС€РёР±РєРё С‚РёРїРёР·Р°С†РёРё Framer Motion (`as any` РґР»СЏ ease-С„СѓРЅРєС†РёР№), Р±Р»РѕРєРёСЂРѕРІР°РІС€РёРµ production-СЃР±РѕСЂРєСѓ РІ Next.js 16/Turbopack.
  - РџСЂРѕРІРµРґРµРЅ СѓСЃРїРµС€РЅС‹Р№ production-Р±РёР»Рґ (`npm run build`) Рё РїСЂРѕРІРµСЂРєР° СЂР°Р±РѕС‚РѕСЃРїРѕСЃРѕР±РЅРѕСЃС‚Рё.
  - РљРѕРґ Р·Р°РїСѓС€РµРЅ РІ СѓРґР°Р»РµРЅРЅС‹Р№ СЂРµРїРѕР·РёС‚РѕСЂРёР№.
  - РЎР°Р№С‚ СЂР°Р·РІРµСЂРЅСѓС‚ Рё РґРѕСЃС‚СѓРїРµРЅ С‡РµСЂРµР· Cloudflare Tunnel РЅР° РїРѕСЂС‚Сѓ 3012.

## 2026-03-24

1. **РћР±РЅРѕРІР»РµРЅРёРµ РєРѕСЂРЅРµРІРѕРіРѕ `README.md`** [DONE]:
  - РђРєС‚СѓР°Р»РёР·РёСЂРѕРІР°РЅР° РґР°С‚Р° СЃРѕСЃС‚РѕСЏРЅРёСЏ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ: `2026-03-24`.
  - Р”РѕР±Р°РІР»РµРЅ СЂР°Р·РґРµР» В«AI, РђРіРµРЅС‚РЅР°СЏ РїР»Р°С‚С„РѕСЂРјР° Рё governanceВ» СЃ РѕРїРёСЃР°РЅРёРµРј Stage 2: СЂРµС„РµСЂРµРЅСЃРЅС‹Рµ Р°РіРµРЅС‚С‹ `AgronomAgent`, `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`.
  - Р Р°СЃС€РёСЂРµРЅР° СЃС‚СЂСѓРєС‚СѓСЂР° `docs/` РґРѕ РїРѕР»РЅРѕРіРѕ РЅР°Р±РѕСЂР° РёР· 13 СЃР»РѕС‘РІ, РІРєР»СЋС‡Р°СЏ `00_STRATEGY`, `02_DOMAINS`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS`.
  - РўР°Р±Р»РёС†Р° РєРѕРјР°РЅРґ СЂР°Р·Р±РёС‚Р° РЅР° С‚СЂРё СЂР°Р·РґРµР»Р°: РѕСЃРЅРѕРІРЅС‹Рµ, Р±Р°Р·Р° РґР°РЅРЅС‹С…, РіРµР№С‚С‹ Рё Р»РёРЅС‚РµСЂС‹. Р”РѕР±Р°РІР»РµРЅС‹ РІСЃРµ РєСЂРёС‚РёС‡РµСЃРєРёРµ `gate:db:*`, `gate:architecture`, `gate:rollout`.
  - Р”РѕР±Р°РІР»РµРЅР° СЃСЃС‹Р»РєР° РЅР° `docs/00_STRATEGY/Р“Р•РќР•Р РђР›Р¬РќРћР• РћРџРРЎРђРќРР• RAI ENTERPRISE PLATFORM.md` v2.0 Рё `docs/11_INSTRUCTIONS/`.
  - Р РµС„Р°РєС‚РѕСЂРёРЅРі СЂР°Р·РґРµР»Р° В«Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏВ»: СЏРІРЅРѕ РѕР±РѕР·РЅР°С‡РµРЅС‹ С‚СЂРё РіСЂСѓРїРїС‹ СЃР»РѕС‘РІ (verified operational canon / active design & planning / historical).
  - `pnpm lint:docs` вЂ” PASS (0 РѕС€РёР±РѕРє).

2. **РЎРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ (Push)** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РєРѕРјРјРёС‚ Рё РїСѓС€ С‚РµРєСѓС‰РёС… Р»РѕРєР°Р»СЊРЅС‹С… РёР·РјРµРЅРµРЅРёР№ РІ СѓРґР°Р»С‘РЅРЅС‹Р№ СЂРµРїРѕР·РёС‚РѕСЂРёР№.

3. **Р‘РёР·РЅРµСЃ-СЃС‚СЂР°С‚РµРіРёСЏ Рё Р°СЂС…РёС‚РµРєС‚СѓСЂР° (РћР±РѕРіР°С‰РµРЅРёРµ РјР°СЂРєРµС‚РёРЅРіРѕРІРѕРіРѕ РґРѕРєСѓРјРµРЅС‚Р°)** [DONE]:
  - Р”РѕРєСѓРјРµРЅС‚ `docs/00_STRATEGY/BUSINESS/RAI_BUSINESS_STRATEGY_PRESENTATION.md` СЂР°РґРёРєР°Р»СЊРЅРѕ СѓСЃРёР»РµРЅ С„Р°РєС‚РѕР»РѕРіРёРµР№ РёР· `Р“Р•РќР•Р РђР›Р¬РќРћР• РћРџРРЎРђРќРР• RAI ENTERPRISE PLATFORM.md`.
  - Р’ РґРѕРєСѓРјРµРЅС‚ РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅС‹ СЂРµР°Р»СЊРЅС‹Рµ С‚РµС…РЅРёС‡РµСЃРєРёРµ Р°РєС‚РёРІС‹, РґРѕРєР°Р·С‹РІР°СЋС‰РёРµ РёРЅРІРµСЃС‚РѕСЂР°Рј, С‡С‚Рѕ СЃС‚СЂР°С‚РµРіРёСЏ СЃС‚СЂРѕРёС‚СЃСЏ РЅР° СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРј С„СѓРЅРґР°РјРµРЅС‚Рµ: 6 РєРѕРЅС‚СѓСЂРѕРІ СѓРїСЂР°РІР»РµРЅРёСЏ, Stage 2 Agent Platform (`AgronomAgent`, `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`), `IntegrityGate`, С‚СЂР°РЅР·Р°РєС†РёРѕРЅРЅС‹Р№ `Ledger` Рё `FSM`.
  - РњР°СЃС€С‚Р°Р±РёСЂРѕРІР°РЅРёРµ С‚РµРїРµСЂСЊ РїСЂРёРІСЏР·Р°РЅРѕ Рє С‚РµРєСѓС‰РµРјСѓ СЃРѕСЃС‚РѕСЏРЅРёСЋ РІРЅРµРґСЂРµРЅРёСЏ (РёРЅС‚РµСЂС„РµР№СЃС‹ СЃРєСЂС‹РІР°СЋС‚ СѓР¶Рµ СЂР°Р±РѕС‚Р°СЋС‰СѓСЋ РїРѕРґ РєР°РїРѕС‚РѕРј РјРѕС‰СЊ).
  - Р’РµСЂСЃРёСЏ РґРѕРєСѓРјРµРЅС‚Р° РїРѕРґРЅСЏС‚Р° РґРѕ `1.1.0`.

## 2026-03-25

1. **Agent module org structure** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ execution-doc `docs/07_EXECUTION/AGENT_MODULE_ORG_STRUCTURE.md`.
  - Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ РѕСЂРіСЃС‚СЂСѓРєС‚СѓСЂСѓ Р°РіРµРЅС‚СЃРєРѕРіРѕ РјРѕРґСѓР»СЏ РєР°Рє СЃРёСЃС‚РµРјСѓ СѓСЂРѕРІРЅРµР№ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё, Р° РЅРµ РєР°Рє РїСЂРѕСЃС‚РѕР№ СЃРїРёСЃРѕРє Р°РіРµРЅС‚РѕРІ.
  - Р’ РґРѕРєСѓРјРµРЅС‚Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹:
    - `Ingress Layer`
    - `Orchestration Layer`
    - `Owner Agents Layer`
    - `Expert / Escalation Layer`
    - `Trust / Governance Layer`
    - `Execution Layer`
  - Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹:
    - owner map РїРѕ СѓСЂРѕРІРЅСЏРј
    - РїСЂР°РІРёР»Р° СЌСЃРєР°Р»Р°С†РёРё
    - Р·Р°РїСЂРµС‚С‹ РЅР° СЃРјРµС€РµРЅРёРµ СЂРѕР»РµР№
    - РїСЂР°РІРёР»Рѕ РїСЂРёРјРµРЅРµРЅРёСЏ РѕСЂРіСЃС‚СЂСѓРєС‚СѓСЂС‹ Рє РЅРѕРІС‹Рј Р°РіРµРЅС‚Р°Рј Рё РЅРѕРІС‹Рј СЃС†РµРЅР°СЂРёСЏРј
    - РґРѕР±Р°РІР»РµРЅС‹ РґРІРµ РІРёР·СѓР°Р»СЊРЅС‹Рµ `Mermaid`-СЃС…РµРјС‹:
      - РІРµСЂС‚РёРєР°Р»СЊРЅР°СЏ СЃС…РµРјР° СѓСЂРѕРІРЅРµР№
      - СЃС…РµРјР° РѕС‚РЅРѕС€РµРЅРёР№ РјРµР¶РґСѓ ingress, orchestration, owner agents, expert-layer, trust/governance Рё execution
    - РґРѕР±Р°РІР»РµРЅР° РїСЂРѕСЃС‚Р°СЏ СЂСѓСЃСЃРєРѕСЏР·С‹С‡РЅР°СЏ ASCII-СЃС…РµРјР° РґР»СЏ Р±С‹СЃС‚СЂРѕРіРѕ С‡С‚РµРЅРёСЏ Р±РµР· С‚РµСЂРјРёРЅРѕР»РѕРіРёС‡РµСЃРєРѕР№ РЅР°РіСЂСѓР·РєРё
    - СѓС‚РѕС‡РЅРµРЅРѕ, С‡С‚Рѕ `front_office_agent` РѕС‚РЅРѕСЃРёС‚СЃСЏ С‚РѕР»СЊРєРѕ Рє front-office РєРѕРјРјСѓРЅРёРєР°С†РёРѕРЅРЅРѕРјСѓ ingress, Р° Р±РёР·РЅРµСЃ-СЃРµРјР°РЅС‚РёС‡РµСЃРєРёР№ РІС…РѕРґ `rai-chat` РѕСЃС‚Р°С‘С‚СЃСЏ РѕС‚РґРµР»СЊРЅС‹Рј back-office РјР°СЂС€СЂСѓС‚РѕРј С‡РµСЂРµР· semantic ingress Рё orchestration
    - РґРѕР±Р°РІР»РµРЅР° РїСЂРѕСЃС‚Р°СЏ С‚Р°Р±Р»РёС†Р° РјР°СЂС€СЂСѓС‚РѕРІ, РєРѕС‚РѕСЂР°СЏ СЏРІРЅРѕ СЂР°Р·РІРѕРґРёС‚ РєРѕРјРјСѓРЅРёРєР°С†РёРѕРЅРЅС‹Р№ РІС…РѕРґ Рё РґРѕРјРµРЅРЅС‹Рµ Р±РёР·РЅРµСЃ-Р·Р°РїСЂРѕСЃС‹
    - СѓС‚РѕС‡РЅРµРЅРѕ, С‡С‚Рѕ `front_office_agent` РЅРµ СЏРІР»СЏРµС‚СЃСЏ РѕР±С‰РёРј РєРѕРјРјСѓРЅРёРєР°С‚РѕСЂРѕРј РґР»СЏ `rai-chat`; back-office business path РёРґС‘С‚ С‡РµСЂРµР· `rai-chat -> semantic ingress -> SupervisorAgent -> owner-agent`
  - РќРѕРІС‹Р№ claim `CLAIM-EXE-AGENT-MODULE-ORG-STRUCTURE-20260325` Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РІ `docs/DOCS_MATRIX.md`.
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: Сѓ РєРѕРјР°РЅРґС‹ РїРѕСЏРІРёР»Р°СЃСЊ РєР°РЅРѕРЅРёС‡РµСЃРєР°СЏ СЃС…РµРјР° Р°РіРµРЅС‚СЃРєРѕРіРѕ РјРѕРґСѓР»СЏ, РїРѕ РєРѕС‚РѕСЂРѕР№ РјРѕР¶РЅРѕ РІС‹СЂР°РІРЅРёРІР°С‚СЊ runtime, РЅРѕРІС‹Рµ agent profiles Рё РґР°Р»СЊРЅРµР№С€СѓСЋ Р°СЂС…РёС‚РµРєС‚СѓСЂСѓ multi-agent РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёСЏ.

2. **Agent module RACI and reporting lines** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ execution-doc `docs/07_EXECUTION/AGENT_MODULE_RACI_AND_REPORTING_LINES.md`.
  - Р”РѕРєСѓРјРµРЅС‚ РїРµСЂРµРІРѕРґРёС‚ РѕСЂРіСЃС‚СЂСѓРєС‚СѓСЂСѓ Р°РіРµРЅС‚СЃРєРѕРіРѕ РјРѕРґСѓР»СЏ РІ СЂР°Р±РѕС‡СѓСЋ РјР°С‚СЂРёС†Сѓ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё.
  - Р’ РґРѕРєСѓРјРµРЅС‚Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹:
    - СЂРѕР»Рё `R / A / C / I / E / T`
    - reporting lines РґР»СЏ `front_office_agent`, `semantic ingress`, `SupervisorAgent` Рё owner-agents
    - RACI-РјР°С‚СЂРёС†С‹ РґР»СЏ РєРѕРјРјСѓРЅРёРєР°С†РёРѕРЅРЅРѕРіРѕ ingress, primary owner domains, supporting branches, multi-source Рё composite scenarios
    - РїСЂР°РІРёР»Рѕ РІС‹Р±РѕСЂР° `lead owner-agent`
    - РѕС‚РґРµР»СЊРЅС‹Рµ РіСЂР°РЅРёС†С‹ РґР»СЏ `front_office_agent`, `SupervisorAgent`, `TruthfulnessEngine` Рё `Branch Trust Gate`
    - РјРёРЅРёРјР°Р»СЊРЅР°СЏ РјР°С‚СЂРёС†Р°, РѕР±СЏР·Р°С‚РµР»СЊРЅР°СЏ РґР»СЏ РЅРѕРІРѕРіРѕ routing case
  - РќРѕРІС‹Р№ claim `CLAIM-EXE-AGENT-MODULE-RACI-AND-REPORTING-LINES-20260325` Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РІ `docs/DOCS_MATRIX.md`.
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: РѕСЂРіСЃС‚СЂСѓРєС‚СѓСЂР° РїРµСЂРµСЃС‚Р°Р»Р° Р±С‹С‚СЊ С‚РѕР»СЊРєРѕ СЃС…РµРјРѕР№ СѓСЂРѕРІРЅРµР№ Рё СЃС‚Р°Р»Р° РїСЂРёРіРѕРґРЅРѕР№ РґР»СЏ РїСЂСЏРјРѕРіРѕ РїСЂРёРјРµРЅРµРЅРёСЏ РІ routing, agent profiles, governance Рё implementation backlog.
  - РЎРѕРїСѓС‚СЃС‚РІСѓСЋС‰РµРµ РёСЃРїСЂР°РІР»РµРЅРёРµ docs-root policy:
    - СЃС…РµРјР° `docs/Р›РѕРіРёРєР° РґРІРёР¶РµРЅРёСЏ Р·Р°РїСЂРѕСЃРѕРІ.drawio` РїРµСЂРµРЅРµСЃРµРЅР° РІ `docs/07_EXECUTION/LOGIC_OF_REQUEST_FLOW.drawio`
    - СЌС„С„РµРєС‚: РєРѕСЂРµРЅСЊ `docs/` СЃРЅРѕРІР° СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓРµС‚ policy, Рё РѕР±С‰РёР№ docs-Р»РёРЅС‚ Р±РѕР»СЊС€Рµ РЅРµ РїР°РґР°РµС‚ РЅР° root junk

3. **Instruction-layer sync with agent org structure** [DONE]:
  - РћР±РЅРѕРІР»С‘РЅ `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md`.
  - РћР±РЅРѕРІР»С‘РЅ `docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_FRONT_OFFICE_AGENT_ENABLEMENT.md`.
  - Р’ instruction-layer Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹:
    - Р¶С‘СЃС‚РєРѕРµ СЂР°Р·РґРµР»РµРЅРёРµ `front-office communication ingress` Рё `back-office rai-chat business ingress`
    - РїСЂР°РІРёР»Рѕ, С‡С‚Рѕ `front_office_agent` РЅРµ СЏРІР»СЏРµС‚СЃСЏ РѕР±С‰РёРј РєРѕРјРјСѓРЅРёРєР°С‚РѕСЂРѕРј РїР»Р°С‚С„РѕСЂРјС‹ Рё РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ owner РґР»СЏ `rai-chat` business scenarios
    - СѓС‚РѕС‡РЅС‘РЅРЅС‹Р№ orchestration path С‡РµСЂРµР· `semantic ingress -> SupervisorAgent -> owner-agent`
    - РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ routing/RACI-РєРѕРЅС‚РµРєСЃС‚ РґР»СЏ `lead owner-agent`, supporting branches Рё trust-layer
    - С‚РµСЃС‚РѕРІС‹Рµ Рё production-ready РєСЂРёС‚РµСЂРёРё РїСЂРѕС‚РёРІ Р·Р°С…РІР°С‚Р° `rai-chat` РјР°СЂС€СЂСѓС‚РѕРІ `front_office_agent`-РѕРј
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: instruction-layer СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ СЃ execution-РґРѕРєСѓРјРµРЅС‚Р°РјРё РїРѕ РіСЂР°РЅРёС†Р°Рј `front_office_agent`, `SupervisorAgent`, `lead owner-agent` Рё `rai-chat` business path.

## 2026-03-22

1. **TECH_MAP_GOVERNED_WORKFLOW РёРЅР¶РµРЅРµСЂРЅР°СЏ СЃРїРµС†РёС„РёРєР°С†РёСЏ** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ РґРѕРєСѓРјРµРЅС‚ `docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md`.
  - Р”РѕРєСѓРјРµРЅС‚ С„РёРєСЃРёСЂСѓРµС‚ РўРµС…РєР°СЂС‚Сѓ РєР°Рє governed composite workflow РїРµСЂРІРѕРіРѕ РєР»Р°СЃСЃР°, Р° РЅРµ РєР°Рє вЂњСЃР»РѕР¶РЅС‹Р№ РѕС‚РІРµС‚ Р°РіРµРЅС‚Р°вЂќ.
  - Р’ РґРѕРєСѓРјРµРЅС‚Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹:
    - Р±РёР·РЅРµСЃ-СЃРјС‹СЃР» РўРµС…РєР°СЂС‚С‹
    - РїСЂРёС‡РёРЅС‹, РїРѕС‡РµРјСѓ workflow РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ governed
    - tech-map specialization РґР»СЏ `semantic ingress`
    - required context model Рё slot matrix
    - readiness levels `S0_UNSCOPED -> S5_PUBLISHABLE`
    - missing-context / clarify model
    - assumption policy
    - owner-agent Рё participating agents
    - workflow phases
    - branch architecture
    - typed workflow/branch/composition contracts
    - truth / trust / evidence model
    - deterministic vs `LLM` responsibility split
    - governance / approvals / publication rules
    - explainability bundle
    - audit / forensics model
    - failure modes / anti-hallucination safeguards
    - 5 РѕР±СЏР·Р°С‚РµР»СЊРЅС‹С… sequence-СЃС†РµРЅР°СЂРёРµРІ
    - MVP slice Рё РїРµСЂРІР°СЏ implementation-РґРµРєРѕРјРїРѕР·РёС†РёСЏ
  - РЎР»РµРґСѓСЋС‰РёРј СѓС‚РѕС‡РЅРµРЅРёРµРј СЌС‚РѕС‚ Р¶Рµ spec СЂР°СЃС€РёСЂРµРЅ explicit expert-review СЃР»РѕРµРј:
    - `chief_agronomist` Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ РєР°Рє conditional expert-review СЃР»РѕР№, Р° РЅРµ РєР°Рє owner СЃР±РѕСЂРєРё РўРµС…РєР°СЂС‚С‹
    - РґРѕР±Р°РІР»РµРЅР° РѕС‚РґРµР»СЊРЅР°СЏ С„Р°Р·Р° `EXPERT_REVIEW`
    - РІРІРµРґС‘РЅ typed contract `TechMapExpertReviewResult`
    - РІРІРµРґРµРЅР° trigger-policy РґР»СЏ РІС‹Р·РѕРІР° `chief_agronomist`
    - Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ С‡РµСЃС‚РЅС‹Р№ bypass path РІ human review, РµСЃР»Рё expert-tier execution path РЅРµРґРѕСЃС‚СѓРїРµРЅ
    - РѕР±РЅРѕРІР»РµРЅС‹ review/publication sequence, explainability Рё audit artifacts
  - РЎР»РµРґСѓСЋС‰РёРј СѓСЃРёР»РёС‚РµР»СЊРЅС‹Рј РїСЂРѕС…РѕРґРѕРј spec РґРѕРІРµРґС‘РЅ РґРѕ Р±РѕР»РµРµ РєР°РЅРѕРЅРёС‡РµСЃРєРѕРіРѕ implementation-ready СѓСЂРѕРІРЅСЏ:
    - РґРѕР±Р°РІР»РµРЅ СЂР°Р·РґРµР» `Canonical Tech Map Domain Model` СЃ `TechMapCanonicalDraft`, variant/object graph Рё persisted invariants
    - РІРІРµРґРµРЅР° Р¶С‘СЃС‚РєР°СЏ state taxonomy Рё СЂР°Р·РІРµРґРµРЅС‹ `workflow state`, `review/approval state`, `publication state` Рё `persistence state`
    - `clarify` РѕС„РѕСЂРјР»РµРЅ РєР°Рє operational subprocess СЃ batch grouping, `ONE_SHOT / MULTI_STEP`, `resume_token`, `TTL` Рё expiration semantics
    - Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅР° `Conflict Resolution And Source Authority Policy` СЃ authority ranking, recency/specificity rules Рё РєР»Р°СЃСЃР°РјРё СЂР°Р·СЂРµС€РµРЅРёСЏ РєРѕРЅС„Р»РёРєС‚РѕРІ
    - СѓСЃРёР»РµРЅС‹ finance/compliance publishability-РєРѕРЅС‚СЂР°РєС‚С‹: budget ceiling, unit economics thresholds, prohibited inputs, contract-linked constraints, regulatory locks, sign-off obligations
    - СЏРІРЅРѕ РѕРїРёСЃР°РЅС‹ write boundaries РїРѕ С„Р°Р·Р°Рј, immutable snapshots Рё versioning rules
    - sequence-СЂР°Р·РґРµР» РґРѕРїРѕР»РЅРµРЅ `Mermaid` diagrams: 5 СЃС†РµРЅР°СЂРёРµРІ, state diagram, branch dependency graph, approval swimlane
  - РЎР»РµРґСѓСЋС‰РёРј execution/code РїР°РєРµС‚РѕРј СЃРґРµР»Р°РЅРѕ:
    - РґРѕР±Р°РІР»РµРЅ shared governed contract-layer РІ `apps/api/src/shared/tech-map/` РґР»СЏ `artifact/state/conflict/clarify`
    - РґРѕР±Р°РІР»РµРЅ helper-СЃР»РѕР№ persisted status mapping/editability/transitions
    - `TechMapStateMachine` Рё `TechMapService.updateDraft(...)` РїРµСЂРµСЃС‚Р°Р»Рё РґРµСЂР¶Р°С‚СЊ status/editability rules С‚РѕР»СЊРєРѕ Р»РѕРєР°Р»СЊРЅРѕ Рё РЅР°С‡Р°Р»Рё РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ shared source
    - РґРѕР±Р°РІР»РµРЅС‹ execution-РґРѕРєРё:
      - `docs/07_EXECUTION/TECH_MAP_TMW-2_CANONICAL_ARTIFACT_SCHEMA_IMPLEMENTATION_PLAN.md`
      - `docs/07_EXECUTION/TECH_MAP_TMW-8_PERSISTENCE_VERSIONING_GATE_IMPLEMENTATION_PLAN.md`
    - РЅРѕРІС‹Рµ execution claims Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅС‹ РІ `docs/DOCS_MATRIX.md`
  - РЎР»РµРґСѓСЋС‰РёРј hardening-РїР°РєРµС‚РѕРј СЃРґРµР»Р°РЅРѕ:
    - РѕСЃРЅРѕРІРЅРѕР№ spec СѓСЃРёР»РµРЅ canonical `Slot Registry` contract, formal workflow verdict aggregation matrix Рё approval trigger/invalidation rules
    - Р¶С‘СЃС‚С‡Рµ Р·Р°РєСЂРµРїР»РµРЅС‹ invariants РїСЂРѕС‚РёРІ role inflation РґР»СЏ `chief_agronomist`
    - РґРѕР±Р°РІР»РµРЅС‹ execution-РґРѕРєРё:
      - `docs/07_EXECUTION/TECH_MAP_TMW-1_SLOT_REGISTRY_IMPLEMENTATION_PLAN.md`
      - `docs/07_EXECUTION/TECH_MAP_TMW-6_BRANCH_CONTRACTS_CONFLICT_AUTHORITY_IMPLEMENTATION_PLAN.md`
    - РІ `apps/api/src/shared/tech-map/` РґРѕР±Р°РІР»РµРЅС‹:
      - `tech-map-slot-registry.ts`
      - `tech-map-governed-branch.types.ts`
      - `tech-map-governed-verdict.helpers.ts`
      - `tech-map-conflict-authority.helpers.ts`
    - unit-tests РґРѕР±Р°РІР»РµРЅС‹ РґР»СЏ slot registry, verdict aggregation Рё authority precedence
  - РЎР»РµРґСѓСЋС‰РёРј runtime adoption-СЃСЂРµР·РѕРј СЃРґРµР»Р°РЅРѕ:
    - РґРѕР±Р°РІР»РµРЅ helper `tech-map-governed-draft.helpers.ts`, РєРѕС‚РѕСЂС‹Р№ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅРѕ СЃС‡РёС‚Р°РµС‚ `readiness`, `clarify`, `gaps`, `publicationState` Рё `workflowVerdict`
    - `TechMapService.createDraftStub(...)` С‚РµРїРµСЂСЊ СЃРѕР±РёСЂР°РµС‚ governed intake РїРѕ СЂРµР°Р»СЊРЅС‹Рј РґР°РЅРЅС‹Рј `season / plan / cropZone / soilProfile / techMap history / harvest history / input catalog`
    - `GenerateTechMapDraftResult` СЂР°СЃС€РёСЂРµРЅ governed-РїРѕР»СЏРјРё `readiness / nextReadinessTarget / workflowVerdict / publicationState / clarifyItems / gaps / tasks`
    - `ResponseComposer` РїРµСЂРµСЃС‚Р°Р» РѕС‚РІРµС‡Р°С‚СЊ РїРѕ `generate_tech_map_draft` РєР°Рє РїРѕ Р±РµР·СѓСЃР»РѕРІРЅРѕ РіРѕС‚РѕРІРѕРјСѓ draft Рё РЅР°С‡Р°Р» РїРѕРєР°Р·С‹РІР°С‚СЊ governed boundary С‡РµСЂРµР· readiness/verdict/clarify count
    - `methodology_profile_id` РІ С‚РµРєСѓС‰РµРј runtime РІСЂРµРјРµРЅРЅРѕ РІС‹РІРѕРґРёС‚СЃСЏ РёР· deterministic blueprint metadata, С‡С‚Рѕ РґР°С‘С‚ С‡РµСЃС‚РЅС‹Р№ machine-readable methodology basis РІРјРµСЃС‚Рѕ РїСѓСЃС‚РѕРіРѕ Р·Р°РіР»СѓС€РµС‡РЅРѕРіРѕ РїРѕР»СЏ
    - РґРѕР±Р°РІР»РµРЅ unit-spec `tech-map-governed-draft.helpers.spec.ts`
  - Р”Р»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ РІСЃРµР№ РїСЂРѕРіСЂР°РјРјРѕР№ СЃРІРµСЂС…Сѓ РґРѕР±Р°РІР»РµРЅ master execution-checklist:
    - `docs/07_EXECUTION/TECH_MAP_MASTER_IMPLEMENTATION_CHECKLIST.md`
    - РѕРЅ С„РёРєСЃРёСЂСѓРµС‚ РїРѕР»РЅС‹Р№ РјР°СЂС€СЂСѓС‚ `TMW-0..TMW-9`
    - РѕРЅ РїРѕРєР°Р·С‹РІР°РµС‚, РєР°РєРёРµ РїР°РєРµС‚С‹ СѓР¶Рµ СЃРґРµР»Р°РЅС‹, РєР°РєРёРµ РІ СЂР°Р±РѕС‚Рµ Рё РєР°РєРёРµ РµС‰С‘ РЅРµ СЃС‚Р°СЂС‚РѕРІР°Р»Рё
    - РѕРЅ С„РёРєСЃРёСЂСѓРµС‚ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё, С‚РµРєСѓС‰РёР№ active slice Рё Р·Р°РїСЂРµС‚ РЅР° РІС‹С…РѕРґ РёР· РѕС‡РµСЂРµРґРЅРѕСЃС‚Рё
  - Р”РѕРєСѓРјРµРЅС‚РЅС‹Р№ РєРѕРЅС‚СѓСЂ РўРµС…РєР°СЂС‚С‹ РґРѕР±СЂР°РЅ РґРѕ РїРѕР»РЅРѕРіРѕ РЅР°Р±РѕСЂР° execution-РїР°РєРµС‚РѕРІ:
    - РґРѕР±Р°РІР»РµРЅС‹ `TMW-3 Clarify Loop Engine`
    - РґРѕР±Р°РІР»РµРЅС‹ `TMW-4 Semantic Frame Extension`
    - РґРѕР±Р°РІР»РµРЅС‹ `TMW-5 Workflow Orchestrator`
    - РґРѕР±Р°РІР»РµРЅС‹ `TMW-7 Trust + Composition`
    - РґРѕР±Р°РІР»РµРЅС‹ `TMW-9 Expert Review Gate`
    - master-checklist Рё `DOCS_MATRIX` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ СЃ РїРѕР»РЅС‹Рј РЅР°Р±РѕСЂРѕРј `TMW`
  - Р’Р°Р¶РЅРѕРµ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅРЅРѕРµ СЂРµС€РµРЅРёРµ:
    - С‚РµРєСѓС‰РёР№ РєРѕРґ РѕСЃС‚Р°С‘С‚СЃСЏ source of truth РґР»СЏ raw branch verdict enum `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED`
    - РЅР° workflow-СЃР»РѕРµ РўРµС…РєР°СЂС‚С‹ РІРІРµРґС‘РЅ Р°РіСЂРµРіРёСЂСѓСЋС‰РёР№ verdict `BLOCKED`, С‡С‚РѕР±С‹ РЅРµ Р»РѕРјР°С‚СЊ С‚РµРєСѓС‰РёР№ runtime РєР°РЅРѕРЅ Рё РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ РїРѕР»СѓС‡РёС‚СЊ user/business-РѕСЂРёРµРЅС‚РёСЂРѕРІР°РЅРЅСѓСЋ governed-РјРѕРґРµР»СЊ Р±Р»РѕРєРёСЂРѕРІРєРё
  - РќРѕРІС‹Р№ claim `CLAIM-ENG-TECH-MAP-GOVERNED-WORKFLOW-20260322` Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РІ `docs/DOCS_MATRIX.md`.
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: Сѓ РєРѕРјР°РЅРґС‹ РїРѕСЏРІРёР»СЃСЏ РїР»РѕС‚РЅС‹Р№ РёРЅР¶РµРЅРµСЂРЅС‹Р№ РёСЃС‚РѕС‡РЅРёРє РґР»СЏ РґР°Р»СЊРЅРµР№С€РµРіРѕ СЂР°Р·СЂРµР·Р°РЅРёСЏ governed workflow РўРµС…РєР°СЂС‚С‹ РЅР° backend/runtime/policy/schema/FSM implementation-РїР°РєРµС‚С‹, РІРєР»СЋС‡Р°СЏ expert-review gate, source-authority policy Рё persistence/versioning boundaries.
  - Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ С‚РµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ РёСЃРїРѕР»РЅРµРЅРёСЏ master-checklist:
  - `TMW-1` РїРѕРјРµС‡РµРЅ РєР°Рє Р·Р°РІРµСЂС€С‘РЅРЅС‹Р№ runtime slice
  - `TMW-4` РїРѕРјРµС‡РµРЅ РєР°Рє Р·Р°РІРµСЂС€С‘РЅРЅС‹Р№ runtime slice
  - `TMW-2` РїРѕРјРµС‡РµРЅ РєР°Рє Р·Р°РІРµСЂС€С‘РЅРЅС‹Р№ runtime slice
  - `TMW-3` РїРѕРјРµС‡РµРЅ РєР°Рє Р·Р°РІРµСЂС€С‘РЅРЅС‹Р№ runtime slice
  - `TMW-5` РїРѕРјРµС‡РµРЅ РєР°Рє completed runtime slice СЃ orchestrator service, live trust feed Рё final composition wiring
  - `TMW-7` РїРѕРјРµС‡РµРЅ РєР°Рє completed runtime slice СЃ trust specialization, branch-gated composition Рё variant comparison report
  - `TMW-8` РїРѕРјРµС‡РµРЅ РєР°Рє completed runtime slice СЃ persistence boundary read-model, head-draft write-guard, snapshot storage tables Рё versioning route
  - `TMW-9` Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ РєР°Рє completed runtime slice СЃ policy trigger helper, review packet contract, full audit/explainability trail Рё publication path
  - `TMW-3` Р·Р°РІРµСЂС€С‘РЅ РєР°Рє runtime slice СЃ clarify batch/resume metadata, explicit resume endpoint, audit trail Рё supervisor intake wiring
  - `TMW-4` Р·Р°РєСЂС‹С‚ РєРѕРґРѕРј:
    - semantic ingress specialization frame РґР»СЏ С‚РµС…РєР°СЂС‚С‹
    - typed `workflow intent / stage / policy / required actions`
    - compare / review / publication edge-cases
    - boundary-aware variant-count extraction
  - СЃР»РµРґСѓСЋС‰РёР№ СѓРїСЂР°РІР»СЏРµРјС‹Р№ С€Р°Рі С‚РµРїРµСЂСЊ РїСЂРѕРґРѕР»Р¶Р°С‚СЊ РїРѕ master-checklist СЃ Р±Р»РёР¶Р°Р№С€РµРіРѕ РЅРµР·Р°РєСЂС‹С‚РѕРіРѕ СѓР·Р»Р°, Р±РµР· РїРµСЂРµСЃРєР°РєРёРІР°РЅРёСЏ С‡РµСЂРµР· С‡РµРєР»РёСЃС‚
  - `TMW-1` Р·Р°РєСЂС‹С‚ РІ РєРѕРґРµ:
    - shared slot registry
    - query helpers
    - first runtime-consumer in governed draft scoring
    - clarify/readiness/publication consumers
    - master-checklist СЃРґРІРёРЅСѓС‚ С‚Р°Рє, С‡С‚РѕР±С‹ СЃР»РµРґСѓСЋС‰РёР№ Р°РєС‚РёРІРЅС‹Р№ С€Р°Рі С€С‘Р» РїРѕ Р±Р»РёР¶Р°Р№С€РµРјСѓ РЅРµР·Р°РєСЂС‹С‚РѕРјСѓ СѓР·Р»Сѓ
  - `TMW-2` Р·Р°РєСЂС‹С‚ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ canonical mapper `Prisma TechMap -> TechMapCanonicalDraft`
    - РґРѕР±Р°РІР»РµРЅС‹ invariant checks РґР»СЏ root/variant/header clusters
    - РґРѕР±Р°РІР»РµРЅ runtime consumer `TechMapService.getCanonicalDraft(...)`
    - РґРѕР±Р°РІР»РµРЅ governed draft read-model route РІ `TechMapController`
    - master-checklist СЃРґРІРёРЅСѓС‚ С‚Р°Рє, С‡С‚РѕР±С‹ СЃР»РµРґСѓСЋС‰РёР№ Р°РєС‚РёРІРЅС‹Р№ С€Р°Рі С€С‘Р» РїРѕ Р±Р»РёР¶Р°Р№С€РµРјСѓ РЅРµР·Р°РєСЂС‹С‚РѕРјСѓ СѓР·Р»Сѓ
  - `TMW-3` Р·Р°РєСЂС‹С‚ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ clarify batch builder
    - РґРѕР±Р°РІР»РµРЅ workflow resume state builder
    - РґРѕР±Р°РІР»РµРЅ explicit clarify resume endpoint
    - РґРѕР±Р°РІР»РµРЅ clarify audit trail
    - РґРѕР±Р°РІР»РµРЅ clarify intake wiring РІ supervisor
    - `createDraftStub(...)` emits clarify lifecycle metadata
    - `ResponseComposer` РїРѕРєР°Р·С‹РІР°РµС‚ batch/resume lifecycle РІ summary
  - `TMW-4` Р·Р°РєСЂС‹С‚ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ semantic ingress specialization frame РґР»СЏ С‚РµС…РєР°СЂС‚С‹
    - РґРѕР±Р°РІР»РµРЅС‹ typed `workflow intent / stage / policy / required actions`
    - Р·Р°РєСЂС‹С‚С‹ compare / review / publication edge-cases Рё variant-count extraction
    - `SupervisorAgent` РЅР°С‡Р°Р» РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ frame РєР°Рє runtime metadata
  - `TMW-5` Р·Р°РєСЂС‹С‚ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ first-class `TechMapWorkflowOrchestrator`
    - phase engine `INTAKE -> TRIAGE -> BRANCHING -> TRUST -> COMPOSITION` РїРѕРґРєР»СЋС‡С‘РЅ
    - `TechMapService` СЌРјРёС‚РёС‚ `workflowOrchestration`
    - `getRuntimeAdoptionSnapshot(...)` РїРѕРґР°С‘С‚ live branch trust feed РІ workflow trace
    - runtime adoption snapshot С‚РµРїРµСЂСЊ СЃРѕР±РёСЂР°РµС‚ branch-aware final composition
    - `ResponseComposer` РїРѕРєР°Р·С‹РІР°РµС‚ workflow spine РІ summary
    - runtime trust/composition path РїРµСЂРµРґР°РЅ РІ `TMW-7`
  - `TMW-7` Р·Р°РєСЂС‹С‚ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ tech-map-specific trust specialization РїРѕРІРµСЂС… platform `Branch Trust Gate`
    - final composition contract С‚РµРїРµСЂСЊ С„РёР»СЊС‚СЂСѓРµС‚ branch payloads РїРѕ СЂР°Р·СЂРµС€С‘РЅРЅРѕРјСѓ trust path
    - honest disclosure РїРѕ `PARTIAL / UNVERIFIED / BLOCKED` РїРѕРєР°Р·Р°РЅ РІ runtime summary
    - variant comparison report wired into runtime adoption snapshot Рё response composer
    - СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі С‚РµРїРµСЂСЊ `TMW-8`
  - `TMW-8` Р·Р°РІРµСЂС€С‘РЅ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ shared persistence boundary helper
    - `updateDraft(...)` Р·Р°С‰РёС‰С‘РЅ head-draft guard Рё Р±РѕР»СЊС€Рµ РЅРµ РїР°С‚С‡РёС‚ immutable REVIEW/APPROVED/ACTIVE snapshots
    - РґРѕР±Р°РІР»РµРЅ read endpoint РґР»СЏ persistence boundary snapshot
    - РґРѕР±Р°РІР»РµРЅ `createNextVersion(...)` route РґР»СЏ controlled revision creation
    - РґРѕР±Р°РІР»РµРЅС‹ immutable snapshot tables Рё migration-backed write-path
  - `TMW-9` Р·Р°РІРµСЂС€С‘РЅ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ policy-trigger helper РґР»СЏ `chief_agronomist`
    - РґРѕР±Р°РІР»РµРЅ structured expert review packet contract
    - `TechMapWorkflowOrchestrator` Рё runtime adoption snapshot С‚РµРїРµСЂСЊ РїРѕРґРЅРёРјР°СЋС‚ expert review РІ summary
    - `ResponseComposer` РїРѕРєР°Р·С‹РІР°РµС‚ expert review verdict РІ runtime summary
    - expert review packet С‚РµРїРµСЂСЊ РЅРµСЃС‘С‚ full audit/explainability trail Рё publication path
  - `TMW-6 PR D` Р·Р°РєСЂС‹С‚ РІ РєРѕРґРµ:
    - РґРѕР±Р°РІР»РµРЅ runtime adoption snapshot СЃ branch results, trust assessments Рё authority resolutions
    - authority helper РїРѕРґРєР»СЋС‡С‘РЅ РІ conflict resolution stage
    - РґРѕР±Р°РІР»РµРЅ runtime consumer `TechMapService.getRuntimeAdoptionSnapshot(...)`
    - master-checklist СЃРґРІРёРЅСѓС‚ С‚Р°Рє, С‡С‚РѕР±С‹ СЃР»РµРґСѓСЋС‰РёРј Р°РєС‚РёРІРЅС‹Рј С€Р°РіРѕРј СЃС‚Р°Р» `TMW-5`, Р·Р°С‚РµРј `TMW-7`
  - `TMW-6` РґРѕРєСѓРјРµРЅС‚РЅРѕ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ:
    - master-checklist С‡РµРєР±РѕРєСЃС‹ РґР»СЏ branch contracts, verdict aggregation Рё authority helper РїРµСЂРµРІРµРґРµРЅС‹ РІ `DONE`
    - execution-plan `TMW-6` РѕР±РЅРѕРІР»С‘РЅ РїРѕ evidence_refs Рё timestamps

## 2026-03-21

1. **Communication Proposal Rule added to `AGENTS.md`** [DONE]:
  - Р’ РєРѕСЂРЅРµРІРѕР№ `AGENTS.md` РґРѕР±Р°РІР»РµРЅРѕ РЅРѕРІРѕРµ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ РїСЂР°РІРёР»Рѕ С„РѕСЂРјСѓР»РёСЂРѕРІРєРё РїСЂРµРґР»РѕР¶РµРЅРёР№ СЂР°Р·РІРёС‚РёСЏ СЂР°Р±РѕС‚С‹.
  - РўРµРїРµСЂСЊ Р·Р°РїСЂРµС‰РµРЅС‹ СЂР°Р·РјС‹С‚С‹Рµ РєРѕРЅСЃС‚СЂСѓРєС†РёРё РІРёРґР° `РµСЃР»Рё С…РѕС‡РµС€СЊ/РµСЃР»Рё С…РѕС‚РёС‚Рµ/РјРѕРіСѓ`, РєРѕРіРґР° РѕРЅРё РїРѕРґРјРµРЅСЏСЋС‚ РєРѕРЅРєСЂРµС‚РЅС‹Р№ СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі.
  - Р›СЋР±РѕРµ РїСЂРµРґР»РѕР¶РµРЅРёРµ СЃР»РµРґСѓСЋС‰РµРіРѕ РґРµР№СЃС‚РІРёСЏ С‚РµРїРµСЂСЊ РѕР±СЏР·Р°РЅРѕ СЃРѕРґРµСЂР¶Р°С‚СЊ:
    - РєРѕРЅРєСЂРµС‚РЅРѕРµ РґРµР№СЃС‚РІРёРµ Рє РІС‹РїРѕР»РЅРµРЅРёСЋ
    - РѕР¶РёРґР°РµРјС‹Р№ СЌС„С„РµРєС‚
    - РѕР±СЉСЏСЃРЅРµРЅРёРµ, Р·Р°С‡РµРј СЌС‚Рѕ РґРµР№СЃС‚РІРёРµ РґРµР»Р°РµС‚СЃСЏ Рё С‡С‚Рѕ РѕРЅРѕ СѓР»СѓС‡С€Р°РµС‚ РґР»СЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, РїСЂРѕРґСѓРєС‚Р° РёР»Рё РєРѕРґР°
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: РєРѕРјРјСѓРЅРёРєР°С†РёСЏ РґРѕР»Р¶РЅР° СЃС‚Р°С‚СЊ Р±РѕР»РµРµ РїСЂРµРґРјРµС‚РЅРѕР№, СЂРµС€РµРЅРёСЏ Р±С‹СЃС‚СЂРµРµ РїРµСЂРµС…РѕРґСЏС‚ РІ РґРµР№СЃС‚РІРёРµ, Р° РїРѕР»РµР·РЅРѕСЃС‚СЊ РєР°Р¶РґРѕРіРѕ РїСЂРµРґР»Р°РіР°РµРјРѕРіРѕ С€Р°РіР° СЃС‚Р°РЅРѕРІРёС‚СЃСЏ СЏРІРЅРѕР№.

2. **Semantic ingress -> governed handoff execution plan** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ execution-РїР»Р°РЅ `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md`.
  - РџР»Р°РЅ С„РёРєСЃРёСЂСѓРµС‚ С†РµР»РµРІСѓСЋ РјРёРіСЂР°С†РёСЋ РѕС‚ С‚РµРєСѓС‰РµРіРѕ `trigger/contract-first` routing Рє С†РµР»РµРІРѕР№ РјРѕРґРµР»Рё `СЃРІРѕР±РѕРґРЅС‹Р№ ingress -> semantic intent -> owner-agent -> governed handoff`.
  - Р’ РґРѕРєСѓРјРµРЅС‚Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹:
    - С†РµР»РµРІРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ
    - С‚РµРєСѓС‰РёРµ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Рµ СЂР°Р·СЂС‹РІС‹
    - С„Р°Р·РѕРІР°СЏ РїСЂРѕРіСЂР°РјРјР° СЂРµС„Р°РєС‚РѕСЂРёРЅРіР°
    - file-level backlog
    - РєСЂРёС‚РµСЂРёРё РіРѕС‚РѕРІРЅРѕСЃС‚Рё
    - РїРµСЂРІС‹Р№ proof-slice `crm.register_counterparty`
    - РїСЂР°РІРёР»Рѕ РґР»СЏ СЃР»РѕР¶РЅРѕСЃРѕС‡Р»РµРЅС‘РЅРЅС‹С… `multi-agent` Р·Р°РїСЂРѕСЃРѕРІ: `sub-intent graph`, `lead owner-agent`, `parallel / sequential / blocking`
    - РѕС‚РґРµР»СЊРЅРѕРµ СЂР°Р·Р»РёС‡РµРЅРёРµ `multi-action request` Рё `multi-source analytical question`
    - `JSON-first` contract РґР»СЏ branch-results РјРµР¶РґСѓ Р°РіРµРЅС‚Р°РјРё Рё РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂРѕРј
    - Р°РЅР°Р»РёС‚РёС‡РµСЃРєРёР№ proof-slice `agro execution fact -> finance cost aggregation`
    - `Branch Trust Gate` РєР°Рє РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ СЃР»РѕР№ РјРµР¶РґСѓ branch-results Рё С„РёРЅР°Р»СЊРЅРѕР№ РєРѕРјРїРѕР·РёС†РёРµР№ РѕС‚РІРµС‚Р°
    - branch verdicts `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED`
    - РїСЂР°РІРёР»Рѕ, С‡С‚Рѕ РІР°Р»РёРґРЅС‹Р№ `JSON` РЅРµ СЂР°РІРµРЅ РґРѕРєР°Р·Р°РЅРЅРѕРјСѓ С„Р°РєС‚Сѓ, Р° trust СЃС‚СЂРѕРёС‚СЃСЏ С‡РµСЂРµР· `evidence / provenance / deterministic recompute / cross-branch consistency`
    - latency budget РґР»СЏ anti-hallucination verification: `happy path`, `multi-source read`, `cross-check triggered`
  - РќРѕРІС‹Р№ claim `CLAIM-EXE-SEMANTIC-INGRESS-GOVERNED-HANDOFF-20260321` Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РІ `docs/DOCS_MATRIX.md`.
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: Сѓ РєРѕРјР°РЅРґС‹ РїРѕСЏРІРёР»СЃСЏ РµРґРёРЅС‹Р№ РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ execution-РјР°СЂС€СЂСѓС‚, РєРѕС‚РѕСЂС‹Р№ РїРµСЂРµРІРѕРґРёС‚ СЃРїРѕСЂ Рѕ СЃРІРѕР±РѕРґРЅРѕРј С‡Р°С‚Рµ Рё РґРѕРІРµСЂРёРё Рє agent-РґР°РЅРЅС‹Рј РёР· СѓСЂРѕРІРЅСЏ РѕР±СЃСѓР¶РґРµРЅРёСЏ РІ РїСЂРѕРІРµСЂСЏРµРјСѓСЋ РїСЂРѕРіСЂР°РјРјСѓ РёР·РјРµРЅРµРЅРёР№.
  - Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ РїР»Р°РЅ СЂР°Р·Р»РѕР¶РµРЅ РІ file-level backlog РґР»СЏ `Branch Trust Gate`:
    - shared contracts Рё branch trust types
    - orchestration gate РІ `SupervisorAgent`
    - reusable branch-level inputs РІ `TruthfulnessEngine`
    - composer rules РґР»СЏ `VERIFIED / PARTIAL / CONFLICTED / REJECTED`
    - telemetry/governance СЃР»РѕР№ РґР»СЏ trust-path
    - unit/integration/eval РїР°РєРµС‚ РґР»СЏ multi-source analytical questions
  - Р­С„С„РµРєС‚ РґРµРєРѕРјРїРѕР·РёС†РёРё: Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹Р№ Р±Р»РѕРє `Branch Trust Gate` СЃС‚Р°Р» РёСЃРїРѕР»РЅРёРјС‹Рј РїР°РєРµС‚РѕРј СЂР°Р±РѕС‚ РїРѕ С„Р°Р№Р»Р°Рј, С‚РµСЃС‚Р°Рј Рё РїРѕСЂСЏРґРєСѓ РІРЅРµРґСЂРµРЅРёСЏ.

3. **Branch Trust Gate implementation sprint document** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ execution-doc `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md`.
  - Р”РѕРєСѓРјРµРЅС‚ РїРµСЂРµРІРѕРґРёС‚ `Branch Trust Gate` РёР· СѓСЂРѕРІРЅСЏ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕР№ РёРґРµРё РІ РѕС‚РґРµР»СЊРЅС‹Р№ СЃРїСЂРёРЅС‚РѕРІС‹Р№ РїР°РєРµС‚.
  - Р’ РґРѕРєСѓРјРµРЅС‚Рµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹:
    - С†РµР»СЊ СЃРїСЂРёРЅС‚Р°
    - РіСЂР°РЅРёС†С‹ СЃРїСЂРёРЅС‚Р°
    - РґРµРјРѕРЅСЃС‚СЂР°С†РёРѕРЅРЅС‹Р№ СЃС†РµРЅР°СЂРёР№ `agro execution fact -> finance cost aggregation`
    - PR-СЃСЂРµР·С‹ `A/B/C/D/E`
    - file-level scope РїРѕ РјРѕРґСѓР»СЏРј
    - checklist Рё acceptance criteria РґР»СЏ РєР°Р¶РґРѕРіРѕ PR
    - unit/integration/eval РїР°РєРµС‚
    - РїРѕСЂСЏРґРѕРє РІРЅРµРґСЂРµРЅРёСЏ
    - sprint DoD
  - РќРѕРІС‹Р№ claim `CLAIM-EXE-BRANCH-TRUST-GATE-IMPLEMENTATION-SPRINT-20260321` Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РІ `docs/DOCS_MATRIX.md`.
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: РєРѕРјР°РЅРґР° РїРѕР»СѓС‡РёР»Р° РѕС‚РґРµР»СЊРЅС‹Р№ СЂР°Р±РѕС‡РёР№ РґРѕРєСѓРјРµРЅС‚, РїРѕ РєРѕС‚РѕСЂРѕРјСѓ РјРѕР¶РЅРѕ РІРµСЃС‚Рё СЂРµР°Р»РёР·Р°С†РёСЋ `Branch Trust Gate` РїР°РєРµС‚Р°РјРё `A/B/C/D/E`, Р±РµР· РїРѕРІС‚РѕСЂРЅРѕРіРѕ РїРµСЂРµРІРѕРґР° phase-plan РІ РёРЅР¶РµРЅРµСЂРЅС‹Рµ Р·Р°РґР°С‡Рё РІСЂСѓС‡РЅСѓСЋ.

3. **Business Formula E2E Dry-Run Runbook (agent + API path)** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РѕРїРµСЂР°С†РёРѕРЅРЅС‹Р№ runbook `docs/05_OPERATIONS/WORKFLOWS/BUSINESS_FORMULA_E2E_DRY_RUN_RUNBOOK.md` РґР»СЏ СЃРєРІРѕР·РЅРѕРіРѕ СЂСѓС‡РЅРѕРіРѕ РїСЂРѕРіРѕРЅР° Р±РёР·РЅРµСЃ-С„РѕСЂРјСѓР»С‹: `Р РµРіРёСЃС‚СЂР°С†РёСЏ РєРѕРЅС‚СЂР°РіРµРЅС‚Р° -> РљРѕРЅС‚РµРєСЃС‚ С…РѕР·СЏР№СЃС‚РІР° -> РџР»Р°РЅ РЈСЂРѕР¶Р°СЏ -> Р­С‚Р°Р»РѕРЅ (РўРµС…РєР°СЂС‚Р°) -> РљРѕРЅС‚СЂРѕР»СЊ РёСЃРїРѕР»РЅРµРЅРёСЏ -> РЈРїСЂР°РІР»РµРЅРёРµ РѕС‚РєР»РѕРЅРµРЅРёСЏРјРё -> Р¤Р°РєС‚РёС‡РµСЃРєРёР№ СЂРµР·СѓР»СЊС‚Р°С‚ -> О” -> РњРѕРЅРµС‚РёР·Р°С†РёСЏ`.
  - Runbook РѕРїРёСЂР°РµС‚СЃСЏ РЅР° С„Р°РєС‚РёС‡РµСЃРєРёРµ runtime entrypoints РєРѕРґР°: `rai/chat`, `crm`, `registry/fields`, `seasons`, `consulting/plans`, `consulting/execution`, `field-observation`, `consulting/yield`, `consulting/kpi`, `ofs/finance/dashboard`.
  - Р’ РґРѕРєСѓРјРµРЅС‚ РІРєР»СЋС‡РµРЅС‹ РјРёРЅРёРјР°Р»СЊРЅС‹Р№ С‚РµСЃС‚РѕРІС‹Р№ РґР°С‚Р°СЃРµС‚, РїСЂРёРјРµСЂС‹ JSON РґР»СЏ РєР°Р¶РґРѕРіРѕ С€Р°РіР°, РєСЂРёС‚РµСЂРёРё СѓСЃРїРµС€РЅРѕРіРѕ Р·Р°РІРµСЂС€РµРЅРёСЏ Рё РѕРіСЂР°РЅРёС‡РµРЅРёСЏ С‚РµРєСѓС‰РµРіРѕ MVP (РІРєР»СЋС‡Р°СЏ `stub`-РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹ РІ finance/risk).
  - РќРѕРІС‹Р№ claim `CLAIM-OPS-BUSINESS-FORMULA-E2E-DRY-RUN-20260321` Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РІ `docs/DOCS_MATRIX.md`.
4. **РЎРІРѕР±РѕРґРЅС‹Рµ CRM-С„СЂР°Р·С‹: РїРѕРґРґРµСЂР¶РєР° СЂР°Р·РіРѕРІРѕСЂРЅС‹С… write-СЃРёРіРЅР°Р»РѕРІ (`Р·Р°СЂРµРіРёРј/Р·Р°СЂРµРїРёРј`)** [DONE]:
  - РЈСЃРёР»РµРЅ СЂР°СЃРїРѕР·РЅР°РІР°С‚РµР»СЊ write-intent РІ `agent-interaction-contracts`: `hasWriteActionSignal(...)` С‚РµРїРµСЂСЊ СѓС‡РёС‚С‹РІР°РµС‚ СЂР°Р·РіРѕРІРѕСЂРЅС‹Рµ С„РѕСЂРјС‹ `Р·Р°СЂРµ[РіРї]*`, С‡С‚Рѕ РїРѕР·РІРѕР»СЏРµС‚ СЃС‚СЂРѕРёС‚СЊ auto-tool-call РґР»СЏ `register_counterparty` Р±РµР· "РєРѕРјР°РЅРґРЅРѕРіРѕ" СЃС‚РёР»СЏ.
  - Р’ `semantic-router` РѕР±РЅРѕРІР»РµРЅС‹ guardrails РґР»СЏ CRM (`isCrmInnLookupQuery`, `isCrmWorkspaceReviewQuery`): СЂР°Р·РіРѕРІРѕСЂРЅС‹Рµ write-С„СЂР°Р·С‹ Р±РѕР»СЊС€Рµ РЅРµ РѕС€РёР±РѕС‡РЅРѕ РїРѕРїР°РґР°СЋС‚ РІ read-only lookup/workspace РІРµС‚РєРё.
  - Р’ `execution-adapter-heuristics` СЂР°СЃС€РёСЂРµРЅС‹ `CREATE_ACTION_SIGNAL` Рё CRM intent detection РґР»СЏ СЂР°Р·РіРѕРІРѕСЂРЅС‹С… С„РѕСЂРј СЂРµРіРёСЃС‚СЂР°С†РёРё РєРѕРЅС‚СЂР°РіРµРЅС‚Р°.
  - Р”РѕР±Р°РІР»РµРЅС‹ Рё Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ С‚РµСЃС‚С‹ РЅР° С„СЂР°Р·С‹ РІРёРґР° `Р”Р°РІР°Р№ Р·Р°СЂРµРіРёРј/Р·Р°СЂРµРїРёРј РєРѕРЅС‚СЂР°РіРµРЅС‚Р°, РРќРќ ...` РІ:
    - `agent-interaction-contracts.spec.ts`
    - `execution-adapter-heuristics.spec.ts`
    - `semantic-router.service.spec.ts`
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: targeted `jest` (3 suite) Рё `tsc --noEmit` РІ `apps/api` вЂ” PASS.
  - Closeout-СЃС‚Р°С‚СѓСЃ: СЃСЂРµР· РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ bounded CRM-routing fix Рё Р±РѕР»СЊС€Рµ РЅРµ СЃС‡РёС‚Р°РµС‚СЃСЏ "РІРёСЃСЏС‰РµР№" РЅРµР·Р°РІРµСЂС€С‘РЅРЅРѕР№ РІРµС‚РєРѕР№ СЂСЏРґРѕРј СЃ `Branch Trust Gate`.
5. **Archive Recovery Rule for historical logic** [DONE]:
  - РСЃРїСЂР°РІР»РµРЅ governance-РґРµС„РµРєС‚ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё: `docs/06_ARCHIVE` Р±РѕР»СЊС€Рµ РЅРµ С‚СЂР°РєС‚СѓРµС‚СЃСЏ РєР°Рє "РЅРµ С‡РёС‚Р°С‚СЊ", Р° СЏРІРЅРѕ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ РєР°Рє РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ search-space РґР»СЏ recovery РёСЃС‚РѕСЂРёС‡РµСЃРєРѕР№ Р»РѕРіРёРєРё, intent-map Рё РїСЂРѕРµРєС‚РЅРѕР№ РјРѕС‚РёРІР°С†РёРё.
  - Р’ `AGENTS.md`, `docs/CONTRIBUTING_DOCS.md`, `docs/README.md`, `docs/INDEX.md` Рё `docs/06_ARCHIVE/README.md` Р·Р°РєСЂРµРїР»РµРЅРѕ РµРґРёРЅРѕРµ РїСЂР°РІРёР»Рѕ: Р°СЂС…РёРІ С‡РёС‚Р°РµС‚СЃСЏ РєР°Рє `historical context`, РЅРѕ РЅРµ РјРѕР¶РµС‚ РїРѕРґР°РІР°С‚СЊСЃСЏ РєР°Рє `verified operational truth` Р±РµР· revalidation РїРѕ `code/tests/gates`.
  - Р”Р»СЏ Р±С‹СЃС‚СЂС‹С… recovery-СЃС†РµРЅР°СЂРёРµРІ РёРЅРґРµРєСЃРёСЂРѕРІР°РЅС‹ РєР»СЋС‡РµРІС‹Рµ legacy-Р·РѕРЅС‹: `06_ARCHIVE/LEGACY_TREE_2026-03-20/00_STRATEGY/BUSINESS`, `CONSULTING`, `FRONT_OFFICE`, `STAGE 2`.
6. **Instructions layer restored from archive** [DONE]:
  - РџРѕРґС‚РІРµСЂР¶РґС‘РЅ structural bug РІ docs reset: `11_INSTRUCTIONS` Р±С‹Р» РѕС€РёР±РѕС‡РЅРѕ Р·Р°Р°СЂС…РёРІРёСЂРѕРІР°РЅ, С…РѕС‚СЏ РјР°С‚СЂРёС†Р° СЃР»РѕС‘РІ Рё Р»РёРЅС‚РµСЂ РёР·РЅР°С‡Р°Р»СЊРЅРѕ РїРѕРґРґРµСЂР¶РёРІР°Р»Рё `Instructions` РєР°Рє Р°РєС‚РёРІРЅС‹Р№ first-class layer.
  - РџР°РїРєР° РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅР° РІ active tree РєР°Рє `docs/11_INSTRUCTIONS/`.
  - Р’ `AGENTS.md`, `docs/CONTRIBUTING_DOCS.md`, `docs/README.md`, `docs/INDEX.md` Рё `docs/06_ARCHIVE/README.md` Р·Р°РєСЂРµРїР»РµРЅРѕ РїСЂР°РІРёР»Рѕ: РґРµР№СЃС‚РІСѓСЋС‰РёРµ РёСЃРїРѕР»РЅСЏРµРјС‹Рµ РёРЅСЃС‚СЂСѓРєС†РёРё Р¶РёРІСѓС‚ РІ `docs/11_INSTRUCTIONS`, Р° РЅРµ РІ Р°СЂС…РёРІРµ.
7. **Documentation topology redecision and active layer restore** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РїРѕРІС‚РѕСЂРЅС‹Р№ semantic-scan РІСЃРµС… docs-РєР»Р°СЃС‚РµСЂРѕРІ Рё РѕС‚РјРµРЅРµРЅР° РѕС€РёР±РѕС‡РЅР°СЏ СЃР¶Р°С‚Р°СЏ РјРѕРґРµР»СЊ, РєРѕС‚РѕСЂР°СЏ РїСЂРёСЂР°РІРЅРёРІР°Р»Р° planning/strategy/domains Рє legacy.
  - Р’ active tree РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅС‹ `docs/00_STRATEGY`, `docs/02_DOMAINS`, `docs/06_METRICS`, `docs/07_EXECUTION`, `docs/08_TESTING`, `docs/10_FRONTEND_MENU_IMPLEMENTATION`.
  - Р’ governance-РґРѕРєР°С… Р·Р°РєСЂРµРїР»РµРЅРѕ СЂР°Р·РґРµР»РµРЅРёРµ РјРµР¶РґСѓ `verified operational canon` Рё `active intent/design/planning`.
  - Р”РѕР±Р°РІР»РµРЅ Р°СѓРґРёС‚РЅС‹Р№ Р°СЂС‚РµС„Р°РєС‚ `docs/_audit/DOCUMENTATION_TOPOLOGY_REDECISION_2026-03-21.md`.
  - Р’ `docs/11_INSTRUCTIONS` РїРѕС‡РёРЅРµРЅС‹ cross-links РЅР° `docs/00_STRATEGY/STAGE 2/*`, С‡С‚РѕР±С‹ agent docs СЃРЅРѕРІР° РёСЃРїРѕР»СЊР·РѕРІР°Р»Рё Р¶РёРІРѕР№ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ РєРѕРЅС‚СѓСЂ.

8. **Branch Trust Gate вЂ” PR A shared contracts** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ shared contract-file `apps/api/src/shared/rai-chat/branch-trust.types.ts`.
  - Р’ canonical contract-layer РІРІРµРґРµРЅС‹ С‚РёРїС‹:
    - `BranchResultContract`
    - `BranchTrustAssessment`
    - `BranchVerdict`
    - `UserFacingBranchCompositionPayload`
  - Р’ РєРѕРЅС‚СЂР°РєС‚Рµ Р·Р°РєСЂРµРїР»РµРЅС‹ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ trust-РІРµС‚РєРё:
    - `scope`
    - `derived_from`
    - `evidence_refs`
    - `assumptions`
    - `data_gaps`
    - `freshness`
    - `confidence`
  - `AgentExecutionResult` СЂР°СЃС€РёСЂРµРЅ С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹РјРё branch-Р°СЂС‚РµС„Р°РєС‚Р°РјРё:
    - `branchResults`
    - `branchTrustAssessments`
    - `branchCompositions`
  - `RaiChatResponseDto` Рё shared `rai-chat.dto` РїРѕРґРіРѕС‚РѕРІР»РµРЅС‹ РїРѕРґ С‚РѕС‚ Р¶Рµ РєРѕРЅС‚СЂР°РєС‚РЅС‹Р№ СЃР»РѕР№ Р±РµР· СѓРґР°Р»РµРЅРёСЏ Рё Р±РµР· Р»РѕРјРєРё С‚РµРєСѓС‰РµРіРѕ `structuredOutput`.
  - РўРµРєСѓС‰РёР№ `SupervisorAgent` trust-path С‚РµРїРµСЂСЊ СѓР¶Рµ СЃРѕР±РёСЂР°РµС‚ typed branch artifacts РґР»СЏ primary branch Рё `knowledge` cross-check branch, СЃРѕС…СЂР°РЅСЏСЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚СЊ СЃ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРј `trustScore`/`structuredOutputs` РїРѕРІРµРґРµРЅРёРµРј.
  - Execution-РґРѕРєРё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹:
    - РІ `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` РґРѕР±Р°РІР»РµРЅ Рё РѕС‚РјРµС‡РµРЅ checklist РїР°РєРµС‚Р° A
    - РІ `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR A` РїРµСЂРµРІРµРґС‘РЅ РІ completed
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: trust-layer РїРѕР»СѓС‡РёР» РµРґРёРЅС‹Р№ С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹Р№ СЏР·С‹Рє РґР°РЅРЅС‹С…, Р° СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі `PR B` С‚РµРїРµСЂСЊ РјРѕР¶РµС‚ СЂР°СЃС€РёСЂСЏС‚СЊ `TruthfulnessEngine` Р±РµР· РїРѕРІС‚РѕСЂРЅРѕРіРѕ РёР·РѕР±СЂРµС‚РµРЅРёСЏ branch-СЃС…РµРјС‹.

9. **Branch Trust Gate вЂ” PR B reusable `TruthfulnessEngine` inputs** [DONE]:
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts` РїРµСЂРµСЃС‚СЂРѕРµРЅ РёР· post-trace-only utility РІ reusable input-layer РґР»СЏ branch trust.
  - Р’ СЃРµСЂРІРёСЃРµ РІС‹РґРµР»РµРЅС‹ РїСѓР±Р»РёС‡РЅС‹Рµ РјРµС‚РѕРґС‹:
    - `classifyBranchEvidence(...)`
    - `buildBranchTrustInputs(...)`
    - `resolveEvidenceStatus(...)`
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ reusable РєРѕРЅС‚СЂР°РєС‚ `BranchTrustInputs`, РєРѕС‚РѕСЂС‹Р№ СЃРѕР±РёСЂР°РµС‚:
    - `classifiedEvidence`
    - `accounting`
    - `weightedEvidence`
    - `bsScorePct`
    - `evidenceCoveragePct`
    - `invalidClaimsPct`
    - `recommendedVerdict`
    - `requiresCrossCheck`
    - `reasons`
  - Trace-level РјРµС‚РѕРґ `calculateTraceTruthfulness(...)` РїРµСЂРµРІРµРґС‘РЅ РЅР° СЌС‚Рё Р¶Рµ helper-РјРµС‚РѕРґС‹, РїРѕСЌС‚РѕРјСѓ branch-level Рё trace-level С‚РµРїРµСЂСЊ РёСЃРїРѕР»СЊР·СѓСЋС‚ РѕРґРёРЅ evidence-РєР°РЅРѕРЅ РІРјРµСЃС‚Рѕ РґРІСѓС… РЅРµР·Р°РІРёСЃРёРјС‹С… РєР»Р°СЃСЃРёС„РёРєР°С‚РѕСЂРѕРІ.
  - `truthfulness-engine.service.spec.ts` СЂР°СЃС€РёСЂРµРЅ РѕС‚РґРµР»СЊРЅС‹РјРё unit-С‚РµСЃС‚Р°РјРё РЅР°:
    - reusable classification
    - branch-level trust inputs Р±РµР· full trace summary
    - pending-path Р±РµР· evidence
  - Execution-РґРѕРєРё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹:
    - РІ `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` РґРѕР±Р°РІР»РµРЅ Рё РѕС‚РјРµС‡РµРЅ checklist РїР°РєРµС‚Р° `TruthfulnessEngine`
    - РІ `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR B` РїРµСЂРµРІРµРґС‘РЅ РІ completed
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/truthfulness-engine.service.spec.ts` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: inline trust gate РїРѕР»СѓС‡РёР» РіРѕС‚РѕРІС‹Р№ reusable evidence/input СЃР»РѕР№, Р° СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі `PR C` С‚РµРїРµСЂСЊ РјРѕР¶РµС‚ РІСЃС‚СЂР°РёРІР°С‚СЊ orchestration-stage РїРѕРІРµСЂС… СѓР¶Рµ РѕР±С‰РµРіРѕ truthfulness-РєР°РЅРѕРЅР°, РЅРµ РїР»РѕРґСЏ РЅРѕРІСѓСЋ trust-Р»РѕРіРёРєСѓ.

10. **Branch Trust Gate вЂ” PR C `SupervisorAgent` orchestration trust stage** [DONE]:
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° СЏРІРЅСѓСЋ СЃС‚Р°РґРёСЋ `branch_trust_assessment` РјРµР¶РґСѓ execution Рё composer.
  - РўРµРєСѓС‰РёР№ trust-path Р±РѕР»СЊС€Рµ РЅРµ РѕРїРёСЂР°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РЅР° Р»РѕРєР°Р»СЊРЅСѓСЋ confidence-СЌРІСЂРёСЃС‚РёРєСѓ:
    - `SupervisorAgent` С‚РµРїРµСЂСЊ РёСЃРїРѕР»СЊР·СѓРµС‚ `TruthfulnessEngine.buildBranchTrustInputs(...)`
    - selective cross-check Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ РїРѕ branch trust signal, Р° РЅРµ С‚РѕР»СЊРєРѕ РїРѕ `structuredOutput.crossCheckRequired`
  - Р’ orchestration-result РїСЂРѕРєРёРґС‹РІР°СЋС‚СЃСЏ branch-level trust РјРµС‚СЂРёРєРё:
    - `branchVerdict`
    - `trustScore`
    - `trustEvidenceCoveragePct`
    - `trustInvalidClaimsPct`
    - `trustBsScorePct`
  - Р РµР°Р»РёР·РѕРІР°РЅРѕ РїСЂР°РІРёР»Рѕ happy path:
    - verified branch РЅРµ РїРѕР»СѓС‡Р°РµС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ second-pass
    - `knowledge` cross-check branch СЃР°Рј РЅРµ С‚СЂРёРіРіРµСЂРёС‚ СЂРµРєСѓСЂСЃРёРІРЅС‹Р№ second-pass
  - `apps/api/src/modules/rai-chat/supervisor-forensics.service.ts` СЂР°СЃС€РёСЂРµРЅ:
    - `AiAuditEntry.metadata` С‚РµРїРµСЂСЊ РїРѕР»СѓС‡Р°РµС‚ `branchResults`
    - `AiAuditEntry.metadata` С‚РµРїРµСЂСЊ РїРѕР»СѓС‡Р°РµС‚ `branchTrustAssessments`
    - `AiAuditEntry.metadata` С‚РµРїРµСЂСЊ РїРѕР»СѓС‡Р°РµС‚ `branchCompositions`
  - Р’ forensic phases РїРѕСЏРІРёР»СЃСЏ РѕС‚РґРµР»СЊРЅС‹Р№ СЌС‚Р°Рї `branch_trust_assessment`, РїРѕСЌС‚РѕРјСѓ trust-stage С‚РµРїРµСЂСЊ РІРёРґРµРЅ РІ telemetry РєР°Рє СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅС‹Р№ orchestration hop.
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹РјРё СЂРµРіСЂРµСЃСЃРёРѕРЅРЅС‹РјРё РєРµР№СЃР°РјРё:
    - selective cross-check РїРѕ verdict `UNVERIFIED` РґР°Р¶Рµ Р±РµР· explicit С„Р»Р°РіР°
    - happy path Р±РµР· second-pass
    - branch verdict Рё trust stage РїРѕРїР°РґР°СЋС‚ РІ audit metadata
  - Execution-РґРѕРєРё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹:
    - РІ `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` РѕС‚РјРµС‡РµРЅ checklist РїР°РєРµС‚Р° `SupervisorAgent`
    - РІ `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR C` РїРµСЂРµРІРµРґС‘РЅ РІ completed
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: `SupervisorAgent` СЃС‚Р°Р» first-class trust orchestrator, Р° СЃР»РµРґСѓСЋС‰РёР№ С€Р°Рі `PR D` С‚РµРїРµСЂСЊ РјРѕР¶РµС‚ РїРµСЂРµРІРѕРґРёС‚СЊ user-facing composition РЅР° branch verdict rules Р±РµР· РїРѕРІС‚РѕСЂРЅРѕРіРѕ РІСЃС‚СЂР°РёРІР°РЅРёСЏ trust-stage РІ runtime spine.

11. **Branch Trust Gate вЂ” PR D honest composition rules in `ResponseComposer`** [DONE]:
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° trust-aware synthesis РїРѕРІРµСЂС…:
    - `branchResults`
    - `branchTrustAssessments`
    - `branchCompositions`
  - Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ СЃР»РѕР№ branch verdict composition:
    - `VERIFIED` -> confirmed fact
    - `PARTIAL` -> partial fact with mandatory limitations disclosure
    - `CONFLICTED` -> explicit conflict disclosure
    - `UNVERIFIED / REJECTED` -> insufficient evidence disclosure
  - Composer Р±РѕР»СЊС€Рµ РЅРµ РёСЃРїРѕР»СЊР·СѓРµС‚ РЅРµРїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Рµ РёР»Рё РєРѕРЅС„Р»РёРєС‚СѓСЋС‰РёРµ branch-РІРµС‚РєРё РєР°Рє РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅС‹Р№ С„Р°РєС‚ РІ user-facing С‚РµРєСЃС‚Рµ.
  - Р”Р»СЏ trust-aware РѕС‚РІРµС‚РѕРІ РІРєР»СЋС‡С‘РЅ Р±РѕР»РµРµ Р¶С‘СЃС‚РєРёР№ СЂРµР¶РёРј:
    - conflict / insufficient evidence path Р·Р°РјРµРЅСЏРµС‚ Р±Р°Р·РѕРІС‹Р№ smooth-text
    - verified / partial path РґРѕР±Р°РІР»СЏРµС‚ СЂР°Р·СЂРµС€С‘РЅРЅС‹Р№ synthesis РїРѕРІРµСЂС… base answer
  - `RaiChatResponseDto` С‚РµРїРµСЂСЊ СЂРµР°Р»СЊРЅРѕ РІРѕР·РІСЂР°С‰Р°РµС‚ branch trust Р°СЂС‚РµС„Р°РєС‚С‹ РёР· composer-path, Р° РЅРµ С‚РѕР»СЊРєРѕ РїРµСЂРµРЅРѕСЃРёС‚ РёС… РІ С‚РёРїР°С….
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` СЂР°СЃС€РёСЂРµРЅ РєРµР№СЃР°РјРё:
    - honest conflict disclosure
    - partial disclosure with limitations
    - confirmed fact only from allowed branches
  - Execution-РґРѕРєРё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹:
    - РІ `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` РѕС‚РјРµС‡РµРЅ checklist РїР°РєРµС‚Р° `ResponseComposer`
    - РІ `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR D` РїРµСЂРµРІРµРґС‘РЅ РІ completed
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёР№ РѕС‚РІРµС‚ С‚РµРїРµСЂСЊ СЃС‚СЂРѕРёС‚СЃСЏ РїРѕ branch verdict rules, РїРѕСЌС‚РѕРјСѓ trust-layer РїРµСЂРµСЃС‚Р°Р» Р·Р°РєР°РЅС‡РёРІР°С‚СЊСЃСЏ РІРЅСѓС‚СЂРё РѕСЂРєРµСЃС‚СЂР°С‚РѕСЂР° Рё СЃС‚Р°Р» СЂРµР°Р»СЊРЅРѕ РІР»РёСЏС‚СЊ РЅР° С‡РµСЃС‚РЅРѕСЃС‚СЊ С„РёРЅР°Р»СЊРЅРѕРіРѕ РѕС‚РІРµС‚Р°.

12. **Branch Trust Gate вЂ” PR E telemetry, governance Рё eval closure** [DONE]:
  - `TraceSummary` СЂР°СЃС€РёСЂРµРЅ persisted trust telemetry Рё latency accounting:
    - `verifiedBranchCount`
    - `partialBranchCount`
    - `unverifiedBranchCount`
    - `conflictedBranchCount`
    - `rejectedBranchCount`
    - `trustGateLatencyMs`
    - `trustLatencyProfile`
    - `trustLatencyBudgetMs`
    - `trustLatencyWithinBudget`
  - Р”Р»СЏ `ai_trace_summaries` РґРѕР±Р°РІР»РµРЅ schema-СЃСЂРµР·:
    - `packages/prisma-client/schema.prisma`
    - migration `packages/prisma-client/migrations/20260321153000_branch_trust_trace_summary_metrics/migration.sql`
  - `apps/api/src/modules/rai-chat/trace-summary.service.ts` С‚РµРїРµСЂСЊ Р°РіСЂРµРіРёСЂСѓРµС‚ branch verdict counts Рё РїРёС€РµС‚ trust latency telemetry РІРјРµСЃС‚Рµ СЃ trace quality.
  - `apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts` Рё `runtime-governance-policy.types.ts` РїРѕР»СѓС‡РёР»Рё first-class trust budget policy:
    - `happy path <= 300 ms`
    - `multi-source read <= 800 ms`
    - `cross-check triggered <= 1500 ms`
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` С‚РµРїРµСЂСЊ РІС‹С‡РёСЃР»СЏРµС‚ trust latency profile/budget Рё РїСЂРѕРєРёРґС‹РІР°РµС‚ РёС… РІ `traceSummary.updateQuality(...)`.
  - Explainability/read-model РїРѕРґРіРѕС‚РѕРІР»РµРЅ Рє branch trust visibility:
    - `TraceForensicsSummaryDto` СЂР°СЃС€РёСЂРµРЅ trust summary-РїРѕР»СЏРјРё
    - `ExplainabilityPanelService.getTraceForensics(...)` РѕС‚РґР°С‘С‚ `branchTrust`
    - `TraceSummaryDtoSchema` РІР°Р»РёРґРёСЂСѓРµС‚ РЅРѕРІС‹Рµ trust telemetry РїРѕР»СЏ
  - Р”РѕР±Р°РІР»РµРЅ integration/eval РєРѕРЅС‚СѓСЂ:
    - `runtime-spine.integration.spec.ts` РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ persisted cross-check trust telemetry
    - `branch-trust.eval.spec.ts` С„РёРєСЃРёСЂСѓРµС‚ eval corpus РґР»СЏ `conflict disclosure` Рё `selective cross-check`
  - РСЃРїСЂР°РІР»РµРЅ source-of-truth drift РІ execution-docs:
    - telemetry С‚РµРїРµСЂСЊ СѓС‡РёС‚С‹РІР°РµС‚ verdict `UNVERIFIED`, РїРѕС‚РѕРјСѓ С‡С‚Рѕ РѕРЅ СѓР¶Рµ РєР°РЅРѕРЅРёС‡РµСЃРєРё СЃСѓС‰РµСЃС‚РІСѓРµС‚ РІ `BranchVerdict`
  - Execution-РґРѕРєРё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹:
    - РІ `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` РґРѕР±Р°РІР»РµРЅ Рё РѕС‚РјРµС‡РµРЅ checklist РїР°РєРµС‚Р° `E`
    - РІ `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` checklist `PR E` РїРµСЂРµРІРµРґС‘РЅ РІ completed
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter @rai/prisma-client build` вЂ” PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/trace-summary.service.spec.ts src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/explainability/explainability-panel.service.spec.ts src/modules/explainability/dto/trace-summary.dto.spec.ts src/modules/rai-chat/eval/branch-trust.eval.spec.ts` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: trust-path СЃС‚Р°Р» РЅРµ С‚РѕР»СЊРєРѕ С‡РµСЃС‚РЅС‹Рј РІ orchestration/composition, РЅРѕ Рё РёР·РјРµСЂРёРјС‹Рј РЅР° persisted trace-СѓСЂРѕРІРЅРµ, РїРѕСЌС‚РѕРјСѓ sprint `A-E` Р·Р°РєСЂС‹С‚ РґРѕ telemetry/eval ready СЃРѕСЃС‚РѕСЏРЅРёСЏ.

13. **Semantic Ingress Frame вЂ” proof-slice foundation for `crm.register_counterparty`** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ shared contract `apps/api/src/shared/rai-chat/semantic-ingress.types.ts` СЃ С‚РёРїРѕРј `SemanticIngressFrame`.
  - Р”РѕР±Р°РІР»РµРЅ builder `apps/api/src/modules/rai-chat/semantic-ingress.service.ts`, РєРѕС‚РѕСЂС‹Р№ СЃРѕР±РёСЂР°РµС‚ frame РёР· `legacy classification`, `requestedToolCalls` Рё `semantic routing` СЃРёРіРЅР°Р»РѕРІ.
  - `SupervisorAgent.planExecution()` С‚РµРїРµСЂСЊ СЃС‚СЂРѕРёС‚ `semanticIngressFrame`, РїСЂРѕРєРёРґС‹РІР°РµС‚ РµРіРѕ РІ `AgentExecutionRequest` Рё РїРёС€РµС‚ РІ `AiAuditEntry.metadata`.
  - Р”Р»СЏ proof-slice `crm.register_counterparty` `AgentExecutionAdapterService` С‚РµРїРµСЂСЊ СЃРЅР°С‡Р°Р»Р° СЃРјРѕС‚СЂРёС‚ РІ `semanticIngressFrame.requestedOperation`, Р° СѓР¶Рµ РїРѕС‚РѕРј РїР°РґР°РµС‚ РІ Р»РѕРєР°Р»СЊРЅС‹Р№ CRM heuristic fallback.
  - Explainability/read-model СЂР°СЃС€РёСЂРµРЅ: `TraceForensicsResponseDto` Рё `Control Tower trace page` РїРѕРєР°Р·С‹РІР°СЋС‚ `Semantic Ingress Frame` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ forensics surface.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-ingress.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/explainability/explainability-panel.service.spec.ts src/modules/rai-chat/eval/branch-trust.eval.spec.ts` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter web exec jest --runInBand __tests__/control-tower-trace-page.spec.tsx __tests__/control-tower-page.spec.tsx __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
  - Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Р№ СЃРёРіРЅР°Р»: `src/modules/rai-chat/rai-chat.service.spec.ts` СЃРµР№С‡Р°СЃ РєСЂР°СЃРЅС‹Р№ РЅР° СЃС‚Р°СЂРѕРј widget/fail-open expectation drift; СЌС‚РѕС‚ РїР°РєРµС‚ РµРіРѕ РЅРµ РјРµРЅСЏР» Рё РЅРµ Р·Р°РєСЂС‹РІР°Р».

14. **Semantic Ingress Frame вЂ” governed write-boundary Рё eval closure РґР»СЏ `crm.register_counterparty`** [DONE]:
  - `SemanticIngressFrame` СЂР°СЃС€РёСЂРµРЅ РїРѕР»РµРј `operationAuthority`, С‡С‚РѕР±С‹ proof-slice СЂР°Р·Р»РёС‡Р°Р» `direct_user_command`, `workflow_resume` Рё `delegated_or_autonomous`.
  - `SupervisorAgent` С‚РµРїРµСЂСЊ РїСЂРѕРєРёРґС‹РІР°РµС‚ authority РІ `RaiToolActorContext.userIntentSource` Рё РІС‹СЃС‚Р°РІР»СЏРµС‚ `userConfirmed` С‚РѕР»СЊРєРѕ РґР»СЏ РїСЂСЏРјРѕР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕР№ РєРѕРјР°РЅРґС‹, Р° РЅРµ РґР»СЏ Р»СЋР±РѕРіРѕ Р¶РёРІРѕРіРѕ Р·Р°РїСЂРѕСЃР°.
  - `RaiToolsRegistry` СЂР°Р·СЂРµС€Р°РµС‚ РїСЂСЏРјРѕР№ CRM write bypass С‚РѕР»СЊРєРѕ РїСЂРё `userIntentSource = direct_user_command`; delegated/autonomous path РІРѕР·РІСЂР°С‰Р°РµС‚СЃСЏ РІ governed `PendingAction`.
  - `agent-interaction-contracts` СѓСЃРёР»РµРЅ СЂР°Р·РіРѕРІРѕСЂРЅРѕР№ С„РѕСЂРјРѕР№ `Р·Р°РІРµРґРё ... РєРѕРЅС‚СЂР°РіРµРЅС‚Р°`, С‡С‚РѕР±С‹ СЃРІРѕР±РѕРґРЅС‹Рµ register-РїРµСЂРµС„СЂР°Р·С‹ РЅРµ РІС‹РїР°РґР°Р»Рё РёР· proof-slice.
  - Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ eval corpus/gate:
    - `apps/api/src/modules/rai-chat/eval/fixtures/crm-register-semantic-ingress-eval-corpus.json`
    - `apps/api/src/modules/rai-chat/eval/semantic-ingress.eval.spec.ts`
  - Explainability/UI СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹:
    - `apps/web/lib/api.ts` С‚РёРїРёР·РёСЂСѓРµС‚ `operationAuthority`
    - `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx` РїРѕРєР°Р·С‹РІР°РµС‚ РёСЃС‚РѕС‡РЅРёРє РґРµР№СЃС‚РІРёСЏ РІ `Semantic Ingress Frame`
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-ingress.service.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/rai-chat/tools/rai-tools.registry.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/explainability/explainability-panel.service.spec.ts src/modules/rai-chat/eval/semantic-ingress.eval.spec.ts src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts` вЂ” PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter web exec jest --runInBand __tests__/control-tower-trace-page.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: РїРµСЂРІС‹Р№ proof-slice Р·Р°РєСЂС‹С‚ СѓР¶Рµ РЅРµ С‚РѕР»СЊРєРѕ РЅР° СѓСЂРѕРІРЅРµ typed ingress-object, РЅРѕ Рё РЅР° СѓСЂРѕРІРЅРµ СЂРµР°Р»СЊРЅРѕРіРѕ governed write-boundary Рё СЃР°РјРѕСЃС‚РѕСЏС‚РµР»СЊРЅРѕРіРѕ regression gate.

13. **Branch Trust Gate вЂ” РїРѕСЃС‚-СЃРїСЂРёРЅС‚РѕРІРѕРµ Р·Р°РјС‹РєР°РЅРёРµ UI/read-model СЃР»РѕСЏ** [DONE]:
  - `apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts` Рё `ExplainabilityPanelService.getTruthfulnessDashboard(...)` С‚РµРїРµСЂСЊ РѕС‚РґР°СЋС‚ РѕС‚РґРµР»СЊРЅС‹Р№ Р°РіСЂРµРіРёСЂРѕРІР°РЅРЅС‹Р№ Р±Р»РѕРє `branchTrust`:
    - `known/pending` coverage РїРѕ trace
    - verdict counts `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED`
    - `cross-check` trace count
    - budget compliance Рё latency aggregates
  - `apps/web/lib/api.ts` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ СЃ СЂР°СЃС€РёСЂРµРЅРЅС‹Рј explainability contract:
    - `TruthfulnessDashboardDto`
    - `TraceForensicsResponseDto`
    - С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹Рµ branch trust DTO РґР»СЏ trace page
  - `apps/web/app/(app)/control-tower/page.tsx` С‚РµРїРµСЂСЊ РїРѕРєР°Р·С‹РІР°РµС‚ trust counts, budget compliance Рё latency aggregates РїСЂСЏРјРѕ РІ quality surface `Control Tower`.
  - `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx` С‚РµРїРµСЂСЊ РїРѕРєР°Р·С‹РІР°РµС‚:
    - trust summary РїРѕ trace
    - budget verdict Рё trust profile
    - branch verdict cards СЃ РїСЂРёС‡РёРЅР°РјРё, evidence count, freshness Рё data gaps
  - Web-СЂРµРіСЂРµСЃСЃРёСЏ РѕР±РЅРѕРІР»РµРЅР°:
    - `apps/web/__tests__/control-tower-page.spec.tsx`
    - `apps/web/__tests__/control-tower-trace-page.spec.tsx`
  - Execution-РґРѕРєРё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹:
    - РІ `docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md` РґРѕР±Р°РІР»РµРЅ Рё РѕС‚РјРµС‡РµРЅ post-sprint consumption checklist
    - РІ `docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md` РґРѕР±Р°РІР»РµРЅ Рё РѕС‚РјРµС‡РµРЅ `3.6 Post-sprint consumption closure`
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter api exec jest --runInBand src/modules/explainability/explainability-panel.service.spec.ts` вЂ” PASS
    - `pnpm --filter web exec jest --runInBand __tests__/control-tower-trace-page.spec.tsx __tests__/control-tower-page.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” BLOCKED, pre-existing errors РІ `__tests__/ai-chat-store.spec.ts` Рё `lib/stores/ai-chat-store.ts` РІРѕРєСЂСѓРі `AiWorkWindowPayload` / `PendingClarificationState`
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: trust-path С‚РµРїРµСЂСЊ СЂРµР°Р»СЊРЅРѕ РїРѕС‚СЂРµР±Р»СЏРµС‚СЃСЏ РІ explainability/UI, РїРѕСЌС‚РѕРјСѓ РѕРїРµСЂР°С‚РѕСЂ РїРѕР»СѓС‡Р°РµС‚ branch-quality Рё budget-РІРµСЂРґРёРєС‚ Р±РµР· С‡С‚РµРЅРёСЏ raw forensic metadata.

14. **Branch Trust Gate вЂ” tenant-facing trust surface РІ `AI chat / work windows`** [DONE]:
  - `apps/web/lib/stores/ai-chat-store.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° РµРґРёРЅС‹Р№ С‚РёРїРѕР±РµР·РѕРїР°СЃРЅС‹Р№ post-processing path РґР»СЏ `/api/rai/chat`; РґСѓР±Р»РёСЂРѕРІР°РЅРёРµ РІРµС‚РѕРє `appendAssistantMessage` СѓР±СЂР°РЅРѕ.
  - Р—Р°РєСЂС‹С‚ РїСЂРµР¶РЅРёР№ `web tsc` drift РІ `ai-chat-store`:
    - `PendingClarificationState` С‚РµРїРµСЂСЊ СЃРѕР±РёСЂР°РµС‚СЃСЏ С‡РµСЂРµР· РЅРѕСЂРјР°Р»РёР·Р°С†РёСЋ СЃ literal `autoResume: true`
    - СЃС‚Р°СЂС‹Р№ РЅРµРїРѕР»РЅС‹Р№ fixture `AiWorkWindowPayload` РІ `ai-chat-store.spec.ts` РїСЂРёРІРµРґС‘РЅ Рє Р°РєС‚СѓР°Р»СЊРЅРѕРјСѓ РєРѕРЅС‚СЂР°РєС‚Сѓ
  - РР· СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёС… `branchResults / branchTrustAssessments / branchCompositions` С‚РµРїРµСЂСЊ СЃРѕР±РёСЂР°СЋС‚СЃСЏ:
    - `trustSummary` РІ assistant message
    - trust-aware `structured_result` РѕРєРЅРѕ
    - trust-aware `related_signals` РѕРєРЅРѕ
    - tenant-facing СЃРёРіРЅР°Р»С‹ РІ `AiSignalsStrip`
  - `apps/web/components/ai-chat/AiChatPanel.tsx` С‚РµРїРµСЂСЊ РїРѕРєР°Р·С‹РІР°РµС‚ verdict/disclosure РїСЂСЏРјРѕ РІ bubble assistant-РѕС‚РІРµС‚Р°, РїРѕСЌС‚РѕРјСѓ РїРѕРґС‚РІРµСЂР¶РґС‘РЅРЅРѕСЃС‚СЊ РѕС‚РІРµС‚Р° РІРёРґРЅР° Р±РµР· СѓС…РѕРґР° РІ `Control Tower`.
  - `apps/web/components/ai-chat/ai-work-window-types.ts` СЂР°СЃС€РёСЂРµРЅ intent `branch_trust_summary`, С‡С‚РѕР±С‹ РЅРѕРІС‹Р№ trust window СЃР»РѕР№ РЅРµ РјР°СЃРєРёСЂРѕРІР°Р»СЃСЏ РїРѕРґ РґРѕРјРµРЅРЅС‹Р№ intent.
  - Execution-РґРѕРєРё Рё `memory-bank` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕ РЅРѕРІРѕРјСѓ tenant-facing consumption-layer.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: trust-path Р·Р°РјРєРЅСѓР»СЃСЏ РґРѕ tenant-facing СЂР°Р±РѕС‡РµРіРѕ РґРёР°Р»РѕРіР°, Р° branch verdict/disclosure Р±РѕР»СЊС€Рµ РЅРµ С‚РµСЂСЏСЋС‚СЃСЏ РјРµР¶РґСѓ backend composer Рё frontend chat UX.

15. **Branch Trust Gate вЂ” canonical backend trust windows РІ `ResponseComposer`** [DONE]:
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` С‚РµРїРµСЂСЊ СЃС‚СЂРѕРёС‚ canonical `branch_trust_summary` РѕРєРЅР° Рё trust signals РїСЂСЏРјРѕ РІ chat response, Р° РЅРµ РѕСЃС‚Р°РІР»СЏРµС‚ СЂРѕР¶РґРµРЅРёРµ trust windows С‚РѕР»СЊРєРѕ РЅР° СЃС‚РѕСЂРѕРЅРµ `web`.
  - `apps/api/src/shared/rai-chat/rai-chat.dto.ts` СЂР°СЃС€РёСЂРµРЅ intent `branch_trust_summary` РґР»СЏ `RaiWorkWindowDto.payload.intentId`, РїРѕСЌС‚РѕРјСѓ trust work windows С‚РµРїРµСЂСЊ РєР°РЅРѕРЅРёС‡РЅС‹ Рё РЅР° DTO-СѓСЂРѕРІРЅРµ.
  - Trust windows СЃРѕР±РёСЂР°СЋС‚СЃСЏ РїРѕРІРµСЂС… СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёС… `branchResults / branchTrustAssessments / branchCompositions`:
    - summary window `РЎС‚Р°С‚СѓСЃ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РѕС‚РІРµС‚Р°`
    - signals window `РЎРёРіРЅР°Р»С‹ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ`
    - active window СЃРѕС…СЂР°РЅСЏРµС‚ РїСЂРёРѕСЂРёС‚РµС‚ РґРѕРјРµРЅРЅРѕРіРѕ rich-output, РµСЃР»Рё РѕРЅ СѓР¶Рµ РµСЃС‚СЊ
  - `apps/web/lib/stores/ai-chat-store.ts` РїРµСЂРµРІРµРґС‘РЅ РІ fallback-only СЂРµР¶РёРј:
    - РµСЃР»Рё backend СѓР¶Рµ РїСЂРёСЃР»Р°Р» `branch_trust_summary`, store РЅРµ РґСѓР±Р»РёСЂСѓРµС‚ РѕРєРЅР°
    - РµСЃР»Рё payload СЃС‚Р°СЂС‹Р№, Р»РѕРєР°Р»СЊРЅР°СЏ derivation РїРѕ branch trust Р°СЂС‚РµС„Р°РєС‚Р°Рј РѕСЃС‚Р°С‘С‚СЃСЏ РєР°Рє backward-compatible fallback
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` СЂР°СЃС€РёСЂРµРЅ РїСЂРѕРІРµСЂРєРѕР№ canonical trust windows, Р° `apps/web/__tests__/ai-chat-store.spec.ts` Р·Р°РєСЂРµРїР»СЏРµС‚ РѕС‚СЃСѓС‚СЃС‚РІРёРµ РґСѓР±Р»РёРєР°С‚РѕРІ РїСЂРё backend-generated РѕРєРЅР°С….
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts` вЂ” PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: trust surface СЃС‚Р°Р» first-class backend payload РґР»СЏ РІСЃРµС… РєР»РёРµРЅС‚РѕРІ, Р° frontend РїРµСЂРµСЃС‚Р°Р» Р±С‹С‚СЊ РµРґРёРЅСЃС‚РІРµРЅРЅС‹Рј РјРµСЃС‚РѕРј СЃР±РѕСЂРєРё trust windows.

16. **Branch Trust Gate вЂ” first-class backend `trustSummary` contract** [DONE]:
  - Р’ `apps/api/src/shared/rai-chat/branch-trust.types.ts` РґРѕР±Р°РІР»РµРЅС‹ user-facing С‚РёРїС‹:
    - `UserFacingTrustTone`
    - `UserFacingTrustSummaryBranch`
    - `UserFacingTrustSummary`
  - `apps/api/src/shared/rai-chat/rai-chat.dto.ts` СЂР°СЃС€РёСЂРµРЅ first-class РїРѕР»РµРј `trustSummary`, РїРѕСЌС‚РѕРјСѓ `RaiChatResponseDto` С‚РµРїРµСЂСЊ РЅРµСЃС‘С‚ РЅРµ С‚РѕР»СЊРєРѕ branch artifacts Рё work windows, РЅРѕ Рё РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ summary-РєРѕРЅС‚СЂР°РєС‚ РґР»СЏ РєР»РёРµРЅС‚РѕРІ.
  - `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` С‚РµРїРµСЂСЊ СЃС‚СЂРѕРёС‚ canonical backend `trustSummary` РїРѕРІРµСЂС… СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёС… `branchResults / branchTrustAssessments / branchCompositions`, РІРєР»СЋС‡Р°СЏ:
    - РёС‚РѕРіРѕРІС‹Р№ verdict
    - user-facing label Рё disclosure summary
    - `crossCheckUsed`
    - per-branch summary СЃ evidence/gaps/conflict state
  - `apps/web/lib/stores/ai-chat-store.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° РїСЂРёРѕСЂРёС‚РµС‚ backend `trustSummary`:
    - РµСЃР»Рё backend РїСЂРёСЃР»Р°Р» `trustSummary`, bubble Рё trust windows РёСЃРїРѕР»СЊР·СѓСЋС‚ РµРіРѕ РєР°Рє РѕСЃРЅРѕРІРЅРѕР№ РёСЃС‚РѕС‡РЅРёРє
    - Р»РѕРєР°Р»СЊРЅР°СЏ Р°РіСЂРµРіР°С†РёСЏ branch verdict РѕСЃС‚Р°С‘С‚СЃСЏ С‚РѕР»СЊРєРѕ РєР°Рє backward-compatible fallback РґР»СЏ СЃС‚Р°СЂРѕРіРѕ payload
  - `apps/web/__tests__/ai-chat-store.spec.ts` Р·Р°РєСЂРµРїР»СЏРµС‚ РїСЂРёРѕСЂРёС‚РµС‚ backend summary, Р° `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ СЂРµР°Р»СЊРЅСѓСЋ РІС‹РґР°С‡Сѓ `trustSummary` РёР· composer-path.
  - Execution-РґРѕРєРё Рё `memory-bank` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕ РЅРѕРІРѕРјСѓ summary-РєРѕРЅС‚СЂР°РєС‚Сѓ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter api exec jest --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts` вЂ” PASS
    - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: `assistant bubble`, `work windows` Рё Р±СѓРґСѓС‰РёРµ РєР»РёРµРЅС‚С‹ РїРѕР»СѓС‡Р°СЋС‚ РѕРґРёРЅ backend summary-РєРѕРЅС‚СЂР°РєС‚, РїРѕСЌС‚РѕРјСѓ trust verdict/disclosure РїРµСЂРµСЃС‚Р°СЋС‚ СЂРѕР¶РґР°С‚СЊСЃСЏ РѕС‚РґРµР»СЊРЅРѕ РЅР° РєР°Р¶РґРѕРј consumer-СЃР»РѕРµ.

17. **Branch Trust Gate вЂ” typed web client contract for `trustSummary`** [DONE]:
  - Р’ `apps/web/lib/api.ts` РґРѕР±Р°РІР»РµРЅС‹ typed client DTO:
    - `UserFacingTrustSummaryDto`
    - `UserFacingTrustSummaryBranchDto`
    - `RaiChatResponseDto`
    - `RaiChatPendingClarificationDto`
  - `apps/web/lib/stores/ai-chat-store.ts` Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ chat response РєР°Рє Р»РѕРєР°Р»СЊРЅС‹Р№ ad-hoc РєРѕРЅС‚СЂР°РєС‚ РґР»СЏ trust-path:
    - `RaiChatResponsePayload` С‚РµРїРµСЂСЊ Р°Р»РёР°СЃРёС‚СЃСЏ РЅР° `RaiChatResponseDto`
    - `ChatTrustSummary` Рё `ChatTrustBranch` Р°Р»РёР°СЃСЃСЏС‚СЃСЏ РЅР° DTO РёР· `apps/web/lib/api.ts`
    - `normalizeTrustSummary(...)` РїСЂРёРЅРёРјР°РµС‚ typed `RaiChatResponseDto['trustSummary']`, Р° РЅРµ `unknown`
  - Р­С‚РёРј Р¶Рµ СЃСЂРµР·РѕРј compile-time РєРѕРЅС‚СЂР°РєС‚ РјРµР¶РґСѓ `/api/rai/chat` consumer-layer Рё `ai-chat-store` РІС‹СЂРѕРІРЅРµРЅ Р±РµР· Р»РѕРјРєРё backward-compatible runtime guards.
  - Execution-РґРѕРєРё Рё `memory-bank` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕ typed client-contract closure.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: `web` Р±РѕР»СЊС€Рµ РЅРµ СЃРєСЂС‹РІР°РµС‚ С„РѕСЂРјСѓ trust payload Р·Р° `unknown`, РїРѕСЌС‚РѕРјСѓ РЅРѕРІС‹Рµ trust consumer-СЃР»РѕРё РїРѕР»СѓС‡Р°СЋС‚ compile-time Р·Р°С‰РёС‚Сѓ Рё РјРµРЅСЊС€Рµ СЂРёСЃРєСѓСЋС‚ СЃР»РѕРІРёС‚СЊ РЅРµР·Р°РјРµС‚РЅС‹Р№ drift РјРµР¶РґСѓ API Рё UI.

18. **Branch Trust Gate вЂ” chat transport consolidation in `apps/web/lib/api.ts`** [DONE]:
  - Р’ `apps/web/lib/api.ts` РґРѕР±Р°РІР»РµРЅ РѕР±С‰РёР№ typed helper `submitRaiChatRequest(...)` РґР»СЏ `/api/rai/chat`.
  - Р’ helper РїРµСЂРµРЅРµСЃРµРЅС‹:
    - С„РѕСЂРјРёСЂРѕРІР°РЅРёРµ `Idempotency-Key`
    - `fetch('/api/rai/chat')`
    - HTTP error normalization РґР»СЏ chat path
  - `apps/web/lib/stores/ai-chat-store.ts` Р±РѕР»СЊС€Рµ РЅРµ РґРµСЂР¶РёС‚ СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ transport РґР»СЏ chat request:
    - Р»РѕРєР°Р»СЊРЅС‹Р№ `fetch/json/idempotency` path СѓРґР°Р»С‘РЅ
    - store С‚РµРїРµСЂСЊ РІС‹Р·С‹РІР°РµС‚ РѕР±С‰РёР№ helper РёР· `apps/web/lib/api.ts`
    - UI-РѕР±СЂР°Р±РѕС‚РєР° runtime/network РѕС€РёР±РѕРє СЃРѕС…СЂР°РЅРµРЅР° РІ store Р±РµР· Р»РѕРјРєРё abort flow
  - Request contract РѕСЃС‚Р°Р»СЃСЏ СЃРѕРІРјРµСЃС‚РёРјС‹Рј РїРѕ observable surface:
    - URL `/api/rai/chat`
    - `POST`
    - `Idempotency-Key`
    - РїСЂРµР¶РЅРёР№ body `threadId/message/workspaceContext/clarificationResume`
  - Execution-РґРѕРєРё Рё `memory-bank` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕ transport consolidation.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: transport Рё DTO РґР»СЏ chat path С‚РµРїРµСЂСЊ Р¶РёРІСѓС‚ РІ РѕРґРЅРѕРј client-layer, РїРѕСЌС‚РѕРјСѓ `ai-chat-store` РїРµСЂРµСЃС‚Р°Р» Р±С‹С‚СЊ СЃРєСЂС‹С‚С‹Рј HTTP-РєР»РёРµРЅС‚РѕРј Рё СЃС‚Р°Р» Р±Р»РёР¶Рµ Рє С‡РёСЃС‚РѕРјСѓ state/orchestration СЃР»РѕСЋ.

19. **Branch Trust Gate вЂ” shared chat response adapter extraction** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ shared adapter `apps/web/lib/rai-chat-response-adapter.ts` СЂСЏРґРѕРј СЃ `apps/web/lib/api.ts`.
  - Р’ adapter РІС‹РЅРµСЃРµРЅС‹ response-specific helper-СЃР»РѕРё, РєРѕС‚РѕСЂС‹Рµ СЂР°РЅСЊС€Рµ Р¶РёР»Рё РїСЂСЏРјРѕ РІ `ai-chat-store`:
    - legacy widget migration
    - trust summary normalization
    - trust window derivation
    - pending clarification hydration
  - `apps/web/lib/stores/ai-chat-store.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° РґРІР° РѕР±С‰РёС… С€РІР°:
    - `submitRaiChatRequest(...)` РёР· `apps/web/lib/api.ts`
    - `adaptRaiChatResponseForStore(...)` / `hydratePendingClarificationState(...)` РёР· РЅРѕРІРѕРіРѕ adapter
  - Р’РЅСѓС‚СЂРё `submitRequest(...)` store С‚РµРїРµСЂСЊ РІ РѕСЃРЅРѕРІРЅРѕРј РґРµР»Р°РµС‚ state merge, Р° РЅРµ РґРµСЂР¶РёС‚ СЃРѕР±СЃС‚РІРµРЅРЅС‹Р№ РїР°РєРµС‚ response-Р»РѕРіРёРєРё.
  - Execution-РґРѕРєРё Рё `memory-bank` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕ response-adapter extraction.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: Р°РґР°РїС‚Р°С†РёСЏ chat response РїРµСЂРµСЃС‚Р°Р»Р° Р±С‹С‚СЊ вЂњСЃРєСЂС‹С‚РѕР№ Р±РёР·РЅРµСЃ-Р»РѕРіРёРєРѕР№ РІРЅСѓС‚СЂРё storeвЂќ, РїРѕСЌС‚РѕРјСѓ СЃР»РµРґСѓСЋС‰РёРµ client surfaces Рё unit-С‚РµСЃС‚С‹ СЃРјРѕРіСѓС‚ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ С‚РѕС‚ Р¶Рµ shared path Р±РµР· РєРѕРїРёСЂРѕРІР°РЅРёСЏ zustand-РєРѕРґР°.

20. **Branch Trust Gate вЂ” shared chat response state reducer extraction** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ shared state-layer `apps/web/lib/rai-chat-response-state.ts`.
  - Р’ reducer/helper СЃР»РѕР№ РІС‹РЅРµСЃРµРЅС‹:
    - `resolveResponseWorkWindows(...)`
    - `resolveResponseActiveWindowId(...)`
    - `resolveResponseCollapsedWindowIds(...)`
    - `pickPreferredWorkWindow(...)`
    - signal derivation РґР»СЏ response application path
  - `apps/web/lib/stores/ai-chat-store.ts` С‚РµРїРµСЂСЊ РёСЃРїРѕР»СЊР·СѓРµС‚ `resolveRaiChatResponseState(...)` РІ `submitRequest(...)`, Р° manual window path РїРµСЂРµРёСЃРїРѕР»СЊР·СѓРµС‚ С‚Рµ Р¶Рµ shared helperвЂ™С‹.
  - Extraction РѕС‚РґРµР»СЊРЅРѕ СѓРјРµРЅСЊС€РёР» РѕР±СЉС‘Рј imperative-Р»РѕРіРёРєРё РІ `submitRequest(...)` Рё РѕС‚РґРµР»РёР» response state transitions РѕС‚ transport/adapter СЃР»РѕСЏ.
  - Execution-РґРѕРєРё Рё `memory-bank` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕ reducer extraction.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ:
    - `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` вЂ” PASS
    - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: response window/application semantics РїРµСЂРµСЃС‚Р°Р»Рё Р±С‹С‚СЊ СЃРєСЂС‹С‚РѕР№ С‡Р°СЃС‚СЊСЋ zustand-store, РїРѕСЌС‚РѕРјСѓ СЃР»РµРґСѓСЋС‰РёР№ evolution С€Р°Рі РјРѕР¶РЅРѕ РґРµР»Р°С‚СЊ С‡РµСЂРµР· shared reducer РІРјРµСЃС‚Рѕ СЂСѓС‡РЅРѕР№ СЃР±РѕСЂРєРё state transitions РІ UI-store.

21. **CRM composite flow: register_counterparty -> create_account -> open_workspace** [DONE]:
  - Р’ `Semantic Ingress Frame` РґРѕР±Р°РІР»РµРЅ `compositePlan` РґР»СЏ CRM follow-up flow.
  - `SupervisorAgent` РёСЃРїРѕР»РЅСЏРµС‚ staged composite workflow РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕ: `register_counterparty -> create_crm_account -> review_account_workspace`.
  - `ResponseComposer` РѕС‚РґР°С‘С‚ РѕС‚РґРµР»СЊРЅС‹Р№ `crm_composite_flow` work window СЃ owner/strategy/stage status Рё related signals.
  - Trace forensics Рё `Control Tower` РїРѕРєР°Р·С‹РІР°СЋС‚ `Composite workflow` block РєР°Рє first-class ingress artifact.
  - `apps/web/lib/api.ts`, `apps/web/components/ai-chat/ai-work-window-types.ts` Рё trace page СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РїРѕ `crm_composite_flow`.
  - РўРµСЃС‚С‹ РЅР° `semantic-ingress`, `supervisor-agent`, `response-composer` Рё `Control Tower` Р·РµР»С‘РЅС‹Рµ.
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: РїР»Р°С‚С„РѕСЂРјР° СѓР¶Рµ СѓРјРµРµС‚ РїСЂРѕРІРѕРґРёС‚СЊ РєРѕСЂРѕС‚РєРёР№ governed CRM composite СЃС†РµРЅР°СЂРёР№ РєР°Рє РѕРґРёРЅ lead-owner workflow, Р° РЅРµ РєР°Рє С†РµРїРѕС‡РєСѓ РЅРµСЃРІСЏР·Р°РЅРЅС‹С… write/read РїРµСЂРµС…РѕРґРѕРІ.

22. **Agro execution fact -> finance cost aggregation + branch trust eval coverage** [DONE]:
  - `Semantic Ingress Frame` С‚РµРїРµСЂСЊ РЅРѕСЂРјР°Р»РёР·СѓРµС‚ `agro execution fact -> finance cost aggregation` РІ Р°РЅР°Р»РёС‚РёС‡РµСЃРєРёР№ composite workflow.
  - `SupervisorAgent` РёСЃРїРѕР»РЅСЏРµС‚ staged analytical workflow РєР°Рє `agronomist -> economist`.
  - `ResponseComposer` РѕС‚РґР°С‘С‚ РѕС‚РґРµР»СЊРЅС‹Р№ `multi_source_aggregation` work window РґР»СЏ Р°РЅР°Р»РёС‚РёС‡РµСЃРєРѕРіРѕ composite-flow.
  - `branch-trust.eval.spec.ts` РїРѕР»СѓС‡РёР» verified multi-source regression case РґР»СЏ agro/finance composite payload.
  - РўРµСЃС‚С‹ РЅР° `semantic-ingress`, `supervisor-agent`, `response-composer` Рё `branch-trust.eval` Р·РµР»С‘РЅС‹Рµ.
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: multi-source analytical question С‚РµРїРµСЂСЊ РїСЂРѕС…РѕРґРёС‚ С‡РµСЂРµР· one-owner staged execution Рё branch-level trust verification Р±РµР· РїРѕС‚РµСЂРё С‡РµСЃС‚РЅРѕСЃС‚Рё С„Р°РєС‚РѕРІ.

23. **front_office_agent ingress fallback for no-route process messages** [IN PROGRESS]:
  - `classifyByAgentContracts(...)` С‚РµРїРµСЂСЊ РїРµСЂРµРІРѕРґРёС‚ no-route process-like СЃРѕРѕР±С‰РµРЅРёСЏ РІ `front_office_agent` СЃ intent `classify_dialog_thread` Рё auto tool call `ClassifyDialogThread`.
  - Safe greetings/free-chat no-route path СЃРѕС…СЂР°РЅС‘РЅ РЅР° legacy fallback, С‡С‚РѕР±С‹ РЅРµ Р»РѕРјР°С‚СЊ `rai-chat.service.spec` fail-open РїСѓС‚СЊ.
  - `agent-interaction-contracts.spec.ts` Р·РµР»С‘РЅС‹Р№; `pnpm --filter api exec tsc --noEmit --pretty false` С‚Р°РєР¶Рµ Р·РµР»С‘РЅС‹Р№.
  - `ResponseComposerService` РѕС‚РґРµР»СЊРЅРѕ РІРµСЂРЅСѓР» greeting acknowledge `РџСЂРёРЅСЏР»: <message>` РґР»СЏ РїСЂРѕСЃС‚С‹С… РїСЂРёРІРµС‚СЃС‚РІРёР№, С‡С‚РѕР±С‹ С‚РµРєСѓС‰РёР№ chat fail-open path РЅРµ РґРµРіСЂР°РґРёСЂРѕРІР°Р» РІ generic fallback.
  - РЎС‚Р°СЂС‹Р№ widget-drift РІ `rai-chat.service.spec.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° С‚РµРєСѓС‰РёР№ РєРѕРЅС‚СЂР°РєС‚: legacy `widgets[]` Р±РѕР»СЊС€Рµ РЅРµ РѕР¶РёРґР°СЋС‚СЃСЏ РІ agentExecution path, Р° current truth Р·Р°РєСЂРµРїР»РµРЅР° С‡РµСЂРµР· `workWindows`/agent response behavior.
  - РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі: Р°РєРєСѓСЂР°С‚РЅРѕ СЂР°СЃС€РёСЂРёС‚СЊ СЌС‚РѕС‚ ingress path РЅР° Р±РµР·РѕРїР°СЃРЅС‹Р№ free-chat СЃР»РѕР№ Р±РµР· РёР·РјРµРЅРµРЅРёСЏ С‚РµРєСѓС‰РµРіРѕ chat fallback.

24. **front_office_agent ingress closure for safe free-chat no-route messages** [DONE]:
  - `classifyByAgentContracts(...)` С‚РµРїРµСЂСЊ РїРµСЂРµРІРѕРґРёС‚ no-route free-chat СЃРѕРѕР±С‰РµРЅРёСЏ РІ `front_office_agent` СЃ intent `classify_dialog_thread`.
  - `FrontOfficeAgent` РґР»СЏ `free_chat` РєР»Р°СЃСЃРёС„РёРєР°С†РёРё РІРѕР·РІСЂР°С‰Р°РµС‚ greeting acknowledge `РџСЂРёРЅСЏР»: <message>`, С‡С‚РѕР±С‹ fail-open chat path СЃРѕС…СЂР°РЅРёР»СЃСЏ.
  - `AgentRuntimeConfigService` Р±РѕР»СЊС€Рµ РЅРµ Р±Р»РѕРєРёСЂСѓРµС‚ `front_office_agent` tool surface РєР°Рє governed-by-default without owner config.
  - `rai-chat.service.spec.ts`, `agent-runtime-config.service.spec.ts`, `agent-contracts.spec.ts` Рё `front-office-agent.service.spec.ts` Р·РµР»С‘РЅС‹Рµ.

25. **Semantic-first owner selection in SupervisorAgent** [DONE]:
  - `SupervisorAgent` С‚РµРїРµСЂСЊ СЂРµР·РѕР»РІРёС‚ runtime owner role РёР· `SemanticIngressFrame.requestedOperation.ownerRole` СЂР°РЅСЊС€Рµ legacy classification fallback.
  - semantic frame РѕСЃС‚Р°С‘С‚СЃСЏ canonical РґР»СЏ migrated slices, Р° legacy classification СЃРѕС…СЂР°РЅС‘РЅ РєР°Рє compatibility path.
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `supervisor-agent.service.spec.ts`.
  - СЌС„С„РµРєС‚: semantic ingress С‚РµРїРµСЂСЊ СѓС‡Р°СЃС‚РІСѓРµС‚ РІ actual orchestration role selection, Р° РЅРµ С‚РѕР»СЊРєРѕ РІ audit metadata.

26. **Semantic-first intent resolution in AgentExecutionAdapter** [DONE]:
  - `AgentExecutionAdapterService` С‚РµРїРµСЂСЊ СЂРµР·РѕР»РІРёС‚ intent РёР· `SemanticIngressFrame.requestedOperation.intent` РїРµСЂРІС‹Рј РґР»СЏ migrated roles.
  - CRM / contracts / front-office execution paths РёСЃРїРѕР»СЊР·СѓСЋС‚ semantic ingress РєР°Рє primary source, Р° legacy text heuristics РѕСЃС‚Р°СЋС‚СЃСЏ fallback-СЃР»РѕРµРј.
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `runtime/agent-execution-adapter.service.spec.ts`.
  - СЌС„С„РµРєС‚: execution path РїРµСЂРµСЃС‚Р°С‘С‚ РїРѕРІС‚РѕСЂРЅРѕ СѓРіР°РґС‹РІР°С‚СЊ intent РїРѕСЃР»Рµ semantic ingress Рё СЃС‚Р°РЅРѕРІРёС‚СЃСЏ РїСЂРµРґСЃРєР°Р·СѓРµРјРµРµ.

27. **Semantic-primary text heuristics gated in AgentExecutionAdapter** [DONE]:
  - РґР»СЏ primary semantic routing text heuristics Р±РѕР»СЊС€Рµ РЅРµ РёСЃРїРѕР»СЊР·СѓСЋС‚СЃСЏ РєР°Рє second guess РІ agronomist path
  - chief_agronomist Рё data_scientist С‚Р°РєР¶Рµ РїРµСЂРµРІРµРґРµРЅС‹ РЅР° semantic-primary intent default, Р° text fallback РѕСЃС‚Р°РІР»РµРЅ С‚РѕР»СЊРєРѕ РґР»СЏ compatibility path
  - compatibility fallback РѕСЃС‚Р°С‘С‚СЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ РЅРµРјРёРіСЂРёСЂРѕРІР°РЅРЅС‹С…/heuristic-only requests
  - СЌС„С„РµРєС‚: migrated execution path С‚РµРїРµСЂСЊ РґРµР№СЃС‚РІРёС‚РµР»СЊРЅРѕ СЃР»РµРґСѓРµС‚ semantic plan, Р° РЅРµ РїРµСЂРµСЃРѕР±РёСЂР°РµС‚ intent РїРѕ С„СЂР°Р·Рµ РїРѕСЃР»Рµ routing

28. **Typed writePolicy added to SemanticIngressFrame** [DONE]:
  - `SemanticIngressFrame` С‚РµРїРµСЂСЊ РЅРµСЃС‘С‚ typed `writePolicy` СЃ decision `execute/confirm/clarify/block`
  - policy decision РѕС‚РґРµР»С‘РЅ РѕС‚ lexical signal Рё РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ runtime gate
  - `SupervisorAgent` С‚РµРїРµСЂСЊ РѕРїРёСЂР°РµС‚СЃСЏ РЅР° `writePolicy` РґР»СЏ user-confirmed gating
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `semantic-ingress.service.spec.ts`

29. **Trace forensics surfaces writePolicy** [DONE]:
  - `writePolicy` РґРѕР±Р°РІР»РµРЅ РІ trace forensics response РєР°Рє РѕС‚РґРµР»СЊРЅРѕРµ РїРѕР»Рµ
  - policy decision С‚РµРїРµСЂСЊ РІРёРґРёРј РІ observability API Р±РµР· С‡С‚РµРЅРёСЏ РїРѕР»РЅРѕРіРѕ `semanticIngressFrame`
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `explainability-panel.service.spec.ts`

30. **Tool registry direct-write gating uses typed writePolicy** [DONE]:
  - `RaiToolActorContext` РїРѕР»СѓС‡РёР» typed `writePolicy` РїРѕСЃР»Рµ semantic ingress normalization
  - `RaiToolsRegistry` С‚РµРїРµСЂСЊ РёСЃРїРѕР»СЊР·СѓРµС‚ `writePolicy.decision === "execute"` РґР»СЏ CRM direct-write bypass РІРјРµСЃС‚Рѕ РѕРґРЅРѕРіРѕ `userIntentSource`
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `tools/rai-tools.registry.spec.ts`
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: write-governance СЃС‚Р°Р» Р·Р°РІРёСЃРµС‚СЊ РѕС‚ canonical semantic policy, Р° РЅРµ РѕС‚ РєРѕСЃРІРµРЅРЅРѕРіРѕ string-РёСЃС‚РѕС‡РЅРёРєР° intent.

31. **PendingAction workflow execution carries typed writePolicy** [DONE]:
  - `PendingActionsController` РїРµСЂРµРґР°С‘С‚ typed `writePolicy` РІ approved action execution
  - СЃС‚СЂРѕРєРѕРІС‹Р№ `workflow_resume` intent Р±РѕР»СЊС€Рµ РЅРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РІ approved action execution РєР°Рє source of truth
  - `approvedPendingActionId` РѕСЃС‚Р°Р»СЃСЏ РѕС‚РґРµР»СЊРЅС‹Рј bypass-РјР°СЂРєРµСЂРѕРј, РЅРµ СЃРјРµС€Р°РЅРЅС‹Рј СЃ intent source
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: approved workflow resume path С‚РµРїРµСЂСЊ РЅРµСЃС‘С‚ С‚РѕС‚ Р¶Рµ canonical policy shape, С‡С‚Рѕ Рё РѕСЃС‚Р°Р»СЊРЅРѕР№ governed write path.

32. **PendingActionsController spec locks approved write policy contract** [DONE]:
  - unit-spec РїСЂРѕРІРµСЂСЏРµС‚, С‡С‚Рѕ approved pending-action execution РїРµСЂРµРґР°С‘С‚ typed `writePolicy`
  - unit-spec РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ РѕС‚СЃСѓС‚СЃС‚РІРёРµ `workflow_resume` РєР°Рє source of truth РІ actor context
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: approved execution contract С‚РµРїРµСЂСЊ Р·Р°С‰РёС‰С‘РЅ СЂРµРіСЂРµСЃСЃРёРµР№, Р° РЅРµ С‚РѕР»СЊРєРѕ РєРѕРґРѕРІС‹Рј СЃРѕРіР»Р°С€РµРЅРёРµРј.

33. **Primary CRM/contracts routing uses safe read defaults** [DONE]:
  - CRM primary routing Р±РѕР»СЊС€Рµ РЅРµ СѓРіР°РґС‹РІР°РµС‚ intent РїРѕ message fallback, Р° РІС‹Р±РёСЂР°РµС‚ safe read default `review_account_workspace`
  - contracts primary routing Р±РѕР»СЊС€Рµ РЅРµ СѓРіР°РґС‹РІР°РµС‚ intent РїРѕ message fallback, Р° РІС‹Р±РёСЂР°РµС‚ safe read default `review_commerce_contract`
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `runtime/agent-execution-adapter.service.spec.ts`
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: adapter РїРµСЂРµСЃС‚Р°Р» РїСЂРёРЅРёРјР°С‚СЊ С‚РµРєСЃС‚ Р·Р° РёСЃС‚РѕС‡РЅРёРє РёСЃС‚РёРЅС‹ РґР»СЏ primary CRM/contracts routing Рё С‚РµРїРµСЂСЊ РІРµРґС‘С‚ СЃРµР±СЏ РєР°Рє semantic-first gate СЃ Р±РµР·РѕРїР°СЃРЅС‹Рј read default.

34. **Front-office primary routing uses classify_dialog_thread default** [DONE]:
  - `front_office_agent` primary routing Р±РѕР»СЊС€Рµ РЅРµ СѓРіР°РґС‹РІР°РµС‚ intent РїРѕ message fallback, Р° РІС‹Р±РёСЂР°РµС‚ `classify_dialog_thread` РєР°Рє safe default
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `runtime/agent-execution-adapter.service.spec.ts`
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: front-office primary path С‚РѕР¶Рµ РїРµСЂРµСЃС‚Р°Р» Р·Р°РІРёСЃРµС‚СЊ РѕС‚ text-based intent guessing Рё С‚РµРїРµСЂСЊ СЃР»РµРґСѓРµС‚ semantic-first default.

35. **Agronomist primary routing uses generate_tech_map_draft default** [DONE]:
  - `agronomist` primary routing Р±РѕР»СЊС€Рµ РЅРµ РїРµСЂРµСЃРѕР±РёСЂР°РµС‚ intent РїРѕ phrase fallback Рё РІС‹Р±РёСЂР°РµС‚ `generate_tech_map_draft` РєР°Рє safe default
  - read-only techmap registry path РѕСЃС‚Р°С‘С‚СЃСЏ РѕС‚РґРµР»СЊРЅРѕР№ heuristic РІРµС‚РєРѕР№ РґР»СЏ browsing-СЃС†РµРЅР°СЂРёРµРІ
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `runtime/agent-execution-adapter.service.spec.ts`
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: agronomist primary path С‚РѕР¶Рµ СЃС‚Р°Р» semantic-first default, Р° draft-РІС‹Р·РѕРІ Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ phrase guessing РІ adapter layer.

36. **Route downgraded from hard gate to contextual prior** [DONE]:
  - `semantic-router.service.ts` Р±РѕР»СЊС€Рµ РЅРµ С‚СЂРµР±СѓРµС‚ `route` / `workspaceContext` РєР°Рє РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ gate РґР»СЏ key owner-intents
  - `crm`, `contracts`, `finance` Рё `deviation` slice detection С‚РµРїРµСЂСЊ РјРѕРіСѓС‚ РѕРїРёСЂР°С‚СЊСЃСЏ РЅР° semantic query Р±РµР· route-first РІРµС‚РІР»РµРЅРёСЏ
  - regression coverage РґРѕР±Р°РІР»РµРЅ РІ `semantic-router.service.spec.ts`
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: route-space РїРµСЂРµСЃС‚Р°Р» Р±С‹С‚СЊ СЃРєСЂС‹С‚С‹Рј production gate Рё СЃС‚Р°Р» РёРјРµРЅРЅРѕ prior РґР»СЏ disambiguation, РєР°Рє Рё С‚СЂРµР±РѕРІР°Р» phase plan.

37. **Branch Trust Gate macro-sprint final verification** [DONE]:
  - `pnpm lint:docs` вЂ” PASS
  - `pnpm lint:docs:matrix:strict` вЂ” PASS
  - `pnpm --filter api exec tsc --noEmit --pretty false` вЂ” PASS
  - `pnpm --filter web exec tsc --noEmit --pretty false` вЂ” PASS
  - targeted api jest suites вЂ” PASS
  - targeted web jest suites вЂ” PASS
  - Р­С„С„РµРєС‚ РёР·РјРµРЅРµРЅРёСЏ: macro-sprint Р·Р°РєСЂС‹С‚ РЅРµ С‚РѕР»СЊРєРѕ РІ РєРѕРґРµ, РЅРѕ Рё РІ С„РёРЅР°Р»СЊРЅРѕР№ runtime/docs РІРµСЂРёС„РёРєР°С†РёРё.

## 2026-03-20

1. **Routing Learning Layer вЂ” Foundation + Techmaps Cutover** [DONE]:
  - Р’РІРµРґС‘РЅ canonical routing СЃР»РѕР№: `SemanticIntent`, `RouteDecision`, `RoutingTelemetryEvent`, `SemanticRoutingContext`.
  - Р РµР°Р»РёР·РѕРІР°РЅС‹ `routing-versioning.ts` Рё `routing-telemetry-redaction.ts`; persisted routing events С‚РµРїРµСЂСЊ РїРѕР»СѓС‡Р°СЋС‚ `routerVersion`, `promptVersion`, `toolsetVersion`, `workspaceStateDigest`.
  - `SemanticRouterService` РІСЃС‚СЂРѕРµРЅ РІ `SupervisorAgent` РєР°Рє `shadow-first` СЃР»РѕР№; РґР»СЏ slice `agro.techmaps.list-open-create` РІРєР»СЋС‡С‘РЅ `semantic_router_primary`.
  - Р’ `AgentRuntimeService` РґРѕР±Р°РІР»РµРЅ coarse capability gating РїРѕ `semanticRouting.routeDecision.eligibleTools`.
  - `SupervisorForensicsService` С‚РµРїРµСЂСЊ РїРёС€РµС‚ sanitized `routingTelemetry` РІ `AiAuditEntry.metadata`.
  - Р’ explainability РґРѕР±Р°РІР»РµРЅ divergence read-model Рё endpoint `GET /api/rai/explainability/routing/divergence`.
  - Р’ `apps/web/app/(app)/control-tower/page.tsx` РґРѕР±Р°РІР»РµРЅР° РїР°РЅРµР»СЊ СЂР°СЃС…РѕР¶РґРµРЅРёР№ legacy vs semantic routing.
  - РЎРѕР±СЂР°РЅ fixture-driven eval corpus `techmaps-routing-eval-corpus.json`; РґРѕР±Р°РІР»РµРЅ spec `semantic-router.eval.spec.ts` СЃ РєРµР№СЃР°РјРё `navigate/execute/clarify/abstain`.
  - Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ gate `pnpm gate:routing:techmaps`; РѕРЅ Р·Р°РІРµРґС‘РЅ РІ `.github/workflows/invariant-gates.yml` РєР°Рє hard-fail С€Р°Рі.
  - `routing/divergence` СЂР°СЃС€РёСЂРµРЅ РґРѕ agent-level drilldown: backend С‚РµРїРµСЂСЊ РѕС‚РґР°С‘С‚ `agentBreakdown`, Р° `Control Tower` РїРѕРєР°Р·С‹РІР°РµС‚ СЃР°РјС‹Р№ С€СѓРјРЅС‹Р№ `targetRole`, РµРіРѕ divergence rate, decision breakdown Рё top mismatch kinds.
  - `routing/divergence` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЂР°СЃС€РёСЂРµРЅ `failureClusters`: read-model РіСЂСѓРїРїРёСЂСѓРµС‚ `targetRole + decisionType + mismatchKinds`, СЃС‡РёС‚Р°РµС‚ `semanticPrimaryCount`, `lastSeenAt` Рё `caseMemoryReadiness`.
  - Р’ `Control Tower` РґРѕР±Р°РІР»РµРЅ triage-Р±Р»РѕРє РїРѕРІС‚РѕСЂСЏСЋС‰РёС…СЃСЏ РєР»Р°СЃС‚РµСЂРѕРІ СЃ ready-state `РЅР°Р±Р»СЋРґРµРЅРёРµ / РЅСѓР¶РЅРѕ Р±РѕР»СЊС€Рµ СЃРёРіРЅР°Р»РѕРІ / РіРѕС‚РѕРІРѕ Рє РїР°РјСЏС‚Рё РєРµР№СЃРѕРІ`.
  - `routing/divergence` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЂР°СЃС€РёСЂРµРЅ `caseMemoryCandidates`: read-model С‚РµРїРµСЂСЊ СЂРµР¶РµС‚ РєР°РЅРґРёРґР°С‚РѕРІ РїРѕ РІРµСЂСЃРёСЏРј `routerVersion / promptVersion / toolsetVersion`, СЃС‡РёС‚Р°РµС‚ `traceCount`, `firstSeenAt`, `lastSeenAt`, `ttlExpiresAt`.
  - Р’ `Control Tower` РґРѕР±Р°РІР»РµРЅ Р±Р»РѕРє `РљР°РЅРґРёРґР°С‚С‹ РІ РїР°РјСЏС‚СЊ РєРµР№СЃРѕРІ`, С‡С‚РѕР±С‹ РѕРїРµСЂР°С‚РѕСЂ РІРёРґРµР» version-aware РєР°РЅРґРёРґР°С‚РѕРІ Р±РµР· РѕС‚РґРµР»СЊРЅРѕР№ Р‘Р” Рё СЂСѓС‡РЅРѕР№ СЃР±РѕСЂРєРё.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РїСЂРѕРІРµСЂРєРё: `explainability-panel.service.spec.ts`, `explainability-panel.controller.spec.ts`, `control-tower-page.spec.tsx`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РЅРѕРІС‹Рµ РїСЂРѕРІРµСЂРєРё: `pnpm gate:routing:techmaps`, `semantic-router.eval.spec.ts`, `semantic-router.service.spec.ts`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ targeted РїСЂРѕРІРµСЂРєРё: `pnpm --filter api exec tsc --noEmit --pretty false`, `semantic-router.service.spec.ts`, `supervisor-agent.service.spec.ts`, `explainability-panel.service.spec.ts`, `control-tower-page.spec.tsx`.
  - `pnpm --filter web exec tsc --noEmit --pretty false` РѕСЃС‚Р°С‘С‚СЃСЏ РєСЂР°СЃРЅС‹Рј РёР·-Р·Р° СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёС… РѕС€РёР±РѕРє РІ `ai-chat-store` Рё `lib/stores/ai-chat-store.ts`, РЅРµ СЃРІСЏР·Р°РЅРЅС‹С… СЃ С‚РµРєСѓС‰РёРј routing-РїР°РєРµС‚РѕРј.
2. **Routing Case Memory Capture Path** [DONE]:
  - Р’ `apps/api/src/modules/explainability/dto/routing-divergence.dto.ts` РґРѕР±Р°РІР»РµРЅС‹ capture-РєРѕРЅС‚СЂР°РєС‚С‹: `CaptureRoutingCaseMemoryCandidateDtoSchema` Рё `RoutingCaseMemoryCandidateCaptureResponseDto`.
  - `ExplainabilityPanelService` С‚РµРїРµСЂСЊ СѓРјРµРµС‚ С„РёРєСЃРёСЂРѕРІР°С‚СЊ `ready_for_case_memory` РєР°РЅРґРёРґР°С‚Р° С‡РµСЂРµР· `AuditLog` action `ROUTING_CASE_MEMORY_CANDIDATE_CAPTURED` Рё РІРѕР·РІСЂР°С‰Р°РµС‚ `captureStatus / capturedAt / captureAuditLogId` РІ divergence read-model.
  - Р”РѕР±Р°РІР»РµРЅ guarded endpoint `POST /api/rai/explainability/routing/case-memory-candidates/capture`; `apps/web/lib/api.ts` РїРѕР»СѓС‡РёР» РєР»РёРµРЅС‚СЃРєРёР№ РјРµС‚РѕРґ СЃ `Idempotency-Key`.
  - `Control Tower` РїРѕРєР°Р·С‹РІР°РµС‚ capture-status РїРѕ РєР°РЅРґРёРґР°С‚Сѓ Рё РґР°С‘С‚ РѕРїРµСЂР°С‚РѕСЂСЃРєСѓСЋ РєРЅРѕРїРєСѓ `Р·Р°С„РёРєСЃРёСЂРѕРІР°С‚СЊ` РґР»СЏ РіРѕС‚РѕРІС‹С… РєРµР№СЃРѕРІ.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ targeted РїСЂРѕРІРµСЂРєРё: `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/explainability/explainability-panel.service.spec.ts src/modules/explainability/explainability-panel.controller.spec.ts`, `pnpm --filter web exec jest --runInBand __tests__/control-tower-page.spec.tsx`.
3. **Routing Case Memory Retrieval & Lifecycle** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ `apps/api/src/modules/rai-chat/semantic-router/routing-case-memory.service.ts`: СЃРµСЂРІРёСЃ С‡РёС‚Р°РµС‚ captured cases РёР· `AuditLog`, С„РёР»СЊС‚СЂСѓРµС‚ РїРѕ `TTL`, СЃС‡РёС‚Р°РµС‚ relevance-score Рё РїРµСЂРµРІРѕРґРёС‚ РєРµР№СЃ РІ lifecycle `active` С‡РµСЂРµР· action `ROUTING_CASE_MEMORY_CASE_ACTIVATED`.
  - `SemanticRouterService` С‚РµРїРµСЂСЊ РїСЂРёРЅРёРјР°РµС‚ `companyId`, РїРѕРґС‚СЏРіРёРІР°РµС‚ `retrievedCaseMemory[]` Рё РёСЃРїРѕР»СЊР·СѓРµС‚ РёС… РєР°Рє bounded retrieval СЃР»РѕР№ РґРѕ `LLM refine`.
  - Р’РІРµРґС‘РЅ safe override С‚РѕР»СЊРєРѕ РґР»СЏ low-risk routing: РµСЃР»Рё deterministic path СѓС€С‘Р» РІ `abstain`, Р° active case memory СѓРІРµСЂРµРЅРЅРѕ СѓРєР°Р·С‹РІР°РµС‚ РЅР° `safe_read navigate/clarify`, СЂРѕСѓС‚РµСЂ РјРѕР¶РµС‚ РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ РїСЂР°РІРёР»СЊРЅС‹Р№ read-only РјР°СЂС€СЂСѓС‚ Р±РµР· write escalation.
  - Explainability read-model С‚РµРїРµСЂСЊ СЂР°Р·Р»РёС‡Р°РµС‚ `not_captured / captured / active`, Р° `caseMemoryCandidates` РЅРµСЃСѓС‚ `semanticIntent`, `routeDecision`, `activatedAt`, `activationAuditLogId`.
  - `Control Tower` РїРѕРєР°Р·С‹РІР°РµС‚ lifecycle РєР°РЅРґРёРґР°С‚Р° (`РЅРµ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ / Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ / Р°РєС‚РёРІРµРЅ РІ РјР°СЂС€СЂСѓС‚РёР·Р°С†РёРё`) Рё timestamps Р·Р°С…РІР°С‚Р°/Р°РєС‚РёРІР°С†РёРё.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ targeted РїСЂРѕРІРµСЂРєРё: `pnpm --filter api exec tsc --noEmit --pretty false`, `routing-case-memory.service.spec.ts`, `semantic-router.service.spec.ts`, `semantic-router.eval.spec.ts`, `explainability-panel.service.spec.ts`, `explainability-panel.controller.spec.ts`, `control-tower-page.spec.tsx`.
4. **Routing Case Memory Gate Hardening** [DONE]:
  - `apps/api/package.json` script `test:routing:techmaps` СЂР°СЃС€РёСЂРµРЅ: С‚РµРїРµСЂСЊ РѕРЅ РїСЂРѕРіРѕРЅСЏРµС‚ РЅРµ С‚РѕР»СЊРєРѕ `semantic-router.eval.spec.ts`, РЅРѕ Рё `semantic-router.service.spec.ts` + `routing-case-memory.service.spec.ts`.
  - Р’ `semantic-router.service.spec.ts` РґРѕР±Р°РІР»РµРЅ negative guard: case memory РЅРµ РёРјРµРµС‚ РїСЂР°РІР° РїРѕРґРЅРёРјР°С‚СЊ `write`-РјР°СЂС€СЂСѓС‚ РёР· `abstain` РґР°Р¶Рµ РїСЂРё РІС‹СЃРѕРєРѕРј similarity.
  - `.github/workflows/invariant-gates.yml` РѕР±РЅРѕРІР»С‘РЅ: hard-fail С€Р°Рі С‚РµРїРµСЂСЊ С‡РµСЃС‚РЅРѕ РїСЂРѕРІРµСЂСЏРµС‚ `Routing techmaps + case memory gate`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm gate:routing:techmaps` Рё `pnpm --filter api exec tsc --noEmit --pretty false`.
5. **Routing Learning Layer вЂ” Second Slice `agro.deviations.review`** [DONE]:
  - Р’ `SemanticRouterService` РІРІРµРґС‘РЅ РѕС‚РґРµР»СЊРЅС‹Р№ `sliceId` `agro.deviations.review`; primary promotion СЂР°Р·СЂРµС€Р°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РІРЅСѓС‚СЂРё `deviations`-РєРѕРЅС‚СѓСЂР° Рё Р±РѕР»СЊС€Рµ РЅРµ РїРµСЂРµС…РІР°С‚С‹РІР°РµС‚СЃСЏ `techmaps` С‡РµСЂРµР· РѕР±С‰РёР№ `field`-СЃРёРіРЅР°Р».
  - `collectToolIdentifiers()` С‚РµРїРµСЂСЊ СѓС‡РёС‚С‹РІР°РµС‚ `ComputeDeviations`, Р° `RoutingCaseMemoryService.inferSliceId()` РїРѕРЅРёРјР°РµС‚ `/consulting/deviations`, РїРѕСЌС‚РѕРјСѓ versioning Рё retrieval РЅРµ СЃРјРµС€РёРІР°СЋС‚ `techmaps` Рё `deviations`.
  - `AgentExecutionAdapterService` РёСЃРїСЂР°РІР»РµРЅ: РїСЂРё `request.semanticRouting.source === primary` agronomist-РїСѓС‚СЊ Р±РѕР»СЊС€Рµ РЅРµ Р·Р°С‚РёСЂР°РµС‚ `executionPath` РІ `tool_call_primary`; С‚РµРїРµСЂСЊ РґР»СЏ `compute_deviations` С‡РµСЃС‚РЅРѕ РІРѕР·РІСЂР°С‰Р°РµС‚СЃСЏ `semantic_router_primary`.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»РѕРј `deviations-routing-eval-corpus.json` СЃ РїРѕР·РёС‚РёРІРЅС‹РјРё primary-РєРµР№СЃР°РјРё Рё РЅРµРіР°С‚РёРІРЅС‹Рј РєРµР№СЃРѕРј РІРЅРµ bounded slice.
  - Р’РІРµРґС‘РЅ РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ gate `pnpm gate:routing:agro-slices`; СЃС‚Р°СЂС‹Р№ `pnpm gate:routing:techmaps` СЃРѕС…СЂР°РЅС‘РЅ РєР°Рє compatibility alias. CI-С€Р°Рі РІ `.github/workflows/invariant-gates.yml` РїРµСЂРµРІРµРґС‘РЅ РЅР° РЅРѕРІС‹Р№ gate.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm gate:routing:agro-slices` Рё `pnpm --filter api exec tsc --noEmit --pretty false`.
6. **Routing Learning Layer вЂ” Third Slice `finance.plan-fact.read`** [DONE]:
  - `RoutingEntity` СЂР°СЃС€РёСЂРµРЅ Р·РЅР°С‡РµРЅРёРµРј `plan_fact`, Р° `SemanticRouterService` РїРѕР»СѓС‡РёР» РѕС‚РґРµР»СЊРЅС‹Р№ bounded slice `finance.plan-fact.read`.
  - Primary promotion РґР»СЏ `compute_plan_fact` РѕРіСЂР°РЅРёС‡РµРЅ `workspaceRoute` РІРёРґР° `/consulting/yield` Рё `/finance`; РІРЅРµ СЌС‚РѕРіРѕ РєРѕРЅС‚СѓСЂР° Р·Р°РїСЂРѕСЃС‹ РѕСЃС‚Р°СЋС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ `shadow`.
  - Р’ `yield`-РєРѕРЅС‚СѓСЂРµ `selectedRowSummary.kind = yield` С‚РµРїРµСЂСЊ РјР°РїРїРёС‚СЃСЏ РІ `planId`, РїРѕСЌС‚РѕРјСѓ `compute_plan_fact` РјРѕР¶РµС‚ РёРґС‚Рё РІ `execute` Р±РµР· РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ РґРѕР±РѕСЂР° РєРѕРЅС‚РµРєСЃС‚Р°.
  - Р•СЃР»Рё РЅРµС‚ РЅРё `planId`, РЅРё `seasonId`, semantic-router С‡РµСЃС‚РЅРѕ РѕС‚РґР°С‘С‚ `clarify` Рё `requiredContextMissing = [seasonId]` РІРјРµСЃС‚Рѕ silent fallback.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»РѕРј `plan-fact-routing-eval-corpus.json`; РѕР±С‰РёР№ gate РїРµСЂРµРёРјРµРЅРѕРІР°РЅ РІ `pnpm gate:routing:primary-slices`, Р° СЃС‚Р°СЂС‹Рµ `pnpm gate:routing:agro-slices` Рё `pnpm gate:routing:techmaps` СЃРѕС…СЂР°РЅРµРЅС‹ РєР°Рє Р°Р»РёР°СЃС‹.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm gate:routing:primary-slices`, `pnpm gate:routing:techmaps` Рё `pnpm --filter api exec tsc --noEmit --pretty false`.
7. **Routing Learning Layer вЂ” Fourth Slice `finance.scenario.analysis` + `finance.risk.analysis`** [DONE]:
  - `RoutingEntity` СЂР°СЃС€РёСЂРµРЅ Р·РЅР°С‡РµРЅРёСЏРјРё `scenario` Рё `risk_assessment`; `SemanticRouterService` С‚РµРїРµСЂСЊ СЂР°Р·Р»РёС‡Р°РµС‚ `simulate_scenario`, `compute_risk_assessment` Рё `compute_plan_fact` РєР°Рє СЂР°Р·РЅС‹Рµ finance-СЃСѓС‰РЅРѕСЃС‚Рё.
  - Р’ `SemanticRouterService` РґРѕР±Р°РІР»РµРЅС‹ РѕС‚РґРµР»СЊРЅС‹Рµ bounded slice `finance.scenario.analysis` Рё `finance.risk.analysis`: primary promotion СЂР°Р·СЂРµС€С‘РЅ С‚РѕР»СЊРєРѕ РІ `yield/finance`-РєРѕРЅС‚СѓСЂРµ, Р° РІРЅРµ РЅРµРіРѕ СЃРѕС…СЂР°РЅС‘РЅ `shadow` РїРѕ СЏРІРЅС‹Рј finance-СЃРёРіРЅР°Р»Р°Рј.
  - `RoutingCaseMemoryService.inferSliceId()` С‚РµРїРµСЂСЊ РїРѕРЅРёРјР°РµС‚ `scenario/risk` СЃРёРіРЅР°Р»С‹ РЅР° `yield/finance`-РјР°СЂС€СЂСѓС‚Р°С…, РїРѕСЌС‚РѕРјСѓ retrieval РЅРµ СЃРјРµС€РёРІР°РµС‚ РЅРѕРІС‹Рµ finance-slice СЃ `plan-fact`.
  - `AgentExecutionAdapterService` РїРѕР»СѓС‡РёР» СЏРІРЅС‹Р№ `resolveEconomistIntent()`: primary semantic-routing Р±РѕР»СЊС€Рµ РЅРµ Р·Р°С‚РёСЂР°РµС‚СЃСЏ РІ `compute_plan_fact`, РµСЃР»Рё РІС‹Р±СЂР°РЅ `simulate_scenario` РёР»Рё `compute_risk_assessment`.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»Р°РјРё `scenario-routing-eval-corpus.json` Рё `risk-routing-eval-corpus.json`; `semantic-router.service.spec.ts` Рё `agent-execution-adapter.service.spec.ts` СѓСЃРёР»РµРЅС‹ primary-РєРµР№СЃР°РјРё РґР»СЏ РѕР±РѕРёС… РЅРѕРІС‹С… slice.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` Рё `pnpm gate:routing:primary-slices`.
8. **Routing Learning Layer вЂ” CRM Slice `crm.account.workspace-review`** [DONE]:
  - `RoutingEntity` СЂР°СЃС€РёСЂРµРЅ Р·РЅР°С‡РµРЅРёРµРј `account`; `SemanticRouterService` РїРѕР»СѓС‡РёР» РЅРѕРІС‹Р№ bounded read-only slice `crm.account.workspace-review`.
  - Slice Р°РєС‚РёРІРёСЂСѓРµС‚СЃСЏ РєР°Рє `primary` С‚РѕР»СЊРєРѕ РЅР° `route-space` `/parties | /consulting/crm | /crm`, РЅРѕ РїСЂРё СЏРІРЅРѕРј СЃРёР»СЊРЅРѕРј CRM-СЃРёРіРЅР°Р»Рµ РѕСЃС‚Р°С‘С‚СЃСЏ `shadow` Рё РІРЅРµ bounded route-space.
  - Р’ `semantic-router` СЂРµР°Р»РёР·РѕРІР°РЅ С‡РµСЃС‚РЅС‹Р№ РєРѕРЅС‚СЂР°РєС‚ `accountId/query -> execute`, Р° РїСЂРё РїСѓСЃС‚РѕРј С‚Р°СЂРіРµС‚Рµ `review_account_workspace` СѓС…РѕРґРёС‚ РІ `clarify`, Р° РЅРµ РІ silent fallback.
  - Р—Р°РєСЂС‹С‚ runtime-gap: `CrmAgentInput` РїРѕР»СѓС‡РёР» `query`, `CrmAgent` РїРµСЂРµСЃС‚Р°Р» С‚СЂРµР±РѕРІР°С‚СЊ С‚РѕР»СЊРєРѕ `accountId` РґР»СЏ `review_account_workspace`, Р° `AgentExecutionAdapterService` РЅР°С‡Р°Р» РёР·РІР»РµРєР°С‚СЊ Рё РїСЂРѕРєРёРґС‹РІР°С‚СЊ `query` С‡РµСЂРµР· `extractCrmWorkspaceQuery(...)`.
  - `RoutingCaseMemoryService.inferSliceId()` С‚РµРїРµСЂСЊ СЂР°Р·Р»РёС‡Р°РµС‚ CRM workspace slice РЅР° `route-space` `/parties | /consulting/crm | /crm` Рё РЅРµ СЃРјРµС€РёРІР°РµС‚ РµРіРѕ СЃ finance/agro memory retrieval.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»РѕРј `crm-workspace-routing-eval-corpus.json`; `semantic-router.service.spec.ts`, `agent-execution-adapter.service.spec.ts` Рё `crm-agent.service.spec.ts` СѓСЃРёР»РµРЅС‹ РєРµР№СЃР°РјРё `selected account`, `director question`, `clarify`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/agents/crm-agent.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` Рё `pnpm gate:routing:primary-slices`.
9. **Routing Learning Layer вЂ” Contracts Slice `contracts.registry-review`** [DONE]:
  - Р’ `SemanticRouterService` РґРѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ bounded read-only slice `contracts.registry-review`; primary promotion РѕРіСЂР°РЅРёС‡РµРЅ route-space `/commerce/contracts`.
  - Р’РЅСѓС‚СЂРё slice semantic-router С‚РµРїРµСЂСЊ СЂР°Р·Р»РёС‡Р°РµС‚ `list_commerce_contracts` Рё `review_commerce_contract`, Р° generic singular-Р·Р°РїСЂРѕСЃ Р±РµР· С‚Р°СЂРіРµС‚Р° С‡РµСЃС‚РЅРѕ СѓС…РѕРґРёС‚ РІ `clarify`.
  - `ContractsAgentInput` СЂР°СЃС€РёСЂРµРЅ РїРѕР»РµРј `query`; read-only РєРѕРЅС‚СѓСЂ `GetCommerceContract` Рё РµРіРѕ Joi-schema С‚РµРїРµСЂСЊ РїСЂРёРЅРёРјР°СЋС‚ `contractId` РёР»Рё `query`.
  - `ContractsToolsRegistry` РїРѕР»СѓС‡РёР» safe lookup РїРѕ `contractId / number / quoted query / party name`, РЅРµ Р·Р°С‚СЂР°РіРёРІР°СЏ write-path Рё РЅРµ РІРІРѕРґСЏ РЅРѕРІС‹Р№ store.
  - `AgentExecutionAdapterService` С‚РµРїРµСЂСЊ Р±РµСЂРµС‚ contracts-intent СЃРЅР°С‡Р°Р»Р° РёР· primary semantic-routing Рё СЂРµР°Р»СЊРЅРѕ РїСЂРѕРєРёРґС‹РІР°РµС‚ `query` РґР»СЏ review-Р·Р°РїСЂРѕСЃРѕРІ РїРѕ РЅРѕРјРµСЂСѓ РґРѕРіРѕРІРѕСЂР°.
  - РСЃРїСЂР°РІР»РµРЅР° СЌРІСЂРёСЃС‚РёС‡РµСЃРєР°СЏ РєРѕР»Р»РёР·РёСЏ: `detectContractsIntent()` Р±РѕР»СЊС€Рµ РЅРµ РІР°Р»РёС‚ С„СЂР°Р·С‹ РІРёРґР° `РїРѕРєР°Р¶Рё РґРѕРіРѕРІРѕСЂ DOG-001` РІ `list_commerce_contracts`.
  - Р—Р°РєСЂС‹С‚ РјРµР¶РґРѕРјРµРЅРЅС‹Р№ РєРѕРЅС„Р»РёРєС‚ `CRM vs Contracts`: `isCrmWorkspaceReviewQuery()` Р±РѕР»СЊС€Рµ РЅРµ Р°РєС‚РёРІРёСЂСѓРµС‚СЃСЏ РЅР° generic `РєР°СЂС‚РѕС‡РєР° РґРѕРіРѕРІРѕСЂР°` РІРЅРµ CRM-route, РїРѕСЌС‚РѕРјСѓ `contracts`-slice РЅРµ РїРµСЂРµС…РІР°С‚С‹РІР°РµС‚СЃСЏ CRM read-only РІРµС‚РєРѕР№.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»РѕРј `contracts-routing-eval-corpus.json`; РѕР±С‰РёР№ `pnpm gate:routing:primary-slices` С‚РµРїРµСЂСЊ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ СѓР¶Рµ СЃРµРјСЊ bounded slice.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/shared/rai-chat/execution-adapter-heuristics.spec.ts src/modules/rai-chat/agents/contracts-agent.service.spec.ts`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` Рё `pnpm gate:routing:primary-slices`.
10. **Routing Learning Layer вЂ” Knowledge Slice `knowledge.base.query`** [DONE]:
  - Р’ `SemanticRouterService` РґРѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ bounded read-only slice `knowledge.base.query`; primary promotion СЂР°Р·СЂРµС€С‘РЅ С‚РѕР»СЊРєРѕ РІРЅСѓС‚СЂРё route-space `/knowledge*`.
  - Р’ knowledge-РєРѕРЅС‚СѓСЂРµ semantic-router С‚СЂР°РєС‚СѓРµС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєСѓСЋ СЂРµРїР»РёРєСѓ РєР°Рє Р±РµР·РѕРїР°СЃРЅС‹Р№ `query_knowledge`, РЅРµ СЃРѕР·РґР°РІР°СЏ РѕС‚РґРµР»СЊРЅС‹Р№ write-path Рё РЅРµ СЂР°СЃС€РёСЂСЏСЏ tool-surface beyond `QueryKnowledge`.
  - Route-priority Р·Р°РєСЂРµРїР»С‘РЅ РІС‹С€Рµ phrase-bound СЌРІСЂРёСЃС‚РёРє: РІРЅСѓС‚СЂРё `/knowledge/base` Р·Р°РїСЂРѕСЃ `РєР°Рє СЃРѕСЃС‚Р°РІРёС‚СЊ С‚РµС…РєР°СЂС‚Сѓ РїРѕ СЂР°РїСЃСѓ` СѓС…РѕРґРёС‚ РІ `query_knowledge`, Р° РЅРµ РІ `tech_map_draft`.
  - Р’РЅРµ `/knowledge*` semantic-router РЅРµ РїРµСЂРµС…РІР°С‚С‹РІР°РµС‚ knowledge-Р·Р°РїСЂРѕСЃС‹ РІ `primary`; СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ Р±РµР·РѕРїР°СЃРЅС‹Р№ `shadow`, С‡С‚Рѕ РЅРµ РґР°С‘С‚ knowledge-СЃСЂРµР·Сѓ СЂР°СЃРїРѕР»Р·С‚РёСЃСЊ РІ РјРµР¶РґРѕРјРµРЅРЅС‹Р№ С€СѓРј.
  - `collectToolIdentifiers()`, `buildDialogState()`, `resolveIntentFromCaseMemory()` Рё `resolveCaseMemoryCandidateLabel()` СЂР°СЃС€РёСЂРµРЅС‹ knowledge-СЃРµРјР°РЅС‚РёРєРѕР№; `RoutingCaseMemoryService.inferSliceId()` С‚РµРїРµСЂСЊ СЂР°Р·Р»РёС‡Р°РµС‚ `/knowledge`.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»РѕРј `knowledge-routing-eval-corpus.json`; `semantic-router.service.spec.ts` Рё `agent-execution-adapter.service.spec.ts` СѓСЃРёР»РµРЅС‹ primary-РєРµР№СЃР°РјРё РґР»СЏ `query_knowledge`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts` Рё `pnpm gate:routing:primary-slices`.
11. **Routing Learning Layer вЂ” CRM INN Lookup Slice `crm.counterparty.lookup`** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ bounded read-only slice `crm.counterparty.lookup` РґР»СЏ РёРЅС‚РµРЅС‚Р° `lookup_counterparty_by_inn` СЃ primary promotion С‚РѕР»СЊРєРѕ РІ CRM route-space (`/parties | /consulting/crm | /crm`).
  - `SemanticRouterService` С‚РµРїРµСЂСЊ СЂР°Р·Р»РёС‡Р°РµС‚ РґРІР° CRM read-only РєРѕРЅС‚СѓСЂР°: `crm.account.workspace-review` Рё `crm.counterparty.lookup`, РІРєР»СЋС‡Р°СЏ deterministic `clarify` РїСЂРё С„СЂР°Р·Рµ `РїРѕ РРќРќ` Р±РµР· РЅРѕРјРµСЂР°.
  - `execution-adapter-heuristics.ts` СЂР°СЃС€РёСЂРµРЅ mapping-Р»РѕРіРёРєРѕР№: `LookupCounterpartyByInn -> lookup_counterparty_by_inn`, fallback-РёР·РІР»РµС‡РµРЅРёРµ РРќРќ Рё tool mapping РЅР° `RaiToolName.LookupCounterpartyByInn`.
  - `AgentExecutionAdapterService` РїРѕР»СѓС‡РёР» РїСЂРёРѕСЂРёС‚РµС‚РЅС‹Р№ `resolveCrmIntent()` СЃ РїРѕСЂСЏРґРєРѕРј `explicit tool call -> semantic eligible tools -> semantic slice -> fallback`, Р° С‚Р°РєР¶Рµ fallback-РґРѕР±РѕСЂ `inn` РёР· С‚РµРєСЃС‚Р° Р·Р°РїСЂРѕСЃР°.
  - `CrmAgent` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹Рј intent `lookup_counterparty_by_inn` СЃ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј `inn`, РІС‹Р·РѕРІРѕРј registry tool `lookup_counterparty_by_inn` Рё РѕС‚РґРµР»СЊРЅС‹Рј explain/evidence path.
  - `RoutingCaseMemoryService.inferSliceId()` СѓРјРµРµС‚ РІС‹РґРµР»СЏС‚СЊ `crm.counterparty.lookup`, РЅРµ СЃРјРµС€РёРІР°СЏ РµРіРѕ СЃ `crm.account.workspace-review`.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»РѕРј `crm-inn-lookup-routing-eval-corpus.json`; РґРѕР±Р°РІР»РµРЅС‹/РѕР±РЅРѕРІР»РµРЅС‹ unit-tests РІ `semantic-router.service.spec.ts`, `agent-execution-adapter.service.spec.ts`, `crm-agent.service.spec.ts`, `execution-adapter-heuristics.spec.ts`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/shared/rai-chat/execution-adapter-heuristics.spec.ts src/modules/rai-chat/agents/crm-agent.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.eval.spec.ts` Рё `pnpm gate:routing:primary-slices`.
12. **Routing Learning Layer вЂ” Contracts AR Slice `contracts.ar-balance.review`** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅ РЅРѕРІС‹Р№ bounded read-only slice `contracts.ar-balance.review` РґР»СЏ РёРЅС‚РµРЅС‚Р° `review_ar_balance` СЃ primary promotion С‚РѕР»СЊРєРѕ РІ contracts route-space (`/commerce/contracts`).
  - `SemanticRouterService` С‚РµРїРµСЂСЊ СЂР°Р·РґРµР»СЏРµС‚ РєРѕРЅС‚СѓСЂС‹ `contracts.registry-review` Рё `contracts.ar-balance.review`, С‡С‚РѕР±С‹ Р·Р°РїСЂРѕСЃС‹ РїРѕ РґРµР±РёС‚РѕСЂРєРµ РЅРµ СЃРјРµС€РёРІР°Р»РёСЃСЊ СЃ СЂРµРµСЃС‚СЂРѕРј/РєР°СЂС‚РѕС‡РєРѕР№ РґРѕРіРѕРІРѕСЂР°.
  - Р”Р»СЏ `review_ar_balance` РІРІРµРґС‘РЅ deterministic РєРѕРЅС‚СЂР°РєС‚: `execute` РїСЂРё РЅР°Р»РёС‡РёРё `invoiceId`, `clarify` СЃ `requiredContextMissing = [invoiceId]` РїСЂРё РµРіРѕ РѕС‚СЃСѓС‚СЃС‚РІРёРё.
  - Р”РѕР±Р°РІР»РµРЅ `invoiceId` resolver РґР»СЏ workspace/context path (`selectedRowSummary`, `activeEntityRefs`, `filters`) Рё bounded message-parse (`INV/INVOICE` С€Р°Р±Р»РѕРЅ) Р±РµР· write-СЌСЃРєР°Р»Р°С†РёРё.
  - `RoutingCaseMemoryService.inferSliceId()` СЂР°СЃС€РёСЂРµРЅ РЅРѕРІС‹Рј slice, С‡С‚РѕР±С‹ case-memory retrieval РЅРµ СЃРјРµС€РёРІР°Р» AR-РєРµР№СЃС‹ СЃ `contracts.registry-review`.
  - `AgentExecutionAdapterService.resolveContractsIntent()` С‚РµРїРµСЂСЊ РїСЂРёРѕСЂРёС‚РµС‚РЅРѕ СѓС‡РёС‚С‹РІР°РµС‚ `semanticRouting.routeDecision.eligibleTools` Рё `sliceId` РґР»СЏ `GetArBalance -> review_ar_balance`.
  - Fixture-driven eval corpus СЂР°СЃС€РёСЂРµРЅ С„Р°Р№Р»РѕРј `contracts-ar-balance-routing-eval-corpus.json`; РѕР±РЅРѕРІР»РµРЅС‹ unit-tests РІ `semantic-router.service.spec.ts` Рё `agent-execution-adapter.service.spec.ts`.
  - РџРѕРґС‚РІРµСЂР¶РґРµРЅС‹ `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter api exec jest --runInBand src/modules/rai-chat/semantic-router/semantic-router.service.spec.ts src/modules/rai-chat/runtime/agent-execution-adapter.service.spec.ts src/modules/rai-chat/semantic-router/semantic-router.eval.spec.ts` Рё `pnpm gate:routing:primary-slices`.

## 2026-03-16

1. **A-RAI Director Answer Window UX** [DONE]:
  - `review_account_workspace` РґР»СЏ РІРѕРїСЂРѕСЃР° `РљР°Рє Р·РѕРІСѓС‚ РґРёСЂРµРєС‚РѕСЂР° <РєРѕРЅС‚СЂР°РіРµРЅС‚>?` РїРµСЂРµРІРµРґС‘РЅ РЅР° РѕС‚РґРµР»СЊРЅС‹Р№ compact-presenter: РІ structured result Р±РѕР»СЊС€Рµ РЅРµ РІС‹РІРѕРґРёС‚СЃСЏ `РРќРќ`, РІРјРµСЃС‚Рѕ СЌС‚РѕРіРѕ РїРѕРєР°Р·С‹РІР°СЋС‚СЃСЏ `Р¤РРћ`, `С‚РµР»РµС„РѕРЅ`, `email`.
  - `StructuredResultWindow` РїРѕР»СѓС‡РёР» Р°РґР°РїС‚РёРІРЅС‹Р№ compact shell РґР»СЏ РєРѕСЂРѕС‚РєРёС… С„Р°РєС‚-РѕС‚РІРµС‚РѕРІ: С€РёСЂРёРЅР° Р±РѕР»СЊС€Рµ РЅРµ СЂР°Р·РґСѓРІР°РµС‚СЃСЏ РґРѕ full-screen, Р° РІС‹СЃРѕС‚Р° РѕРіСЂР°РЅРёС‡РµРЅР° СЃ РІРЅСѓС‚СЂРµРЅРЅРёРј scroll С‚РѕР»СЊРєРѕ РїСЂРё РґР»РёРЅРЅРѕРј РєРѕРЅС‚РµРЅС‚Рµ.
  - РўР°СЂРіРµС‚РёСЂРѕРІР°РЅРЅС‹Рµ РїСЂРѕРІРµСЂРєРё: `apps/api response-composer.service.spec.ts` PASS, `apps/web structured-result-window.spec.tsx` PASS.
  - `rai-api` Рё `rai-web` РїРµСЂРµР·Р°РїСѓС‰РµРЅС‹, С‡С‚РѕР±С‹ РЅРѕРІС‹Р№ UX СЃСЂР°Р·Сѓ РїРѕС€С‘Р» РІ live runtime.
2. **Party/Account Projection Spine** [DONE]:
  - Р—Р°РєСЂС‹С‚ СЃРёСЃС‚РµРјРЅС‹Р№ drift РјРµР¶РґСѓ `Party` Рё CRM `Account` Р±РµР· РІРІРѕРґР° hard Prisma relation: РІ `accounts` РґРѕР±Р°РІР»РµРЅ soft-link `partyId` Рё РёРЅРґРµРєСЃ `[companyId, partyId]`.
  - `PartyService` С‚РµРїРµСЂСЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїСЂРѕРµС†РёСЂСѓРµС‚ `Party -> Account` Рё `Party -> CRM Contact` РїСЂРё СЃРѕР·РґР°РЅРёРё/РѕР±РЅРѕРІР»РµРЅРёРё РєРѕРЅС‚СЂР°РіРµРЅС‚Р°; РґРёСЂРµРєС‚РѕСЂ РёР· `registrationData.meta.managerName` РїРѕРїР°РґР°РµС‚ РІ CRM РєР°Рє `DECISION_MAKER`.
  - `CrmService` РїРµСЂРµРІРµРґС‘РЅ РЅР° РїСЂСЏРјРѕР№ `partyId`-СЂРµР·РѕР»РІРёРЅРі РІ workspace/create-flow, Р° `updateAccountProfile` РїРёС€РµС‚ master-РїРѕР»СЏ РѕР±СЂР°С‚РЅРѕ РІ `Party` (`shortName/inn/jurisdiction`).
  - `FrontOfficeAuthService.resolveAccount()` С‚РµРїРµСЂСЊ СЃРЅР°С‡Р°Р»Р° РёС‰РµС‚ Р°РєРєР°СѓРЅС‚ РїРѕ `partyId`, Р° РЅРµ РїРѕ СЌРІСЂРёСЃС‚РёРєРµ РёРјРµРЅРё/РРќРќ.
  - РџСЂРёРјРµРЅС‘РЅ manual migration `packages/prisma-client/migrations/20260316100000_account_party_projection_soft_link/migration.sql`, Р·Р°С‚РµРј РІС‹РїРѕР»РЅРµРЅ backfill `scripts/db/backfill-account-party-projection.ts` СЃ РёС‚РѕРіРѕРј `parties=5 / createdAccounts=1 / updatedAccounts=4 / syncedContacts=2`.
  - Live smoke С‡РµСЂРµР· `POST /api/rai/chat` РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ РЅРѕРІРѕРµ РїРѕРІРµРґРµРЅРёРµ: `РљР°Рє Р·РѕРІСѓС‚ РґРёСЂРµРєС‚РѕСЂР° РЎС‹СЃРѕРё?` -> `Р”РёСЂРµРєС‚РѕСЂ РћРћРћ "РЎР«РЎРћР" вЂ” Р•РІРґРѕРєСѓС€РёРЅ РџРµС‚СЂ РњРёС…Р°Р№Р»РѕРІРёС‡.`
3. **Git Push / Manual Repo Sync** [DONE]:
  - РЈСЃРїРµС€РЅРѕ РІС‹РїРѕР»РЅРµРЅР° СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ СЃ СѓРґР°Р»РµРЅРЅС‹Рј СЂРµРїРѕР·РёС‚РѕСЂРёРµРј (`git push origin main`).
  - Р—Р°РїСѓС€РµРЅС‹ РёР·РјРµРЅРµРЅРёСЏ РїРѕ Front Office, Agent Runtime UI Рё РїР»Р°РЅР°Рј РёРЅС‚РµРіСЂР°С†РёРё (PWA, Telegram).
4. **DB Refactor Program вЂ” FrontOffice Wave Closeout Packet** [DONE]:
  - РџРѕРґРіРѕС‚РѕРІР»РµРЅ С„РёРЅР°Р»СЊРЅС‹Р№ closeout-РґРѕРє `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_WAVE_CLOSEOUT.md`.
  - Р’ РґРѕРєСѓРјРµРЅС‚ Р·Р°СЂР°РЅРµРµ РѕС‚РєСЂС‹С‚С‹ 5 РѕР±СЏР·Р°С‚РµР»СЊРЅС‹С… СЃРµРєС†РёР№: `final observation verdict`, `incidents / regressions summary`, `rollback usage summary`, `lessons learned`, `reusable pattern for next wave`.
  - `DB_PHASE_7_STATUS.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md`, `DB_FRONT_OFFICE_OBSERVATION_24H.md` Рё memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РЅР° СЃС‚Р°С‚СѓСЃ: `Phase 7 Wave 1: end-to-end packet complete, awaiting formal closeout after 24h live observation.`
5. **DB Refactor Program вЂ” FrontOffice 24H Observation Packet** [DONE]:
  - Р’С‹РїСѓС‰РµРЅ РѕС‚СЃСѓС‚СЃС‚РІРѕРІР°РІС€РёР№ РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ cutover runbook `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_TENANT_WAVE_CUTOVER.md`; С‚РµРїРµСЂСЊ Phase 7 РїР°РєРµС‚ РЅР° РґРёСЃРєРµ РєРѕРЅСЃРёСЃС‚РµРЅС‚РµРЅ СЃРѕ status-С„Р°Р№Р»Р°РјРё.
  - Р”РѕР±Р°РІР»РµРЅ РѕС‚РґРµР»СЊРЅС‹Р№ live-window Р°СЂС‚РµС„Р°РєС‚ `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_OBSERVATION_24H.md`.
  - Р’ observation-doc Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹: С‚РѕС‡РЅРѕРµ РІСЂРµРјСЏ СЃС‚Р°СЂС‚Р° РѕРєРЅР°, СЃРѕСЃС‚РѕСЏРЅРёРµ С„Р»Р°РіРѕРІ, API restart marker, Р¶СѓСЂРЅР°Р» РѕС€РёР±РѕРє/РёСЃРєР»СЋС‡РµРЅРёР№ РїРѕ front-office РјР°СЂС€СЂСѓС‚Р°Рј, mismatch/drift counters, rollback triggers Рё С„РёРЅР°Р»СЊРЅС‹Р№ СЃС‚Р°С‚СѓСЃРЅС‹Р№ СЃР»РѕС‚ `PASS | PASS WITH NOTES | FAIL`.
  - `DB_PHASE_7_STATUS.md`, `DB_FRONT_OFFICE_TENANT_WAVE_1.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md` Рё memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РЅР° СЃС‚Р°С‚СѓСЃ: `FrontOfficeThread wave: cutover and rollback proven; pending final 24h live observation confirmation.`
6. **DB Refactor Program вЂ” Phase 7 FrontOfficeThread Cutover Packet** [DONE]:
  - Р’С‹РїСѓС‰РµРЅ cutover runbook `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_TENANT_WAVE_CUTOVER.md` СЃ `prechecks`, `freeze conditions`, `flag strategy`, `shadow-read compare rules`, `mismatch thresholds`, `rollback trigger` Рё `post-cutover observation window`.
  - Р”РѕР±Р°РІР»РµРЅ `TenantIdentityResolverService`: auth boundary С‚РµРїРµСЂСЊ СЂРµР·РѕР»РІРёС‚ СЂРµР°Р»СЊРЅС‹Р№ `tenantId` С‡РµСЂРµР· `TenantCompanyBinding/TenantState`, Р° РЅРµ СЃР»РµРїРѕ С‚Р°С‰РёС‚ `companyId` РєР°Рє surrogate tenant key.
  - `PrismaService` РїРѕР»СѓС‡РёР» selective read cutover cohort С‡РµСЂРµР· `TENANT_DUAL_KEY_ENFORCE_MODELS`, С‡С‚Рѕ РїРѕР·РІРѕР»СЏРµС‚ РїРµСЂРµРІРѕРґРёС‚СЊ РІ enforce РЅРµ РІСЃРµ dual-key РјРѕРґРµР»Рё СЃСЂР°Р·Сѓ, Р° С‚РѕР»СЊРєРѕ `FrontOfficeThread` family.
  - Р”РѕР±Р°РІР»РµРЅ compare-script `scripts/db/front-office-shadow-read-compare.cjs`; `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_SHADOW_COMPARE.md` РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ parity `threads/messages/handoffs/participant_states` РјРµР¶РґСѓ legacy Рё dual-key path (`0` mismatch).
  - Р”РѕР±Р°РІР»РµРЅ runtime smoke drill `scripts/db/front-office-cutover-drill.ts`; `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_CUTOVER_DRILL.md` РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ `cutover snapshot parity = PASS` Рё `rollback verification status = VERIFIED`.
  - РўР°СЂРіРµС‚РёСЂРѕРІР°РЅРЅС‹Рµ РїСЂРѕРІРµСЂРєРё: `pnpm --dir apps/api exec jest --runInBand --silent src/shared/prisma/prisma-tenant-middleware.spec.ts src/shared/tenant-context/tenant-identity-resolver.service.spec.ts` PASS; `pnpm --dir apps/api exec tsc --noEmit --pretty false` PASS.
7. **Git Pull / Manual Repo Sync** [DONE]:
  - РЈСЃРїРµС€РЅРѕ РІС‹РїРѕР»РЅРµРЅР° СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ СЃ СѓРґР°Р»РµРЅРЅС‹Рј СЂРµРїРѕР·РёС‚РѕСЂРёРµРј (`git pull origin main`).
  - Р›РѕРєР°Р»СЊРЅР°СЏ РєРѕРїРёСЏ РѕР±РЅРѕРІР»РµРЅР°, РєРѕРЅС„Р»РёРєС‚РѕРІ РЅРµ РѕР±РЅР°СЂСѓР¶РµРЅРѕ.
8. **RAI_EP SWOT Analysis via Market Research** [DONE]:
  - РџСЂРѕРІРµРґРµРЅ РєРѕРЅРєСѓСЂРµРЅС‚РЅС‹Р№ SWOT-Р°РЅР°Р»РёР· СЃРёСЃС‚РµРјС‹ RAI_EP РЅР° РѕСЃРЅРѕРІРµ СЃРІРµР¶РёС… РёСЃСЃР»РµРґРѕРІР°РЅРёР№ СЂС‹РЅРєР° Р Р¤/РЎРќР“.
  - РЎС„РѕСЂРјРёСЂРѕРІР°РЅ С„Р°Р№Р» `RAI_EP_SWOT_ANALYSIS.md` РІ РїР°РїРєРµ Р°РєС‚РёРІРЅС‹С… РёСЃСЃР»РµРґРѕРІР°РЅРёР№.
  - Р’С‹СЏРІР»РµРЅС‹ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёРµ РѕРєРЅР°: Decision Support РґР»СЏ РўРћРџРѕРІ Рё РёРЅС‚РµРіСЂР°С†РёРѕРЅРЅС‹Р№ С…Р°Р± РїРѕРІРµСЂС… 1РЎ/С‚РµР»РµРјР°С‚РёРєРё.

## 2026-03-14

1. **Docs Consolidation вЂ” `ALL_DOCS` Creation** [DONE]:
  - РЎРѕР·РґР°РЅР° РґРёСЂРµРєС‚РѕСЂРёСЏ `/root/RAI_EP/ALL_DOCS` РґР»СЏ РїР»РѕСЃРєРѕРіРѕ С…СЂР°РЅРµРЅРёСЏ РІСЃРµС… РґРѕРєСѓРјРµРЅС‚РѕРІ РїСЂРѕРµРєС‚Р°.
  - Р’СЃРµ С„Р°Р№Р»С‹ РёР· `/root/RAI_EP/docs` Рё РµС‘ РїРѕРґРґРёСЂРµРєС‚РѕСЂРёР№ СЃРєРѕРїРёСЂРѕРІР°РЅС‹ РІ `/root/RAI_EP/ALL_DOCS`.
  - РСЃРїРѕР»СЊР·РѕРІР°РЅР° СЃС‚СЂР°С‚РµРіРёСЏ `--backup=numbered` РґР»СЏ РїСЂРµРґРѕС‚РІСЂР°С‰РµРЅРёСЏ РїРѕС‚РµСЂРё РґР°РЅРЅС‹С… РїСЂРё СЃРѕРІРїР°РґРµРЅРёРё РёРјРµРЅ С„Р°Р№Р»РѕРІ (СЃРѕР·РґР°РЅРѕ 628 С„Р°Р№Р»РѕРІ, РёР· РЅРёС… 24 СЃ СЃСѓС„С„РёРєСЃР°РјРё Р±СЌРєР°РїР°).
  - РЎС‚СЂСѓРєС‚СѓСЂР° РїР°РїРѕРє РІ `ALL_DOCS` РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚, РІСЃРµ С„Р°Р№Р»С‹ Р»РµР¶Р°С‚ РІ РєРѕСЂРЅРµ РґРёСЂРµРєС‚РѕСЂРёРё.
2. **DB Refactor Program вЂ” Phase 7 FrontOfficeThread Wave Bootstrap** [DONE]:
  - Р”Р»СЏ `default-rai-company` РѕС‚СЃСѓС‚СЃС‚РІРѕРІР°Р» РІРµСЃСЊ platform boundary СЃР»РѕР№ (`tenants`, `tenant_company_bindings`, `tenant_states` Р±С‹Р»Рё РїСѓСЃС‚С‹РјРё), РёР·-Р·Р° С‡РµРіРѕ wave-1 РѕСЃС‚Р°РІР°Р»Р°СЃСЊ schema-ready, РЅРѕ РЅРµ backfilled.
  - Р”РѕР±Р°РІР»РµРЅ РїРѕРІС‚РѕСЂСЏРµРјС‹Р№ bootstrap/backfill script `scripts/db/bootstrap-front-office-tenant-wave.cjs` Рё РєРѕРјР°РЅРґР° `pnpm db:front-office-wave:bootstrap`; СЃРєСЂРёРїС‚ СЃРѕР·РґР°РµС‚ `Tenant`, primary `TenantCompanyBinding`, `TenantState` Рё РїРѕРІС‚РѕСЂРЅРѕ backfill-РёС‚ `FrontOfficeThread` family.
  - РџРѕСЃР»Рµ bootstrap null-backlog СЃС…Р»РѕРїРЅСѓС‚ `1/6/1/1 -> 0/0/0/0` РґР»СЏ `threads/messages/handoffs/participant_states`.
  - РџРѕРІС‚РѕСЂРЅС‹Р№ shadow-validation СЃС„РѕСЂРјРёСЂРѕРІР°Р» `docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_TENANT_WAVE_VALIDATION.md` СЃ `0` mismatch Рё `0` null rows.
  - РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ `DB_PHASE_7_STATUS.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_CONTRACTS.md`, `DB_FRONT_OFFICE_TENANT_WAVE_1.md`, checklist Рё memory-bank.
3. **DB Refactor Program вЂ” Migration Deploy + EXPLAIN Evidence Run** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ `prisma migrate deploy` РЅР° Р‘Р” РёР· `.env`; РѕР±РЅР°СЂСѓР¶РµРЅРЅС‹Р№ migration-defect РІ `20260313214500_phase5_budget_category_literal_fix` (С‚Р°Р±Р»РёС†Р° `budget_items`) РёСЃРїСЂР°РІР»РµРЅ РЅР° `consulting_budget_items`.
  - Р’С‹РїРѕР»РЅРµРЅРѕ recovery Р±РµР· СЂР°Р·СЂСѓС€РµРЅРёСЏ history: `prisma migrate resolve --rolled-back 20260313214500_phase5_budget_category_literal_fix` + РїРѕРІС‚РѕСЂРЅС‹Р№ `migrate deploy` (СѓСЃРїРµС€РЅРѕ).
  - Р”РѕР±Р°РІР»РµРЅ Р°РІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°РЅРЅС‹Р№ evidence-script `scripts/db/explain-hot-paths.cjs` Рё РєРѕРјР°РЅРґР° `pnpm db:explain:hot`.
  - РЎС„РѕСЂРјРёСЂРѕРІР°РЅ РѕС‚С‡РµС‚ `docs/01_ARCHITECTURE/DATABASE/DB_EXPLAIN_ANALYZE_2026-03-13.md` СЃ `EXPLAIN ANALYZE` РґР»СЏ hot-path `Season/Task/HarvestPlan/Party`.
  - РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ Р·Р°РІРёСЃРёРјС‹Рµ Р°СЂС‚РµС„Р°РєС‚С‹: `DB_PHASE_6_STATUS.md`, `DB_INDEX_AUDIT.md`, memory-bank.
4. **DB Refactor Program вЂ” Index Observation Window + Growth KPI Automation** [DONE]:
  - Р—Р°РїСѓС‰РµРЅ `14-day` observation window РґР»СЏ removal-candidate РёРЅРґРµРєСЃРѕРІ, СЃС„РѕСЂРјРёСЂРѕРІР°РЅ snapshot `docs/01_ARCHITECTURE/DATABASE/DB_INDEX_OBSERVATION_WINDOW_2026-03-13.md` РЅР° РѕСЃРЅРѕРІРµ `pg_stat_user_indexes`/`pg_stat_user_tables`.
  - `DB_INDEX_EVIDENCE_REGISTER.md` РѕР±РЅРѕРІР»РµРЅ С„Р°РєС‚РёС‡РµСЃРєРёРјРё candidate-РёРЅРґРµРєСЃР°РјРё Рё СЃС‚Р°СЂС‚РѕРІС‹РјРё usage-РјРµС‚СЂРёРєР°РјРё (`idx_scan` snapshot).
  - Р’РЅРµРґСЂРµРЅ growth KPI РєРѕРЅС‚СѓСЂ: `scripts/db/init-model-growth-baseline.cjs`, `scripts/db/measure-model-growth-kpi.cjs`, baseline `DB_MODEL_GROWTH_BASELINE.json`, РѕС‚С‡РµС‚ `DB_MODEL_GROWTH_KPI.md`.
  - Р”РѕР±Р°РІР»РµРЅС‹ РєРѕРјР°РЅРґС‹: `pnpm db:index:observe`, `pnpm db:kpi:growth:baseline`, `pnpm db:kpi:growth`, `pnpm gate:db:growth-kpi:enforce`.
  - CI workflow РѕР±РЅРѕРІР»РµРЅ С€Р°РіРѕРј `DB growth KPI gate (hard fail)`; Р»РѕРєР°Р»СЊРЅС‹Рµ РїСЂРѕРіРѕРЅС‹ РЅРѕРІС‹С… РєРѕРјР°РЅРґ Рё gate вЂ” PASS.
5. **DB Refactor Program вЂ” Continuous Phase 2-8 Execution (Wave 2)** [DONE]:
  - Phase 2 de-root wave-1 РІС‹РїРѕР»РЅРµРЅ РІ `packages/prisma-client/schema.prisma`: СѓРґР°Р»РµРЅС‹ direct `Company` relations РёР· control-plane/runtime/memory РЅР°Р±РѕСЂР° (`SystemIncident`, `IncidentRunbookExecution`, `RuntimeGovernanceEvent`, `PerformanceMetric`, `PendingAction`, `AgentConfiguration`, `AgentCapabilityBinding`, `AgentToolBinding`, `AgentConnectorBinding`, `AgentConfigChangeRequest`, `EvalRun`, `KnowledgeNode`, `KnowledgeEdge`) РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё СЃРѕРІРјРµСЃС‚РёРјРѕРіРѕ `companyId` scalar path.
  - РњРµС‚СЂРёРєР° `Company` direct relations СЃРЅРёР¶РµРЅР° `140 -> 87`; РІС‹РїСѓС‰РµРЅ staged deprecation Рё compatibility plan `docs/01_ARCHITECTURE/DATABASE/DB_COMPANY_DEROOT_DEPRECATION_PLAN.md`.
  - Governance residual Р·Р°РєСЂС‹С‚: `ADR_DB_001..005` РїРµСЂРµРІРµРґРµРЅС‹ РІ `accepted`, РґРѕР±Р°РІР»РµРЅ owner-review guard `.github/CODEOWNERS`, `READ_MODEL_POLICY.md` Рё `DB_SUCCESS_METRICS.md` РїРѕРјРµС‡РµРЅС‹ РєР°Рє approved.
  - Execution artifacts РґРѕРїРѕР»РЅРµРЅС‹: `DB_INCLUDE_DEPTH_METRICS.md` (+ СЃРєСЂРёРїС‚ `scripts/measure-prisma-include-depth.cjs`), `DB_ENUM_OVERLAP_MATRIX.md`, `DB_OPERATIONAL_AGGREGATE_MIGRATION_CONTRACTS.md`, `DB_MG_CORE_DECISION_NOTE.md`.
  - Р§РµРєР»РёСЃС‚/phase-status/memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹; `DB_REFACTOR_CHECKLIST` Р·Р°РєСЂС‹С‚ РїРѕР»РЅРѕСЃС‚СЊСЋ, KPI window РїРѕ growth-safety РїРµСЂРµРІРµРґРµРЅ РІ active measurement mode.
6. **DB Refactor Program вЂ” Autonomous Phase 2-8 Execution Wave** [DONE]:
  - Phase 2: Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ baseline/target Рё core-map РґР»СЏ `Company de-rooting`; С„Р°РєС‚РёС‡РµСЃРєРёР№ relation reduction РѕСЃС‚Р°РµС‚СЃСЏ residual Рё РІС‹РЅРµСЃРµРЅ РІ `DB_PHASE_2_STATUS.md`.
  - Phase 3: РґРѕР±Р°РІР»РµРЅ schema fragmentation toolchain (`split/compose/check`), СЃРѕР·РґР°РЅС‹ `00..10` fragment-С„Р°Р№Р»С‹ РІ `packages/prisma-client/schema-fragments`, РґРѕР±Р°РІР»РµРЅ CI gate `gate:db:phase3:enforce` Рё workflow wiring.
  - Phase 4: СЃРѕР·РґР°РЅ `DB_PROJECTION_REGISTER.md`, READ_MODEL policy РґРѕРїРѕР»РЅРµРЅ `staleness_tolerance` Рё `deletion_reconciliation_semantics`, РґРѕР±Р°РІР»РµРЅ gate `gate:db:projections:enforce`.
  - Phase 5: `ENUM_DECISION_REGISTER.md` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ РЅР° РїРѕР»РЅС‹Р№ РёРЅРІРµРЅС‚Р°СЂСЊ `149` enum, РґРѕР±Р°РІР»РµРЅ gate `gate:db:enum-register:enforce`.
  - Phase 6: РІС‹РїРѕР»РЅРµРЅ workload index wave `20260313113000_phase6_workload_index_tuning` + schema updates + `DB_INDEX_EVIDENCE_REGISTER.md`, РґРѕР±Р°РІР»РµРЅ gate `gate:db:index-evidence:enforce`.
  - Phase 7: Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ operational migration policy `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md` СЃ hard guard В«РѕРґРЅР° core family Р·Р° РІРѕР»РЅСѓВ».
  - Phase 8: РІС‹РїСѓС‰РµРЅ decision record `DB_PHYSICAL_SPLIT_DECISION.md` (single physical DB retained, split only on proven bottleneck).
  - РЎС„РѕСЂРјРёСЂРѕРІР°РЅ status-packet `DB_PHASE_2_STATUS.md ... DB_PHASE_8_STATUS.md`; checklist/roadmap/metrics/memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹.
7. **DB Refactor Program вЂ” Checklist Hardening to Execution Packet** [DONE]:
  - `DB_REFACTOR_CHECKLIST` СѓСЃРёР»РµРЅ РїРѕ governance: РґРѕР±Р°РІР»РµРЅР° РєР°РЅРѕРЅРёС‡РµСЃРєР°СЏ precedence-С†РµРїРѕС‡РєР° РїСЂРё РєРѕРЅС„Р»РёРєС‚Рµ (`manifest/policy > phase status > checklist > roadmap`) Рё merge-РїСЂР°РІРёР»Рѕ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё lower-priority РґРѕРєСѓРјРµРЅС‚РѕРІ.
  - Р’ `Phase 2` Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ РёР·РјРµСЂРёРјС‹Р№ baseline/target РґР»СЏ `Company` de-rooting (`direct relations: 140 -> <=95`) Рё СЏРІРЅС‹Р№ РґРѕРїСѓСЃС‚РёРјС‹Р№ business/legal core.
  - `Phase 3` СЂР°СЃС€РёСЂРµРЅ rule-set РґР»СЏ shared primitives (`ids/timestamps`, technical enums, audit primitives, relation conventions), С‡С‚РѕР±С‹ `00_base.prisma` РЅРµ СЃС‚Р°Р» mini-god-fragment.
  - `Phase 4` metadata contract РґРѕРїРѕР»РЅРµРЅ `staleness tolerance` Рё `deletion/reconciliation semantics`.
  - `Phase 5` РґРѕР±Р°РІР»РµРЅ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ deliverable `ENUM_DECISION_REGISTER.md`; СЂРµРµСЃС‚СЂ СЃРѕР·РґР°РЅ РІ `docs/01_ARCHITECTURE/DATABASE/ENUM_DECISION_REGISTER.md`.
  - `Phase 6` С„РѕСЂРјР°Р»РёР·РѕРІР°РЅ С‡РµСЂРµР· РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Р№ index evidence contract Рё РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРµ production observation window РїРµСЂРµРґ СѓРґР°Р»РµРЅРёРµРј РёРЅРґРµРєСЃРѕРІ.
  - `Phase 7` РґРѕР±Р°РІР»РµРЅ Р¶РµСЃС‚РєРёР№ wave-limit: `Season/HarvestPlan/TechMap/Task` РЅРµР»СЊР·СЏ РјРёРіСЂРёСЂРѕРІР°С‚СЊ РїР°СЂР°Р»Р»РµР»СЊРЅРѕ Р±РѕР»РµРµ РѕРґРЅРѕР№ aggregate family Р·Р° РІРѕР»РЅСѓ.
  - Program-level metrics РїРµСЂРµРІРµРґРµРЅС‹ РІ С‡РёСЃР»РѕРІРѕР№ РІРёРґ РІ checklist Рё `DB_SUCCESS_METRICS.md` (baseline/target РґР»СЏ company relations, scope ambiguity backlog, enum taxonomy, hot query index debt, include depth, growth safety KPI).
8. **DB Refactor Program вЂ” Phase 1 Additive Tenancy Closure** [DONE]:
  - Р—Р°РєСЂС‹С‚ Phase 1 execution slice: РІ `packages/prisma-client/schema.prisma` РґРѕР±Р°РІР»РµРЅС‹ `Tenant` Рё `TenantCompanyBinding`, Р° РІ control-plane/runtime РјРѕРґРµР»Рё РґРѕР±Р°РІР»РµРЅС‹ additive `tenantId` РїРѕР»СЏ Р±РµР· destructive РёР·РјРµРЅРµРЅРёР№ core business aggregates.
  - Р”РѕР±Р°РІР»РµРЅ migration wave `packages/prisma-client/migrations/20260313103000_phase1_additive_tenant_boundary/migration.sql` (new tenant tables + additive tenant columns/indexes РґР»СЏ Phase 1 model set).
  - Runtime dual-key policy РІРЅРµРґСЂРµРЅ РІ `apps/api/src/shared/prisma/prisma.service.ts`: legacy `companyId` guard СЃРѕС…СЂР°РЅРµРЅ, РІРєР»СЋС‡РµРЅС‹ `tenantId` shadow-write/shadow-read drift detection, feature-flag fallback (`TENANT_DUAL_KEY_COMPANY_FALLBACK`) Рё optional enforce mode (`TENANT_DUAL_KEY_MODE=enforce`).
  - Auth/context contract РѕР±РЅРѕРІР»РµРЅ: `TenantScope` РЅРµСЃРµС‚ `tenantId + companyId + isSystem`, `TenantContextService` РїРѕР»СѓС‡РёР» `getTenantId()`, JWT strategy РІРѕР·РІСЂР°С‰Р°РµС‚ `tenantId`, auth token payload РІРєР»СЋС‡Р°РµС‚ compatibility `tenantId`.
  - Р”РѕР±Р°РІР»РµРЅС‹ governance artifacts `docs/01_ARCHITECTURE/DATABASE/DB_DUAL_KEY_POLICY.md` Рё `DB_TENANCY_TRANSITION_RUNTIME_POLICY.md`; manifests/checklists/status СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹, `MODEL_SCOPE_MANIFEST` РѕР±РЅРѕРІР»РµРЅ РґРѕ `195/195`.
9. **DB Refactor Program вЂ” Phase 0 Closure Discipline** [DONE]:
  - Р—Р°С„РёРєСЃРёСЂРѕРІР°РЅР° РѕР±СЏР·Р°С‚РµР»СЊРЅР°СЏ РѕРїРµСЂР°С†РёРѕРЅРЅР°СЏ РґРёСЃС†РёРїР»РёРЅР°: РїРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ Р»РѕРіРёС‡РµСЃРєРё Р·Р°РІРµСЂС€РµРЅРЅРѕРіРѕ Р±Р»РѕРєР° СЃРёРЅС…СЂРѕРЅРёР·РёСЂСѓСЋС‚СЃСЏ `DB_REFACTOR_CHECKLIST`, phase-status С„Р°Р№Р», Р·Р°РІРёСЃРёРјС‹Рµ ADR/manifest/policy/CI Р°СЂС‚РµС„Р°РєС‚С‹ Рё РѕР±Р° memory-bank С„Р°Р№Р»Р°.
  - `Phase 0` РґРѕРІРµРґРµРЅ РґРѕ engineering-finish: `gate:db:phase0:enforce` РїСЂРѕС…РѕРґРёС‚, `MODEL_SCOPE_MANIFEST` РїРѕРєСЂС‹РІР°РµС‚ `195/195` РјРѕРґРµР»РµР№, РєРѕРЅС„Р»РёРєС‚ `EventConsumption` РІ tenant/system policy СѓСЃС‚СЂР°РЅРµРЅ.
  - РћСЃС‚Р°С‚РѕРє `Phase 0` вЂ” С‚РѕР»СЊРєРѕ formal sign-off РІР»Р°РґРµР»СЊС†РµРІ РґРѕРјРµРЅРѕРІ РїРѕ ADR/policy РїР°РєРµС‚Сѓ; С‚РµС…РЅРёС‡РµСЃРєРёРµ phase-gates Р·Р°РєСЂС‹С‚С‹.
10. **AI Copilot Closeout вЂ” Telemetry + Go/No-Go Packet** [DONE]:
  - Р—Р°РєСЂС‹С‚ rollout telemetry block: РІ invariant metrics РґРѕР±Р°РІР»РµРЅС‹ `ai_memory_hint_shown_total`, `expert_review_requested_total`, `expert_review_completed_total`, `strategy_forecast_run_total`, `strategy_forecast_degraded_total`, `strategy_forecast_latency_ms`, `memory_lane_populated_total`.
  - Instrumentation РґРѕР±Р°РІР»РµРЅ РІ runtime path: `ResponseComposerService` (memory hints), `ExpertReviewService` (request/outcome), `DecisionIntelligenceService` (run/degraded/latency), `SupervisorForensicsService` (memory lane population).
  - Р Р°СЃС€РёСЂРµРЅС‹/РґРѕР±Р°РІР»РµРЅС‹ targeted tests: `invariant-metrics.controller.spec.ts`, `decision-intelligence.service.spec.ts`, `response-composer.service.spec.ts`, `expert-review.service.spec.ts`, РЅРѕРІС‹Р№ `supervisor-forensics.service.spec.ts`.
  - РЎС„РѕСЂРјРёСЂРѕРІР°РЅ release packet `docs/07_EXECUTION/AI_COPILOT_RELEASE_GO_NO_GO_2026-03-13.md`; execution plan СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ СЃСЃС‹Р»РєРѕР№ РЅР° packet.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api exec tsc --noEmit --pretty false` PASS; targeted jest suites PASS.
11. **Architecture Simplification вЂ” RaiChat File-Count Closure** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `rai-chat file-count`: СѓРґР°Р»РµРЅС‹ module-bridge С„Р°Р№Р»С‹ `agent-contracts/agent-interaction-contracts.ts`, `tools/front-office-routing.policy.ts`, `widgets/rai-chat-widgets.types.ts`.
  - РўРёРїРѕРІРѕР№ Рё error-layer РІС‹РЅРµСЃРµРЅ РІ `apps/api/src/shared/rai-chat/`*: `intent-router.types.ts`, `runtime-governance-policy.types.ts`, `explainable-result.types.ts`, `security/{agent-config-blocked,budget-exceeded,risk-policy-blocked,security-violation}.error.ts`.
  - Runtime/tools/explainability РёРјРїРѕСЂС‚С‹ РїРµСЂРµРІРµРґРµРЅС‹ РЅР° shared-path; Р·Р°РІРёСЃРёРјРѕСЃС‚СЊ shared-layer РѕС‚ `agent-registry.service` СѓСЃС‚СЂР°РЅРµРЅР° (Р»РѕРєР°Р»СЊРЅС‹Р№ `CanonicalAgentRuntimeRole` Рё `AgentRuntimeRole` С‚РµРїРµСЂСЊ С‚РёРїРёР·РёСЂРѕРІР°РЅС‹ РІ shared types).
  - РџРѕ `architecture-budget-gate` `rai-chat` СЃРЅРёР¶РµРЅ РґРѕ `28260 lines / 134 files` (Р±С‹Р»Рѕ `28472 / 144`), file-count warning СЃРЅСЏС‚.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; targeted suites PASS (`agent-interaction-contracts.spec.ts`, `tool-call.planner.spec.ts`, `front-office-routing.policy.spec.ts`, `risk-tools.registry.spec.ts`, `rai-tools.registry.spec.ts`, `work-window.factory.spec.ts`, `legacy-widget-window.mapper.spec.ts`); `pnpm gate:architecture` PASS.
12. **Decision Intelligence Bridge вЂ” `data_scientist` Runtime Consumption** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ СЃР»РµРґСѓСЋС‰РёР№ wave-5 slice: `DataScientistAgent` РїРѕР»СѓС‡РёР» intent `strategy_forecast` Рё С‚РµРїРµСЂСЊ РІС‹Р·С‹РІР°РµС‚ deterministic `DecisionIntelligenceService.runStrategyForecast(...)` РІРјРµСЃС‚Рѕ РіРµРЅРµСЂР°С†РёРё С‡РёСЃРµР» РІ chat-layer.
  - Р’ `apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts` РѕР±РЅРѕРІР»С‘РЅ intent routing: СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёРµ Р·Р°РїСЂРѕСЃС‹ (`РїСЂРѕРіРЅРѕР·/СЃС†РµРЅР°СЂРёР№/РјР°СЂР¶Р°/cash flow/СЃС‚СЂР°С‚РµРіРёСЏ`) РЅР°РїСЂР°РІР»СЏСЋС‚СЃСЏ РІ `strategy_forecast`; `what_if` Рё РґРѕРјРµРЅРЅС‹Рµ intents СЃРѕС…СЂР°РЅРµРЅС‹.
  - Р’ `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts` СЂР°СЃС€РёСЂРµРЅ payload mapping РґР»СЏ `scopeLevel/horizonDays/domains/farmId/fieldId/crop/seasonId/scenario`.
  - Р’ `apps/api/src/modules/rai-chat/rai-chat.module.ts` РїРѕРґРєР»СЋС‡С‘РЅ `OfsModule` РґР»СЏ DI-РєРѕРЅС‚СЂР°РєС‚Р° `DecisionIntelligenceService` РІ runtime-РєРѕРЅС‚СѓСЂРµ `rai-chat`.
  - Р”РѕР±Р°РІР»РµРЅ targeted suite `apps/api/src/modules/rai-chat/agents/data-scientist-agent.service.spec.ts` (validation + deterministic defaults + scope guards).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api exec tsc --noEmit --pretty false` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/agents/data-scientist-agent.service.spec.ts src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` PASS.
13. **Architecture Simplification вЂ” Consulting/Finance/Commerce File-Count Closure** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `consulting file-count`: DTO `complete-operation/create-harvest-plan/save-harvest-result/transition-plan-status/update-draft-plan` РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/consulting/dto` РІ `apps/api/src/shared/consulting/dto`.
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `commerce file-count`: DTO `create-party/create-jurisdiction/create-regulatory-profile` РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/commerce/dto` РІ `apps/api/src/shared/commerce/dto` СЃ РїРµСЂРµРІРѕРґРѕРј РёРјРїРѕСЂС‚РѕРІ controller/service/helper СЃР»РѕСЏ РЅР° shared-path.
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `finance-economy file-count`: `contracts/finance-ingest.contract.ts` Рё `finance/config/{finance-config.module,finance-config.service}.ts` РІС‹РЅРµСЃРµРЅС‹ РІ `apps/api/src/shared/finance-economy/`*; bridge `integrations/domain/finance-ingest.contract.ts` СѓРґР°Р»С‘РЅ.
  - РџРѕ `architecture-budget-gate` СЃРЅСЏС‚С‹ file-count warnings: `consulting=4613 lines / 35 files` (Р±С‹Р»Рѕ `4763 / 40`), `finance-economy=4303 lines / 37 files` (Р±С‹Р»Рѕ `4417 / 41`), `commerce=3324 lines / 31 files` (Р±С‹Р»Рѕ `3599 / 34`).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm gate:architecture` PASS; `pnpm gate:architecture:enforce` PASS; `pnpm -C apps/api build` PASS; targeted suites PASS (`finance-ingest.contract.spec.ts`, `economy.service.spec.ts`, `commerce.e2e.spec.ts`, `consulting-access.guard.spec.ts`).
  - РћС‚РґРµР»СЊРЅРѕ: legacy suite `consulting-flow.spec.ts` Рё `yield.orchestrator.spec.ts` РїРѕ-РїСЂРµР¶РЅРµРјСѓ С„РµР№Р»СЏС‚СЃСЏ РёР·-Р·Р° СЂР°РЅРµРµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµРіРѕ mock/DI drift (`harvestPlan.findFirst` Рё missing `ConsultingDomainRules` provider), РЅРµ СЃРІСЏР·Р°РЅРЅРѕРіРѕ СЃ СЌС‚РёРј boundary-СЃСЂРµР·РѕРј.
14. **Architecture Simplification вЂ” TechMap File-Count Closure** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ С‚РѕС‡РµС‡РЅС‹Р№ deep-slice `tech-map dto`: `approval.dto.ts` Рё `crop-zone.dto.ts` РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/tech-map/dto` РІ `apps/api/src/shared/tech-map/dto`.
  - РЎРїРµРєРё `approval.dto.spec.ts` Рё `crop-zone.dto.spec.ts` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° shared-path Р±РµР· РёР·РјРµРЅРµРЅРёСЏ РєРѕРЅС‚СЂР°РєС‚РѕРІ СЃС…РµРј.
  - РџРѕ `architecture-budget-gate` `tech-map` РІС‹С€РµР» РЅРёР¶Рµ file-warn: `5888 lines / 59 files` (Р±С‹Р»Рѕ `5941 / 61`).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/tech-map/dto/approval.dto.spec.ts src/modules/tech-map/dto/crop-zone.dto.spec.ts` PASS; `pnpm gate:architecture` PASS.
15. **Architecture Simplification вЂ” Explainability/Generative File-Count Closure** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `explainability`: `agent-config.dto` Рё `autonomy-status.dto` РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/explainability/dto` РІ `apps/api/src/shared/explainability` (`agent-config.dto` + `dto/autonomy-status.dto`) СЃ РїРµСЂРµРІРѕРґРѕРј runtime-imports РЅР° shared-path Рё СѓРґР°Р»РµРЅРёРµРј module-bridge.
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `generative-engine`: СѓРґР°Р»РµРЅС‹ module-bridge С„Р°Р№Р»С‹ `contradiction/counterfactual-engine.ts` Рё `contradiction/conflict-explainability-builder.ts`; `risk-metric-calculator.ts` Рё `yield/input-data-snapshot.ts` РІС‹РЅРµСЃРµРЅС‹ РІ `apps/api/src/shared/generative-engine/`*.
  - РџРѕ `architecture-budget-gate` СЃРЅСЏС‚С‹ file-count warnings РґР»СЏ РѕР±РѕРёС… hotspot-РјРѕРґСѓР»РµР№: `explainability=8089 lines / 41 files` (Р±С‹Р»Рѕ `8136 / 43`), `generative-engine=6743 lines / 69 files` (Р±С‹Р»Рѕ `6869 / 73`).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: targeted suite РїРѕ `explainability + generative-engine` PASS; `pnpm gate:architecture` PASS (`mode=warn`). `pnpm -C apps/api build` СЃРµР№С‡Р°СЃ Р±Р»РѕРєРёСЂСѓРµС‚СЃСЏ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№ РЅРµСЃРІСЏР·Р°РЅРЅРѕР№ РѕС€РёР±РєРѕР№ `TS2322` РІ `src/shared/memory/memory-facade.service.ts` (readonly `OR` РґР»СЏ `EngramWhereInput`).
16. **Architecture Simplification вЂ” Commerce Party/Asset Helper Boundaries** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `commerce`: relation/rules helper-СЃР»РѕР№ РІС‹РЅРµСЃРµРЅ РёР· `apps/api/src/modules/commerce/services/party.service.ts` РІ `apps/api/src/shared/commerce/party.helpers.ts`.
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `commerce`: asset-role mapping/overlap/type-detection helper-СЃР»РѕР№ РІС‹РЅРµСЃРµРЅ РёР· `apps/api/src/modules/commerce/services/asset-role.service.ts` РІ `apps/api/src/shared/commerce/asset-role.helpers.ts`.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `commerce` СЃРЅРёР¶РµРЅ СЃ `3726` РґРѕ `3599` СЃС‚СЂРѕРє (line-warn СЃРЅСЏС‚); РѕСЃС‚Р°С‘С‚СЃСЏ file-count debt (`34` С„Р°Р№Р»Р°).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
17. **Architecture Simplification вЂ” Finance-Economy Ingest/Types Shared Boundary** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `economy ingest`: DTO Рё replay/integrity helper-СЃР»РѕР№ РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/finance-economy/economy/application/economy.service.ts` РІ `apps/api/src/shared/finance-economy/economy-ingest.helpers.ts`.
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice `decision-intelligence types`: run/scenario/history С‚РёРїС‹ РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/finance-economy/ofs/application/decision-intelligence.service.ts` РІ `apps/api/src/shared/finance-economy/decision-intelligence.types.ts` СЃ type re-export РёР· service-С„Р°Р№Р»Р° РґР»СЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё РёРјРїРѕСЂС‚РѕРІ.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `finance-economy` СЃРЅРёР¶РµРЅ РґРѕ `4417` СЃС‚СЂРѕРє (line-warn СЃРЅСЏС‚); РѕСЃС‚Р°С‘С‚СЃСЏ file-count debt (`41` С„Р°Р№Р»).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/finance-economy/economy/application/economy.service.spec.ts` PASS; `pnpm gate:architecture` PASS.
18. **Architecture Simplification вЂ” Tranche Sync (`... + commerce`)** [DONE]:
  - РўРµРєСѓС‰РёР№ tranche РїРѕ СЃС‚СЂРѕРєРѕРІС‹Рј budget-warning СЂР°СЃС€РёСЂРµРЅ Рё Р·Р°РєСЂС‹С‚ РґР»СЏ `rai-chat + tech-map + consulting + finance-economy + commerce`.
  - РђРєС‚СѓР°Р»СЊРЅС‹Р№ snapshot: `rai-chat=28122`, `tech-map=5941`, `consulting=4763`, `finance-economy=4417`, `commerce=3599`.
  - РћСЃС‚Р°С‚РѕС‡РЅС‹Р№ СЂРёСЃРє: file-count pressure (`rai-chat/tech-map/consulting/finance-economy/commerce`) Рё РєСЂСѓРїРЅС‹Рµ hotspots `explainability/generative-engine`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/finance-economy/ofs/application/strategy-forecasts.controller.spec.ts src/modules/commerce/services/commerce.e2e.spec.ts` PASS.
19. **Architecture Simplification вЂ” Tranche Closure (`rai-chat + tech-map + consulting + finance-economy`)** [DONE]:
  - РўРµРєСѓС‰РёР№ tranche Р±Р»РѕРєР° `Module complexity` Р»РѕРіРёС‡РµСЃРєРё Р·Р°РєСЂС‹С‚ РїРѕ СЃС‚СЂРѕРєРѕРІС‹Рј budget-warning РґР»СЏ РїСЂРёРѕСЂРёС‚РµС‚РЅС‹С… РјРѕРґСѓР»РµР№: `rai-chat=28122`, `tech-map=5941`, `consulting=4763`, `finance-economy=4404`.
  - РЎС‚Р°С‚СѓСЃРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹: `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md` Рё `memory-bank/activeContext.md` РѕС‚СЂР°Р¶Р°СЋС‚ 14 РІС‹РїРѕР»РЅРµРЅРЅС‹С… deep-slice Рё СЏРІРЅС‹Р№ С„Р°РєС‚ Р»РѕРіРёС‡РµСЃРєРѕРіРѕ Р·Р°РєСЂС‹С‚РёСЏ tranche.
  - РћС‚РєСЂС‹С‚С‹Рј РѕСЃС‚Р°Р»СЃСЏ СЃС‚СЂСѓРєС‚СѓСЂРЅС‹Р№ РґРѕР»Рі СЃР»РµРґСѓСЋС‰РµР№ РІРѕР»РЅС‹: file-count pressure (`tech-map/consulting/finance-economy`) Рё РєСЂСѓРїРЅС‹Рµ hotspots (`explainability/generative-engine/commerce`).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm gate:architecture` PASS (`mode=warn`).
20. **Architecture Simplification вЂ” Finance-Economy OFS Decision Intelligence Helper Slice** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice РІ `apps/api/src/modules/finance-economy/ofs/application/decision-intelligence.service.ts`: validation/driver composition/reason mapping/lever normalization/scenario mapping РІС‹РЅРµСЃРµРЅС‹ РІ `apps/api/src/shared/finance-economy/decision-intelligence.helpers.ts`.
  - РЎРµСЂРІРёСЃ РѕСЃС‚Р°РІР»РµРЅ orchestration-oriented, helper-СЃР»РѕР№ РїРµСЂРµРёСЃРїРѕР»СЊР·СѓРµРј Рё РёР·РѕР»РёСЂРѕРІР°РЅ РІ shared boundary.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `finance-economy` СЃРЅРёР¶РµРЅ СЃ `4557` РґРѕ `4404` СЃС‚СЂРѕРє (warn-РїРѕСЂРѕРі РїРѕ СЃС‚СЂРѕРєР°Рј СЃРЅСЏС‚).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/finance-economy/ofs/application/decision-intelligence.service.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
21. **Architecture Simplification вЂ” Consulting Controller Context Slice** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ deep-slice РІ `apps/api/src/modules/consulting/consulting.controller.ts`: РїРѕРІС‚РѕСЂСЏСЋС‰Р°СЏСЃСЏ СЃР±РѕСЂРєР° `UserContext` Рё execution context СЃРІРµРґРµРЅР° Рє helper-РјРµС‚РѕРґР°Рј `toUserContext()` Рё `toExecutionContext()`.
  - РљРѕРЅС‚СЂРѕР»Р»РµСЂ СЃРѕРєСЂР°С‰С‘РЅ СЃ `467` РґРѕ `367` СЃС‚СЂРѕРє Р±РµР· РёР·РјРµРЅРµРЅРёСЏ РїСѓР±Р»РёС‡РЅРѕРіРѕ РїРѕРІРµРґРµРЅРёСЏ endpoint-РѕРІ.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `consulting` СЃРЅРёР¶РµРЅ СЃ `4863` РґРѕ `4763` СЃС‚СЂРѕРє (warn-РїРѕСЂРѕРі РїРѕ СЃС‚СЂРѕРєР°Рј СЃРЅСЏС‚).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
22. **Architecture Simplification вЂ” TechMap Prisma Include Boundary Slice** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РІС‚РѕСЂРѕР№ deep-slice `tech-map`: РїРѕРІС‚РѕСЂСЏСЋС‰РёРµСЃСЏ Prisma include-РґРµСЂРµРІСЊСЏ РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/tech-map/tech-map.service.ts` РІ `apps/api/src/shared/tech-map/tech-map-prisma-includes.ts`.
  - `TechMapService` С‚РµРїРµСЂСЊ РёСЃРїРѕР»СЊР·СѓРµС‚ РѕР±С‰РёР№ include-layer РґР»СЏ `findAll/findOne/findBySeason/transitionStatus/validateTechMap/validateDAG/activate/createNextVersion` Р±РµР· РґСѓР±Р»РёСЂРѕРІР°РЅРёСЏ nested include-СЃС‚СЂСѓРєС‚СѓСЂ.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `tech-map` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРЅРёР¶РµРЅ СЃ `6020` РґРѕ `5941` СЃС‚СЂРѕРє РїСЂРё `61` С„Р°Р№Р»Рµ (warn РїРѕ СЃС‚СЂРѕРєР°Рј РґР»СЏ `tech-map` СЃРЅСЏС‚).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/tech-map/tech-map.concurrency.spec.ts src/shared/tech-map/tech-map-mapping.helpers.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
23. **Architecture Simplification вЂ” TechMap Mapping/Snapshot Boundary Slice** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РїРµСЂРІС‹Р№ deep-slice `tech-map`: mapping/snapshot СЃР»РѕР№ РІС‹РЅРµСЃРµРЅ РёР· `apps/api/src/modules/tech-map/tech-map.service.ts` РІ `apps/api/src/shared/tech-map/tech-map-mapping.helpers.ts`.
  - Р’ shared helper РІС‹РЅРµСЃРµРЅС‹: СЃР±РѕСЂРєР° `ValidationInput` РґР»СЏ `TechMapValidationEngine`, DAG nodes РґР»СЏ `DAGValidationService`, activation snapshots `operationsSnapshot/resourceNormsSnapshot`.
  - Р”РѕР±Р°РІР»РµРЅ targeted spec `apps/api/src/shared/tech-map/tech-map-mapping.helpers.spec.ts`; `tech-map.concurrency` РєРѕРЅС‚СѓСЂ РѕСЃС‚Р°С‘С‚СЃСЏ Р·РµР»С‘РЅС‹Рј.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `tech-map` СЃРЅРёР¶РµРЅ СЃ `6087` РґРѕ `6020` СЃС‚СЂРѕРє РїСЂРё `61` С„Р°Р№Р»Рµ; `rai-chat` СѓРґРµСЂР¶Р°РЅ РЅР° `28122` СЃС‚СЂРѕРєР°С….
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/tech-map/tech-map.concurrency.spec.ts src/shared/tech-map/tech-map-mapping.helpers.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
24. **Architecture Simplification вЂ” RAI Chat Tool Orchestration Slice (`rai-tools.registry`)** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ СЃР»РµРґСѓСЋС‰РёР№ deep-slice orchestration-СЃР»РѕСЏ: built-in tool schemas/handlers (`echo_message`, `workspace_snapshot`) РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` РІ `apps/api/src/shared/rai-chat/rai-tools-builtins.ts`.
  - РЎРµСЂРёР°Р»РёР·Р°С†РёСЏ payload Рё С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ tool-call log РІС‹РЅРµСЃРµРЅС‹ РёР· `rai-tools.registry.ts` РІ `apps/api/src/shared/rai-chat/rai-tools-log-helpers.ts`; orchestration-РєР»Р°СЃСЃ РѕСЃС‚Р°РІР»РµРЅ РЅР° policy/runtime flow + registry dispatch.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `rai-chat` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРЅРёР¶РµРЅ СЃ `28123` РґРѕ `28122` СЃС‚СЂРѕРє РїСЂРё `143` С„Р°Р№Р»Р°С….
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
25. **Architecture Simplification вЂ” RAI Chat Tool Registries Boundary Slice (Contracts)** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ СЃР»РµРґСѓСЋС‰РёР№ deep-slice `tool registries`: РёР· `apps/api/src/modules/rai-chat/tools/contracts-tools.registry.ts` РІС‹РЅРµСЃРµРЅС‹ payload schemas РІ `apps/api/src/shared/rai-chat/contracts-tool-schemas.ts`.
  - Mapping/helper СЃР»РѕР№ `mapCreatedContract`, `mapContractSummary`, `normalizeJsonObject` РІС‹РЅРµСЃРµРЅ РІ `apps/api/src/shared/rai-chat/contracts-tool-helpers.ts`, Р° `contracts-tools.registry.ts` РѕСЃС‚Р°РІР»РµРЅ orchestration-oriented.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `rai-chat` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРЅРёР¶РµРЅ СЃ `28286` РґРѕ `28123` СЃС‚СЂРѕРє РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё `143` С„Р°Р№Р»РѕРІ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/contracts-tools.registry.spec.ts src/modules/rai-chat/tools/front-office-tools.registry.spec.ts src/modules/rai-chat/tools/crm-tools.registry.spec.ts src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
26. **Architecture Simplification вЂ” RAI Chat Tool Registries Boundary Slice (CRM + Front-Office)** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ СЃР»РµРґСѓСЋС‰РёР№ deep-slice `tool registries`: РёР· `apps/api/src/modules/rai-chat/tools/crm-tools.registry.ts` РІС‹РЅРµСЃРµРЅС‹ payload schemas Рё helper-Р»РѕРіРёРєР° РІ `apps/api/src/shared/rai-chat/crm-tool-schemas.ts` Рё `apps/api/src/shared/rai-chat/crm-tool-helpers.ts`.
  - Р’С‹РїРѕР»РЅРµРЅ СЃР»РµРґСѓСЋС‰РёР№ deep-slice `tool registries`: РёР· `apps/api/src/modules/rai-chat/tools/front-office-tools.registry.ts` РІС‹РЅРµСЃРµРЅС‹ payload schemas Рё routing/classification helper-СЃР»РѕР№ РІ `apps/api/src/shared/rai-chat/front-office-tool-schemas.ts` Рё `apps/api/src/shared/rai-chat/front-office-tool-helpers.ts`.
  - Routing policy РІС‹РЅРµСЃРµРЅ РІ `apps/api/src/shared/rai-chat/front-office-routing.policy.ts`, Р° РІ `apps/api/src/modules/rai-chat/tools/front-office-routing.policy.ts` РѕСЃС‚Р°РІР»РµРЅ re-export bridge РґР»СЏ Р±РµР·РѕРїР°СЃРЅРѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `rai-chat` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРЅРёР¶РµРЅ СЃ `28630` РґРѕ `28286` СЃС‚СЂРѕРє РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё `143` С„Р°Р№Р»РѕРІ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/tools/front-office-routing.policy.spec.ts src/modules/rai-chat/tools/front-office-tools.registry.spec.ts src/modules/rai-chat/tools/crm-tools.registry.spec.ts src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts` PASS; `pnpm -C apps/api build` PASS; `pnpm gate:architecture` PASS.
27. **Architecture Simplification вЂ” Supervisor Forensics/Audit Post-Processing Slice** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ СЃР»РµРґСѓСЋС‰РёР№ deep-slice `supervisor orchestration`: post-processing СЃР»РѕР№ (`AiAuditEntry` Р·Р°РїРёСЃСЊ, forensic phases append, memory lane build) РІС‹РЅРµСЃРµРЅ РёР· `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` РІ `apps/api/src/modules/rai-chat/supervisor-forensics.service.ts`.
  - `SupervisorAgent` РѕС‡РёС‰РµРЅ РґРѕ orchestration-РєРѕРЅС‚СѓСЂРѕРІ router/runtime/external/composer + truthfulness pipeline coordination.
  - `RaiChatModule` Рё spec-РєРѕРЅС‚СѓСЂС‹ `runtime-spine`, `supervisor-agent`, `rai-chat.service` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РЅРѕРІС‹Р№ provider `SupervisorForensicsService`.
  - РћР±РЅРѕРІР»РµРЅС‹ СѓСЃС‚Р°СЂРµРІС€РёРµ assertions РІ `supervisor-agent.service.spec.ts` Рё `rai-chat.service.spec.ts` РїРѕРґ С‚РµРєСѓС‰РµРµ canonical РїРѕРІРµРґРµРЅРёРµ memory-profile/context РІ РѕС‚РІРµС‚Рµ.
  - `architecture-budget-gate` РїРѕСЃР»Рµ СЃСЂРµР·Р°: `rai-chat=28777 lines / 143 files`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts` PASS.
28. **Architecture Simplification вЂ” RAI Chat Runtime Governance Control Slice** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ СЃР»РµРґСѓСЋС‰РёР№ deep-slice `runtime-governance event/control`: РёР· `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts` РІС‹РЅРµСЃРµРЅ governance control-layer РІ `apps/api/src/modules/rai-chat/runtime/runtime-governance-control.service.ts`.
  - Р’ РЅРѕРІС‹Р№ СЃР»РѕР№ РІС‹РЅРµСЃРµРЅС‹: `buildGovernanceMeta`, `recordGovernanceEvent`, `recordToolFailure`, `resolveConcurrencyEnvelope`, `resolveRuntimeGovernanceFromResults` Рё budget degrade `filterAllowedToolCalls`.
  - `AgentRuntimeService` СЃРѕРєСЂР°С‰С‘РЅ СЃ `659` РґРѕ `498` СЃС‚СЂРѕРє (`-161`) Рё РѕСЃС‚Р°РІР»РµРЅ РєР°Рє runtime orchestration/service glue.
  - `RaiChatModule` Рё runtime-specs (`agent-runtime`, `runtime-spine`) РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РЅРѕРІС‹Р№ provider `RuntimeGovernanceControlService`; runtime DI-РєРѕРЅС‚СѓСЂ РѕСЃС‚Р°С‘С‚СЃСЏ СЃС‚Р°Р±РёР»СЊРЅС‹Рј.
  - `architecture-budget-gate` РїРѕСЃР»Рµ СЃСЂРµР·Р°: `rai-chat=28764 lines / 142 files` (РёСЃС‚РѕСЂРёС‡РµСЃРєРёР№ РјРёРЅРёРјСѓРј РЅР° РїСЂРµРґС‹РґСѓС‰РµРј С€Р°РіРµ РѕСЃС‚Р°С‘С‚СЃСЏ `28410`, РЅРѕ С‚РµРєСѓС‰РёР№ snapshot РІС‹СЂРѕСЃ РёР·-Р·Р° РЅРѕРІРѕРіРѕ control-layer Рё СЂР°СЃС€РёСЂРµРЅРЅРѕРіРѕ test DI-РєРѕРЅС‚СѓСЂР°).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/runtime/agent-runtime.service.spec.ts src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts src/modules/explainability/agent-management.service.spec.ts src/modules/rai-chat/composer/work-window.factory.spec.ts src/modules/rai-chat/composer/legacy-widget-window.mapper.spec.ts src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts` PASS.
29. **Architecture Simplification вЂ” RAI Chat Execution Adapter Heuristics Extraction** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РїСЏС‚С‹Р№ РїСЂР°РєС‚РёС‡РµСЃРєРёР№ boundary-refactor РІ `rai-chat`: execution heuristics/mapping СЃР»РѕР№ РІС‹РЅРµСЃРµРЅ РёР· `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts` РІ `apps/api/src/shared/rai-chat/execution-adapter-heuristics.ts`.
  - Р’ shared РІС‹РЅРµСЃРµРЅС‹ `detect*Intent`, `detect*Tool`, `firstPayload`, `resolve*Id`, `extract`* Рё `isKnowledgeNoHit`/`isKnownFulfillmentEventType`; `AgentExecutionAdapterService` РѕСЃС‚Р°РІР»РµРЅ РєР°Рє orchestration + output validation.
  - `agent-execution-adapter.service.ts` СѓРјРµРЅСЊС€РµРЅ СЃ `1152` РґРѕ `785` СЃС‚СЂРѕРє (`-367`), РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё РїРѕРІРµРґРµРЅРёСЏ execution path.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `rai-chat` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРЅРёР¶РµРЅ СЃ `28777` РґРѕ `28410` СЃС‚СЂРѕРє (РёСЃС‚РѕСЂРёС‡РµСЃРєРёР№ РјРёРЅРёРјСѓРј РїРѕСЃР»Рµ extraction-СЃСЂРµР·Р°); РЅР° СЌС‚Р°РїРµ СЃС‚Р°Р±РёР»РёР·Р°С†РёРё runtime test-РєРѕРЅС‚СѓСЂР° С„РёРєСЃРёСЂРѕРІР°Р»СЃСЏ snapshot `28482` СЃС‚СЂРѕРє РїСЂРё `139` С„Р°Р№Р»Р°С….
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `node scripts/architecture-budget-gate.cjs` PASS; targeted suite `src/modules/explainability/agent-management.service.spec.ts`, `src/modules/rai-chat/composer/work-window.factory.spec.ts`, `src/modules/rai-chat/composer/legacy-widget-window.mapper.spec.ts`, `src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts` PASS; runtime-suite `src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` Рё `src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` PASS (DI-РґРѕР»Рі С‚РµСЃС‚РѕРІРѕРіРѕ РєРѕРЅС‚СѓСЂР° Р·Р°РєСЂС‹С‚).
30. **Architecture Simplification вЂ” RAI Chat Response Composer Presenter Extraction** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ С‡РµС‚РІС‘СЂС‚С‹Р№ РїСЂР°РєС‚РёС‡РµСЃРєРёР№ boundary-refactor РІ `rai-chat`: CRM/Commerce presenter-layer РІС‹РЅРµСЃРµРЅ РёР· `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` РІ `apps/api/src/shared/rai-chat/response-composer-presenters.ts`.
  - Р’С‹РЅРµСЃРµРЅС‹ РѕС‚РѕР±СЂР°Р¶Р°СЋС‰РёРµ С„СѓРЅРєС†РёРё `buildToolDisplayName`, `buildCrm`*, `buildContracts*`; `ResponseComposerService` РѕСЃС‚Р°РІР»РµРЅ РєР°Рє orchestration path Р±РµР· heavy presenter-РІРµС‚РѕРє.
  - `response-composer` РїРµСЂРµРІРµРґС‘РЅ РЅР° shared presenter imports, С„СѓРЅРєС†РёРѕРЅР°Р»СЊРЅРѕРµ РїРѕРІРµРґРµРЅРёРµ СЃРѕС…СЂР°РЅРµРЅРѕ.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `rai-chat` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРЅРёР¶РµРЅ СЃ `29605` РґРѕ `28777` СЃС‚СЂРѕРє РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё `139` С„Р°Р№Р»РѕРІ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts src/modules/explainability/agent-config-guard.service.spec.ts src/modules/explainability/agent-management.service.spec.ts src/modules/explainability/agent-prompt-governance.service.spec.ts src/modules/front-office-draft/front-office-draft.service.spec.ts src/modules/rai-chat/composer/work-window.factory.spec.ts src/modules/rai-chat/composer/legacy-widget-window.mapper.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.
31. **Architecture Simplification вЂ” RAI Chat DTO/Tools/Widgets Contract Extraction** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ С‚СЂРµС‚РёР№ РїСЂР°РєС‚РёС‡РµСЃРєРёР№ boundary-refactor РІ `rai-chat`: `dto/rai-chat.dto.ts`, `tools/rai-tools.types.ts` Рё `widgets/rai-chat-widgets.types.ts` РІС‹РЅРµСЃРµРЅС‹ РёР· `apps/api/src/modules/rai-chat` РІ `apps/api/src/shared/rai-chat`.
  - Р’ СЃС‚Р°СЂС‹С… РїСѓС‚СЏС… РѕСЃС‚Р°РІР»РµРЅС‹ С‚РѕРЅРєРёРµ re-export bridge С„Р°Р№Р»С‹: `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`, `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`, `apps/api/src/modules/rai-chat/widgets/rai-chat-widgets.types.ts`.
  - Canonical imports РїРµСЂРµРІРµРґРµРЅС‹ РЅР° shared-path РґР»СЏ `agent-interaction-contracts`, `front-office-client-response.orchestrator`, `agent-management`, `agent-config-guard.spec`, `agent-prompt-governance.spec`, `agent-management.spec`, `agent-config.dto`.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `rai-chat` РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ СЃРЅРёР¶РµРЅ СЃ `31316` РґРѕ `29605` СЃС‚СЂРѕРє РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё `139` С„Р°Р№Р»РѕРІ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts src/modules/explainability/agent-config-guard.service.spec.ts src/modules/explainability/agent-management.service.spec.ts src/modules/explainability/agent-prompt-governance.service.spec.ts src/modules/front-office-draft/front-office-draft.service.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.

## 2026-03-12

1. **Architecture Simplification вЂ” RAI Chat Contract Layer Extraction** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РІС‚РѕСЂРѕР№ РїСЂР°РєС‚РёС‡РµСЃРєРёР№ boundary-refactor РїРѕСЃР»Рµ `front-office`: `agent-interaction-contracts` РІС‹РЅРµСЃРµРЅ РёР· `apps/api/src/modules/rai-chat/agent-contracts` РІ `apps/api/src/shared/rai-chat/agent-interaction-contracts.ts`.
  - Р’ `modules/rai-chat/agent-contracts/agent-interaction-contracts.ts` РѕСЃС‚Р°РІР»РµРЅ С‚РѕРЅРєРёР№ re-export bridge РґР»СЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё Рё Р±РµР·РѕРїР°СЃРЅРѕРіРѕ РїРµСЂРµС…РѕРґР°.
  - РџРµСЂРµРїРѕРґРєР»СЋС‡РµРЅС‹ РїСЂСЏРјС‹Рµ РёРјРїРѕСЂС‚РёСЂСѓСЋС‰РёРµ РєРѕРЅС‚СѓСЂС‹ `rai-chat` Рё `explainability` РЅР° shared-path: `supervisor`, `intent-router`, `response-composer`, `agent-config-guard`, `agent-management`.
  - РџРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ `rai-chat` СЃРЅРёР¶РµРЅ СЃ `34256` РґРѕ `31316` СЃС‚СЂРѕРє РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё `139` С„Р°Р№Р»РѕРІ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/agent-contracts/agent-interaction-contracts.spec.ts src/modules/explainability/agent-config-guard.service.spec.ts src/modules/explainability/agent-management.service.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.
2. **Architecture Simplification вЂ” Front-Office Shared Boundary Extraction** [DONE]:
  - Р’С‹РїРѕР»РЅРµРЅ РїРµСЂРІС‹Р№ РїСЂР°РєС‚РёС‡РµСЃРєРёР№ boundary-refactor РїРѕСЃР»Рµ РІРІРѕРґР° growth-governance: РёР· `apps/api/src/modules/front-office-draft` РІС‹РЅРµСЃРµРЅС‹ thread/transport/binding РєРѕРјРїРѕРЅРµРЅС‚С‹ РІ `apps/api/src/shared/front-office`.
  - Р’РІРµРґРµРЅС‹ `FrontOfficeSharedModule`, `FrontOfficeThreadingService`, `FrontOfficeCommunicationRepository`, `FrontOfficeOutboundService`; `FrontOfficeDraftService` СЃРѕРєСЂР°С‰С‘РЅ РґРѕ domain orchestration (intake/decision/commit/handoff).
  - РњРѕРґСѓР»СЊ `front-office-draft` СѓРјРµРЅСЊС€РµРЅ СЃ `10` РґРѕ `8` С„Р°Р№Р»РѕРІ; РїРѕ `architecture-budget-gate` СЂР°Р·РјРµСЂ СЃРЅРёР·РёР»СЃСЏ СЃ `5684` РґРѕ `4246` СЃС‚СЂРѕРє.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand src/modules/front-office-draft/front-office-draft.service.spec.ts src/modules/front-office/front-office.e2e.spec.ts` PASS; `node scripts/architecture-budget-gate.cjs` PASS.
3. **Architecture Growth Governance** [DONE]:
  - Р’РІРµРґС‘РЅ `scripts/architecture-budget-gate.cjs` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ control-layer РґР»СЏ СЂРѕСЃС‚Р° Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕР№ СЃР»РѕР¶РЅРѕСЃС‚Рё.
  - Р‘СЋРґР¶РµС‚С‹ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ РІ `scripts/architecture-budgets.json`: РѕС‚РґРµР»СЊРЅРѕ РєРѕРЅС‚СЂРѕР»РёСЂСѓСЋС‚СЃСЏ `schema.prisma`, РєРѕР»РёС‡РµСЃС‚РІРѕ top-level РјРѕРґСѓР»РµР№ Рё watch-list С‚СЏР¶С‘Р»С‹С… hotspots (`rai-chat`, `explainability`, `generative-engine`, `tech-map`, `front-office-draft`, `consulting`, `finance-economy`, `commerce`).
  - Р’ РєРѕСЂРЅРµРІРѕР№ `package.json` РґРѕР±Р°РІР»РµРЅС‹ РєРѕРјР°РЅРґС‹ `pnpm gate:architecture` Рё `pnpm gate:architecture:enforce`.
  - Р”РѕР±Р°РІР»РµРЅ guideline `docs/05_OPERATIONS/DEVELOPMENT_GUIDELINES/ARCHITECTURE_GROWTH_GUARDRAILS.md`; `delta audit` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ: Р±Р»РѕРє module complexity РїРµСЂРµРІРµРґС‘РЅ РёР· вЂњРїСЂРѕСЃС‚Рѕ Р°РєС‚СѓР°Р»СЊРЅРѕвЂќ РІ вЂњС‡Р°СЃС‚РёС‡РЅРѕ Р·Р°РєСЂС‹С‚Рѕ / growth-governance РІРІРµРґС‘РЅвЂќ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm gate:architecture` PASS; `pnpm gate:architecture:enforce` PASS; С‚РµРєСѓС‰РёР№ РѕС‚С‡С‘С‚ С„РёРєСЃРёСЂСѓРµС‚ `schema.prisma=6107`, `top-level modules=38` Рё РѕСЃРЅРѕРІРЅС‹Рµ hotspots.
4. **Foundation Remediation вЂ” Compliance-Grade WORM S3 Rollout** [DONE]:
  - `WormStorageService` РїРµСЂРµРІРµРґС‘РЅ РІ fail-closed СЂРµР¶РёРј РґР»СЏ `s3_compatible|dual`: РЅР° СЃС‚Р°СЂС‚Рµ С‚РµРїРµСЂСЊ РїСЂРѕРІРµСЂСЏСЋС‚СЃСЏ `Versioning=Enabled`, `Object Lock=Enabled` Рё default retention `COMPLIANCE / Years / 7`, Р° `filesystem` РІ `production` Р·Р°РїСЂРµС‰С‘РЅ Р±РµР· СЏРІРЅРѕРіРѕ override.
  - `WORM` upload path СѓСЃРёР»РµРЅ РґРѕ С„Р°РєС‚РёС‡РµСЃРєРѕР№ retention verification: РѕР±СЉРµРєС‚ РїРёС€РµС‚СЃСЏ РІ `S3-compatible` storage, Р·Р°С‚РµРј retention С‡РёС‚Р°РµС‚СЃСЏ Рё РїРѕРґС‚РІРµСЂР¶РґР°РµС‚СЃСЏ; РµСЃР»Рё РєРѕРЅС‚СѓСЂ РЅРµ РїРѕРґС‚РІРµСЂРґРёР»СЃСЏ, Р·Р°РїРёСЃСЊ СЃС‡РёС‚Р°РµС‚СЃСЏ РЅРµСѓСЃРїРµС€РЅРѕР№.
  - `scripts/setup-minio.ts` С‚РµРїРµСЂСЊ РїРѕРґРЅРёРјР°РµС‚ `rai-audit-worm` bucket СЃ `Object Lock` Рё default retention, Р° РІ РєРѕСЂРЅРµРІРѕР№ `package.json` РґРѕР±Р°РІР»РµРЅ Р·Р°РїСѓСЃРє `pnpm storage:minio:setup`.
  - `delta audit` Рё РЅРѕРІС‹Р№ runbook `docs/05_OPERATIONS/WORKFLOWS/WORM_S3_COMPLIANCE_ROLLOUT.md` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹: WORM-Р±Р»РѕРє РїРµСЂРµРІРµРґС‘РЅ РёР· вЂњРѕСЃС‚Р°Р»СЃСЏ production rolloutвЂќ РІ Р»РѕРіРёС‡РµСЃРєРё Р·Р°РєСЂС‹С‚С‹Р№ runtime/bootstrap СЃР»РѕР№.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/level-f/worm/worm-storage.service.spec.ts src/shared/audit/audit-notarization.service.spec.ts src/shared/audit/audit.service.spec.ts` PASS; `pnpm exec tsx scripts/setup-minio.ts` PASS; live self-test `WormStorageService` РїРѕРґС‚РІРµСЂРґРёР» `provider=s3_compatible`, `objectLock=enabled`, `versioning=enabled`, `defaultRetention=COMPLIANCE:Years:7`, `accessible=true`.
5. **Foundation Remediation вЂ” Event-Stream-Native Outbox Evolution** [DONE]:
  - `OutboxRelay` РїРµСЂРµСЃС‚Р°Р» Р±С‹С‚СЊ cron-only РєРѕРЅС‚СѓСЂРѕРј: РІРІРµРґС‘РЅ `Redis Pub/Sub` wakeup С‡РµСЂРµР· `OutboxWakeupService`, Р° scheduler С‚РµРїРµСЂСЊ РёРіСЂР°РµС‚ СЂРѕР»СЊ safety fallback, Р° РЅРµ РµРґРёРЅСЃС‚РІРµРЅРЅРѕРіРѕ production-РјРµС…Р°РЅРёР·РјР° РґРІРёР¶РµРЅРёСЏ РѕС‡РµСЂРµРґРё.
  - Producer-path С†РµРЅС‚СЂР°Р»РёР·РѕРІР°РЅ С‡РµСЂРµР· `OutboxService.persistEvent()` / `persistPreparedEvents()`: `task`, `consulting`, `economy`, `reconciliation` С‚РµРїРµСЂСЊ РїРѕСЃР»Рµ Р·Р°РїРёСЃРё outbox РїСѓР±Р»РёРєСѓСЋС‚ wakeup hint Р±РµР· СЂР°Р·СЂРѕР·РЅРµРЅРЅРѕРіРѕ РїСЂСЏРјРѕРіРѕ `outboxMessage.create/createMany`.
  - `redis_streams` transport СѓСЃРёР»РµРЅ РґРѕ broker-native topology: `OutboxBrokerPublisher` С‚РµРїРµСЂСЊ РЅРµ С‚РѕР»СЊРєРѕ РїРёС€РµС‚ РІ stream, РЅРѕ Рё РїРѕРґРЅРёРјР°РµС‚ configured consumer groups С‡РµСЂРµР· `OUTBOX_BROKER_REDIS_CONSUMER_GROUPS`; relay Р»РѕРіРёСЂСѓРµС‚ broker receipt Рё РїСЂРѕРґРѕР»Р¶Р°РµС‚ drain РЅРµРјРµРґР»РµРЅРЅРѕ РїСЂРё РїРѕР»РЅРѕРј batch.
  - `delta audit` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ: outbox-Р±Р»РѕРє РїРµСЂРµРІРµРґС‘РЅ РІ Р»РѕРіРёС‡РµСЃРєРё Р·Р°РєСЂС‹С‚С‹Р№ РєР°Рє event-stream-native relay; РµСЃР»Рё РїРѕР·Р¶Рµ РїРѕРЅР°РґРѕР±РёС‚СЃСЏ Debezium/Kafka-class РІРЅРµС€РЅРёР№ CDC, СЌС‚Рѕ СѓР¶Рµ СЃР»РµРґСѓСЋС‰РёР№ infra-layer, Р° РЅРµ РЅРµР·Р°РєСЂС‹С‚С‹Р№ foundation-gap.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/outbox/outbox.service.spec.ts src/shared/outbox/outbox-wakeup.service.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts src/shared/outbox/outbox.relay.spec.ts` PASS; live self-test СЃ `OUTBOX_RELAY_SCHEDULE_ENABLED=false` Рё `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED=false` РїРµСЂРµРІС‘Р» outbox-СЃРѕРѕР±С‰РµРЅРёРµ РІ `PROCESSED` С‚РѕР»СЊРєРѕ С‡РµСЂРµР· wakeup-РєРѕРЅС‚СѓСЂ.
6. **Foundation Remediation вЂ” Audit Log Notarization / WORM** [DONE]:
  - `AuditService` РїРµСЂРµРІРµРґС‘РЅ РЅР° create-only РїСѓС‚СЊ С‡РµСЂРµР· `AuditNotarizationService`: РєР°Р¶РґР°СЏ audit-Р·Р°РїРёСЃСЊ С‚РµРїРµСЂСЊ РїРѕР»СѓС‡Р°РµС‚ `entryHash`, company-scoped `chainHash`, HSM-РїРѕРґРїРёСЃСЊ Рё РѕС‚РґРµР»СЊРЅСѓСЋ proof-Р·Р°РїРёСЃСЊ РІ `audit_notarization_records`.
  - Р’РІРµРґС‘РЅ `WormStorageService` / `WormModule` СЃ РІРЅРµС€РЅРёРј immutable storage РІРЅРµ РѕСЃРЅРѕРІРЅРѕР№ Р‘Р”: РїРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ `filesystem`, `s3_compatible` Рё `dual`, Р° default path Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ `cwd` РїСЂРѕС†РµСЃСЃР° Рё СЃС‚Р°Р±РёР»СЊРЅРѕ СЂР°Р·СЂРµС€Р°РµС‚СЃСЏ РѕС‚ РєРѕСЂРЅСЏ workspace.
  - Р”РѕР±Р°РІР»РµРЅС‹ `GET /api/audit/logs/:id/proof` Рё `health`-readiness РїРѕ `audit_notarization`; readiness С‚РµРїРµСЂСЊ РїСЂРѕРІРµСЂСЏРµС‚ РЅРµ С‚РѕР»СЊРєРѕ Р‘Р”-Р·Р°РїРёСЃСЊ proof, РЅРѕ Рё РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ РїРѕСЃР»РµРґРЅРµРіРѕ WORM object.
  - `delta audit` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ: Р±Р»РѕРє `Audit log notarization / WORM` РїРµСЂРµРІРµРґС‘РЅ РІ Р»РѕРіРёС‡РµСЃРєРё Р·Р°РєСЂС‹С‚С‹Р№ РїРѕ РєРѕРґСѓ. РћСЃС‚Р°С‚РѕРє С‚РµРїРµСЂСЊ РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂРЅС‹Р№: РґР»СЏ production-retention СѓСЂРѕРІРЅСЏ compliance РЅСѓР¶РЅРѕ РІРєР»СЋС‡РёС‚СЊ `AUDIT_WORM_PROVIDER=s3_compatible|dual` Рё object-lock bucket.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/audit/audit.service.spec.ts src/shared/audit/audit-notarization.service.spec.ts src/level-f/worm/worm-storage.service.spec.ts src/level-f/crypto/hsm.service.spec.ts` PASS; `curl -s http://127.0.0.1:4000/api/health` -> `audit_notarization.status=up`; Р¶РёРІРѕР№ self-test СЃРѕР·РґР°Р» РІРЅРµС€РЅРёР№ WORM object `/root/RAI_EP/var/audit-worm/audit-logs/default-rai-company/2026-03-12/2026-03-12T20:08:58.992Z_337c2c81-2627-4a77-aaaf-88595e20d83e_903f72c49b9f2f8d.json`.
7. **Foundation Remediation вЂ” External Front-Office Route-Space Separation** [DONE]:
  - Р’РІРµРґС‘РЅ РѕС‚РґРµР»СЊРЅС‹Р№ viewer-only API namespace `portal/front-office` С‡РµСЂРµР· `src/modules/front-office/front-office-external.controller.ts`; РІРЅРµС€РЅРёР№ РєРѕРЅС‚СѓСЂ Р±РѕР»СЊС€Рµ РЅРµ Р¶РёРІС‘С‚ С‚РѕР»СЊРєРѕ РІРЅСѓС‚СЂРё РѕР±С‰РµРіРѕ `front-office.controller.ts`.
  - Canonical web portal РІС‹РЅРµСЃРµРЅ РІ `/portal/front-office` Рё `/portal/front-office/threads/[threadKey]`, Р° onboarding/success redirects Рё activation links РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РЅРѕРІС‹Р№ route-space.
  - РЎС‚Р°СЂС‹Рµ `/front-office/login|activate` РїРµСЂРµРІРµРґРµРЅС‹ РІ redirect-only alias, Р° РІРЅСѓС‚СЂРµРЅРЅРёР№ `/api/front-office/`* Р±РѕР»СЊС€Рµ РЅРµ РѕР±СЃР»СѓР¶РёРІР°РµС‚ `FRONT_OFFICE_USER`.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist Рё memory-bank: Р±Р»РѕРє `External front-office auth boundary` РїРµСЂРµРІРµРґС‘РЅ РёР· `С‡Р°СЃС‚РёС‡РЅРѕ Р·Р°РєСЂС‹С‚Рѕ` РІ `Р·Р°РєСЂС‹С‚Рѕ`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/modules/front-office/front-office-external.controller.spec.ts src/shared/auth/front-office-auth.service.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS; `pnpm --filter web exec tsc --noEmit --pretty false` PASS.
8. **Foundation Remediation вЂ” Broader Secrets Centralization** [DONE]:
  - Р’РІРµРґС‘РЅ РіР»РѕР±Р°Р»СЊРЅС‹Р№ `SecretsService` / `SecretsModule` РєР°Рє РµРґРёРЅС‹Р№ provider-layer РїРѕРІРµСЂС… `resolveSecretValue()` Рё `*_FILE` secret mounts.
  - РќР° С†РµРЅС‚СЂР°Р»РёР·РѕРІР°РЅРЅС‹Р№ secret-read РїРµСЂРµРІРµРґРµРЅС‹ `JWT`, `MinIO`, `INTERNAL_API_KEY`, `CORE_API_KEY`, `OUTBOX_BROKER_AUTH_TOKEN`, `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`, Р° С‚Р°РєР¶Рµ `AuditService` Рё `HsmService`.
  - `JwtModule`, `JwtStrategy`, `S3Service`, `InternalApiKeyGuard`, `CustomThrottlerGuard`, `OutboxBrokerPublisher`, `TelegramAuthService`, `FrontOfficeAuthService`, `ProgressService`, `TelegramNotificationService`, `NvidiaGatewayService` Рё `OpenRouterGatewayService` Р±РѕР»СЊС€Рµ РЅРµ С‡РёС‚Р°СЋС‚ runtime-secrets РЅР°РїСЂСЏРјСѓСЋ РёР· СЂР°Р·СЂРѕР·РЅРµРЅРЅРѕРіРѕ `process.env`.
  - `delta audit` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ: Р±Р»РѕРє `Broader secrets centralization` РїРµСЂРµРІРµРґС‘РЅ РІ Р»РѕРіРёС‡РµСЃРєРё Р·Р°РєСЂС‹С‚С‹Р№, Р° РѕСЃС‚Р°С‚РѕРє С‚РµРїРµСЂСЊ С‚СЂР°РєС‚СѓРµС‚СЃСЏ РєР°Рє РѕР±С‹С‡РЅС‹Р№ config/env debt, Р° РЅРµ РєР°Рє РѕС‚РєСЂС‹С‚С‹Р№ audit-gap.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm -C apps/api build` PASS; `pnpm -C apps/api test -- --runInBand --silent src/shared/config/secrets.service.spec.ts src/shared/auth/internal-api-key.guard.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts src/shared/audit/audit.service.spec.ts src/level-f/crypto/hsm.service.spec.ts src/shared/auth/front-office-auth.service.spec.ts` PASS; `curl -s http://127.0.0.1:4000/api/health` -> `status=ok`; `curl -s http://127.0.0.1:4000/api/invariants/metrics` -> РІР°Р»РёРґРЅС‹Р№ `JSON`.
9. **Foundation Remediation вЂ” Broker-Native Outbox Transport** [DONE]:
  - `OutboxBrokerPublisher` РїРµСЂРµРІРµРґС‘РЅ РЅР° transport abstraction `http | redis_streams` РІРјРµСЃС‚Рѕ РµРґРёРЅСЃС‚РІРµРЅРЅРѕРіРѕ generic HTTP webhook path.
  - Р’РІРµРґС‘РЅ broker-native Redis Streams publish path С‡РµСЂРµР· `XADD`, safety env-configs `OUTBOX_BROKER_TRANSPORT`, `OUTBOX_BROKER_REDIS_STREAM_KEY`, `OUTBOX_BROKER_REDIS_STREAM_MAXLEN`, `OUTBOX_BROKER_REDIS_TENANT_PARTITIONING` Рё rudimentary tenant partitioning РїРѕ stream key.
  - `OutboxRelay` С‚РµРїРµСЂСЊ transport-aware РїРѕ broker config hint; legacy HTTP path СЃРѕС…СЂР°РЅС‘РЅ РєР°Рє backward-compatible fallback.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist, outbox replay runbook Рё memory-bank: С‚РµР·РёСЃ РїСЂРѕ "generic HTTP-only broker publisher" РїРµСЂРµРІРµРґС‘РЅ РІ СѓСЃС‚Р°СЂРµРІС€РёР№.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts src/shared/outbox/outbox-broker.publisher.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS.
10. **Foundation Remediation вЂ” Production-Grade Operational Control for Memory Lifecycle** [DONE]:
  - `MemoryMaintenanceService` РґРѕРІРµРґС‘РЅ РґРѕ production-grade control-plane: playbook catalog, tenant-scoped recommendations, audit-backed recent runs Рё `GET /api/memory/maintenance/control-plane`.
  - Р’РІРµРґС‘РЅ `MemoryAutoRemediationService` СЃ scheduled automatic corrective action, cooldown policy, auto-eligible playbooks only Рё safety caps `MEMORY_AUTO_REMEDIATION_`*.
  - `InvariantMetricsController` Рё Prometheus export СЂР°СЃС€РёСЂРµРЅС‹ deeper lifecycle signals Рё automation counters: `memory_oldest_prunable_consolidated_age_seconds`, `memory_engram_formation_candidates`, `memory_oldest_engram_formation_candidate_age_seconds`, `invariant_memory_auto_remediations_total`, `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled`.
  - `EngramFormationWorker` РїРµСЂРµРІРµРґС‘РЅ РЅР° С‚РѕС‚ Р¶Рµ candidate contour, С‡С‚Рѕ Рё observability/control-plane: СѓР¶Рµ РїРѕРјРµС‡РµРЅРЅС‹Рµ `generationMetadata.memoryLifecycle.engramFormed=true` С‚РµС…РєР°СЂС‚С‹ РёСЃРєР»СЋС‡Р°СЋС‚СЃСЏ РёР· formation path.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist, alert runbook, maturity dashboard, SLO policy Рё memory-bank: Р±Р»РѕРє `production-grade operational control for memory lifecycle` РїРµСЂРµРІРµРґС‘РЅ РІ closed.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/memory-maintenance.service.spec.ts src/shared/memory/memory.controller.spec.ts src/shared/memory/memory-lifecycle-observability.service.spec.ts src/shared/memory/memory-auto-remediation.service.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts` PASS; `pnpm --filter api exec tsc --noEmit --pretty false` PASS.
11. **Foundation Remediation вЂ” Special Internal Boundaries + Consulting Policy Guard** [DONE]:
  - РЎРїРµС†РёР°Р»СЊРЅС‹Рµ РІРЅСѓС‚СЂРµРЅРЅРёРµ boundary С„РѕСЂРјР°Р»РёР·РѕРІР°РЅС‹ С‡РµСЂРµР· СЏРІРЅС‹Рµ decorators/metadata: `RequireMtls`, `RequireInternalApiKey`, `PublicHealthBoundary`.
  - `InternalApiKeyGuard` РїРµСЂРµРІРµРґС‘РЅ РІ fail-closed СЂРµР¶РёРј РїРѕ boundary metadata Рё РёСЃРїРѕР»СЊР·СѓРµС‚ timing-safe compare; `adaptive-learning` Рё `telegram-auth-internal` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РµРґРёРЅС‹Р№ decorator РІРјРµСЃС‚Рѕ СЂР°Р·СЂРѕР·РЅРµРЅРЅРѕРіРѕ `UseGuards`.
  - Р СѓС‡РЅС‹Рµ `ensureStrategicAccess()` / `ensureManagementAccess()` СѓРґР°Р»РµРЅС‹ РёР· `ConsultingController` Рё Р·Р°РјРµРЅРµРЅС‹ РЅР° `ConsultingAccessGuard` РєР°Рє С†РµРЅС‚СЂР°Р»РёР·РѕРІР°РЅРЅС‹Р№ policy-layer РґР»СЏ strategic/management РґРµР№СЃС‚РІРёР№.
  - `delta audit` Рё runtime-РїСЂРѕРІРµСЂРєР° СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹: Р»РѕРєР°Р»СЊРЅС‹Р№ `start:prod` СѓСЃРїРµС€РµРЅ, `/api/health` РѕС‚РІРµС‡Р°РµС‚ `ok`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api test -- --runInBand --silent src/shared/auth/auth-boundary.decorator.spec.ts src/shared/auth/internal-api-key.guard.spec.ts src/modules/consulting/consulting-access.guard.spec.ts` PASS, `pnpm -C apps/api build` PASS.
12. **Foundation Remediation вЂ” Tenant-Scoped Memory Manual Control Plane** [DONE]:
  - Р’РІРµРґС‘РЅ guarded endpoint `POST /api/memory/maintenance/run` Рё РѕС‚РґРµР»СЊРЅС‹Р№ `MemoryMaintenanceService` РґР»СЏ controlled corrective action РїРѕ `consolidation`, `pruning`, `engram formation`, `engram pruning`.
  - Manual path СЃРґРµР»Р°РЅ tenant-safe: `ConsolidationWorker`, `EngramFormationWorker` Рё `EngramService.pruneEngrams()` С‚РµРїРµСЂСЊ РїРѕРґРґРµСЂР¶РёРІР°СЋС‚ company-scoped runs Р±РµР· РёР·РјРµРЅРµРЅРёСЏ РіР»РѕР±Р°Р»СЊРЅРѕРіРѕ scheduler/bootstrap contour.
  - Р”РѕР±Р°РІР»РµРЅ audit trail `MEMORY_MAINTENANCE_RUN_COMPLETED` / `MEMORY_MAINTENANCE_RUN_FAILED`, Р° runbook/checklist/audit delta СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ СЃ РЅРѕРІС‹Рј operator control-plane.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/memory-maintenance.service.spec.ts src/shared/memory/memory.controller.spec.ts src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/memory/engram.service.spec.ts` PASS. `pnpm --filter api exec tsc --noEmit` РѕСЃС‚Р°С‘С‚СЃСЏ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№ РЅРµСЃРІСЏР·Р°РЅРЅРѕР№ РѕС€РёР±РєРѕР№ РІ `src/modules/health/health.controller.ts`.
13. **Foundation Remediation вЂ” Memory Lifecycle Multi-Window Burn-Rate Escalation** [DONE]:
  - Р’ Prometheus alert-rules РґРѕР±Р°РІР»РµРЅС‹ `RAIMemoryEngramFormationBurnRateMultiWindow` Рё `RAIMemoryEngramPruningBurnRateMultiWindow` РєР°Рє sustained degradation contour РїРѕ `6h/24h` РѕРєРЅР°Рј.
  - Runbook Рё SLO policy СЂР°СЃС€РёСЂРµРЅС‹: С‚РµРїРµСЂСЊ РµСЃС‚СЊ СЏРІРЅРѕРµ СЂР°Р·РґРµР»РµРЅРёРµ РјРµР¶РґСѓ `burn-high`, `multi-window burn-rate` Рё `hard breach`.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist, maturity dashboard Рё memory-bank, С‡С‚РѕР±С‹ РЅРѕРІС‹Р№ escalation layer Р±С‹Р» РѕС‚СЂР°Р¶С‘РЅ РєР°Рє С‚РµРєСѓС‰РёР№ remediation-state.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `python3` + `PyYAML` load РґР»СЏ `infra/monitoring/prometheus/invariant-alert-rules.yml` PASS, `node scripts/invariant-gate.cjs --mode=warn` PASS.
14. **Foundation Remediation вЂ” Memory Lifecycle Error Budget View** [DONE]:
  - Р’ `InvariantMetricsController` РґРѕР±Р°РІР»РµРЅС‹ derived gauges `memory_engram_formation_budget_usage_ratio` Рё `memory_engram_pruning_budget_usage_ratio` РїРѕРІРµСЂС… С‚РµРєСѓС‰РёС… L4 thresholds.
  - Р’ Prometheus alert-rules РґРѕР±Р°РІР»РµРЅС‹ СЂР°РЅРЅРёРµ burn-high СЃРёРіРЅР°Р»С‹ `RAIMemoryEngramFormationBudgetBurnHigh` Рё `RAIMemoryEngramPruningBudgetBurnHigh`, Р° runbook/SLO/dashboard СЂР°СЃС€РёСЂРµРЅС‹ РїРѕРґ early-warning contour.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist Рё memory-bank, С‡С‚РѕР±С‹ error-budget view Р±С‹Р» РѕС‚СЂР°Р¶С‘РЅ РєР°Рє С‚РµРєСѓС‰РёР№ remediation-state, Р° РЅРµ РѕСЃС‚Р°РІР°Р»СЃСЏ РѕС‚РєСЂС‹С‚С‹Рј РїСѓРЅРєС‚РѕРј.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
15. **Foundation Remediation вЂ” Memory Lifecycle Operator Pause Windows** [DONE]:
  - Р’ `ConsolidationWorker` Рё `EngramFormationWorker` РґРѕР±Р°РІР»РµРЅС‹ time-boxed operator pause windows `*_PAUSE_UNTIL` / `*_PAUSE_REASON` РґР»СЏ scheduler/bootstrap path.
  - Manual maintenance path СЃРѕС…СЂР°РЅС‘РЅ РґРѕСЃС‚СѓРїРЅС‹Рј, Р° `/api/invariants/metrics` Рё Prometheus export СЂР°СЃС€РёСЂРµРЅС‹ pause flags Рё remaining-seconds gauges РґР»СЏ РІСЃРµС… С‡РµС‚С‹СЂС‘С… lifecycle paths.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy, alert runbook Рё memory-bank, С‡С‚РѕР±С‹ operator control Р±С‹Р» РѕС‚СЂР°Р¶С‘РЅ РєР°Рє С‚РµРєСѓС‰РёР№ remediation-state.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
16. **Foundation Remediation вЂ” Engram Lifecycle Throughput Visibility** [DONE]:
  - Р’ `InvariantMetrics` Рё `EngramService` РґРѕР±Р°РІР»РµРЅС‹ L4 throughput counters `memory_engram_formations_total` Рё `memory_engram_pruned_total`.
  - Prometheus export СЂР°СЃС€РёСЂРµРЅ РјРµС‚СЂРёРєР°РјРё `invariant_memory_engram_formations_total` Рё `invariant_memory_engram_pruned_total`, Р° РІ alert-rules РґРѕР±Р°РІР»РµРЅ `RAIMemoryEngramPruningStalled`.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy Рё memory-bank, С‡С‚РѕР±С‹ throughput visibility Р±С‹Р» РѕС‚СЂР°Р¶С‘РЅ РєР°Рє С‚РµРєСѓС‰РёР№ remediation-state.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts src/shared/memory/engram.service.spec.ts` PASS.
17. **Foundation Remediation вЂ” Controlled Memory Backfill Policy** [DONE]:
  - Р’ `ConsolidationWorker` Рё `EngramFormationWorker` РґРѕР±Р°РІР»РµРЅС‹ bounded bootstrap catch-up loops РґР»СЏ controlled recovery РїРѕСЃР»Рµ РїСЂРѕСЃС‚РѕСЏ.
  - Р’РІРµРґРµРЅС‹ env-config caps `MEMORY_CONSOLIDATION_BOOTSTRAP_MAX_RUNS`, `MEMORY_PRUNING_BOOTSTRAP_MAX_RUNS`, `MEMORY_ENGRAM_FORMATION_BOOTSTRAP_MAX_RUNS`, `MEMORY_ENGRAM_PRUNING_BOOTSTRAP_MAX_RUNS`.
  - Targeted specs СЂР°СЃС€РёСЂРµРЅС‹ РЅР° stop-on-drain Рё respect-max-runs РїРѕРІРµРґРµРЅРёРµ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/engram-formation.worker.spec.ts` PASS.
18. **Foundation Remediation вЂ” Engram Lifecycle Observability** [DONE]:
  - `InvariantMetricsController` СЂР°СЃС€РёСЂРµРЅ L4 metrics/alerts РґР»СЏ `latestEngramFormationAgeSeconds` Рё `prunableActiveEngramCount`.
  - Р”РѕР±Р°РІР»РµРЅС‹ Prometheus alerts `RAIMemoryEngramFormationStale` Рё `RAIMemoryPrunableActiveEngramsHigh`, Р° С‚Р°РєР¶Рµ runbook-РїСЂРѕС†РµРґСѓСЂС‹ РґР»СЏ РёС… triage.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy Рё memory-bank, С‡С‚РѕР±С‹ engram lifecycle observability Р±С‹Р» РѕС‚СЂР°Р¶С‘РЅ РєР°Рє С‚РµРєСѓС‰РёР№ remediation-state.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
19. **Foundation Remediation вЂ” Broader Engram Lifecycle Scheduling** [DONE]:
  - `EngramFormationWorker` РїРµСЂРµРІРµРґС‘РЅ РІ background lifecycle worker СЃ bootstrap/scheduler wiring РґР»СЏ L4 engram formation Рё pruning.
  - Р”РѕР±Р°РІР»РµРЅС‹ env-config flags `MEMORY_ENGRAM_FORMATION_`*, `MEMORY_ENGRAM_PRUNING_*`, Р° С‚Р°РєР¶Рµ pruning thresholds `MEMORY_ENGRAM_PRUNING_MIN_WEIGHT` Рё `MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS`.
  - Р”РѕР±Р°РІР»РµРЅ targeted spec `apps/api/src/shared/memory/engram-formation.worker.spec.ts` РЅР° bootstrap/scheduler contract Рё pruning thresholds.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/engram-formation.worker.spec.ts` PASS.
20. **Foundation Remediation вЂ” Raw SQL Hardening Phase 2 (Memory Path)** [DONE]:
  - `PrismaService.safeQueryRaw()/safeExecuteRaw()` СЂР°СЃС€РёСЂРµРЅС‹ executor-aware СЂРµР¶РёРјРѕРј РґР»СЏ transaction client.
  - `ConsolidationWorker` Рё `DefaultMemoryAdapter` РїРµСЂРµРІРµРґРµРЅС‹ СЃ РїСЂСЏРјРѕРіРѕ raw SQL РЅР° safe wrappers.
  - `scripts/raw-sql-allowlist.json` СЃСѓР¶РµРЅ: memory path Р±РѕР»СЊС€Рµ РЅРµ С‚СЂРµР±СѓРµС‚ РѕС‚РґРµР»СЊРЅРѕРіРѕ approved raw SQL entry.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts src/shared/memory/memory-adapter.spec.ts` PASS, `node scripts/raw-sql-governance.cjs --mode=enforce` PASS.
21. **Foundation Remediation вЂ” Memory Hygiene Bootstrap Maintenance** [DONE]:
  - Р’ `ConsolidationWorker` РґРѕР±Р°РІР»РµРЅС‹ startup maintenance paths РґР»СЏ consolidation/pruning С‡РµСЂРµР· `MEMORY_CONSOLIDATION_BOOTSTRAP_ENABLED` Рё `MEMORY_PRUNING_BOOTSTRAP_ENABLED`.
  - S-tier memory hygiene С‚РµРїРµСЂСЊ РЅРµ Р·Р°РІРёСЃРёС‚ С‚РѕР»СЊРєРѕ РѕС‚ РїРµСЂРІРѕРіРѕ cron РїРѕСЃР»Рµ СЂРµСЃС‚Р°СЂС‚Р°: РїСЂРё СЃС‚Р°СЂС‚Рµ РїСЂРёР»РѕР¶РµРЅРёСЏ РІРѕР·РјРѕР¶РµРЅ controlled bootstrap drain.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist Рё memory-bank, С‡С‚РѕР±С‹ bootstrap closeout Р±С‹Р» РѕС‚СЂР°Р¶С‘РЅ РєР°Рє С‚РµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ remediation.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts` PASS.
22. **Foundation Remediation вЂ” Memory Hygiene Observability** [DONE]:
  - Р’ `InvariantMetricsController` РґРѕР±Р°РІР»РµРЅ memory hygiene snapshot РІ `/api/invariants/metrics` Рё Prometheus gauges РґР»СЏ backlog/freshness/active engrams.
  - РљРѕРЅС‚СѓСЂ alerting/runbook РѕС‚СЂР°Р¶С‘РЅ РІ `infra/monitoring/prometheus/invariant-alert-rules.yml` Рё `docs/INVARIANT_ALERT_RUNBOOK_RU.md`.
  - РћР±РЅРѕРІР»РµРЅС‹ baseline audit, delta audit, stabilization checklist, maturity dashboard, SLO policy Рё memory-bank, С‡С‚РѕР±С‹ observability closeout Р±С‹Р» РІРёРґРµРЅ РєР°Рє С‚РµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ, Р° РЅРµ СЃРєСЂС‹РІР°Р»СЃСЏ РІ РєРѕРґРµ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/invariants/invariant-metrics.controller.spec.ts` PASS.
23. **Foundation Remediation вЂ” Memory Hygiene Scheduling** [DONE]:
  - Р’ `ConsolidationWorker` РІРєР»СЋС‡РµРЅС‹ cron-based scheduler paths РґР»СЏ СЂРµРіСѓР»СЏСЂРЅРѕР№ РєРѕРЅСЃРѕР»РёРґР°С†РёРё Рё prune S-tier memory.
  - Р”РѕР±Р°РІР»РµРЅС‹ feature flags `MEMORY_HYGIENE_ENABLED`, `MEMORY_CONSOLIDATION_SCHEDULE_ENABLED`, `MEMORY_PRUNING_SCHEDULE_ENABLED`, Р° С‚Р°РєР¶Рµ cron overrides РґР»СЏ Р±РµР·РѕРїР°СЃРЅРѕРіРѕ rollout.
  - Р”РѕР±Р°РІР»РµРЅ targeted spec `apps/api/src/shared/memory/consolidation.worker.spec.ts` РЅР° scheduler contract.
  - Baseline audit, delta audit, stabilization checklist Рё memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ СЃ РЅРѕРІС‹Рј СЃС‚Р°С‚СѓСЃРѕРј partial closeout РїРѕ memory hygiene.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/memory/consolidation.worker.spec.ts` PASS.
24. **Foundation Remediation вЂ” Outbox Productionization (Scheduler Wiring)** [DONE]:
  - Р’ `OutboxRelay` РІРєР»СЋС‡РµРЅС‹ bootstrap drain Рё cron-based scheduler wiring С‡РµСЂРµР· `OUTBOX_RELAY_ENABLED`, `OUTBOX_RELAY_SCHEDULE_ENABLED`, `OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED`.
  - Manual `processOutbox()` path СЃРѕС…СЂР°РЅС‘РЅ, РЅРѕ С‚РµРїРµСЂСЊ relay Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ РЅРµСЏРІРЅРѕРіРѕ РІРЅРµС€РЅРµРіРѕ РІС‹Р·РѕРІР° РґР»СЏ Р±Р°Р·РѕРІРѕРіРѕ С„РѕРЅРѕРІРѕРіРѕ Р·Р°РїСѓСЃРєР°.
  - Р”РѕР±Р°РІР»РµРЅС‹ targeted tests РЅР° bootstrap/scheduler contract РІ `apps/api/src/shared/outbox/outbox.relay.spec.ts`.
  - Baseline audit, delta audit, stabilization checklist Рё memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ СЃ РЅРѕРІС‹Рј СЃС‚Р°С‚СѓСЃРѕРј partial closeout РїРѕ outbox productionization.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec jest --runInBand src/shared/outbox/outbox.relay.spec.ts` PASS.
25. **Foundation Remediation вЂ” Raw SQL Governance Phase 1** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅС‹ `scripts/raw-sql-governance.cjs` Рё `scripts/raw-sql-allowlist.json` РґР»СЏ inventory/allowlist approved raw SQL paths.
  - `scripts/invariant-gate.cjs` С‚РµРїРµСЂСЊ РІРєР»СЋС‡Р°РµС‚ raw SQL governance section Рё СѓРјРµРµС‚ СЂР°Р±РѕС‚Р°С‚СЊ РІ `warn/enforce` СЂРµР¶РёРјРµ Р±РµР· РґРµРєРѕСЂР°С‚РёРІРЅРѕРіРѕ bypass.
  - РЈРґР°Р»РµРЅС‹ `Prisma.$queryRawUnsafe/$executeRawUnsafe` РёР· `scripts/backfill-outbox-companyid.cjs` Рё `scripts/verify-task-fsm-db.cjs`.
  - Baseline audit, delta audit, stabilization checklist Рё memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ СЃ РЅРѕРІС‹Рј СЃС‚Р°С‚СѓСЃРѕРј remediation.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `node scripts/raw-sql-governance.cjs --mode=enforce` PASS, `node scripts/invariant-gate.cjs --mode=warn` PASS.
26. **Foundation Remediation вЂ” Audit Log Immutability** [DONE]:
  - Р’РІРµРґС‘РЅ DB-level append-only enforcement РґР»СЏ `audit_logs` С‡РµСЂРµР· РјРёРіСЂР°С†РёСЋ `20260312170000_audit_log_append_only_enforcement`.
  - РўСЂРёРіРіРµСЂ `trg_audit_logs_append_only` Р¶С‘СЃС‚РєРѕ Р±Р»РѕРєРёСЂСѓРµС‚ `UPDATE/DELETE`, РїРµСЂРµРІРѕРґСЏ audit trail РёР· "tamper-evident only" РІ "tamper-evident + append-only at DB layer".
  - Р”РѕР±Р°РІР»РµРЅ `apps/api/src/shared/audit/audit.service.spec.ts`, РєРѕС‚РѕСЂС‹Р№ С„РёРєСЃРёСЂСѓРµС‚ create-only path Рё РЅР°Р»РёС‡РёРµ `_tamperEvident` metadata.
  - РћР±РЅРѕРІР»РµРЅС‹ С‚РµРєСѓС‰РёРµ СЃС‚Р°С‚СѓСЃРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹: `RAI_EP_SYSTEM_AUDIT_DELTA_2026-03-12.md`, `docs/FOUNDATION_STABILIZATION_CHECKLIST_RU.md`, `memory-bank/activeContext.md`, `memory-bank/TRACELOG.md`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: targeted jest РґР»СЏ `AuditService`.

## 2026-03-07

1. **A_RAI S23 вЂ” Live API Smoke** [APPROVED]:
  - Р”РѕР±Р°РІР»РµРЅ live HTTP smoke suite `apps/api/test/a_rai-live-api-smoke.spec.ts`, РєРѕС‚РѕСЂС‹Р№ РїРѕРґРЅРёРјР°РµС‚ СЂРµР°Р»СЊРЅС‹Р№ feature-module graph `RaiChatModule + ExplainabilityPanelModule` Рё С…РѕРґРёС‚ РІ РЅРµРіРѕ С‡РµСЂРµР· `supertest`.
  - РџРѕРєСЂС‹С‚ РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ Stage 2 API slice: `GET /api/rai/explainability/queue-pressure`, `GET /api/rai/incidents/feed`, `GET /api/rai/agents/config`, `POST /api/rai/agents/config/change-requests`, РїР»СЋСЃ negative case `POST /api/rai/agents/config -> 404`.
  - Smoke РІСЃРєСЂС‹Р» Рё РїРѕРјРѕРі Р·Р°РєСЂС‹С‚СЊ СЂРµР°Р»СЊРЅС‹Рµ wiring gaps: `RaiChatModule -> MemoryModule`, `MemoryModule -> AuditModule`, export `AutonomyPolicyService`.
  - РџСѓРЅРєС‚ readiness `Р•СЃС‚СЊ smoke tests РЅР° Р¶РёРІС‹Рµ API РјР°СЂС€СЂСѓС‚С‹` РїРµСЂРµРІРµРґС‘РЅ РІ `[x]`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, `CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles test/a_rai-live-api-smoke.spec.ts` PASS.
2. **A_RAI S22 вЂ” Queue & Backpressure Visibility** [APPROVED]:
  - `AgentRuntimeService` С‚РµРїРµСЂСЊ РїРёС€РµС‚ per-instance live queue snapshots РІ `QueueMetricsService`, Р° `QueueMetricsService` Р°РіСЂРµРіРёСЂСѓРµС‚ tenant-wide latest state РїРѕ `queueName + instanceId` РёР· persisted `PerformanceMetric`.
  - Р”РѕР±Р°РІР»РµРЅ live API `GET /rai/explainability/queue-pressure`; `Control Tower` РїРѕРєР°Р·С‹РІР°РµС‚ runtime pressure, backlog depth, freshness Рё queue contour Р±РµР· synthetic fallback.
  - Р”РѕР±Р°РІР»РµРЅ producer-side proof РЅР° multi-instance semantics: backlog РЅРµ СЃС…Р»РѕРїС‹РІР°РµС‚СЃСЏ РґРѕ РїРѕСЃР»РµРґРЅРµРіРѕ snapshot РѕРґРЅРѕР№ РЅРѕРґС‹.
  - РџСѓРЅРєС‚ readiness `Р•СЃС‚СЊ queue/backpressure visibility` РїРµСЂРµРІРµРґС‘РЅ РІ `[x]`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted API jest PASS, targeted web jest PASS.
3. **A_RAI S21 вЂ” Runtime Spine Integration Proof** [APPROVED]:
  - Р”РѕР±Р°РІР»РµРЅ integration suite `runtime-spine.integration.spec.ts`, РєРѕС‚РѕСЂС‹Р№ РіРѕРЅСЏРµС‚ СЂРµР°Р»СЊРЅС‹Р№ РїСѓС‚СЊ `Supervisor -> Runtime -> Registry/Governance/Budget/Policy -> Audit/Trace`.
  - Р”РѕРєР°Р·Р°РЅС‹ С‚СЂРё СЃС†РµРЅР°СЂРёСЏ: happy path, `budget deny` СЃ persisted incident/audit/trace, Рё governed registry block path С‡РµСЂРµР· effective runtime state.
  - РџСѓРЅРєС‚ readiness `Р•СЃС‚СЊ integration tests РЅР° runtime spine` РїРµСЂРµРІРµРґС‘РЅ РІ `[x]`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, `CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts` PASS.
4. **A_RAI S20 вЂ” Agent Configurator Closeout** [APPROVED]:
  - `control-tower/agents` Р±РѕР»СЊС€Рµ РЅРµ СЃС‚СЂРѕРёС‚СЃСЏ РІРѕРєСЂСѓРі `global/tenantOverrides + toggle`, Р° С‡РёС‚Р°РµС‚ runtime-aware `agents[]` read model СЃ `runtime.source`, `bindingsSource`, `tenantAccess`, `capabilities`, `tools` Рё `isActive`.
  - Client contract Р±РѕР»СЊС€Рµ РЅРµ СЌРєСЃРїРѕСЂС‚РёСЂСѓРµС‚ configurator `toggle`, Р° legacy backend route `PATCH /rai/agents/config/toggle` СѓРґР°Р»С‘РЅ.
  - Configurator surface РѕСЃС‚Р°РІР»СЏРµС‚ С‚РѕР»СЊРєРѕ governed `createChangeRequest`; HTTP proof РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ effective registry-aware read model Рё `404` РґР»СЏ СЃС‚Р°СЂРѕРіРѕ toggle path.
  - Claim `Agent Configurator СЃСѓС‰РµСЃС‚РІСѓРµС‚ РєР°Рє UI + API РЅР°СЃС‚СЂРѕР№РєРё Р°РіРµРЅС‚РѕРІ` РїРµСЂРµРІРµРґС‘РЅ РІ `CONFIRMED`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.
5. **A_RAI S19 вЂ” Quality Governance Loop** [APPROVED]:
  - `ExplainabilityPanelService` С‚РµРїРµСЂСЊ СЃС‡РёС‚Р°РµС‚ `Correction Rate` РїРѕ decision-scoped persisted advisory feedback СЃ РґРµРґСѓРїР»РёРєР°С†РёРµР№ РїРѕ `traceId`, Р° РЅРµ РїРѕ РґРµРєРѕСЂР°С‚РёРІРЅРѕР№ РёР»Рё РїРѕС‚РµРЅС†РёР°Р»СЊРЅРѕ СЂР°Р·РґСѓРІР°РµРјРѕР№ РјРѕРґРµР»Рё.
  - `AutonomyPolicyService` С„РѕСЂСЃРёСЂСѓРµС‚ `QUALITY_ALERT -> QUARANTINE` РїСЂРё Р°РєС‚РёРІРЅРѕРј `BS_DRIFT`, Р° runtime enforcement РїРѕ-РїСЂРµР¶РЅРµРјСѓ РёРґС‘С‚ С‡РµСЂРµР· `RaiToolsRegistry`, Р±РµР· РѕР±С…РѕРґР° С‡РµСЂРµР· UI/config path.
  - `IncidentOpsService` РѕС‚РґР°С‘С‚ lifecycle-aware governance counters/feed СЃ breakdown РїРѕ quality/autonomy/policy incidents.
  - Claims `Quality & Evals Panel`, `РђРІС‚РѕРЅРѕРјРЅРѕСЃС‚СЊ СЂРµРіСѓР»РёСЂСѓРµС‚СЃСЏ РїРѕ BS% Рё quality alerts`, `Governance counters Рё incidents feed СЂРµР°Р»СЊРЅРѕ Р¶РёРІС‹Рµ` РїРµСЂРµРІРµРґРµРЅС‹ РІ `CONFIRMED`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.
6. **A_RAI S18 вЂ” Budget Controller Runtime** [APPROVED]:
  - `BudgetControllerService` РїРµСЂРµСЃС‚Р°Р» Р±С‹С‚СЊ Р±РѕРєРѕРІС‹Рј СЃРµСЂРІРёСЃРѕРј Рё С‚РµРїРµСЂСЊ С‡РёС‚Р°РµС‚ persisted `agentRegistry.maxTokens`, РІРѕР·РІСЂР°С‰Р°СЏ СЂРµР°Р»СЊРЅС‹Рµ runtime outcomes `ALLOW / DEGRADE / DENY`.
  - `AgentRuntimeService` РїСЂРёРјРµРЅСЏРµС‚ budget decision РґРѕ fan-out: `DEGRADE` СЂРµР¶РµС‚ execution set, `DENY` РѕСЃС‚Р°РЅР°РІР»РёРІР°РµС‚ РІС‹РїРѕР»РЅРµРЅРёРµ РґРѕ РІС‹Р·РѕРІР° tools.
  - `ResponseComposerService` Рё `SupervisorAgent` РґРѕРІРѕР·СЏС‚ `runtimeBudget` РґРѕ response Рё `AiAuditEntry.metadata`.
  - РќР° degraded/denied path С‡РµСЂРµР· `IncidentOpsService` РїРёС€СѓС‚СЃСЏ budget incidents.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
7. **A_RAI S17 вЂ” Control Tower Honesty** [APPROVED]:
  - Persisted evidence trail РґРѕРІРµРґС‘РЅ РґРѕ С‡РµСЃС‚РЅРѕРіРѕ РєРѕРЅС‚СѓСЂР° `evidence -> audit -> forensics/dashboard`.
  - `TruthfulnessEngineService` Р±РѕР»СЊС€Рµ РЅРµ СЂРёСЃСѓРµС‚ synthetic fallback РґР»СЏ `BS%` Рё РІРѕР·РІСЂР°С‰Р°РµС‚ С‡РµСЃС‚РЅС‹Рµ nullable/pending quality-РјРµС‚СЂРёРєРё.
  - `ExplainabilityPanelService` Рё `/control-tower` РїРѕРєР°Р·С‹РІР°СЋС‚ `Acceptance Rate`, `BS%`, `Evidence Coverage`, `qualityKnown/pending` counters Рё `criticalPath`.
  - `Correction Rate` С‡РµСЃС‚РЅРѕ РѕСЃС‚Р°РІР»РµРЅ РєР°Рє `null/N/A`, РїРѕС‚РѕРјСѓ С‡С‚Рѕ РѕС‚РґРµР»СЊРЅС‹Р№ live source РµС‰С‘ РЅРµ РёРЅСЃС‚СЂСѓРјРµРЅС‚РёСЂРѕРІР°РЅ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, `pnpm --filter web exec tsc --noEmit` PASS, targeted jest PASS.
8. **A_RAI S16 вЂ” Eval Productionization** [APPROVED]:
  - Р”РѕР±Р°РІР»РµРЅ persisted `EvalRun` Рё Р¶РёРІР°СЏ СЃРІСЏР·СЊ СЃ `AgentConfigChangeRequest` С‡РµСЂРµР· СЂРµР°Р»СЊРЅС‹Рµ Prisma relations Рё DB-level foreign keys.
  - `GoldenTestRunnerService` СѓСЃРёР»РµРЅ РґРѕ run-level evidence: `corpusSummary`, `caseResults`, `verdictBasis`, СЏРІРЅС‹Рµ verdicts `APPROVED / REVIEW_REQUIRED / ROLLBACK`.
  - `AgentConfigGuardService` Рё `AgentPromptGovernanceService` С‚РµРїРµСЂСЊ РїРёС€СѓС‚ Рё РёСЃРїРѕР»СЊР·СѓСЋС‚ candidate-specific eval evidence РєР°Рє gate.
  - Golden corpus СЂР°СЃС€РёСЂРµРЅ РґР»СЏ РєР°РЅРѕРЅРёС‡РµСЃРєРёС… Р°РіРµРЅС‚РѕРІ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter @rai/prisma-client run db:generate` PASS, `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
9. **A_RAI S15 вЂ” Registry Persisted Bindings** [APPROVED]:
  - Р’РІРµРґРµРЅС‹ persisted Prisma-РјРѕРґРµР»Рё `AgentCapabilityBinding` Рё `AgentToolBinding`, Р° `AgentRegistryService` С‚РµРїРµСЂСЊ СЃС‚СЂРѕРёС‚ effective runtime bindings РёР· Р‘Р”.
  - `AgentRuntimeConfigService` РїРµСЂРµРІРµРґС‘РЅ РЅР° deny-by-default РґР»СЏ governed tools Р±РµР· owner/binding; primary authority Р±РѕР»СЊС€Рµ РЅРµ РёРґС‘С‚ С‡РµСЂРµР· `TOOL_RUNTIME_MAP`.
  - `UpsertAgentConfigDto` РїРѕР»СѓС‡РёР» explicit `tools`, Р° governed sync РїРµСЂРµСЃС‚Р°Р» Р°РІС‚РѕРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ tool bindings С‚РѕР»СЊРєРѕ РёР· РґРµС„РѕР»С‚РѕРІ СЂРѕР»Рё.
  - Persisted `agent -> tools/capabilities` mapping СЃС‚Р°Р» СЂРµР°Р»СЊРЅРѕР№ authority-РјРѕРґРµР»СЊСЋ РґР»СЏ runtime Рё management path.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter @rai/prisma-client run db:generate` PASS, `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
10. **A_RAI S14 вЂ” Prompt Governance Closeout** [APPROVED]:
  - Canonical control-plane contract РїРµСЂРµРІРµРґС‘РЅ РЅР° `POST /rai/agents/config/change-requests` Рё `.../change-requests/:id/...`.
  - Legacy direct-write path `POST /rai/agents/config` СѓР±СЂР°РЅ; controller-level HTTP proof РїРѕРґС‚РІРµСЂР¶РґР°РµС‚, С‡С‚Рѕ СЃС‚Р°СЂС‹Р№ write path РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚.
  - Р”РѕР±Р°РІР»РµРЅС‹ controller-level РїСЂРѕРІРµСЂРєРё РЅР° create change request, degraded canary rollback outcome Рё tenant-bypass denial.
  - Client contract `apps/web/lib/api.ts` Рё control-plane surface `control-tower/agents` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° governed semantics РІРјРµСЃС‚Рѕ direct CRUD-РёР»Р»СЋР·РёРё.
  - Claim `PromptChange RFC` РїРµСЂРµРІРµРґС‘РЅ РёР· `PARTIAL` РІ `CONFIRMED`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --filter api exec tsc --noEmit` PASS, targeted jest PASS.
11. **A_RAI S13 вЂ” Autonomy/Policy Incidents & Runbooks** [APPROVED]:
  - `SystemIncident` СЂР°СЃС€РёСЂРµРЅ explicit lifecycle `status`; РґРѕР±Р°РІР»РµРЅС‹ live autonomy/policy incident types.
  - Р”РѕР±Р°РІР»РµРЅР° persisted РјРѕРґРµР»СЊ `IncidentRunbookExecution`.
  - `RaiToolsRegistry` С‚РµРїРµСЂСЊ РїРёС€РµС‚ live incidents РґР»СЏ `QUARANTINE`, `TOOL_FIRST` Рё `RiskPolicy` blocked critical actions.
  - `AgentPromptGovernanceService` РїРёС€РµС‚ live `PROMPT_CHANGE_ROLLBACK` incident.
  - Р РµР°Р»РёР·РѕРІР°РЅ endpoint `POST /rai/incidents/:id/runbook` СЃ РёСЃРїРѕР»РЅСЏРµРјС‹РјРё actions `REQUIRE_HUMAN_REVIEW` Рё `ROLLBACK_CHANGE_REQUEST`.
  - Governance feed/counters С‚РµРїРµСЂСЊ СѓС‡РёС‚С‹РІР°СЋС‚ autonomy/policy incidents РѕС‚РґРµР»СЊРЅРѕ Рё РІРѕР·РІСЂР°С‰Р°СЋС‚ explicit incident status.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm prisma:generate` PASS, `pnpm prisma:build-client` PASS, `pnpm --dir apps/api exec tsc --noEmit` PASS, targeted jest PASS.
12. **A_RAI R12 вЂ” Prompt Governance Reality** [READY_FOR_REVIEW]:
  - Р”РѕР±Р°РІР»РµРЅ persisted workflow `AgentConfigChangeRequest` РґР»СЏ agent prompt/model/config changes.
  - Р РµР°Р»РёР·РѕРІР°РЅ `AgentPromptGovernanceService` СЃ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј РїСѓС‚С‘Рј `create change -> eval -> canary start -> canary review -> promote/rollback`.
  - `POST /rai/agents/config` Р±РѕР»СЊС€Рµ РЅРµ РїРёС€РµС‚ production config РЅР°РїСЂСЏРјСѓСЋ; production activation РІС‹РїРѕР»РЅСЏРµС‚СЃСЏ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· `promoteApprovedChange()`.
  - РџСЂСЏРјРѕР№ bypass С‡РµСЂРµР· `toggle(true)` Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ; enable С‚СЂРµР±СѓРµС‚ governed workflow.
  - `GoldenTestRunnerService` СЂР°СЃС€РёСЂРµРЅ РґРѕ agent-aware СЂРµР¶РёРјР°: РґРѕР±Р°РІР»РµРЅС‹ golden sets РґР»СЏ `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent`, eval РїСЂРёРІСЏР·Р°РЅ Рє СЂРµР°Р»СЊРЅРѕРјСѓ change candidate (`promptVersion`, `modelName`).
  - Р’ `CanaryService` РґРѕР±Р°РІР»РµРЅР° rejection-rate evaluation РґР»СЏ prompt/config canary path; degraded canary СѓРІРѕРґРёС‚ workflow РІ rollback Рё quarantine outcome.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm prisma:generate` PASS, `pnpm prisma:build-client` PASS, `pnpm --dir apps/api exec tsc --noEmit` PASS, targeted jest PASS.

## 2026-03-07

1. **A_RAI R10 вЂ” Registry Domain Model** [APPROVED]:
  - Р”РѕР±Р°РІР»РµРЅ `AgentRegistryService` РєР°Рє first-class РґРѕРјРµРЅРЅС‹Р№ СЃР»РѕР№ authority РґР»СЏ Р°РіРµРЅС‚РѕРІ `agronomist`, `economist`, `knowledge`, `monitoring`.
  - Registry С‚РµРїРµСЂСЊ СЏРІРЅРѕ СЃРѕР±РёСЂР°РµС‚ `AgentDefinition`, effective runtime policy Рё `AgentTenantAccess` (`INHERITED` / `OVERRIDE` / `DENIED`).
  - `AgentRuntimeConfigService` Р±РѕР»СЊС€Рµ РЅРµ С‡РёС‚Р°РµС‚ `AgentConfiguration` РЅР°РїСЂСЏРјСѓСЋ; runtime СЂРµС€РµРЅРёСЏ РёРґСѓС‚ С‡РµСЂРµР· registry-domain layer.
  - `AgentConfiguration` РїРµСЂРµРІРµРґС‘РЅ РІ СЂРѕР»СЊ legacy storage / projection, Р° management API (`AgentManagementService`) С‚РµРїРµСЂСЊ РѕС‚РґР°С‘С‚ РґРѕРјРµРЅРЅСѓСЋ read model `agents`.
  - РСЃРїСЂР°РІР»РµРЅС‹ Р·Р°РјРµС‡Р°РЅРёСЏ С‚РµС…Р»РёРґР°: СѓР±СЂР°РЅРѕ `catalog` auto-enable Р±РµР· persisted authority; `role` Р·Р°РјРєРЅСѓС‚ РЅР° РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ РґРѕРјРµРЅ `agronomist|economist|knowledge|monitoring`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --dir apps/api exec tsc --noEmit` PASS; targeted jest PASS (26 tests); execution path РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ `agent_disabled` Рё `capability_denied`.
2. **A_RAI R12 вЂ” Prompt Governance Reality** [APPROVED]:
  - Р’РІРµРґС‘РЅ persisted safe-evolution workflow: `AgentConfigChangeRequest` + `AgentPromptGovernanceService` СЃРѕ state machine `change request -> eval -> canary -> promote/rollback`.
  - РџСЂСЏРјРѕР№ production write С‡РµСЂРµР· `POST /rai/agents/config` СѓР±СЂР°РЅ; `toggle(true)` Рё service-level bypass РЅР° Р·Р°РїРёСЃСЊ production config Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅС‹.
  - `GoldenTestRunnerService` СѓСЃРёР»РµРЅ РґРѕ agent/candidate-aware eval logic: verdict С‚РµРїРµСЂСЊ Р·Р°РІРёСЃРёС‚ РѕС‚ role, activation, prompt/model metadata, budget Рё capability/tool bindings, Р° РЅРµ РѕС‚ РѕРґРЅРѕРіРѕ `IntentRouter`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `pnpm --dir apps/api exec tsc --noEmit` PASS; targeted jest PASS (15 tests).

## 2026-03-10

1. **Service Startup Verification (API/WEB/TG)** [DONE]:
  - API (РїРѕСЂС‚ 4000), Web (РїРѕСЂС‚ 3000) Рё Telegram (РїРѕСЂС‚ 4002) РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РєР°Рє Р·Р°РїСѓС‰РµРЅРЅС‹Рµ.
  - РџСЂРѕС†РµСЃСЃС‹ РІРёСЃСЏС‚, РїРѕСЂС‚С‹ СЃР»СѓС€Р°СЋС‚СЃСЏ, `pnpm dev` РЅРµ С‚СЂРµР±СѓРµС‚СЃСЏ, С‚Р°Рє РєР°Рє РІСЃС‘ СѓР¶Рµ Рё С‚Р°Рє РїРёР·РґР°С‚Рѕ СЂР°Р±РѕС‚Р°РµС‚.
2. **Chief Agronomist (РњРµРіР°-РђРіСЂРѕРЅРѕРј) вЂ” Expert-Tier Agent Design** [DONE]:
  - РЎРїСЂРѕРµРєС‚РёСЂРѕРІР°РЅ Рё РґРѕРєСѓРјРµРЅС‚РёСЂРѕРІР°РЅ РЅРѕРІС‹Р№ РєР»Р°СЃСЃ Р°РіРµРЅС‚Р° вЂ” expert-tier `chief_agronomist` (Р¦РёС„СЂРѕРІРѕР№ РњРµРіР°-РђРіСЂРѕРЅРѕРј).
  - РЎРѕР·РґР°РЅ РїРѕР»РЅС‹Р№ РїСЂРѕС„РёР»СЊРЅС‹Р№ РїР°СЃРїРѕСЂС‚: `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CHIEF_AGRONOMIST.md` (v1.1.0).
  - РђСЂС…РёС‚РµРєС‚СѓСЂРЅРѕРµ СЂРµС€РµРЅРёРµ: РњРµРіР°-РђРіСЂРѕРЅРѕРј РЅР°С…РѕРґРёС‚СЃСЏ **РІРЅРµ** СЃС‚Р°РЅРґР°СЂС‚РЅРѕРіРѕ orchestration spine, СЂР°Р±РѕС‚Р°РµС‚ РЅР° PRO/Heavy РјРѕРґРµР»СЏС… РР РїРѕ Р·Р°РїСЂРѕСЃСѓ (on-demand).
  - Р’РІРµРґС‘РЅ РЅРѕРІС‹Р№ РєР»Р°СЃСЃ СЂРѕР»РµР№ вЂ” expert-tier вЂ” РѕС‚Р»РёС‡РЅС‹Р№ РѕС‚ РєР°РЅРѕРЅРёС‡РµСЃРєРёС… runtime-Р°РіРµРЅС‚РѕРІ Рё РѕР±С‹С‡РЅС‹С… template roles.
  - РћС‚РЅРѕС€РµРЅРёРµ Рє `agronomist`: РёРµСЂР°СЂС…РёС‡РµСЃРєРё РІС‹С€Рµ, РЅРѕ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕ РЅРµР·Р°РІРёСЃРёРј. `agronomist` вЂ” РёСЃРїРѕР»РЅРёС‚РµР»СЊ СЂСѓС‚РёРЅС‹, `chief_agronomist` вЂ” СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ СЌРєСЃРїРµСЂС‚.
  - РЎРІСЏР·Рё: `marketer` (РёРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹Р№ feed) в†’ `chief_agronomist` (СЌРєСЃРїРµСЂС‚РёР·Р°) в†’ `knowledge` (РїСЂРµС†РµРґРµРЅС‚РЅР°СЏ Р±Р°Р·Р°) в†’ `consulting` (РєРµР№СЃС‹ РїР°СЂС‚РЅС‘СЂРѕРІ).
  - РћРїСЂРµРґРµР»РµРЅС‹ 10 С†РµР»РµРІС‹С… intent-РѕРІ, 10 expert-tier tools, РјРѕРґРµР»СЊРЅР°СЏ СЃС‚СЂР°С‚РµРіРёСЏ Рё cost control.
  - РћР±РЅРѕРІР»РµРЅС‹: `INDEX.md`, `INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md` (РјР°С‚СЂРёС†Р° РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё + РјР°С‚СЂРёС†Р° СЃРІСЏР·РµР№).
  - **[v1.1]** Dual Operation Mode: Lightweight (С„РѕРЅРѕРІС‹Р№, РґРµС€С‘РІС‹Р№, engram curator) + Full PRO (on-demand, С‚СЏР¶С‘Р»С‹Р№).
  - **[v1.1]** Р­РЅРіСЂР°РјРЅС‹Р№ РєРѕРЅС‚СѓСЂ: РњРµРіР°-РђРіСЂРѕРЅРѕРј = РіР»Р°РІРЅС‹Р№ РїРѕС‚СЂРµР±РёС‚РµР»СЊ Р РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊ Р°РіСЂРѕ-СЌРЅРіСЂР°РјРј (Formationв†’Strengtheningв†’Recallв†’Feedback).
  - **[v1.1]** РџСЂРѕР°РєС‚РёРІРЅРѕСЃС‚СЊ: monitoring в†’ alert в†’ chief_agronomist Lightweight в†’ РјРёРЅРё-С‚РёРї в†’ С‡РµР»РѕРІРµРє в†’ Full PRO (РµСЃР»Рё РЅСѓР¶РЅРѕ).
  - **[v1.1]** Р­С‚РёС‡РµСЃРєРёР№ guardrail COMMERCIAL_TRANSPARENCY (РјРѕРґРµР»СЊ D+E): РўРћРџ-3 Р°Р»СЊС‚РµСЂРЅР°С‚РёРІС‹, С‚РµРі [РџРђР РўРќРЃР ], РЅР°СѓРєР° > РєРѕРјРјРµСЂС†РёСЏ, performance-based commission.
  - **[v1.1]** РљСЂРѕСЃСЃ-РїР°СЂС‚РЅС‘СЂСЃРєРёРµ СЌРЅРіСЂР°РјС‹ (СЃРµС‚РµРІРѕР№ СЌС„С„РµРєС‚) + Engram-Backed Trust Score (РґР»СЏ Р±Р°РЅРєРѕРІ/СЃС‚СЂР°С…РѕРІС‹С…).
3. **Memory System: Cognitive Memory Architecture v2** [DONE вЂ” ALL PHASES 1-5.4]:
  - РЎРїСЂРѕРµРєС‚РёСЂРѕРІР°РЅР° Рё РїРѕР»РЅРѕСЃС‚СЊСЋ СЂРµР°Р»РёР·РѕРІР°РЅР° 6-СѓСЂРѕРІРЅРµРІР°СЏ РєРѕРіРЅРёС‚РёРІРЅР°СЏ СЃРёСЃС‚РµРјР° РїР°РјСЏС‚Рё.
  - **Implementation**: L1 Working Memory, L2 Episodic, L4 Engrams (Vector HNSW), L6 Network Effect / Trust Score.
  - **Background Workers**: ConsolidationWorker, EngramFormationWorker.
  - **Seasonal Loop**: SeasonalLoopService (batch processing, cross-partner knowledge share).
  - **Expert Integration**: MemoryCoordinatorService + MemoryFacade + AgentMemoryContext.
  - **TypeScript 0 РѕС€РёР±РѕРє.** РђСЂС…РёС‚РµРєС‚СѓСЂР° РіРѕС‚РѕРІР° Рє СЂР°Р±РѕС‚Рµ СЃ PRO-РјРѕРґРµР»СЏРјРё.
4. **Expert-Tier Agents: Chief Agronomist & Data Scientist** [DONE вЂ” Phase 3-5 IMPLEMENTED]:
  - Р РµР°Р»РёР·РѕРІР°РЅС‹ СЃРµСЂРІРёСЃС‹ Рё Р°РіРµРЅС‚С‹: `ChiefAgronomistAgent` & `DataScientistAgent`.
  - **Chief Agronomist**: ExpertInvocationEngine (PRO-mode, cost control), Expert Opinion, Alert Tips, Ethical Guardrail.
  - **Data Scientist**: Core Analytics, Feature Store, Model Registry (ML Pipeline), Yield Prediction, Disease Risk Model, Cost Optimization, A/B Testing.
  - **Integration**: РџРѕР»РЅР°СЏ РёРЅС‚РµРіСЂР°С†РёСЏ РІ `AgentRegistryService` Рё `AgentExecutionAdapterService`.
  - **Memory Integration**: РђРіРµРЅС‚С‹ РёСЃРїРѕР»СЊР·СѓСЋС‚ РІСЃРµ СѓСЂРѕРІРЅРё РїР°РјСЏС‚Рё (L1-L6) РґР»СЏ СЌРєСЃРїРµСЂС‚РЅС‹С… РІС‹РІРѕРґРѕРІ.
  - **Status**: Р’С€РёС‚С‹ РІ СЂР°РЅС‚Р°Р№Рј, РєРѕРјРїРёР»РёСЂСѓСЋС‚СЃСЏ Р±РµР· РѕС€РёР±РѕРє.
5. **GIT PUSH Stage 2 & Front Office & Runtime Governance** [DONE]:
  - Р’СЃРµ Р»РѕРєР°Р»СЊРЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ РїРѕ Stage 2 Interaction Blueprint, Front Office Agent Рё Runtime Governance (РјРёРіСЂР°С†РёРё Prisma, СЃРµСЂРІРёСЃС‹, РєРѕРЅС‚СЂРѕР»Р»РµСЂС‹) Р·Р°РїСѓС€РµРЅС‹ РІ РјР°СЃС‚РµСЂ.
  - Р РµРїРѕР·РёС‚РѕСЂРёР№ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ.
  - Р”РѕР±Р°РІР»РµРЅС‹ РЅРѕРІС‹Рµ РіР°Р№РґР»Р°Р№РЅС‹ РїРѕ СЌРІРѕР»СЋС†РёРё Р°РіРµРЅС‚РѕРІ Рё GAP-Р°РЅР°Р»РёР· РїРѕ Control Tower.
6. **Front Office Threads & Handoffs Implementation** [DONE]:
  - Р РµР°Р»РёР·РѕРІР°РЅР° РјРѕРґРµР»СЊ `FrontOfficeThread` Рё `FrontOfficeHandoff` РІ Prisma.
  - Р”РѕР±Р°РІР»РµРЅ `FrontOfficeCommunicationRepository` Рё `FrontOfficeHandoffOrchestratorService`.
  - РџРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ РїРµСЂРµРІРѕРґ С‡Р°С‚Р° РёР· СЂРµР¶РёРјР° "Agent Only" РІ "Manager Assisted".
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: tsc PASS, prisma migrations PASS.
7. **Agent Lifecycle Runtime Control** [DONE]:
  - Р РµР°Р»РёР·РѕРІР°РЅ `AgentLifecycleControlService` РґР»СЏ С„РѕСЂСЃРёСЂРѕРІР°РЅРёСЏ СЃРѕСЃС‚РѕСЏРЅРёР№ FROZEN Рё RETIRED.
  - Р”РѕР±Р°РІР»РµРЅР° РїРѕРґРґРµСЂР¶РєР° `agentLifecycleOverride` РІ runtime governance.
  - РћР±РЅРѕРІР»РµРЅ РєР°РЅРѕРЅ `RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: unit tests PASS.
8. **Telegram Hybrid Manager Workspace** [DONE]:
  - Р”РѕР±Р°РІР»РµРЅР° РїРѕРґРґРµСЂР¶РєР° Telegram WebApp РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ РІРѕСЂРєСЃРїРµР№СЃРѕРј РјРµРЅРµРґР¶РµСЂР°.
  - Р РµР°Р»РёР·РѕРІР°РЅ `TelegramPollingConflictGuard` РґР»СЏ Р±РµР·РѕРїР°СЃРЅРѕР№ СЂР°Р±РѕС‚С‹ Р±РѕС‚Р° РІ РіРёР±СЂРёРґРЅРѕРј СЂРµР¶РёРјРµ.
  - Р’РЅРµРґСЂРµРЅР° Р°РІС‚РѕСЂРёР·Р°С†РёСЏ `telegram-webapp` РІ `apps/web`.
9. **Application Services Startup** [DONE]:
  - РџРѕРґРЅСЏС‚С‹ API (РїРѕСЂС‚ 4000) Рё Web (РїРѕСЂС‚ 3000) СЃРµСЂРІРµСЂС‹ С‡РµСЂРµР· `pnpm dev`.
  - Prisma client РїРµСЂРµРіРµРЅРµСЂРёСЂРѕРІР°РЅ РґР»СЏ РѕР±РµСЃРїРµС‡РµРЅРёСЏ Р°РєС‚СѓР°Р»СЊРЅРѕСЃС‚Рё С‚РёРїРѕРІ.
10. **Git Pull & Encoding Fix (P1.5)** [DONE]:
  - РЎРґРµР»Р°РЅ `git pull origin main`. Р’ РјР°СЃС‚РµСЂРµ РѕРєР°Р·Р°Р»СЃСЏ Р»СЋС‚С‹Р№ РїРёР·РґРµС† СЃ РєРѕРґРёСЂРѕРІРєРѕР№ (mojibake).
  - Р›РѕРєР°Р»СЊРЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ Р±С‹Р»Рё Р·Р°РЅР°С‡РµРЅС‹ (`git stash`).
  - РљРѕРЅС„Р»РёРєС‚С‹ СЂР°Р·СЂРµС€РµРЅС‹ РІ РїРѕР»СЊР·Сѓ СЃС‚Р°С€Р°, РєРѕРґРёСЂРѕРІРєР° РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅР° РґРѕ С‡РµР»РѕРІРµС‡РµСЃРєРѕР№.
  - Р’СЃРµ С„Р°Р№Р»С‹ РёР· `docs/` Рё `apps/` РїСЂРёРІРµРґРµРЅС‹ РІ РїРѕСЂСЏРґРѕРє.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `grep` РїРѕ "Р ЛњР СњР РЋР Сћ" РЅРёС‡РµРіРѕ РЅРµ РЅР°С…РѕРґРёС‚, СЂСѓСЃСЃРєРёР№ С‚РµРєСЃС‚ С‡РёС‚Р°РµС‚СЃСЏ.

## Status: Refactoring Tenant Isolation & Fixing Type Resolution

### Completed:

1. **Schema Refactoring**:
  - Renamed `tenantId` to `companyId` in `AgroEventDraft` and `AgroEventCommitted` for 10/10 tenant isolation compliance.
  - Updated models to include relations to the `Company` model.
2. **Prisma Client Regeneration**:
  - Regenerated Prisma Client after schema changes.
  - Confirmed `agroEventCommitted` exists in `generated-client/index.d.ts`.
3. **PrismaService Modernization**:
  - Implemented a **Transparent Proxy** in `PrismaService` constructor to automatically route all model delegates through the isolated `tenantClient`.
  - Removed 70+ manual model getters.
  - Updated `tenantScopedModels` to include Agro Event models.
4. **Automation & Contracts**:
  - Added `db:client` and `postinstall` scripts to root `package.json`.
  - Created `docs/01_ARCHITECTURE/PRISMA_CLIENT_CONTRACT.md`.
5. **IDE Fixes**:
  - Created root `tsconfig.json` to resolve `@nestjs/common` and package paths for files in `docs/` and other non-app directories.
  - Added path mapping for `@nestjs/`* to `apps/api/node_modules`.
6. **RAI Chat Integration (P0.1)** вњ…:
  - Р РµР°Р»РёР·РѕРІР°РЅ СЌРЅРґРїРѕРёРЅС‚ `POST /api/rai/chat` РІ API СЃ РёР·РѕР»СЏС†РёРµР№ С‚РµРЅРµРЅС‚РѕРІ.
  - Р’РµР±-С‡Р°С‚ РїРµСЂРµРєР»СЋС‡РµРЅ РЅР° Р±СЌРєРµРЅРґ, РјРѕРєРё РІ Next.js Р·Р°РјРµРЅРµРЅС‹ РїСЂРѕРєСЃРё.
  - Unit-С‚РµСЃС‚С‹ РїСЂРѕР№РґРµРЅС‹ (4/4).
7. **Agro Draftв†’Commit (P0.3)** вњ…:
  - Р”РѕР±Р°РІР»РµРЅ Р±РѕРµРІРѕР№ РјРѕРґСѓР»СЊ `apps/api/src/modules/agro-events/`* СЃ РѕРїРµСЂР°С†РёСЏРјРё draft/fix/link/confirm/commit.
  - Tenant isolation: `companyId` Р±РµСЂС‘С‚СЃСЏ РёР· security context, РЅРµ РёР· payload.
  - РџСЂРѕРІРµСЂРєР° MUST-gate: `apps/api/jest.agro-events.config.js` в†’ PASS (4/4).
8. **Telegram Bot в†’ Agro API (P0.4)** вњ…:
  - Р‘РѕС‚ РїРѕРґРєР»СЋС‡С‘РЅ Рє `/api/agro-events/`*: intake text/photo/voice в†’ draft, РєРЅРѕРїРєРё вњ…вњЏпёЏрџ”—, callback `ag:<action>:<draftId>`, РІС‹Р·РѕРІС‹ fix/link/confirm.
  - Unit + smoke-СЃРєСЂРёРїС‚ РїСЂРѕР№РґРµРЅС‹. Р РµРІСЊСЋ APPROVED. Р–РёРІРѕР№ e2e РЅРµ РїСЂРѕРіРЅР°РЅ вЂ” РїСЂРёС‘РјРєР° СЃ СЂРёСЃРєРѕРј.
9. **AgroEscalation + controller loop (P0.5)** вњ…:
  - `AgroEscalationLoopService` РїРѕРґРєР»СЋС‡С‘РЅ РїРѕСЃР»Рµ commit РІ `agro-events`; РїРѕСЂРѕРіРё S3 (delayDaysв‰Ґ4), S4 (delayDaysв‰Ґ7); РёРґРµРјРїРѕС‚РµРЅС‚РЅРѕСЃС‚СЊ РїРѕ eventId+metricKey.
  - Unit 7/7, tenant РёР· committed. Р РµРІСЊСЋ APPROVED. Р–РёРІРѕР№ РёРЅС‚РµРіСЂР°С†РёРѕРЅРЅС‹Р№ РїСЂРѕРіРѕРЅ РЅРµ РїСЂРѕРіРЅР°РЅ.
10. **Typed tools registry (P1.1)** вњ…:
  - `RaiToolsRegistry` (joi, register/execute), 2 РёРЅСЃС‚СЂСѓРјРµРЅС‚Р° (echo_message, workspace_snapshot), С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹Рµ DTO (toolCalls, suggestedActions, widgets[].payload Record<string, unknown>).
  - Unit 4/4 (jest direct; pnpm test 137). Р РµРІСЊСЋ APPROVED.
11. **WorkspaceContext (P0.2)** вњ…:
  - РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ РєРѕРЅС‚СЂР°РєС‚ `workspace-context.ts` (Zod) + store + РїР°Р±Р»РёС€РµСЂС‹ (FarmDetailsPage, TechMap active). AiChatStore РїРµСЂРµРґР°С‘С‚ context РІ POST /api/rai/chat; API- ## 2026-03-03 (Session Start)

- Р§С‚РµРЅРёРµ С‚РµРєСѓС‰РµРіРѕ СЃРѕСЃС‚РѕСЏРЅРёСЏ РїСЂРѕРµРєС‚Р° (INDEX.md, Checklist)
- Р РµРІСЊСЋ РіРѕС‚РѕРІС‹С… РѕС‚С‡РµС‚РѕРІ (S4.1) [APPROVED]
- Р¤РёРЅР°Р»РёР·Р°С†РёСЏ S4.1 (INDEX, Report, MB) [DONE]
- Р РµРІСЊСЋ Рё С„РёРЅР°Р»РёР·Р°С†РёСЏ S5.1 (Memory Adapter) [DONE]
- РћРїСЂРµРґРµР»РµРЅРёРµ СЃР»РµРґСѓСЋС‰РµРіРѕ С€Р°РіР° РїРѕ Stage 2 Plan [PENDING]
[x] РџРѕРґРіРѕС‚РѕРІРёС‚СЊ РїР»Р°РЅ СЃРѕР·РґР°РЅРёСЏ РїСЂРѕРјС‚Р° `implementation_plan.md`
- РЎРѕР·РґР°С‚СЊ С„Р°Р№Р» РїСЂРѕРјС‚Р° `interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md`
- РћР±РЅРѕРІРёС‚СЊ `interagency/INDEX.md`
- Р РµР°Р»РёР·Р°С†РёСЏ Рё РѕС‚С‡РµС‚ S4.1 [ ]
- РЈРІРµРґРѕРјРёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
СЃРєР°СЏ С‚РёРїРёР·РёСЂРѕРІР°РЅРЅР°СЏ СЃС…РµРјР° `widgets[]` v1.0 (API/Web). `RaiChatService` РІРѕР·РІСЂР°С‰Р°РµС‚ `DeviationList` Рё `TaskBacklog` РІРёРґР¶РµС‚С‹. Р РµРІСЊСЋ APPROVED (2026-03-02).

1. **Interagency Synchronization** вњ…:
  - РР·СѓС‡РµРЅС‹ Рё РїСЂРёРЅСЏС‚С‹ Рє РёСЃРїРѕР»РЅРµРЅРёСЋ `ORCHESTRATOR PROMPT` Рё `STARTER PROMPT`.
  - РЈСЃС‚Р°РЅРѕРІР»РµРЅ Р¶РµСЃС‚РєРёР№ РїСЂРёРѕСЂРёС‚РµС‚ `interagency/` РІРѕСЂРєР»РѕСѓ.
2. **Agent Chat Memory (P1.3)** вњ…:
  - Р РµС€РµРЅРёРµ AG-CHAT-MEMORY-001 РџР РРќРЇРўРћ.
  - Р РµР°Р»РёР·РѕРІР°РЅС‹ retrieve + append РІ RAI Chat; Р»РёРјРёС‚С‹/timeout/fail-open, denylist СЃРµРєСЂРµС‚РѕРІ.
  - Unit-С‚РµСЃС‚С‹ РїСЂРѕР№РґРµРЅС‹ (5/5), РёР·РѕР»СЏС†РёСЏ РїСЂРѕРІРµСЂРµРЅР°.
3. **Status Truth Sync (P1.4)** вњ…:
  - Р РµС€РµРЅРёРµ AG-STATUS-TRUTH-001 РџР РРќРЇРўРћ.
  - Truth-sync РґР»СЏ PROJECT_EXECUTION_CHECKLIST, FULL_PROJECT_WBS, TECHNICAL_DEVELOPMENT_PLAN.
  - Evidence/РєРѕРјР°РЅРґС‹ РїСЂРѕРІРµСЂРєРё РґР»СЏ P0/P1; РїРѕР»РЅС‹Р№ РїСЂРѕС…РѕРґ docs/07_EXECUTION/* вЂ” backlog.
  - Р РµРІСЊСЋ APPROVED (2026-03-02).
4. **WorkspaceContext Expand (P2.1)** вњ…:
  - Р РµС€РµРЅРёРµ AG-WORKSPACE-CONTEXT-EXPAND-001 РџР РРќРЇРўРћ.
  - Commerce contracts + consulting/execution/manager РїСѓР±Р»РёРєСѓСЋС‚ contract/operation refs, summaries, filters.
  - Web-spec PASS; tenant isolation СЃРѕС…СЂР°РЅС‘РЅ. Р РµРІСЊСЋ APPROVED (2026-03-02).
5. **External Signals Advisory (P2.2)** вњ…:
  - Р РµС€РµРЅРёРµ AG-EXTERNAL-SIGNALS-001 РџР РРќРЇРўРћ.
  - Р РµР°Р»РёР·РѕРІР°РЅ С‚РѕРЅРєРёР№ СЃСЂРµР· `signals -> advisory -> feedback -> memory append` РІ RAI Chat; explainability, feedback, episodic memory.
  - Unit 8/8 PASS; tenant isolation СЃРѕС…СЂР°РЅС‘РЅ. Р РµРІСЊСЋ APPROVED (2026-03-02).
6. **AppShell (S1.1)** вњ…:
  - Р РµС€РµРЅРёРµ AG-APP-SHELL-001 РџР РРќРЇРўРћ.
  - AppShell + LeftRaiChatDock, С‡Р°С‚ РЅРµ СЂР°Р·РјРѕРЅС‚РёСЂСѓРµС‚СЃСЏ РїСЂРё РЅР°РІРёРіР°С†РёРё; РёСЃС‚РѕСЂРёСЏ Рё Dock/Focus СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ.
  - tsc + unit PASS; manual smoke РЅРµ РІС‹РїРѕР»РЅРµРЅ. Р РµРІСЊСЋ APPROVED (2026-03-02).
7. **TopNav Navigation (S1.2)** вњ…:
  - Р РµС€РµРЅРёРµ AG-S1-2-TOPNAV-001 РџР РРќРЇРўРћ.
  - Р’РЅРµРґСЂРµРЅР° РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅР°СЏ РЅР°РІРёРіР°С†РёСЏ (TopNav), СѓРґР°Р»РµРЅ Sidebar.
  - Р РµР°Р»РёР·РѕРІР°РЅР° РґРѕРјРµРЅРЅР°СЏ РіСЂСѓРїРїРёСЂРѕРІРєР° РјРµРЅСЋ (РЈСЂРѕР¶Р°Р№, CRM, Р¤РёРЅР°РЅСЃС‹, РљРѕРјРјРµСЂС†РёСЏ, РќР°СЃС‚СЂРѕР№РєРё).
  - РРЅС‚РµРіСЂРёСЂРѕРІР°РЅ РІРёР·СѓР°Р»СЊРЅС‹Р№ РѕС‚РєР»РёРє РІ RAI Output (Р°РІС‚Рѕ-СЃРєСЂРѕР»Р» Рё РїРѕРґСЃРІРµС‚РєР° РІРёРґР¶РµС‚РѕРІ РёР· РјРёРЅРё-РёРЅР±РѕРєСЃР°).
  - РўРµСЃС‚С‹ РљРѕРґРµРєСЃР° PASS (189/189). Р РµРІСЊСЋ APPROVED (2026-03-03).
8. **TopNav / Role Switch Hotfix (S1.3)** вњ…:
  - Р’РЅРµРїР»Р°РЅРѕРІС‹Рµ UI-РїСЂР°РІРєРё РїСЂРѕРІРµРґРµРЅС‹ С‡РµСЂРµР· РѕС‚РґРµР»СЊРЅС‹Р№ canonical hotfix-РєРѕРЅС‚СѓСЂ.
  - `TopNav`: РёРєРѕРЅРєРё РІС‹РЅРµСЃРµРЅС‹ РІ РіРѕР»РѕРІРЅРѕРµ РјРµРЅСЋ, СѓР±СЂР°РЅ РґСѓР±Р»РёСЂСѓСЋС‰РёР№ Р·Р°РіРѕР»РѕРІРѕРє РІ dropdown, РґР»РёРЅРЅС‹Рµ РЅР°Р·РІР°РЅРёСЏ РЅРѕСЂРјР°Р»РёР·РѕРІР°РЅС‹ РїРѕРґ РґРІСѓС…СЃС‚СЂРѕС‡РЅС‹Р№ РїРµСЂРµРЅРѕСЃ.
  - `GovernanceBar`: СЂРѕР»СЊ РѕСЃС‚Р°РІР»РµРЅР° С‚РѕР»СЊРєРѕ РІ РІРµСЂС…РЅРµР№ control panel, dropdown СЂРѕР»РµР№ РїРµСЂРµРІРµРґС‘РЅ РЅР° СѓСЃС‚РѕР№С‡РёРІРѕРµ open-state Р±РµР· hover-gap.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `apps/web` tsc PASS, manual check PASS. Р РµРІСЊСЋ APPROVED (2026-03-03).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: web-spec PASS (5 suites / 11 tests), `apps/web` tsc PASS, `apps/api` controller spec PASS. Р РµРІСЊСЋ APPROVED (2026-03-03).
9. **WorkspaceContext Load Rule (S2.2)** вњ…:
  - Р’РЅРµРґСЂРµРЅ "gatekeeper" СЃР»РѕР№ РІ `useWorkspaceContextStore`.
  - Р РµР°Р»РёР·РѕРІР°РЅР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РѕР±СЂРµР·РєР° (truncate) СЃС‚СЂРѕРє: title (160), subtitle (240), lastUserAction (200).
  - Р’РІРµРґРµРЅ Р»РёРјРёС‚ РЅР° 10 `activeEntityRefs`, РёР·Р±С‹С‚РѕРє РѕС‚СЃРµРєР°РµС‚СЃСЏ.
  - `filters` Р·Р°С‰РёС‰РµРЅС‹ РѕС‚ РІР»РѕР¶РµРЅРЅС‹С… РѕР±СЉРµРєС‚РѕРІ (fail-safe + console.warn РІ dev).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: СЋРЅРёС‚-С‚РµСЃС‚С‹ PASS (3/3), `apps/web` tsc PASS. Р РµРІСЊСЋ APPROVED (2026-03-03).
10. **Software Factory Reinforcement** вњ…:
  - Р Рµ-РІРµСЂРёС„РёС†РёСЂРѕРІР°РЅС‹ Рё РїСЂРёРЅСЏС‚С‹ `STARTER PROMPT` (DOC-ARH-GEN-175) Рё `REVIEW & FINALIZE PROMPT` (DOC-ARH-GEN-176).
  - TECHLEAD РіРѕС‚РѕРІ Рє СЂР°Р±РѕС‚Рµ РїРѕ РєР°РЅРѕРЅСѓ.

### Pending / Current Issues:

- IDE still showing red files in the screenshot despite TS Server restart.
  - Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
  - Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
  - Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

1. **Chat API v1 Protocol (S3.1)** вњ…:
  - Р¤РѕСЂРјР°Р»РёР·РѕРІР°РЅ РєРѕРЅС‚СЂР°РєС‚ `POST /api/rai/chat` (V1).
  - `RaiChatResponseDto` СЂР°СЃС€РёСЂРµРЅ РїРѕР»СЏРјРё `toolCalls` (С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹Р№ СЃРїРёСЃРѕРє РІС‹РїРѕР»РЅРµРЅРЅС‹С… РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ) Рё `openUiToken`.
  - Р РµР°Р»РёР·РѕРІР°РЅ РІРѕР·РІСЂР°С‚ С„Р°РєС‚РёС‡РµСЃРєРё РёСЃРїРѕР»РЅРµРЅРЅС‹С… РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ РёР· `RaiChatService`.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: СЃРµСЂРІРёСЃРЅС‹Рµ С‚РµСЃС‚С‹ PASS (РїСЂРѕРІРµСЂРєР° РєРѕРЅС‚СЂР°РєС‚Р°, traceId, threadId), `apps/api` tsc PASS. Р РµРІСЊСЋ APPROVED (2026-03-03).
2. **Typed Tool Calls / Forensic (S3.2)** вњ…:
  - РЈСЃРёР»РµРЅ В«Р—Р°РєРѕРЅ С‚РёРїРёР·РёСЂРѕРІР°РЅРЅС‹С… РІС‹Р·РѕРІРѕРІВ» (LAW).
  - Р’РЅРµРґСЂРµРЅРѕ РїСЂРёРЅСѓРґРёС‚РµР»СЊРЅРѕРµ Forensic-Р»РѕРіРёСЂРѕРІР°РЅРёРµ РїСЌР№Р»РѕР°РґРѕРІ РІСЃРµС… РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ РІ `RaiToolsRegistry`.
  - Р“Р°СЂР°РЅС‚РёСЂРѕРІР°РЅРѕ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ `execute()` РєР°Рє РµРґРёРЅСЃС‚РІРµРЅРЅРѕРіРѕ С€Р»СЋР·Р° Рє РґРѕРјРµРЅСѓ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: СЋРЅРёС‚-С‚РµСЃС‚С‹ PASS (РїСЂРѕРІРµСЂРєР° Р»РѕРіРѕРІ РїСЂРё СѓСЃРїРµС…Рµ/РІР°Р»РёРґР°С†РёРё/РѕС€РёР±РєРµ), `apps/api` tsc PASS. Р РµРІСЊСЋ APPROVED (2026-03-03).
3. **Chat Widget Logic / Domain Bridge (S4.1)** [x]:
  - РџР»Р°РЅ РїСЂРёРЅСЏС‚ (ACCEPTED). РџСЂРµРґСЃС‚РѕРёС‚ СЂР°Р·РґРµР»РµРЅРёРµ Р»РѕРіРёРєРё- [x] S4.1 Р РµР°Р»РёР·Р°С†РёСЏ РґРёРЅР°РјРёС‡РµСЃРєРѕР№ Р»РѕРіРёРєРё РІРёРґР¶РµС‚РѕРІ

- Р РµРІСЊСЋ Рё С„РёРЅР°Р»РёР·Р°С†РёСЏ S4.1
.

### Pending / Current Issues:

- IDE still showing red files in the screenshot despite TS Server restart.
- Possible cause 1: `tsconfig.json` was missing previously (fixed now with root config).
- Possible cause 2: `node_modules` resolution for files in `docs/` was failing (fixed with paths mapping).
- Possible cause 3: `PrismaService` typing mismatch after removing explicit getters.

### Next Steps:

1. РџРѕР»РЅС‹Р№ truth-sync РїСЂРѕС…РѕРґ РїРѕ docs/07_EXECUTION/* (backlog).

145: 2.  РџРµСЂРµР№С‚Рё Рє **3.2 Typed Tool Calls only (LAW)** вЂ” РёРЅСЃРїРµРєС†РёСЏ Рё С‚РёРїРёР·Р°С†РёСЏ РІСЃРµС… РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ.
146: 
147: 26. **Software Factory Adoption Reinforcement (2026-03-03)** вњ…:
148:     *   РџРѕРІС‚РѕСЂРЅРѕ РїСЂРёРЅСЏС‚ `ORCHESTRATOR PROMPT` (DOC-ARH-GEN-173).
149:     *   РџРѕРґС‚РІРµСЂР¶РґРµРЅРѕ СЃР»РµРґРѕРІР°РЅРёРµ `interagency/` РІРѕСЂРєС„Р»РѕСѓ.
150:     *   РђРєС‚РёРІРёСЂРѕРІР°РЅР° СЏР·С‹РєРѕРІР°СЏ РїРѕР»РёС‚РёРєР° В«Р СѓСЃСЃРєРёР№ + РјР°С‚В».
27. **Memory Adapter Contract (S5.1)** вњ…:
    *   Р’РЅРµРґСЂРµРЅ `MemoryAdapter` РІ `shared/memory`.
    *   Р РµС„Р°РєС‚РѕСЂРёРЅРі `RaiChatService` Рё `ExternalSignalsService` РЅР° РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ Р°РґР°РїС‚РµСЂР°.
    *   Р’РµСЂРёС„РёС†РёСЂРѕРІР°РЅРѕ 10/10 С‚РµСЃС‚РѕРІ, РёР·РѕР»СЏС†РёСЏ С‚РµРЅР°РЅС‚РѕРІ СЃРѕС…СЂР°РЅРµРЅР°.

1. **Memory Storage Canon (S5.2)** вњ…:
  - РЎС„РѕСЂРјРёСЂРѕРІР°РЅ РєР°РЅРѕРЅ С…СЂР°РЅРµРЅРёСЏ РґРѕР»РіРѕРІСЂРµРјРµРЅРЅРѕР№ РїР°РјСЏС‚Рё `MEMORY_CANON.md` (AG-MEMORY-CANON-001).
  - РћРїСЂРµРґРµР»РµРЅС‹ 3 СѓСЂРѕРІРЅСЏ (S-Tier, M-Tier, L-Tier) Рё РїСЂРёРЅС†РёРї "Carcass + Flex".
  - РР·РѕР»СЏС†РёСЏ `companyId` С„РѕСЂРјР°Р»СЊРЅРѕ Р·Р°РєСЂРµРїР»РµРЅР° РІРѕ РІСЃРµС… СЃР»РѕСЏС….
2. **Memory Schema Implementation (S5.3)** вњ…:
  - Р”РѕР±Р°РІР»РµРЅС‹ РјРѕРґРµР»Рё `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` РІ Prisma.
  - РЎРѕС…СЂР°РЅРµРЅР° СЃС‚Р°СЂР°СЏ РјРѕРґРµР»СЊ `MemoryEntry` РґР»СЏ РѕР±СЂР°С‚РЅРѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё.
  - РЎРѕР·РґР°РЅС‹ DTO С‚РёРїС‹ РІ `memory.types.ts` Рё СЃРѕР±Р»СЋРґРµРЅР° РёР·РѕР»СЏС†РёСЏ.
3. **CI/CD Stability (pnpm fix)** вњ…:
  - РЈСЃС‚СЂР°РЅС‘РЅ РєРѕРЅС„Р»РёРєС‚ РІРµСЂСЃРёР№ pnpm РІ GitHub Actions (`Multiple versions of pnpm specified`).
  - Р’РѕСЂРєР»РѕСѓ РїРµСЂРµРІРµРґРµРЅС‹ РЅР° Р°РІС‚Рѕ-РґРµС‚РµРєС‚ РІРµСЂСЃРёРё РёР· `package.json`.
  - РћР±РЅРѕРІР»С‘РЅ `pnpm/action-setup@v4`.
4. **Memory Adapter Bugfixes (S5.4)** вњ…:
  - `DefaultMemoryAdapter.appendInteraction` РїРµСЂРµРІРµРґРµРЅ РЅР° РЅРѕРІСѓСЋ С‚Р°Р±Р»РёС†Сѓ `MemoryInteraction`.
  - `userId` РїСЂРѕРєРёРЅСѓС‚ РёР· JWT С‡РµСЂРµР· `RaiChatController` / `RaiChatService` / `ExternalSignalsService` РІ carcass РїР°РјСЏС‚Рё.
  - Р’РЅРµРґСЂРµРЅР° recursive JSON sanitization РґР»СЏ `attrs.metadata` Рё `attrs.toolCalls` Р±РµР· РѕР±РЅСѓР»РµРЅРёСЏ РІСЃРµРіРѕ payload.
  - `embedding` РїРёС€РµС‚СЃСЏ С‚СЂР°РЅР·Р°РєС†РёРѕРЅРЅРѕ С‡РµСЂРµР· `create + raw vector update`; РЅРµРІР°Р»РёРґРЅС‹Рµ РІРµРєС‚РѕСЂС‹ РѕС‚СЃРµРєР°СЋС‚СЃСЏ.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `apps/api` tsc PASS, targeted jest PASS, СЂРµРІСЊСЋ APPROVED.
5. **SupervisorAgent API Integration (Phase B closeout)** вњ…:
  - РЎРѕР·РґР°РЅ `SupervisorAgent` РєР°Рє РѕС‚РґРµР»СЊРЅС‹Р№ orchestration layer РґР»СЏ `rai-chat`.
  - `RaiChatService` РїСЂРµРІСЂР°С‰РµРЅ РІ thin facade РЅР°Рґ `SupervisorAgent`.
  - РЎРѕС…СЂР°РЅРµРЅС‹ typed tools, widgets, memory, advisory Рё append-flow Р±РµР· Р»РѕРјРєРё API-РєРѕРЅС‚СЂР°РєС‚Р°.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `apps/api` tsc PASS, targeted jest PASS, СЂРµРІСЊСЋ APPROVED.
6. **Episodes/Profile Runtime Integration (S5.5)** вњ…:
  - `DefaultMemoryAdapter.getProfile/updateProfile` Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РіР»СѓС€РєРё Рё СЂР°Р±РѕС‚Р°СЋС‚ СЃ `MemoryProfile`.
  - `appendInteraction` С‚РµРїРµСЂСЊ РїРёС€РµС‚ РєРѕРјРїР°РєС‚РЅС‹Р№ `MemoryEpisode` СЂСЏРґРѕРј СЃ raw interaction.
  - `SupervisorAgent` РёСЃРїРѕР»СЊР·СѓРµС‚ profile context РІ РѕС‚РІРµС‚Рµ Рё РѕР±РЅРѕРІР»СЏРµС‚ РїСЂРѕС„РёР»СЊ РїРѕСЃР»Рµ interaction.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `apps/api` tsc PASS, targeted jest PASS, СЂРµРІСЊСЋ APPROVED.
7. **Memory Observability Debug Panel (S5.6)** вњ…:
  - Р’ `RaiChatResponseDto` РґРѕР±Р°РІР»РµРЅРѕ РїРѕР»Рµ `memoryUsed`.
  - `SupervisorAgent` РІРѕР·РІСЂР°С‰Р°РµС‚ Р±РµР·РѕРїР°СЃРЅС‹Р№ summary РїРѕ episode/profile context.
  - Р’ web chat РґРѕР±Р°РІР»РµРЅР° debug-РїР»Р°С€РєР° `Memory Used` РґР»СЏ РїСЂРёРІРёР»РµРіРёСЂРѕРІР°РЅРЅРѕРіРѕ СЂРµР¶РёРјР°.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `apps/api` tsc PASS, `apps/api` targeted jest PASS, `apps/web` store test PASS.

## [2026-03-15 08:40Z] Git Pull / Manual Repo Sync

- Р—Р°РїСѓСЃРє `git pull` РґР»СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё Р»РѕРєР°Р»СЊРЅРѕР№ РєРѕРїРёРё СЃ `origin/main`.

[2026-03-15 09:15Z] RAI_EP SWOT Analysis

- РџСЂРѕРІРµРґРµРЅ SWOT-Р°РЅР°Р»РёР· СЃРёСЃС‚РµРјС‹ RAI_EP РЅР° РѕСЃРЅРѕРІРµ СЂС‹РЅРѕС‡РЅРѕРіРѕ РёСЃСЃР»РµРґРѕРІР°РЅРёСЏ (Р Р¤/РЎРќР“).
- РЎРѕР·РґР°РЅ РґРѕРєСѓРјРµРЅС‚ `RAI_EP_SWOT_ANALYSIS.md`.
- Р—Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹ РєР»СЋС‡РµРІС‹Рµ РїСЂРµРёРјСѓС‰РµСЃС‚РІР° (РјСѓР»СЊС‚РёР°РіРµРЅС‚РЅРѕСЃС‚СЊ, РґРµС‚РµСЂРјРёРЅРёР·Рј) Рё СЂС‹РЅРѕС‡РЅС‹Рµ РЅРёС€Рё (CFO-layer).

1. **Agent-First Sprint 1 P1 вЂ” Tools Registry Domain Bridge (2026-03-03)** вњ…:
  - `RaiToolsRegistry` СЂР°СЃС€РёСЂРµРЅ 4 Р±РѕРµРІС‹РјРё РёРЅСЃС‚СЂСѓРјРµРЅС‚Р°РјРё: `compute_deviations`, `compute_plan_fact`, `emit_alerts`, `generate_tech_map_draft`.
  - Typed payload/result РєРѕРЅС‚СЂР°РєС‚С‹ РґРѕР±Р°РІР»РµРЅС‹ РІ `rai-tools.types.ts`; `companyId` С‚РѕР»СЊРєРѕ РёР· `RaiToolActorContext`, РЅРёРєРѕРіРґР° РёР· payload.
  - `generate_tech_map_draft` Р·Р°РјРєРЅСѓС‚ РЅР° `TechMapService.createDraftStub()` вЂ” СЃРѕР·РґР°С‘С‚ DRAFT СЃ РїСЂР°РІРёР»СЊРЅС‹Рј tenant-scope (TODO: РїРѕР»РЅР°СЏ РіРµРЅРµСЂР°С†РёСЏ вЂ” Sprint TechMap Intake).
  - Р’ `SupervisorAgent` РґРѕР±Р°РІР»РµРЅ `detectIntent()` вЂ” keyword routing РїРѕ 4 РїР°С‚С‚РµСЂРЅР°Рј (РѕС‚РєР»РѕРЅРµРЅРёСЏ, kpi/РїР»Р°РЅ-С„Р°РєС‚, Р°Р»РµСЂС‚С‹, С‚РµС…РєР°СЂС‚Р°).
  - DI: `DeviationService`, `ConsultingService`, `AgroEscalationLoopService`, `TechMapService` РїРѕРґРєР»СЋС‡РµРЅС‹ РІ `RaiChatModule`.
  - `axios` РґРѕР±Р°РІР»РµРЅ РІ `apps/api/package.json` (runtime-Р±Р»РѕРєРµСЂ `HttpResilienceModule` СѓСЃС‚СЂР°РЅС‘РЅ).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `apps/api` tsc PASS, unit 14/14 PASS, smoke curl PASS. Р РµРІСЊСЋ APPROVED.
2. **Agent-First Sprint 1 P2 вЂ” Tests, E2E Smoke & Telegram Linking (2026-03-03)** вњ…:
  - РџСЂРѕРіРЅР°РЅС‹ unit-С‚РµСЃС‚С‹ РЅР° РІСЃРµ 4 tool-РјР°СЂС€СЂСѓС‚Р° Рё `detectIntent` вЂ” 14/14 PASS.
  - Р’С‹РїРѕР»РЅРµРЅС‹ 4 live smoke-РїСЂРѕРІРµСЂРєРё С‡РµСЂРµР· `POST /api/rai/chat`: РІСЃРµ 4 С‚СѓР»Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹.
  - `generate_tech_map_draft` СЃРѕР·РґР°Р» СЂРµР°Р»СЊРЅСѓСЋ Р·Р°РїРёСЃСЊ `TechMap` РІ Р‘Р” (`status=DRAFT`, `companyId=default-rai-company`, `crop=rapeseed`).
  - Telegram linking cascade РїСЂРѕРІРµСЂРµРЅ: `telegram.update.ts` РїРѕРґРґРµСЂР¶РёРІР°РµС‚ link-patch РґР»СЏ `AgroEventDraft`, РЅРѕ Telegramв†’`/api/rai/chat` РјР°СЂС€СЂСѓС‚Р° РЅРµС‚ вЂ” Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅРѕ РІ backlog.
  - `PROJECT_EXECUTION_CHECKLIST.md` РѕР±РЅРѕРІР»С‘РЅ СЃ truth-sync РїРѕ Sprint 1.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: unit 14/14 PASS, smoke 4/4 PASS, TechMap DRAFT РІ Р‘Р” РїРѕРґС‚РІРµСЂР¶РґС‘РЅ. Р РµРІСЊСЋ APPROVED.
3. **Techmap Prompt Synthesis (2026-03-03)** вњ…:
  - РЎРёРЅС‚РµР·РёСЂРѕРІР°РЅ РјРµС‚Р°-РїСЂРѕРјС‚ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РўРµС…РєР°СЂС‚С‹ РЅР° РѕСЃРЅРѕРІРµ 6 AI-РѕС‚С‡РµС‚РѕРІ.
  - РћР±СЉРµРґРёРЅРµРЅС‹ С‚СЂРµР±РѕРІР°РЅРёСЏ РёР· `РџСЂРѕРјС‚_Р“СЂР°РЅРґ_РЎРёРЅС‚РµР·.md` Рё `РџСЂРѕРјС‚_СЃРёРЅС‚РµР·.md`.
  - Р”РѕР±Р°РІР»РµРЅС‹ СЃС‚СЂРѕРіРёРµ РєСЂРёС‚РµСЂРёРё СЌРєСЃС‚СЂР°РєС†РёРё (Р‘Р»РѕРєРё A-H) РёР· РѕСЂРёРіРёРЅР°Р»СЊРЅРѕРіРѕ `РџСЂРѕРјС‚ РґР»СЏ РёСЃСЃР»РµРґРѕРІР°РЅРёСЏ`, С‡С‚РѕР±С‹ РёСЃРєР»СЋС‡РёС‚СЊ "РІРѕРґСѓ" Рё СЃР°РјРјР°СЂРё.
4. **TechMap Grand Synthesis вЂ” РџРѕР»РЅС‹Р№ РЎРёРЅС‚РµР· 6 AI-РёСЃСЃР»РµРґРѕРІР°РЅРёР№ (2026-03-03)** вњ…:
  - РџСЂРѕС‡РёС‚Р°РЅС‹ РІСЃРµ 6 РёСЃС‚РѕС‡РЅРёРєРѕРІ: ChatGPT, ChatGPT#2, CLUADE, COMET, GEMINI, GROK.
  - РЎРѕР·РґР°РЅ `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` вЂ” 770 СЃС‚СЂРѕРє, 8 С‡Р°СЃС‚РµР№:
5. **TM POST-A: TechMapService Consolidation + Docs (2026-03-04)** вњ…:
  - РџРѕСЃР»Рµ `ACCEPTED` РёСЃРїРѕР»РЅРµРЅ РїР»Р°РЅ `interagency/plans/2026-03-04_tm-post-a_consolidation.md`.
  - РњРµС‚РѕРґС‹ `activate` Рё `createNextVersion` РїРµСЂРµРЅРµСЃРµРЅС‹ РІ РґРѕРјРµРЅРЅС‹Р№ `apps/api/src/modules/tech-map/tech-map.service.ts` Р±РµР· РёР·РјРµРЅРµРЅРёСЏ СЃРёРіРЅР°С‚СѓСЂ.
  - `ConsultingModule` РїРµСЂРµРІРµРґС‘РЅ РЅР° `TechMapModule`; Р»РѕРєР°Р»СЊРЅС‹Р№ `apps/api/src/modules/consulting/tech-map.service.ts` СѓРґР°Р»С‘РЅ.
  - Р’ `TechMapModule` РґРѕР±Р°РІР»РµРЅС‹ `TechMapValidator` Рё `UnitNormalizationService` (providers/exports) РґР»СЏ РµРґРёРЅРѕРіРѕ СЃРµСЂРІРёСЃР°.
  - Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ TM-POST.5 РѕР±РЅРѕРІР»РµРЅР°: `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts` + `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-services-api.tm4-tm5.md`.
    - Р§Р°СЃС‚СЊ 1: Executive Summary (7 С„СѓРЅРґР°РјРµРЅС‚Р°Р»СЊРЅС‹С… Р°РєСЃРёРѕРј, РєРѕРЅСЃРµРЅСЃСѓСЃ РІСЃРµС… РёСЃС‚РѕС‡РЅРёРєРѕРІ)
    - Р§Р°СЃС‚СЊ 2: РњРѕРґРµР»СЊ РґР°РЅРЅС‹С… (15+ СЃСѓС‰РЅРѕСЃС‚РµР№ СЃ JSON-СЃС…РµРјР°РјРё, enum-СЃР»РѕРІР°СЂРё, Provenance/Confidence)
    - Р§Р°СЃС‚СЊ 3: РњРµС‚РѕРґРѕР»РѕРіРёСЏ СЂР°СЃС‡С‘С‚РѕРІ (РЅРѕСЂРјС‹ РІС‹СЃРµРІР°, РѕРєРЅР° GDD, РґРѕР·С‹ СѓРґРѕР±СЂРµРЅРёР№, Р­РџР’, AdaptiveRules, РІР°Р»РёРґР°С†РёСЏ)
    - Р§Р°СЃС‚СЊ 4: Р®СЂРёРґРёС‡РµСЃРєР°СЏ Рё РѕРїРµСЂР°С†РёРѕРЅРЅР°СЏ РјРѕРґРµР»СЊ (Contract Core + Execution Layer, ChangeOrder, Evidence, DAG, РјР°С‚СЂРёС†Р° РґРµР»РµРіРёСЂРѕРІР°РЅРёСЏ РРв†”Р§РµР»РѕРІРµРє)
    - Р§Р°СЃС‚СЊ 5: Р РµРіРёРѕРЅР°Р»РёР·Р°С†РёСЏ (3 РїСЂРѕС„РёР»СЏ) + Р­РєРѕРЅРѕРјРёРєР° (Р±СЋРґР¶РµС‚, KPI, РїСЂР°РІРёР»Р° РїРµСЂРµСЂР°СЃС…РѕРґР°)
    - Р§Р°СЃС‚СЊ 6: РљР°СЂС‚Р° РїСЂРѕС‚РёРІРѕСЂРµС‡РёР№ (7 РєРѕРЅС„Р»РёРєС‚РѕРІ СЃ Р°СЂС…РёС‚РµРєС‚СѓСЂРЅС‹РјРё РІРµСЂРґРёРєС‚Р°РјРё)
    - Р§Р°СЃС‚СЊ 7: 10 РёРЅР¶РµРЅРµСЂРЅС‹С… СЃР»РµРїС‹С… Р·РѕРЅ (РјСѓР»СЊС‚Рё-РїРѕР»РµРІР°СЏ РѕРїС‚РёРјРёР·Р°С†РёСЏ, СЃРєР»Р°Рґ, РѕС„Р»Р°Р№РЅ-СЂРµР¶РёРј Рё РґСЂ.)
    - Р§Р°СЃС‚СЊ 8: РњРёРЅРё-РїСЂРёРјРµСЂ (10 РѕРїРµСЂР°С†РёР№ РґР»СЏ РѕР·РёРјРѕРіРѕ СЂР°РїСЃР° MARITIME_HUMID)
  - Р”РѕРєСѓРјРµРЅС‚ РіРѕС‚РѕРІ РєР°Рє С‚РµС…РЅРёС‡РµСЃРєРёР№ Р±Р°Р·РёСЃ РґР»СЏ РёРјРїР»РµРјРµРЅС‚Р°С†РёРё РјРѕРґСѓР»СЏ TechMap РІ RAI EP.
6. **TechMap Implementation Master Checklist (2026-03-03)** вњ…:
  - РџСЂРѕРІРµРґС‘РЅ РїРѕР»РЅС‹Р№ Р°СѓРґРёС‚ РєРѕРґРѕРІРѕР№ Р±Р°Р·С‹: РЅР°Р№РґРµРЅС‹ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ `TechMap`, `MapStage`, `MapOperation`, `MapResource`, `ExecutionRecord`, `Field`, `Season`, `Rapeseed`, `AgronomicStrategy`, `GenerationRecord`, `DivergenceRecord`.
  - Gap-Р°РЅР°Р»РёР·: ~60% СЃСѓС‰РЅРѕСЃС‚РµР№ РёР· GRAND_SYNTHESIS РїРѕРєСЂС‹С‚С‹, РЅРµРґРѕСЃС‚Р°С‘С‚ `SoilProfile`, `RegionProfile`, `InputCatalog`, `CropZone`, `Evidence`, `ChangeOrder`, `AdaptiveRule`.
  - РЎРѕР·РґР°РЅ `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` вЂ” РјР°СЃС‚РµСЂ-С‡РµРєР»РёСЃС‚ РЅР° 5 СЃРїСЂРёРЅС‚РѕРІ (TM-1..TM-5) + РїРѕСЃС‚-РєРѕРЅСЃРѕР»РёРґР°С†РёСЏ.
  - РЎРѕР·РґР°РЅР° РґРёСЂРµРєС‚РѕСЂРёСЏ `docs/00_STRATEGY/TECHMAP/SPRINTS/` РґР»СЏ РїСЂРѕРјС‚РѕРІ РєРѕРґРµСЂСѓ.
7. **TechMap Sprint TM-1 вЂ” Data Foundation CLOSED (2026-03-03)** вњ…:
  - Р”РѕР±Р°РІР»РµРЅС‹ 4 РЅРѕРІС‹Рµ Prisma-РјРѕРґРµР»Рё: `SoilProfile` (L1639), `RegionProfile` (L1666), `InputCatalog` (L1691), `CropZone` (L1712).
  - Р”РѕР±Р°РІР»РµРЅС‹ 5 Prisma enums: `SoilGranulometricType`, `ClimateType`, `InputType`, `OperationType`, `ApplicationMethod`.
  - Р Р°СЃС€РёСЂРµРЅС‹ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ РјРѕРґРµР»Рё nullable-РїРѕР»СЏРјРё: `Field` (+slope/drainage/protectedZones), `TechMap` (+budgetCap/hash/cropZoneId), `MapOperation` (+BBCH-РѕРєРЅР°/dependencies/evidenceRequired), `MapResource` (+inputCatalogId/rates/applicationMethod).
  - РЎРѕР·РґР°РЅС‹ Zod DTO: `apps/api/src/modules/tech-map/dto/` (4 С„Р°Р№Р»Р° + 4 spec).
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: `prisma validate` вњ…, `db push` вњ…, `tsc --noEmit` вњ…, 8/8 DTO-С‚РµСЃС‚РѕРІ вњ….
  - Р РµРІСЊСЋ Orchestrator: APPROVED. Pre-existing failures РІ 8 РјРѕРґСѓР»СЏС… (NestJS DI) РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ РєР°Рє РЅРµ scope TM-1.
  - Decision-ID: `AG-TM-DATA-001` (DECISIONS.log).
  - TM-2 РїСЂРѕРјС‚ СЃРѕР·РґР°РЅ: `interagency/prompts/2026-03-03_tm-2_dag-validation.md`.
8. **TechMap Sprint TM-2 вЂ” DAG + Validation CLOSED (2026-03-03)**:
  - Р РµР°Р»РёР·РѕРІР°РЅС‹ `DAGValidationService` (DFS + CPM РєСЂРёС‚РёС‡РµСЃРєРёР№ РїСѓС‚СЊ), `TechMapValidationEngine` (7 РєР»Р°СЃСЃРѕРІ РѕС€РёР±РѕРє: HARD_STOP/WARNING), `TankMixCompatibilityService`.
  - Р РµР°Р»РёР·РѕРІР°РЅС‹ 3 pure-function РєР°Р»СЊРєСѓР»СЏС‚РѕСЂР°: `SeedingRateCalculator`, `FertilizerDoseCalculator`, `GDDWindowCalculator`.
  - Р”РѕР±Р°РІР»РµРЅС‹ РІ `TechMapService`: `validateTechMap()`, `validateDAG()`, `getCalculationContext()`.
  - РўРµСЃС‚С‹: validation/ 15/15 PASS, calculators/ 9/9 PASS, tech-map/ 56/56 PASS. tsc PASS.
  - Decision-ID: `AG-TM-DAG-002`.
9. **TechMap Sprint TM-3 вЂ” Evidence + ChangeOrder CLOSED (2026-03-03)** вњ…:
  - Р”РѕР±Р°РІР»РµРЅС‹ Prisma-РјРѕРґРµР»Рё: `Evidence`, `ChangeOrder`, `Approval` + 5 enums.
  - Р Р°СЃС€РёСЂРµРЅС‹ `Company`, `TechMap`, `MapOperation` relation-РїРѕР»СЏРјРё. `PrismaService` РѕР±РЅРѕРІР»С‘РЅ tenant-е€—иЎЁРѕРј.
  - Р РµР°Р»РёР·РѕРІР°РЅС‹: `EvidenceService` (attachEvidence, validateOperationCompletion, getByOperation) Рё `ChangeOrderService` (5 РјРµС‚РѕРґРѕРІ СЃ routing РїРѕ СЂРѕР»СЏРј + $transaction).
  - Zod DTO: evidence, change-order, approval + 6 spec.
  - РўРµСЃС‚С‹: 5 suites / 16/16 PASS. prisma validate/db push/tsc PASS.
  - Р РµРІСЊСЋ Orchestrator: APPROVED. `calculateContingency` СЃ nullable-РґРµС„РѕР»С‚РѕРј, append-only С‡РµСЂРµР· С‚СЂР°РЅР·Р°РєС†РёРё, FSM РЅРµ РїРµСЂРµРїРёСЃР°РЅ.
  - Decision-ID: `AG-TM-EV-003`.
  - TM-3 РїСЂРѕРјС‚: `interagency/prompts/2026-03-03_tm-3_evidence-changeorder.md`.
10. **TechMap Sprint TM-4 вЂ” Adaptive Rules + Regionalization CLOSED (2026-03-04)** вњ…:
  - РњРѕРґРµР»Рё: `AdaptiveRule` (triggerType, condition/changeTemplate Json, isActive, lastEvaluatedAt), `HybridPhenologyModel` (gddToStage Json, baseTemp, companyId optional).
  - Enums: `TriggerType` (WEATHER/NDVI/OBSERVATION/PHENOLOGY/PRICE), `TriggerOperator` (GT/GTE/LT/LTE/EQ/NOT_EQ).
  - РЎРµСЂРІРёСЃС‹: `TriggerEvaluationService` (pure `evaluateCondition` + `evaluateTriggers` + `applyTriggeredRule` в†’ ChangeOrderService), `RegionProfileService` (3 climate profile sowing windows, suggestOperationTypes: CONTINENTAL_COLDв†’DESICCATION mandatory, MARITIME_HUMIDв†’2Г—FUNGICIDE), `HybridPhenologyService` (GDDв†’BBCH prediction, tenantв†’global lookup).
  - DTO: adaptive-rule, hybrid-phenology.
  - РўРµСЃС‚С‹: 17/17 Р°РґСЂРµСЃРЅС‹С… PASS (5 suites). Р РµРіСЂРµСЃСЃРёСЏ tech-map/: 22 suites / 75 tests PASS.
  - Fix: РѕРїРµС‡Р°С‚РєР° `tecmhMap` РІ `tech-map.concurrency.spec.ts` РёСЃРїСЂР°РІР»РµРЅР°.
  - Decision-ID: `AG-TM-AR-004`.
11. **TechMap Sprint TM-5 вЂ” Economics + Contract Core CLOSED (2026-03-04)** вњ…:
  - РњРѕРґРµР»СЊ: `BudgetLine` (TechMap-scoped: techMapId, category, plannedCost, actualCost, tolerancePct). Enum: `BudgetCategory` (9 РєР°С‚РµРіРѕСЂРёР№).
  - РЎРµСЂРІРёСЃС‹: `TechMapBudgetService` (calculateBudget СЃ byCategory ledger/withinCap/overCap; checkOverspend: SEEDS 5%, РѕСЃС‚Р°Р»СЊРЅС‹Рµ 10% tolerance в†’ ChangeOrderService), `TechMapKPIService` (pure `computeKPIs`: C_ha, C_t, marginPerHa, marginPct, riskAdjustedMarginPerHa, variancePct), `ContractCoreService` (generateContractCore, inline recursive `stableStringify` в†’ SHA-256 в†’ `TechMap.basePlanHash`, verifyIntegrity), `RecalculationEngine` (event-driven: CHANGE_ORDER_APPLIED/ACTUAL_YIELD_UPDATED/PRICE_CHANGED/TRIGGER_FIRED).
  - DTO: budget-line, tech-map-kpi.
  - РўРµСЃС‚С‹: 20/20 Р°РґСЂРµСЃРЅС‹С… PASS (6 suites). Р РµРіСЂРµСЃСЃРёСЏ: 28 suites / 95 tests PASS.
  - Р РµРІСЊСЋ: APPROVED. `computeKPIs` pure fn, `stableStringify` recursive Р±РµР· РІРЅРµС€РЅРёС… dep, `basePlanHash` РЅРµ РґСѓР±Р»РёСЂРѕРІР°Р»СЃСЏ.
  - Decision-ID: `AG-TM-EC-005`.

## 2026-03-04 вЂ” РћСЂРєРµСЃС‚СЂР°С‚РѕСЂ: POST-B Рё POST-C РїСЂРѕРјС‚С‹

**Р”РµР№СЃС‚РІРёРµ**: РЎРѕР·РґР°РЅРёРµ РїСЂРѕРјС‚РѕРІ РґР»СЏ РїРѕСЃС‚-СЃРїСЂРёРЅС‚РѕРІ B Рё C

### POST-B: Season в†’ CropZone + Rapeseed в†’ CropVariety

- Р¤Р°Р№Р»: `interagency/prompts/2026-03-04_tm-post-b_season-cropzone-cropvariety.md`
- Decision-ID: AG-TM-POST-B-006
- РЎС‚Р°С‚СѓСЃ: READY_FOR_PLAN (рџ”ґ Р’С‹СЃРѕРєРёР№ СЂРёСЃРє вЂ” РјРёРіСЂР°С†РёСЏ РґР°РЅРЅС‹С…, РѕР±СЏР·Р°С‚РµР»РµРЅ pg_dump)
- РљР»СЋС‡РµРІС‹Рµ РѕРіСЂР°РЅРёС‡РµРЅРёСЏ: Season.fieldId в†’ nullable, CropZone.cropZoneId в†’ NOT NULL РґР»СЏ TechMap, Rapeseed РјРѕРґРµР»СЊ РќР• СѓРґР°Р»СЏРµС‚СЃСЏ (deprecated)

### POST-C: UI TechMap Workbench v2

- Р¤Р°Р№Р»: `interagency/prompts/2026-03-04_tm-post-c_ui-workbench-v2.md`
- Decision-ID: AG-TM-POST-C-007
- РЎС‚Р°С‚СѓСЃ: DONE (Р—Р°РІРµСЂС€РµРЅР° РєРѕРЅС„РёРіСѓСЂР°С†РёСЏ UI РєРѕРјРїРѕРЅРµРЅС‚РѕРІ РґР»СЏ С‚РµС…РєР°СЂС‚С‹)

1. **TM-POST-C: UI TechMap Workbench v2 CLOSED (2026-03-04)** вњ…:
  - РћС‚С‡РµС‚ СѓС‚РІРµСЂР¶РґРµРЅ (APPROVED).
    - Р РµР°Р»РёР·РѕРІР°РЅР° DAG-РІРёР·СѓР°Р»РёР·Р°С†РёСЏ Р±РµР· РІРЅРµС€РЅРёС… Р±РёР±Р»РёРѕС‚РµРє (РЅР° SVG).
    - РЎРѕР·РґР°РЅР° EvidencePanel (UI Р·Р°РіСЂСѓР·РєРё) Рё ChangeOrderPanel (Р·Р°РїСЂРѕСЃС‹ РЅР° РёР·РјРµРЅРµРЅРёСЏ).
    - isFrozen СЂРµР¶РёРј Р¶РµСЃС‚РєРѕ РѕС‚РєР»СЋС‡Р°РµС‚ РёРЅС‚РµСЂС„РµР№СЃ РїРѕ Transition-РїРѕР»РёС‚РёРєР°Рј.
    - TypeScript (`tsc --noEmit`), Jest (`testPathPatterns=TechMapWorkbench`) PASS.
2. **TM-POST-B: Season в†’ CropZone + Rapeseed в†’ CropVariety CLOSED (2026-03-04)** вњ…:
  - РњРѕРґРµР»Рё: `Season` (fieldId nullable), `CropZone` (primary link), `CropVariety`, `CropVarietyHistory`, `CropType` enum РІРЅРµРґСЂРµРЅС‹.
  - `TechMapService` РїРµСЂРµРєР»СЋС‡РµРЅ РЅР° `CropZone` РєР°Рє РѕСЃРЅРѕРІРЅРѕР№ РёСЃС‚РѕС‡РЅРёРє СЃРІСЏР·Рё.
  - Data-migration: `Rapeseed` -> `CropVariety` Рё `Season` -> `CropZone` РІС‹РїРѕР»РЅРµРЅС‹ (idempotent СЃРєСЂРёРїС‚С‹).
  - Backup: `backups/rai_platform_20260304T114020Z.dump` СЃРѕР·РґР°РЅ РїРµСЂРµРґ DDL.
  - Р’РµСЂРёС„РёРєР°С†РёСЏ: tsc PASS, prisma validate PASS, tests (34 + 95) PASS. Р РµРІСЊСЋ APPROVED.
3. **AI Multi-Agent Architecture Design (2026-03-04)** вњ…:
  - РџСЂРѕРІРµРґРµРЅРѕ РіР»СѓР±РѕРєРѕРµ РёСЃСЃР»РµРґРѕРІР°РЅРёРµ (Phase 1) 35+ РјРѕРґСѓР»РµР№ Рё Prisma-СЃС…РµРјС‹.
  - РЎРѕР·РґР°РЅ `docs/RAI_AI_SYSTEM_RESEARCH.md` (12 СЃРµРєС†РёР№).
  - РЎРѕР·РґР°РЅ `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` (14 СЃРµРєС†РёР№) вЂ” РјСѓР»СЊС‚Рё-Р°РіРµРЅС‚РЅР°СЏ СЃРёСЃС‚РµРјР° СЃ 5 СЃРїРµС†РёР°Р»РёР·РёСЂРѕРІР°РЅРЅС‹РјРё Р°РіРµРЅС‚Р°РјРё.
  - РЎРїСЂРѕРµРєС‚РёСЂРѕРІР°РЅС‹: Tool Registry (14 С‚СѓР»РѕРІ), 3-СЃР»РѕР№РЅР°СЏ РїР°РјСЏС‚СЊ, 4 С‚РёСЂР° РјРѕРґРµР»РµР№, HITL-РјР°С‚СЂРёС†Р°, Roadmap РЅР° 3 СЃС‚Р°РґРёРё.
  - РћР±РЅРѕРІР»РµРЅ `memory-bank/activeContext.md`.
  - Р РµРІСЊСЋ: DONE. Р“РѕС‚РѕРІ Рє РёРјРїР»РµРјРµРЅС‚Р°С†РёРё Stage 1.
4. **A_RAI Р¤Р°Р·Р° 1 вЂ” РЎС‚Р°СЂС‚ РґРµРєРѕРјРїРѕР·РёС†РёРё SupervisorAgent (2026-03-04)** [IN_PROGRESS]:
  - РџСЂРёРЅСЏС‚ Рє РёСЃРїРѕР»РЅРµРЅРёСЋ `CURSOR SOFTWARE FACTORY вЂ” STARTER PROMPT.md`.
  - РџСЂРѕС‡РёС‚Р°РЅС‹ РІСЃРµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РґРѕРєСѓРјРµРЅС‚С‹: `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`, `RAI_AI_SYSTEM_ARCHITECTURE.md`, `A_RAI_IMPLEMENTATION_CHECKLIST.md`, `PROJECT_EXECUTION_CHECKLIST.md`.
  - РЎРѕСЃС‚РѕСЏРЅРёРµ: РІСЃРµ Р·Р°РґР°С‡Рё Р¤Р°Р·Р° 1-3 A_RAI РѕС‚РєСЂС‹С‚С‹; РІСЃРµ Sprint S-СЃРµСЂРёРё Рё TM-СЃРµСЂРёРё DONE.
  - РћРїСЂРµРґРµР»С‘РЅ РїРµСЂРІС‹Р№ С€Р°Рі: IntentRouter + AgroToolsRegistry + TraceId Binding.
  - РЎРѕР·РґР°РЅ РїСЂРѕРјС‚: `interagency/prompts/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md`.
  - Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅС‹ Decision-ID: AG-ARAI-F1-001, AG-ARAI-F1-002, AG-ARAI-F1-003, AG-ARAI-F1-004, AG-ARAI-F2-001, AG-ARAI-F2-002, AG-ARAI-F2-003, AG-ARAI-F3-001, AG-ARAI-F3-002, AG-ARAI-F3-003 РІ `DECISIONS.log`.
  - РћР±РЅРѕРІР»РµРЅС‹: `A_RAI_IMPLEMENTATION_CHECKLIST.md` (РїРї. 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3 в†’ `[/]`), `interagency/INDEX.md`, `memory-bank/task.md`.
  - РџСЂРѕРјС‚ F1-3: `interagency/prompts/2026-03-04_a_rai-f1-3_budget-deterministic-bridge.md`.
  - РџСЂРѕРјС‚ F1-4 (Р”РµРєРѕРјРїРѕР·РёС†РёСЏ SupervisorAgent: MemoryCoordinator, AgentRuntime, ResponseComposer): `interagency/prompts/2026-03-04_a_rai-f1-4_supervisor-decomposition.md`.
  - РџСЂРѕРјС‚ F2-1 (Parallel Fan-Out + ToolCall Planner): `interagency/prompts/2026-03-04_a_rai-f2-1_parallel-fan-out.md`.
  - РџСЂРѕРјС‚ F2-2 (EconomistAgent + KnowledgeAgent): `interagency/prompts/2026-03-04_a_rai-f2-2_economist-knowledge-agents.md`.
  - РџСЂРѕРјС‚ F2-3 (Eval & Quality: AgentScoreCard, GoldenTestSet): `interagency/prompts/2026-03-04_a_rai-f2-3_eval-quality.md`.
  - РџСЂРѕРјС‚ F3-1 (РњРѕРЅРёС‚РѕСЂРёРЅРі Рё Р°РІС‚РѕРЅРѕРјРЅРѕСЃС‚СЊ: MonitoringAgent, AutonomousExecutionContext): `interagency/prompts/2026-03-05_a_rai-f3-1_monitoring-agent.md`.
  - РџСЂРѕРјС‚ F3-2 (РџРѕР»РёС‚РёРєРё СЂРёСЃРєРѕРІ: RiskPolicyEngine, Two-Person Rule): `interagency/prompts/2026-03-05_a_rai-f3-2_risk-policy.md`.
  - РџСЂРѕРјС‚ F3-3 (РљРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚СЊ: SensitiveDataFilter, Red-Team Suite): `interagency/prompts/2026-03-05_a_rai-f3-3_privacy-red-team.md`.
  - РџСЂРѕРјС‚ F4-1 (Explainability Panel): `interagency/prompts/2026-03-05_a_rai-f4-1_explainability-panel.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-2 (TraceSummary Data Contract v1): `interagency/prompts/2026-03-05_a_rai-f4-2_tracesummary-contract.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-3 (Evidence Tagging MVP): `interagency/prompts/2026-03-05_a_rai-f4-3_evidence-tagging.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-4 (Truthfulness Engine BS%): `interagency/prompts/2026-03-05_a_rai-f4-4_truthfulness-engine.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-5 (Truthfulness Panel API): `interagency/prompts/2026-03-05_a_rai-f4-5_truthfulness-panel-api.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-6 (Drift Alerts): `interagency/prompts/2026-03-05_a_rai-f4-6_drift-alerts.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-7 (Autonomy Policies): `interagency/prompts/2026-03-05_a_rai-f4-7_autonomy-policies.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-8 (Agent Points): `interagency/prompts/2026-03-05_a_rai-f4-8_agent-points.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-9 (Feedback Credibility): `interagency/prompts/2026-03-05_a_rai-f4-9_feedback-credibility.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-10 (Explainability Explorer): `interagency/prompts/2026-03-05_a_rai-f4-10_explainability-explorer.md` [APPROVED].
  - РџСЂРѕРјС‚ F4-11 (Incident Ops): `interagency/prompts/2026-03-05_a_rai-f4-11_incident-ops.md` [ACTIVE].
  - РџСЂРѕРјС‚ F4-12 (Performance Metrics): `interagency/prompts/2026-03-05_a_rai-f4-12_performance-metrics.md` (РґРѕР±Р°РІР»РµРЅРѕ РІ РёРЅРґРµРєСЃ).

- [2026-03-05 18:16:48] РџСЂРѕРІРµСЂРµРЅ РѕС‚С‡С‘С‚ 2026-03-05_a_rai-f4-11_incident-ops.md РїРѕ IncidentOps. Р—Р°РµР±РёСЃСЊ.
- [2026-03-05 18:34:33] РџСЂРѕРІРµСЂРµРЅ РѕС‚С‡С‘С‚ 2026-03-05_a_rai-f4-12_performance-metrics.md. Performance Metrics & SLO DONE.
- [2026-03-05 18:48:28] РџСЂРѕРІРµСЂРµРЅ РѕС‚С‡С‘С‚ 2026-03-05_a_rai-f4-13_cost-workload-hotspots.md. Cost Decomposition DONE.
- [2026-03-05 18:57:10] РџСЂРѕРІРµСЂРµРЅ РѕС‚С‡С‘С‚ 2026-03-05_a_rai-f4-14_connection-map-critical-path.md. Agent Connection Map DONE.
- [2026-03-05 19:17:34] РџСЂРѕРІРµСЂРµРЅ РѕС‚С‡С‘С‚ 2026-03-05_a_rai-f4-15_safe-replay-trace.md. Safe Replay Trace DONE.
- [2026-03-05 19:24:27] РџСЂРѕРІРµСЂРµРЅ РѕС‚С‡С‘С‚ 2026-03-05_a_rai-f4-16_agent-configurator.md. Agent Configurator API DONE.
- [2026-03-05 19:43:27] РџСЂРѕРІРµСЂРµРЅ РѕС‚С‡РµС‚ 2026-03-05_a_rai-f4-17_control-tower-ui.md. Control Tower UI DONE.
- [2026-03-05 19:51:12] Р—Р°РїСѓС‰РµРЅС‹ API (port 4000) Рё Web (port 3000) СЃРµСЂРІРµСЂС‹.
- [2026-03-05 20:35:00] РСЃРїСЂР°РІР»РµРЅ Р±Р°Рі РІ `TopNav.tsx`: РґРѕР±Р°РІР»РµРЅ С‚Р°Р№РјР°СѓС‚ 150РјСЃ РЅР° Р·Р°РєСЂС‹С‚РёРµ РјРµРЅСЋ. РЎСѓРєР°, Р·Р°Р·РѕСЂ РІ 8 РїРёРєСЃРµР»РµР№ Р±РѕР»СЊС€Рµ РЅРµ Р»РѕРјР°РµС‚ РЅР°РІРёРіР°С†РёСЋ.

## 2026-03-05 вЂ” R2 TraceSummary Live Metrics (READY_FOR_REVIEW)

- `TraceSummaryService.updateQuality(traceId, companyId, bsScorePct, evidenceCoveragePct, invalidClaimsPct)` вЂ” РЅРѕРІС‹Р№ РјРµС‚РѕРґ РґР»СЏ РїР°С‚С‡Р° quality-РїРѕР»РµР№
- `TruthfulnessEngineService.calculateTraceTruthfulness()` вЂ” СЃРёРіРЅР°С‚СѓСЂР° РёР·РјРµРЅРµРЅР° СЃ `Promise<void>` РЅР° `Promise<number>` (bsScorePct); СѓР±СЂР°РЅ РІРЅСѓС‚СЂРµРЅРЅРёР№ `updateTraceSummary`
- `SupervisorAgent`: 2-С€Р°РіРѕРІР°СЏ Р·Р°РїРёСЃСЊ TraceSummary вЂ” initial record (exe metadata) + updateQuality (quality РїРѕСЃР»Рµ TruthfulnessEngine)
- Live РїРѕР»СЏ: `toolsVersion` = СЃРїРёСЃРѕРє РІС‹РїРѕР»РЅРµРЅРЅС‹С… tools, `policyId` = classification.method, `bsScorePct` + `evidenceCoveragePct` РёР· runtime
- tsc PASS | trace-summary.spec 4/4 | truthfulness-engine.spec 5/5 | supervisor-agent.spec 6/6

## [2026-03-15 08:40Z] Git Pull / Manual Repo Sync

- Р—Р°РїСѓСЃРє `git pull` РґР»СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё Р»РѕРєР°Р»СЊРЅРѕР№ РєРѕРїРёРё СЃ `origin/main`.

## 2026-03-05 вЂ” R3 Truthfulness Runtime Trigger (READY_FOR_REVIEW)

- Р“РѕРЅРєР° СѓСЃС‚СЂР°РЅРµРЅР°: `writeAiAuditEntry` РґРѕР¶РёРґР°РµС‚СЃСЏ РІС‹РїРѕР»РЅРµРЅРёСЏ РїРµСЂРµРґ `calculateTraceTruthfulness`.
- `replayMode` РєРѕСЂСЂРµРєС‚РЅРѕ Р±Р»РѕРєРёСЂСѓРµС‚ РІС‹С‡РµС‚ truthfulness.
- РЈР±СЂР°РЅ С„Р°Р»СЊС€РёРІС‹Р№ fallback `bsScorePct ?? 0` вЂ” РґРІРёР¶РѕРє С‚РµРїРµСЂСЊ С‡РµСЃС‚РЅРѕ РѕС‚РґР°РµС‚ 100 РґР»СЏ РїСѓСЃС‚С‹С… С‚СЂРµР№СЃРѕРІ.
- Р”РѕР±Р°РІР»РµРЅРѕ 5 С‚РµСЃС‚РѕРІ `Truthfulness runtime pipeline`.
- tsc PASS, targeted jest PASS.

## 2026-03-06 вЂ” R4 Claim Accounting and Coverage (DONE)

- Р’РЅРµРґСЂРµРЅР° РєР°РЅРѕРЅРёС‡РµСЃРєР°СЏ РјРѕРґРµР»СЊ Claim Accounting: `total / evidenced / verified / invalid`.
- Р¤РѕСЂРјСѓР»С‹ `evidenceCoveragePct` Рё `invalidClaimsPct` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РїСЂРѕР·СЂР°С‡РЅС‹Рµ Р·РЅР°РјРµРЅР°С‚РµР»Рё.
- `TruthfulnessEngineService` С‚РµРїРµСЂСЊ РІРѕР·РІСЂР°С‰Р°РµС‚ `TruthfulnessResult` РІРјРµСЃС‚Рѕ `number`.
- `TraceSummary` С‚РµРїРµСЂСЊ С‡РµСЃС‚РЅРѕ СЃРѕС…СЂР°РЅСЏРµС‚ `invalidClaimsPct`.
- Р РµРіСЂРµСЃСЃРёСЏ С‚РµСЃС‚РѕРІ (3 СЃСЋРёС‚С‹, 20 С‚РµСЃС‚РѕРІ) вЂ” PASS.
- Decision AG-RAI-R4-001 Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ.

## 2026-03-06 вЂ” R5 Forensics Timeline Depth (STARTED)

- Р’Р·СЏС‚ РїСЂРѕРјС‚ `2026-03-06_a_rai-r5_trace-forensics-depth.md`.
- Р¦РµР»СЊ: Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїРѕР»РЅРѕР№ РїСЂРёС‡РёРЅРЅРѕР№ С†РµРїРѕС‡РєРё (`router -> summary -> audit -> truthfulness -> quality -> composer`).
- РђРЅР°Р»РёР· `TraceTopologyService` Рё `ExplainabilityPanelService` РІС‹СЏРІРёР» СЂР°СЃС…РѕР¶РґРµРЅРёСЏ РІ Р»РѕРіРёРєРµ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ С„Р°Р·.

## 2026-03-06 вЂ” Git Sync (DONE)

- Р’С‹РїРѕР»РЅРµРЅ `git pull` РґР»СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё СЃ СѓРґР°Р»РµРЅРЅС‹Рј СЂРµРїРѕР·РёС‚РѕСЂРёРµРј.
- РћР±РЅРѕРІР»РµРЅС‹ С„Р°Р№Р»С‹ РІ `docs/09_ARCHIVE/`.
- РљРѕРЅС„Р»РёРєС‚РѕРІ РЅРµС‚, РІСЃС‘ С‡РёРєРё-РїСѓРєРё.

## 2026-03-06 вЂ” РЎР±РѕСЂ РґР°РЅРЅС‹С… РїРѕ СЂР°РїСЃСѓ (IN PROGRESS)

- Р¤РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ `CEMINI#1.md` (СЂСѓС‡РЅР°СЏ РїСЂР°РІРєР° СЃС‚СЂСѓРєС‚СѓСЂС‹ Рё С‚Р°Р±Р»РёС†)
- [/] Р РµС„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ `GEMINI#2.md` (83KB). РџСЂРёРјРµРЅРµРЅС‹ Python-СЃРєСЂРёРїС‚С‹ РґР»СЏ РїРµСЂРІРёС‡РЅРѕР№ СЂР°Р·Р±РёРІРєРё РЅР° СЃРµРєС†РёРё.
- РћРєРѕРЅС‡Р°С‚РµР»СЊРЅР°СЏ РѕС‡РёСЃС‚РєР° Рё С„РёРєСЃ С‚Р°Р±Р»РёС† РІ `GEMINI#2.md`.
- РЎРѕР·РґР°РЅ С„РёРЅР°Р»СЊРЅС‹Р№ РїСЂРѕРјС‚ Р“СЂР°РЅРґ-РЎРёРЅС‚РµР·Р°: `Promt_Grand_Sintez_FINAL.md` вЂ” РѕР±СЉРµРґРёРЅСЏРµС‚ СЂРѕР»СЊ/РїСЂР°РІРёР»Р° РёР· С€Р°Р±Р»РѕРЅР° СЃ РїРѕР»РЅРѕР№ 11-СЃРµРєС†РёРѕРЅРЅРѕР№ СЃС‚СЂСѓРєС‚СѓСЂРѕР№ + 6 РїСЂРёР»РѕР¶РµРЅРёР№ + 7 РїСЂР°РІРёР» С‚СЂРёР°РЅРіСѓР»СЏС†РёРё + РєСЂРёС‚РµСЂРёРё РєР°С‡РµСЃС‚РІР°.

## 2026-03-07 вЂ” РђРЅР°Р»РёР· РіРѕС‚РѕРІРЅРѕСЃС‚Рё РјСѓР»СЊС‚РёР°РіРµРЅС‚РѕРІ

- РР·СѓС‡РµРЅС‹ С‡РµРєР»РёСЃС‚С‹ `STAGE 2` (Implementation, Readiness, Truth Sync).
- РЎРѕРїРѕСЃС‚Р°РІР»РµРЅ РєРѕРґ СЃ claims: РѕР±РЅР°СЂСѓР¶РµРЅРѕ, С‡С‚Рѕ Agent Registry РїРѕРєР° СЃСѓС‰РµСЃС‚РІСѓРµС‚ Р»РёС€СЊ РєР°Рє CRUD-РёР»Р»СЋР·РёСЏ `AgentConfiguration` РІ Prisma.
- РЎС„РѕСЂРјРёСЂРѕРІР°РЅ РґР°Р»СЊРЅРµР№С€РёР№ roadmap: СЂРµР°Р»РёР·Р°С†РёСЏ `R10. Registry Domain Model`.

## 2026-03-07 вЂ” Stage 2 Interaction Blueprint Finalized вњ…

- Р—Р°РєСЂС‹С‚ `clarification / overlay / auto-resume / result windows` РєР°Рє production-like path.
- Unified window protocol РїРѕРґС‚РІРµСЂР¶РґС‘РЅ РЅР° reference families:
  - `agronomist`
  - `economist`
  - `knowledge`
  - `monitoring`
- Р’РІРµРґС‘РЅ backend contract-layer `Focus / Intent / Required Context / UI Action`.
- `IntentRouter`, `Supervisor`, `ResponseComposer` РїРµСЂРµРІРµРґРµРЅС‹ РЅР° РѕР±С‰РёР№ interaction contract source.
- `AI Dock` РїСЂРёРІРµРґС‘РЅ Рє IDE-РїРѕРґРѕР±РЅРѕР№ РєРѕРјРїРѕР·РёС†РёРё: header, history toggle, new chat, conversation, composer.
- Legacy `widgets[]` РїРµСЂРµРІРµРґРµРЅС‹ РІ compatibility path С‡РµСЂРµР· `workWindows[]`.
- Window layer РїРѕРґРґРµСЂР¶РёРІР°РµС‚ `context_`*, `structured_result`, `related_signals`, `comparison`.
- Р”РѕРєСѓРјРµРЅС‚Р°С†РёСЏ Рё handoff СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ РґРѕ СЃРѕСЃС‚РѕСЏРЅРёСЏ `DONE / implemented canon`.
- Memory-bank СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ РїРµСЂРµРґ РїСѓР±Р»РёРєР°С†РёРµР№ РІ git.

## 2026-03-11 вЂ” CI/CD & Р—Р°РїСѓСЃРє

- Р—Р°РїСѓС‰РµРЅС‹ API/Web СЃРµСЂРІРёСЃС‹ (С‡РµСЂРµР· `pnpm dev` РІ С„РѕРЅРµ).
- РЎРѕР·РґР°РЅ С„Р°Р№Р» РїРѕР»РЅРѕРіРѕ СЃРёСЃС‚РµРјРЅРѕРіРѕ Р°СѓРґРёС‚Р° `RAI_EP_SYSTEM_AUDIT.md`.
- Р’СЃРµ Р»РѕРєР°Р»СЊРЅС‹Рµ РёР·РјРµРЅРµРЅРёСЏ Р·Р°РєРѕРјРјРёС‡РµРЅС‹ Рё РѕС‚РїСЂР°РІР»РµРЅС‹ РІ СЂРµРјРѕСѓС‚.
2026-03-12: РРЅС‚РµРіСЂР°С†РёСЏ Nvidia Qwen LLM Р°РґР°РїС‚РµСЂР° РґР»СЏ Expert-tier Р°РіРµРЅС‚РѕРІ РІ СЂРµР¶РёРјРµ full_pro.
2026-03-13: Р—Р°РєРѕРјРјРёС‚РёР» Рё РїСѓС€РЅСѓР» РёР·РјРµРЅРµРЅРёСЏ РїРѕ Р±Р°Р·Рµ РґР°РЅРЅС‹С…, С‘РїС‚Р°, РІСЃС‘ РЅР° РјРµСЃС‚Рµ.
2026-03-28: РќР°С‡Р°С‚ remediation-РїР°РєРµС‚ РїРѕСЃР»Рµ enterprise-Р°СѓРґРёС‚Р°: `invariant-gate` РЅР°СѓС‡РµРЅ СЂР°СЃРїРѕР·РЅР°РІР°С‚СЊ `RequireInternalApiKey`, `semantic-router` СЃРЅРѕРІР° РѕС‚РґРµР»СЏРµС‚ bounded primary-slice РѕС‚ shadow classification, `infra/gateway/certs` РѕС‡РёС‰РµРЅ РѕС‚ versioned private key Рё РїРµСЂРµРІРµРґС‘РЅ РЅР° externalized secret policy.
2026-03-28: Р”РѕР±РёС‚ `raw SQL governance`: С‡РµС‚С‹СЂРµ db-СЃРєСЂРёРїС‚Р° РїРµСЂРµРІРµРґРµРЅС‹ СЃ `queryRawUnsafe/executeRawUnsafe` РЅР° `Prisma.sql` Рё allowlisted РєР°Рє approved tooling SQL; `node scripts/raw-sql-governance.cjs --enforce` Рё `pnpm gate:invariants` Р·Р°РІРµСЂС€РёР»РёСЃСЊ СЃ `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0`.
2026-03-28: РЎС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅ РєСЂСѓРїРЅС‹Р№ backend test-contract batch: 15 targeted suite РїСЂРѕС€Р»Рё `--runInBand`, `api build` Р·РµР»С‘РЅС‹Р№, Р° `agent-interaction-contracts` Р±РѕР»СЊС€Рµ РЅРµ СЃРѕР·РґР°С‘С‚ front-office escalation write-call Р±РµР· route/thread context РґР»СЏ red-team tenant-escape payload.
2026-03-28: Audit-РїР°РєРµС‚ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ РґРѕ РІРµСЂСЃРёРё `1.1.0` РїРѕРґ post-remediation baseline: `routing` PASS (`4/4`, `86/86`), `web build` PASS, `web test` PASS (`42/42`, `482/482`), `api test -- --runInBand` PASS (`252/252`, `1313 passed`, `1 skipped`); verdict РїРѕРґРЅСЏС‚ РґРѕ `Security/Deployment/Product = CONDITIONAL GO`, `Legal = NO-GO`.
2026-03-28: РџРѕРІС‚РѕСЂРЅР°СЏ audit-РІРµСЂРёС„РёРєР°С†РёСЏ СѓС‚РѕС‡РЅРёР»Р° residual-risk: `pnpm gate:invariants` СЃРµР№С‡Р°СЃ WARN СЃ `controllers_without_guards=0`, `raw_sql_review_required=0`, `raw_sql_unsafe=2`, Р° `infra/gateway/certs/ca.key` СѓР¶Рµ СѓРґР°Р»С‘РЅ РёР· РґРµСЂРµРІР°, РЅРѕ РµС‰С‘ С‚СЂРµР±СѓРµС‚ commit-level cleanup Рё key-rotation review.
2026-03-28: Р—Р°РєСЂС‹С‚ residual security slice: `apps/api/test/a_rai-live-api-smoke.spec.ts` РїРµСЂРµРІРµРґС‘РЅ РЅР° bracket-key mocks РґР»СЏ unsafe Prisma РјРµС‚РѕРґРѕРІ, `node scripts/raw-sql-governance.cjs --enforce` СЃРЅРѕРІР° PASS СЃ `raw_sql_unsafe=0`, Р° `pnpm gate:invariants` Р·Р°РІРµСЂС€РёР»СЃСЏ СЃ `violations=0`.
2026-03-28: `git rm --cached --force infra/gateway/certs/ca.key` СѓР±СЂР°Р» `ca.key` РёР· С‚РµРєСѓС‰РµРіРѕ РёРЅРґРµРєСЃР°; РѕС‚РєСЂС‹С‚С‹Рј РѕСЃС‚Р°Р»СЃСЏ СѓР¶Рµ РЅРµ tracked-file risk, Р° history cleanup / rotation evidence debt.
2026-03-28: Audit-РїР°РєРµС‚ РѕР±РЅРѕРІР»С‘РЅ РґРѕ РІРµСЂСЃРёРё `1.2.0`: evidence matrix Рё delta С‚РµРїРµСЂСЊ С„РёРєСЃРёСЂСѓСЋС‚ fully green invariant baseline Рё historical, Р° РЅРµ active, С…Р°СЂР°РєС‚РµСЂ `ca.key` incident.
2026-03-28: Р—Р°РєСЂС‹С‚ DB governance drift: `MODEL_SCOPE_MANIFEST.md` РґРѕРїРѕР»РЅРµРЅ `TechMapReviewSnapshot`, `TechMapApprovalSnapshot`, `TechMapPublicationLock`, РїРѕСЃР»Рµ С‡РµРіРѕ `pnpm gate:db:scope` СЃРЅРѕРІР° PASS.
2026-03-28: Audit-РїР°РєРµС‚ РѕР±РЅРѕРІР»С‘РЅ РґРѕ РІРµСЂСЃРёРё `1.3.0`: deployment/schema sections Р±РѕР»СЊС€Рµ РЅРµ СЃС‡РёС‚Р°СЋС‚ `gate:db:scope` Р°РєС‚РёРІРЅС‹Рј blocker, Р° С„РѕРєСѓСЃ remediation СЃРјРµС‰С‘РЅ РІ legal/compliance, supply-chain Рё schema validate stabilization.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` Р·Р°РєСЂС‹С‚ remediation-РїР°РєРµС‚ Р»РµРЅРґРёРЅРіР° Р“Р РРџРР›: СѓРґР°Р»С‘РЅ Р¶С‘СЃС‚РєРёР№ scroll-hijack РёР· `ScrollNavigation`, CTA РїРµСЂРµРІРµРґС‘РЅ СЃ `alert` РЅР° СЂРµР°Р»СЊРЅС‹Р№ `app/api/lead` submit СЃ СЃРµСЂРІРµСЂРЅРѕР№ РІР°Р»РёРґР°С†РёРµР№ Рё webhook-bridge, С‚СЏР¶С‘Р»С‹Рµ РјРµРґРёР° СЃРјСЏРіС‡РµРЅС‹ С‡РµСЂРµР· lazy-РїРѕРґС…РѕРґ (`priority` С‚РѕР»СЊРєРѕ РІ hero, `preload=\"none\"` РґР»СЏ ecology video, GPU-friendly slider transforms, reduced-motion fallback), Р° `SplitComparison` СѓСЃРёР»РµРЅ РґРѕ signature-СЃС†РµРЅС‹ СЃ pinned scan-line, HUD-РјРµС‚СЂРёРєР°РјРё Рё Р°С‚РјРѕСЃС„РµСЂРЅС‹Рј СЃР»РѕРµРј Р±РµР· РїРѕР»РЅРѕРіРѕ WebGL. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: Р»РµРЅРґРёРЅРі СЃРѕС…СЂР°РЅРёР» wow-РїРѕРґР°С‡Сѓ, РЅРѕ СЃС‚Р°Р» СЃС‚Р°Р±РёР»СЊРЅРµРµ РЅР° РјРѕР±РёР»СЊРЅС‹С…, С‡РµСЃС‚РЅРµРµ РїРѕ lead-flow Рё Р±РµР·РѕРїР°СЃРЅРµРµ РґР»СЏ РґР°Р»СЊРЅРµР№С€РµРіРѕ СЂР°Р·РІРёС‚РёСЏ.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` СѓСЃС‚СЂР°РЅС‘РЅ hydration mismatch РІ `EcologySection`: РіРµРЅРµСЂР°С†РёСЏ С‡Р°СЃС‚РёС† РїРµСЂРµРІРµРґРµРЅР° СЃ `Math.random()` РЅР° РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅС‹Р№ seeded generator, С‡С‚РѕР±С‹ server HTML Рё client hydration РІС‹РґР°РІР°Р»Рё РѕРґРёРЅР°РєРѕРІС‹Рµ inline styles. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: dev-overlay СЃ РѕС€РёР±РєРѕР№ РіРёРґСЂР°С†РёРё РёСЃС‡РµР·Р°РµС‚, Р° РІРёР·СѓР°Р»СЊРЅС‹Р№ СЃР»РѕР№ РїС‹Р»СЊС†С‹ СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ Р±РµР· SSR-РєРѕРЅС„Р»РёРєС‚Р°.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` СЃРµРєС†РёСЏ `YieldCalculator` РїРµСЂРµРІРµРґРµРЅР° РёР· СЃС‚Р°РЅРґР°СЂС‚РЅРѕРіРѕ B2B-РІРёРґР¶РµС‚Р° РІ pinned Awwwards-СЃС†РµРЅСѓ `Loss в†’ Recovery Engine`: РѕР±С‹С‡РЅС‹Рµ СЃР»Р°Р№РґРµСЂС‹ Р·Р°РјРµРЅРµРЅС‹ РЅР° С„РёСЂРјРµРЅРЅС‹Рµ `MetricRail`, С‡РёСЃР»РѕРІРѕР№ СЂРµР·СѓР»СЊС‚Р°С‚ РїРµСЂРµСЃС‚СЂРѕРµРЅ РІ РґСЂР°РјР°С‚СѓСЂРіРёСЋ `РїРѕС‚РµСЂРё в†’ РјРµРјР±СЂР°РЅР° в†’ С‡РёСЃС‚Р°СЏ РІС‹РіРѕРґР°`, Р° РІРёР·СѓР°Р»СЊРЅР°СЏ С‡Р°СЃС‚СЊ РїРѕР»СѓС‡РёР»Р° Р¶РёРІСѓСЋ split-СЃС†РµРЅСѓ РїРѕР»СЏ СЃ risk/recovery veil, scan-line Рё СЃРёРіРЅР°Р»СЊРЅС‹РјРё РєР°СЂС‚РѕС‡РєР°РјРё. Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ runtime РѕС‡РёС‰РµРЅ РїРѕРґ РЅРѕРІСѓСЋ РїРѕРґР°С‡Сѓ: `next.config.ts` С‚РµРїРµСЂСЊ СЏРІРЅРѕ СЂР°Р·СЂРµС€Р°РµС‚ РёСЃРїРѕР»СЊР·СѓРµРјС‹Рµ `next/image` quality presets, Р° `SectionReveal` РІСЃРµРіРґР° СЂРµРЅРґРµСЂРёС‚СЃСЏ РєР°Рє positioned-wrapper РґР»СЏ Р±РѕР»РµРµ РїСЂРµРґСЃРєР°Р·СѓРµРјРѕР№ СЂР°Р±РѕС‚С‹ scroll-driven Р°РЅРёРјР°С†РёР№. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: РєР°Р»СЊРєСѓР»СЏС‚РѕСЂ СЃС‚Р°Р» РѕРґРЅРёРј РёР· РіР»Р°РІРЅС‹С… wow-РјРѕРјРµРЅС‚РѕРІ Р»РµРЅРґРёРЅРіР°, СЃРѕС…СЂР°РЅРёР» ROI-РєРѕРЅРІРµСЂСЃРёРѕРЅРЅСѓСЋ С„СѓРЅРєС†РёСЋ Рё СѓР±СЂР°Р» Р»РёС€РЅРёР№ runtime-С€СѓРј РІРѕРєСЂСѓРі РЅРѕРІРѕР№ СЃС†РµРЅС‹.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` РІС‹РїРѕР»РЅРµРЅР° СЃС‚Р°Р±РёР»РёР·Р°С†РёСЏ Awwwards-РєР°Р»СЊРєСѓР»СЏС‚РѕСЂР° РїРѕСЃР»Рµ РїРµСЂРІРѕРіРѕ РІРёР·СѓР°Р»СЊРЅРѕРіРѕ РїСЂРѕРіРѕРЅР°: Р»РµРІР°СЏ narrative-Р·РѕРЅР° РїРѕР»СѓС‡РёР»Р° СѓРІРµР»РёС‡РµРЅРЅС‹Р№ Р±РµР·РѕРїР°СЃРЅС‹Р№ copy-slot Рё Р±РѕР»РµРµ РєРѕРјРїР°РєС‚РЅС‹Р№ headline-scale, РїСЂР°РІР°СЏ `ROI Console` СѓР¶Р°С‚Р° РїРѕ РІРµСЂС‚РёРєР°Р»Рё Рё СЃРѕР±СЂР°РЅР° РІ fixed-height panel СЃ РІРЅСѓС‚СЂРµРЅРЅРёРј scroll-body, Р° С‚СЏР¶С‘Р»Р°СЏ ambient-РіСЂР°С„РёРєР° СѓРїСЂРѕС‰РµРЅР° Р·Р° СЃС‡С‘С‚ РјРµРЅСЊС€РµРіРѕ blur, РјРµРЅРµРµ Р°РіСЂРµСЃСЃРёРІРЅС‹С… С„РѕРЅРѕРІ Рё РїРµСЂРµРІРѕРґР° С‡Р°СЃС‚Рё seed-СЃР»РѕСЏ СЃ РїРѕСЃС‚РѕСЏРЅРЅРѕР№ JS-Р°РЅРёРјР°С†РёРё РЅР° Р±РѕР»РµРµ РґРµС€С‘РІСѓСЋ CSS/static-РїРѕРґР°С‡Сѓ. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: СЃРµРєС†РёСЏ РїРµСЂРµСЃС‚Р°Р»Р° РєРѕРЅС„Р»РёРєС‚РѕРІР°С‚СЊ СЃ РІС‹СЃРѕС‚РѕР№ viewport, Р±Р»РѕРєРё Р±РѕР»СЊС€Рµ РЅРµ РЅР°РµР·Р¶Р°СЋС‚ РЅР° С‚РµРєСЃС‚, Р° РіСЂР°С„РёРєР° Р·Р°РјРµС‚РЅРѕ Р»РµРіС‡Рµ РґР»СЏ Р±СЂР°СѓР·РµСЂР° РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё wow-РєРѕРјРїРѕР·РёС†РёРё.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` `ROI Console` РєР°Р»СЊРєСѓР»СЏС‚РѕСЂР° РїРµСЂРµРїСЂРѕРµРєС‚РёСЂРѕРІР°РЅ РїРѕРґ full-visible desktop usage: РїР°СЂР°РјРµС‚СЂС‹ РїРѕР»СЏ СЃРѕР±СЂР°РЅС‹ РІ РєРѕРјРїР°РєС‚РЅСѓСЋ РІРµСЂС…РЅСЋСЋ control-row Р±РµР· С‚РѕРЅРєРёС… rail-С‚СЂРµРєРѕРІ, РІС‚РѕСЂРёС‡РЅС‹Рµ СЌРєРѕРЅРѕРјРёС‡РµСЃРєРёРµ РїРѕРєР°Р·Р°С‚РµР»Рё СЃР¶Р°С‚С‹ РІ summary-tiles Рё inline-ledger РІРЅСѓС‚СЂРё hero-РјРµС‚СЂРёРєРё, Р° РІРЅСѓС‚СЂРµРЅРЅРёР№ scroll РёР· РїСЂР°РІРѕР№ РїР°РЅРµР»Рё СѓР±СЂР°РЅ РїРѕР»РЅРѕСЃС‚СЊСЋ. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃСЂР°Р·Сѓ РІРёРґРёС‚ РІСЃРµ РєР»СЋС‡РµРІС‹Рµ РјРµС‚СЂРёРєРё РєР°Р»СЊРєСѓР»СЏС‚РѕСЂР° РЅР° РѕРґРЅРѕРј СЌРєСЂР°РЅРµ Рё Р±С‹СЃС‚СЂРµРµ РїРѕРЅРёРјР°РµС‚, С‡С‚Рѕ РёРјРµРЅРЅРѕ РјРѕР¶РЅРѕ РјРµРЅСЏС‚СЊ Рё РєР°РєРѕР№ С„РёРЅР°РЅСЃРѕРІС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚ РїРѕР»СѓС‡Р°РµС‚ С…РѕР·СЏР№СЃС‚РІРѕ.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` РІ `SplitComparison` СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅР° РіРµРѕРјРµС‚СЂРёСЏ reveal-РіСЂР°РЅРёС†С‹ Рё neon scan-line: clip-mask Р·РґРѕСЂРѕРІРѕРіРѕ СЃР»РѕСЏ РѕС‚РґРµР»РµРЅР° РѕС‚ РјР°СЃС€С‚Р°Р±РёСЂСѓРµРјРѕРіРѕ media-wrapper, Р° СЃР°РјР° СЃРІРµС‚РѕРІР°СЏ Р»РёРЅРёСЏ С‚РµРїРµСЂСЊ С†РµРЅС‚СЂРёСЂСѓРµС‚СЃСЏ РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ РІС‹С‡РёСЃР»СЏРµРјРѕР№ РїРѕР·РёС†РёРё СЂР°Р·РґРµР»Р°. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: РІРµСЂС‚РёРєР°Р»СЊРЅС‹Р№ СЂР°Р·РґРµР»РёС‚РµР»СЊ РІРёР·СѓР°Р»СЊРЅРѕ СЃРѕРІРїР°РґР°РµС‚ СЃ СЂРµР°Р»СЊРЅРѕР№ РіСЂР°РЅРёС†РµР№ РїРµСЂРµС…РѕРґР° РјРµР¶РґСѓ `РґРѕ` Рё `РїРѕСЃР»Рµ`, Р±РµР· СЃРјРµС‰РµРЅРёСЏ РёР·-Р·Р° transform-Р°РЅРёРјР°С†РёРё СЃР»РѕСЏ.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` РІРµСЂС…РЅРёРµ controls РєР°Р»СЊРєСѓР»СЏС‚РѕСЂР° РїРµСЂРµРІРµРґРµРЅС‹ РІ Р±РѕР»РµРµ РїСЂРµРјРёР°Р»СЊРЅСѓСЋ typographic-СЃС…РµРјСѓ: РґР»РёРЅРЅС‹Рµ С‚РµС…РЅРёС‡РµСЃРєРёРµ label-СЃРёРіРЅР°С‚СѓСЂС‹ СЃР¶Р°С‚С‹ РґРѕ РєРѕСЂРѕС‚РєРёС… display-РЅР°Р·РІР°РЅРёР№, units РІС‹РЅРµСЃРµРЅС‹ РІ РѕС‚РґРµР»СЊРЅС‹Рµ badge-РјР°СЂРєРµСЂС‹, numeric-value СЃС‚Р°Р» РіР»Р°РІРЅС‹Рј РІРёР·СѓР°Р»СЊРЅС‹Рј СЃР»РѕРµРј card, Р° CTA РїРµСЂРµСЂР°Р±РѕС‚Р°РЅ РІ РєСЂСѓРїРЅС‹Р№ action-card СЃ РґРІСѓС…СѓСЂРѕРІРЅРµРІС‹Рј С‚РµРєСЃС‚РѕРј Рё СЃРІРµС‚РѕРІС‹Рј Р°РєС†РµРЅС‚РѕРј Р±СЂРµРЅРґР°. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: РїР°СЂР°РјРµС‚СЂС‹ СЃС‡РёС‚С‹РІР°СЋС‚СЃСЏ Р±С‹СЃС‚СЂРµРµ Рё РІС‹РіР»СЏРґСЏС‚ РґРѕСЂРѕР¶Рµ, Р° РєРЅРѕРїРєР° РїРµСЂРµСЃС‚Р°С‘С‚ Р±С‹С‚СЊ СЃРµСЂРІРёСЃРЅРѕР№ СЃС‚СЂРѕРєРѕР№ Рё СЃС‚Р°РЅРѕРІРёС‚СЃСЏ СЏРІРЅРѕР№ РєСѓР»СЊРјРёРЅР°С†РёРµР№ РєРѕРЅРІРµСЂСЃРёРѕРЅРЅРѕРіРѕ СЃС†РµРЅР°СЂРёСЏ.
2026-03-28: Р”Р»СЏ `apps/gripil-web-awwwards` СЃРµРєС†РёСЏ `YieldCalculator` РїРµСЂРµРІРµРґРµРЅР° РёР· СЂСѓС‡РЅРѕРіРѕ scroll/input-СЃС†РµРЅР°СЂРёСЏ РІ Р°РІС‚РѕРЅРѕРјРЅС‹Р№ presentation-loop: sticky-scroll progression Р·Р°РјРµРЅС‘РЅ РЅР° РІРЅСѓС‚СЂРµРЅРЅРёР№ time-driven motion cycle, Р° РІРµСЂС…РЅРёРµ `MetricRail` Р±РѕР»СЊС€Рµ РЅРµ РїСЂРёРЅРёРјР°СЋС‚ РјС‹С€РёРЅС‹Р№ input Рё СЃР°РјРё РїРµСЂРµРєР»СЋС‡Р°СЋС‚СЃСЏ РїРѕ preset-СЃС†РµРЅР°СЂРёСЏРј РїРѕР»СЏ (`РїР»РѕС‰Р°РґСЊ / СѓСЂРѕР¶Р°Р№РЅРѕСЃС‚СЊ / С†РµРЅР°`) РїРѕСЃР»Рµ СЃС‚Р°СЂС‚РѕРІРѕРіРѕ default-state. РџСЂР°РєС‚РёС‡РµСЃРєРёР№ СЌС„С„РµРєС‚: Р±Р»РѕРє СЂР°Р±РѕС‚Р°РµС‚ РєР°Рє СЃР°РјРѕРґРѕСЃС‚Р°С‚РѕС‡РЅР°СЏ Awwwards-СЃС†РµРЅР°, СЃР°Рј РґРµРјРѕРЅСЃС‚СЂРёСЂСѓРµС‚ РїРµСЂРµС…РѕРґ РѕС‚ СЂРёСЃРєР° Рє РїСЂРёР±С‹Р»Рё Рё РЅРµ С‚СЂРµР±СѓРµС‚ РѕС‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ СЂСѓС‡РЅРѕР№ СЂРµРіСѓР»РёСЂРѕРІРєРё РїР°СЂР°РјРµС‚СЂРѕРІ, С‡С‚РѕР±С‹ РїРѕРЅСЏС‚СЊ value РїСЂРѕРґСѓРєС‚Р°.
2026-03-28: Для `apps/gripil-web-awwwards` motion-контракт автономного `YieldCalculator` смягчён под более премиальную и менее перегруженную подачу: auto-loop растянут до 12-секундного шага на сценарий и 36-секундного полного цикла, `AnimatedNumber` теперь перетекает из предыдущего значения вместо старта с нуля, narrative-copy и membrane/recovery veil получили более широкие transition-окна, а лаймовый акцент и glow в `YieldCalculator` и `globals.css` десатурированы и замедлены. Практический эффект: секция читается спокойнее, не мигает как виджет, дольше удерживает внимание на каждом сценарии и лучше соответствует Awwwards-подаче без потери ROI-смысла.

2026-03-29: Для `apps/gripil-web-awwwards` закрыт recoverable hydration drift в `YieldCalculator`: на label/value узлах `InlineMetric` добавлен `suppressHydrationWarning`, после чего `pnpm lint`, `pnpm build` и browser-check на `http://localhost:3006` подтвердили отсутствие dev overlay с текстовой рассинхронизацией. Практический эффект: калькулятор перестал регенерироваться на клиенте из-за локального SSR/client text mismatch и снова даёт чистый preview в dev-режиме.
2026-03-29: Для `apps/gripil-web-awwwards` `YieldCalculator` переведён из авто-смены смысловых и финансовых сценариев в стабильный showcase-режим: headline, stage-pill и все ROI-метрики зафиксированы на одном кураторском кейсе, а автономным оставлен только мягкий атмосферный motion сцены (`membrane / veil / scan glow`). Практический эффект: калькулятор перестал жить своей жизнью, больше не путает пользователя самопроизвольной сменой текста и цифр и читается как единый premium-блок.
2026-03-29: Для `apps/gripil-web-awwwards` `FAQAccordion` переведён на deterministic first paint: у `motion`-обёрток секции отключён enter-`initial`, для viewport-анимаций заданы стабильные `once/amount`, а `AnimatePresence` раскрытия ответа переведён на `initial={false}`. Практический эффект: FAQ перестал быть источником ложных hydration text-mismatch в dev-режиме при сохранении мягкой анимационной подачи после монтирования.
2026-03-29: Для `apps/gripil-web-awwwards` в `YieldCalculator` возвращена stage-анимация narrative-слоя без возврата к хаотичной автосмене экономики: headline, stage-pill и scene-state снова переключаются по трём состояниям (`risk -> membrane -> roi`) через отдельный таймер, а все ROI-метрики, рельсы и summary-данные зафиксированы на одном showcase-кейсе. Практический эффект: секция снова воспринимается как живая Awwwards-сцена, но при этом цифры не скачут и не подрывают доверие к расчёту.
2026-03-29: Для `apps/gripil-web-awwwards` в `YieldCalculator` устранено дублирование ROI-метрик между левой scene-панелью и правой `ROI Console`: нижние карточки сцены переведены из финансовых значений в process-callouts про источник потерь, роль мембраны и рабочее окно `BBCH 79-80`, с активной подсветкой по stage-loop. Практический эффект: левая часть секции теперь объясняет механику и агрономическую логику процесса, правая считает деньги, из-за чего блок читается чище и убедительнее для пользователя.
2026-03-29: Для `apps/gripil-web-awwwards` `YieldCalculator` приведён к единому русскоязычному UI-словарю и синхронизирован по микроакцентам: `Loss → Recovery Engine`, `ROI Console` и `live` заменены на `Риск → Капитал`, `Панель ROI` и `Сейчас`, а правая панель получила stage-driven подсветку без смены чисел — в фазе `risk` акцентируются потери, в фазе `membrane` управляющие рельсы и операционный блок, в фазе `roi` hero-метрика и CTA. Практический эффект: секция стала цельнее по языку и режиссуре, но сохранила доверие к расчёту, потому что движение показывает фокус внимания, а не переписывает экономику.
2026-03-29: Для `apps/gripil-web-awwwards` композиция `YieldCalculator` дополнительно ужата под чистый first-screen: headline каждой стадии переведён в двухстрочный ритм с более компактным scale, нижняя сцена очищена от тяжёлой трёхкарточной сетки и заменена на одиночный active callout по текущей фазе, а CTA усилен до крупной action-card с явной привязкой к демонстрационному кейсу (`1400 га / 31 ц/га / 52 000 ₽`). Практический эффект: сцена перестала перекрывать changing copy, верхняя драматургия читается быстрее, а кнопка стала главной точкой конверсии внутри калькулятора.
2026-03-29: Для `apps/gripil-web-awwwards` из `YieldCalculator` полностью удалён нижний scene-overlay callout, который дублировал смысл headline и конфликтовал с меняющимся copy-слоем. Практический эффект: left-scene снова работает как чистый атмосферный контекст с разделительной scan-line и stage-badges, а смысловая нагрузка возвращена в headline и правую ROI-панель без перекрытия текста.
