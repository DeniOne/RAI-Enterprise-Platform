import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@rai/prisma-client";

export const CONSULTING_ACCESS_POLICY_KEY = "consulting_access_policy";

export type ConsultingAccessPolicy = "strategic" | "management";

const CONSULTING_POLICY_MATRIX: Record<
  ConsultingAccessPolicy,
  {
    allowedRoles: UserRole[];
    errorMessage: string;
  }
> = {
  strategic: {
    allowedRoles: [UserRole.ADMIN, UserRole.CEO, UserRole.CFO],
    errorMessage:
      "Доступ разрешен только стратегическому руководству (CEO/CFO/ADMIN)",
  },
  management: {
    allowedRoles: [UserRole.ADMIN, UserRole.CEO, UserRole.CFO],
    errorMessage: "Доступ разрешен только руководству (CEO/CFO/ADMIN)",
  },
};

@Injectable()
export class ConsultingAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<ConsultingAccessPolicy>(
      CONSULTING_ACCESS_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!policy) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user?.role || !user?.companyId) {
      throw new ForbiddenException(
        "Отсутствует аутентифицированный контекст для consulting policy.",
      );
    }

    const matrix = CONSULTING_POLICY_MATRIX[policy];
    if (!matrix.allowedRoles.includes(user.role)) {
      throw new ForbiddenException(matrix.errorMessage);
    }

    return true;
  }
}
