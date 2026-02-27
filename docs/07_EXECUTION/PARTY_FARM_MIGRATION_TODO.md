# TODO: Migration compat layer (Party → Farm split)

Место внедрения: `apps/api/src/modules/commerce` (read-models + migration service).

1. Прочитать legacy `registrationData.farm` у `Party`.
2. Для каждой записи создать `Asset` с `type='FARM'` в реестре Assets.
3. Создать `AssetPartyRole`:
- `OPERATOR` для party-создателя по `validFrom=createdAt`.
- `OWNER` если legacy-модель явно содержала ownership-признак.
4. `holdingName/groupName` строковые поля пометить deprecated и перестать использовать в UI.
5. Включить редирект и backward-compatible ответ в старых endpoint до полного cut-over.
