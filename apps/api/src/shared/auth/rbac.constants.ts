import { UserRole } from "@rai/prisma-client";

export const TENANT_ADMIN_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.CLIENT_ADMIN,
  UserRole.CEO,
];

export const INTERNAL_USER_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
  UserRole.FIELD_WORKER,
  UserRole.USER,
];

export const COMMERCE_READ_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
];

export const COMMERCE_WRITE_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
  UserRole.MANAGER,
];

export const REGULATORY_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
];

export const PLANNING_READ_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
  UserRole.FIELD_WORKER,
];

export const PLANNING_WRITE_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
];

export const EXECUTION_ROLES: UserRole[] = [
  ...PLANNING_WRITE_ROLES,
  UserRole.FIELD_WORKER,
];

export const STRATEGIC_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.CEO,
  UserRole.CFO,
];

export const MANAGEMENT_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.MANAGER,
];

export const EXPERT_REVIEW_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
];

export const EXPLORATION_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
];

export const RND_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
];

export const FRONT_OFFICE_INTERNAL_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.MANAGER,
  UserRole.AGRONOMIST,
];

export const FRONT_OFFICE_MANAGER_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.MANAGER,
];

export const FRONT_OFFICE_THREAD_ROLES: UserRole[] = [
  ...FRONT_OFFICE_INTERNAL_ROLES,
  UserRole.FRONT_OFFICE_USER,
];

export const OBSERVABILITY_ROLES: UserRole[] = [...TENANT_ADMIN_ROLES];

export const AUDIT_READ_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
];

export const PARTY_LOOKUP_ROLES: UserRole[] = [
  ...COMMERCE_WRITE_ROLES,
];

export const FINANCE_ROLES: UserRole[] = [
  ...TENANT_ADMIN_ROLES,
  UserRole.CFO,
];
