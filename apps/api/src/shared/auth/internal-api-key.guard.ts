import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers["x-internal-api-key"] as
      | string
      | undefined;
    const expected = this.configService.get<string>("INTERNAL_API_KEY") || "";

    if (!expected || !provided || provided !== expected) {
      throw new UnauthorizedException("Unauthorized");
    }

    return true;
  }
}
