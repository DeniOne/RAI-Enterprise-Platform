import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { TelegramAuthService } from "./telegram-auth.service";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "./jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private telegramAuthService: TelegramAuthService,
  ) { }

  @Get("ping")
  ping() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for login
  @ApiOperation({ summary: "User login" })
  @ApiResponse({
    status: 200,
    description: "Login successful, returns JWT token",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post("telegram-login")
  @ApiOperation({ summary: "Initiate Telegram 2FA login" })
  @ApiResponse({
    status: 200,
    description: "Login session created, push sent to Telegram",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async initiateTelegramLogin(
    @Body() body: { telegramId: string; companyId?: string },
  ) {
    try {
      const result = await this.telegramAuthService.initiateLogin(
        body.telegramId,
        body.companyId,
      );
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get("telegram-login/:sessionId")
  @ApiOperation({ summary: "Check Telegram login status (for polling)" })
  @ApiResponse({ status: 200, description: "Returns session status" })
  @ApiResponse({ status: 404, description: "Session not found or expired" })
  async checkTelegramLoginStatus(@Param("sessionId") sessionId: string) {
    try {
      const session =
        await this.telegramAuthService.checkLoginStatus(sessionId);

      // If approved, return access token
      if (session.status === "approved") {
        const { accessToken } =
          await this.telegramAuthService.confirmLogin(sessionId);
        return { status: "approved", accessToken };
      }

      return { status: session.status };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private authService: AuthService,
    private devModeService: DevModeService,
  ) { }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Returns user profile" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req) {
    // Dev mode: req.user уже содержит { userId, email, companyId } из DevModeService
    if (this.devModeService.isDevMode()) {
      return req.user;
    }
    return this.authService.getProfile(req.user.userId);
  }

  @Get("company/:companyId")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get users by company" })
  @ApiResponse({ status: 200, description: "Returns users list" })
  async getCompanyUsers(@Param("companyId") companyId: string) {
    return this.authService.listCompanyUsers(companyId);
  }
}
