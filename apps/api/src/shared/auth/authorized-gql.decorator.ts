import { applyDecorators, UseGuards } from "@nestjs/common";
import { UserRole } from "@rai/prisma-client";
import { GqlAuthGuard } from "./auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

export function AuthorizedGql(...roles: UserRole[]) {
  return applyDecorators(UseGuards(GqlAuthGuard, RolesGuard), Roles(...roles));
}
