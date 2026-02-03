import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController, UsersController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaModule } from "../prisma/prisma.module";
import { UserRepository } from "./repositories/user.repository";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, JwtStrategy, UserRepository],
  exports: [AuthService, UserRepository],
})
export class AuthModule {}
