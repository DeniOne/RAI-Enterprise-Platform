export type TelegramTunnel = "front_office_rep" | "back_office_operator";

const BACK_OFFICE_ROLES = new Set([
  "MANAGER",
  "ADMIN",
  "CEO",
  "CFO",
  "AGRONOMIST",
]);

export function resolveTelegramTunnel(user: {
  role?: string | null;
  accountId?: string | null;
  employeeProfile?: { clientId?: string | null } | null;
}): TelegramTunnel {
  const role = String(user.role ?? "").toUpperCase();
  if (BACK_OFFICE_ROLES.has(role)) {
    return "back_office_operator";
  }

  if (user.accountId || user.employeeProfile?.clientId) {
    return "front_office_rep";
  }

  return "front_office_rep";
}
