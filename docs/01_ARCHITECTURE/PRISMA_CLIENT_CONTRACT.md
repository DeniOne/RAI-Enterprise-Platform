# PRISMA_CLIENT_CONTRACT

## Rules for Prisma Client Management

1.  **Generation Authority**: Prisma Client MUST only be generated through the root script: `pnpm db:client`.
2.  **Schema Source of Truth**: The canonical source for the database schema is located at `packages/prisma-client/schema.prisma`.
3.  **Transparent Extensions**: Any implementation of `PrismaService` or equivalent wrapper MUST be transparent for model delegates. This means manual property getters for each model are FORBIDDEN. Use a Proxy-based approach to ensure that new models added to the schema are automatically available and correctly isolated.
4.  **Tenant Isolation**: All tenant-scoped models MUST be listed in the `tenantScopedModels` set within `PrismaService` to ensure 10/10 platform isolation.
5.  **Environment Sync**: The `postinstall` script ensures that the client is always generated and built after dependency updates.

## Workflow for adding new models

1.  Update `packages/prisma-client/schema.prisma`.
2.  Run `pnpm prisma:generate` from the root.
3.  If the model requires tenant isolation, add its name to the `tenantScopedModels` Set in `apps/api/src/shared/prisma/prisma.service.ts`.
4.  The delegate `this.prisma.yourNewModel` will be automatically available and isolated.
