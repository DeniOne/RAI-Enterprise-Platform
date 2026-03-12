import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { timingSafeEqual } from "crypto";
import {
  AUTH_BOUNDARY_KEY,
  AuthBoundaryMetadata,
} from "./auth-boundary.decorator";
import { SecretsService } from "../config/secrets.service";

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(
    private readonly secretsService: SecretsService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const boundary = this.reflector.getAllAndOverride<AuthBoundaryMetadata>(
      AUTH_BOUNDARY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (boundary?.kind !== "internal_api_key") {
      throw new UnauthorizedException("Unauthorized");
    }

    const request = context.switchToHttp().getRequest();
    const provided = request.headers["x-internal-api-key"] as
      | string
      | undefined;
    const expected =
      this.secretsService.getOptionalSecret("INTERNAL_API_KEY") || "";

    if (
      !expected ||
      !provided ||
      !this.safeEquals(provided.trim(), expected.trim())
    ) {
      throw new UnauthorizedException("Unauthorized");
    }

    request.authBoundary = boundary.kind;
    return true;
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
