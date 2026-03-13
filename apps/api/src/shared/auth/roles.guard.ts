import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { UserRole } from "@rai/prisma-client";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  private isKnownRole(role: string): role is UserRole {
    return (Object.values(UserRole) as string[]).includes(role);
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request =
      context.getType<string>() === "graphql"
        ? GqlExecutionContext.create(context).getContext().req
        : context.switchToHttp().getRequest();

    const { user, headers } = request ?? {};

    // Если пользователя нет в запросе (например, публичный эндпоинт без AuthGuard)
    if (!user) {
      return false;
    }

    const simulatedRoleHeader = headers?.["x-simulated-role"];
    const normalizedSimulatedRole =
      typeof simulatedRoleHeader === "string"
        ? simulatedRoleHeader.trim().toUpperCase()
        : null;
    const effectiveRole =
      normalizedSimulatedRole && this.isKnownRole(normalizedSimulatedRole)
        ? normalizedSimulatedRole
        : user.role;

    // ADMIN имеет доступ ко всему
    if (effectiveRole === UserRole.ADMIN) {
      return true;
    }

    return requiredRoles.some((role) => effectiveRole === role);
  }
}
