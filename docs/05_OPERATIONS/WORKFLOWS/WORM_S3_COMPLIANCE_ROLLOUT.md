# WORM S3 Compliance Rollout

## Цель

Поднять внешний `WORM`-контур для `audit_notarization` в режиме `s3_compatible|dual` так, чтобы:

- bucket существовал с `Object Lock`;
- `Versioning` был включён;
- default retention был `COMPLIANCE / Years / 7`;
- `API` не стартовал в `production` при небезопасной конфигурации.

## Обязательные env

- `AUDIT_WORM_PROVIDER=s3_compatible` или `AUDIT_WORM_PROVIDER=dual`
- `WORM_S3_BUCKET=rai-audit-worm`
- `WORM_S3_PREFIX=audit-worm`
- `WORM_S3_REGION=us-east-1`
- `WORM_S3_OBJECT_LOCK_REQUIRED=true`
- `WORM_S3_AUTO_CREATE_BUCKET=true`
- `WORM_S3_AUTO_CONFIGURE_DEFAULT_RETENTION=true`
- `WORM_S3_RETENTION_MODE=COMPLIANCE`
- `WORM_S3_RETENTION_YEARS=7`
- `MINIO_ENDPOINT`
- `MINIO_PORT`
- `MINIO_ROOT_USER` или `MINIO_ACCESS_KEY`
- `MINIO_ROOT_PASSWORD` или `MINIO_SECRET_KEY`

## Bootstrap

1. Поднять `MinIO/S3-compatible` storage.
2. Запустить:

```bash
pnpm storage:minio:setup
```

3. Убедиться, что bucket `rai-audit-worm` создан с `Object Lock`.

## Smoke Check

1. Собрать `API`:

```bash
pnpm -C apps/api build
```

2. Запустить живой self-test `WORM`-сервиса:

```bash
cd apps/api
pnpm exec node
```

Дальше в `node`:

```js
process.env.NODE_ENV = "production";
process.env.AUDIT_WORM_PROVIDER = "s3_compatible";
process.env.WORM_S3_BUCKET = "rai-audit-worm";
process.env.WORM_S3_PREFIX = "audit-worm";
process.env.WORM_S3_RETENTION_MODE = "COMPLIANCE";
process.env.WORM_S3_RETENTION_YEARS = "7";
process.env.WORM_S3_OBJECT_LOCK_REQUIRED = "true";
process.env.WORM_S3_AUTO_CREATE_BUCKET = "true";
process.env.WORM_S3_AUTO_CONFIGURE_DEFAULT_RETENTION = "true";
process.env.MINIO_ENDPOINT = "localhost";
process.env.MINIO_PORT = "9000";
process.env.MINIO_ROOT_USER = "rai_admin";
process.env.MINIO_ROOT_PASSWORD = "rai_secret_password";
process.env.MINIO_USE_SSL = "false";

require("reflect-metadata");
const { ConfigService } = require("@nestjs/config");
const { SecretsService } = require("./dist/apps/api/src/shared/config/secrets.service.js");
const { WormStorageService } = require("./dist/apps/api/src/level-f/worm/worm-storage.service.js");

(async () => {
  const config = new ConfigService(process.env);
  const secrets = new SecretsService(config);
  const service = new WormStorageService(config, secrets);
  await service.onModuleInit();
  const receipt = await service.uploadImmutableObject(
    `audit-logs/default-rai-company/selftest/${Date.now()}.json`,
    { type: "WORM_S3_COMPLIANCE_SELFTEST", at: new Date().toISOString() },
  );
  console.log(service.describeConfig());
  console.log(receipt);
  console.log(await service.isObjectAccessible(receipt.uri));
})();
```

Ожидаемый результат:

- `describeConfig()` содержит `objectLock=enabled`
- `versioning=enabled`
- `defaultRetention=COMPLIANCE:Years:7`
- `receipt.uri` начинается с `s3://rai-audit-worm/`
- `isObjectAccessible(...) === true`

## Fail-Closed Поведение

`API` обязан падать на старте, если:

- `NODE_ENV=production`, но `AUDIT_WORM_PROVIDER=filesystem` и нет `AUDIT_WORM_ALLOW_FILESYSTEM_IN_PRODUCTION=true`
- bucket для `s3_compatible|dual` не задан
- bucket существует без `Object Lock`
- bucket не подтвердил `Versioning=Enabled`
- bucket не подтвердил default retention `COMPLIANCE / Years / 7`

## Что считать успешным rollout

- `pnpm storage:minio:setup` проходит
- `WormStorageService` self-test проходит
- `/api/health` отдаёт `audit_notarization.status=up`
- новые audit-proof записи создают `s3://`-URI, а не только `file://`
