import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>("JWT_SECRET");
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
      secretOrKey: secret || "your-secret-key-change-in-production",
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
    };
  }
}
