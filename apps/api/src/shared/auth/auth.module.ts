import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController, UsersController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { UserRepository } from "./repositories/user.repository";
import { TelegramAuthService } from "./telegram-auth.service";
import { TelegramAuthInternalController } from "./telegram-auth-internal.controller";

import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "24h" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, UsersController, TelegramAuthInternalController],
  providers: [AuthService, JwtStrategy, UserRepository, TelegramAuthService],
  exports: [AuthService, UserRepository, TelegramAuthService],
})
export class AuthModule { }
