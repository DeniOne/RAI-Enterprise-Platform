import { applyDecorators, UseGuards } from "@nestjs/common";
import { UserRole } from "@rai/prisma-client";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

export function Authorized(...roles: UserRole[]) {
  return applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(...roles));
}
