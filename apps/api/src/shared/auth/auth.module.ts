import { Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController, UsersController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { UserRepository } from "./repositories/user.repository";
import { TelegramAuthService } from "./telegram-auth.service";
import { TelegramAuthInternalController } from "./telegram-auth-internal.controller";
import { InternalApiKeyGuard } from "./internal-api-key.guard";
import { DevModeService } from "./dev-mode.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { FrontOfficeAuthController } from "./front-office-auth.controller";
import { FrontOfficeAuthService } from "./front-office-auth.service";
import { RolesGuard } from "./roles.guard";

import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "../redis/redis.module";
import { SecretsModule } from "../config/secrets.module";
import { SecretsService } from "../config/secrets.service";

@Global()
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    PassportModule,
    ConfigModule,
    SecretsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule, SecretsModule],
      useFactory: async (
        _configService: ConfigService,
        secretsService: SecretsService,
      ) => ({
        secret: secretsService.getRequiredSecret("JWT_SECRET"),
        signOptions: { expiresIn: "24h" },
      }),
      inject: [ConfigService, SecretsService],
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    TelegramAuthInternalController,
    FrontOfficeAuthController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    UserRepository,
    TelegramAuthService,
    FrontOfficeAuthService,
    InternalApiKeyGuard,
    DevModeService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    UserRepository,
    TelegramAuthService,
    FrontOfficeAuthService,
    DevModeService,
    JwtAuthGuard,
    InternalApiKeyGuard,
    RolesGuard,
  ],
})
export class AuthModule { }
