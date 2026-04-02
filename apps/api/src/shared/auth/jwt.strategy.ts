import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { SecretsService } from "../config/secrets.service";
import { TenantIdentityResolverService } from "../tenant-context/tenant-identity-resolver.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    secretsService: SecretsService,
    private readonly tenantIdentityResolver: TenantIdentityResolverService,
  ) {
    const secret = secretsService.getRequiredSecret("JWT_SECRET");
    const cookieExtractor = (req: any): string | null => {
      const cookieHeader = req?.headers?.cookie as string | undefined;
      if (!cookieHeader) return null;

      const parts = cookieHeader.split(";");
      for (const part of parts) {
        const [rawKey, ...rawValue] = part.trim().split("=");
        if (rawKey === "auth_token") {
          return decodeURIComponent(rawValue.join("="));
        }
      }
      return null;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const tenantId = await this.tenantIdentityResolver.resolveTenantId(
      payload.companyId,
      payload.tenantId,
    );

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      username: payload.username ?? null,
      companyId: payload.companyId,
      tenantId,
      role: payload.role,
      accountId: payload.accountId ?? null,
      subjectClass: payload.subjectClass ?? "internal",
      bindingId: payload.bindingId ?? null,
    };
  }
}
