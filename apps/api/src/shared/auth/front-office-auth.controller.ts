import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@rai/prisma-client";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";
import {
  ActivateFrontOfficeInvitationDto,
  CreateFrontOfficeInvitationDto,
  FrontOfficePasswordLoginDto,
  SetFrontOfficePasswordDto,
} from "./front-office-auth.dto";
import { FrontOfficeAuthService } from "./front-office-auth.service";

type AuthenticatedUser = {
  userId?: string;
  companyId?: string;
  role?: string;
};

@Controller("auth/front-office")
export class FrontOfficeAuthController {
  constructor(private readonly frontOfficeAuthService: FrontOfficeAuthService) {}

  @Post("invitations")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.CEO,
    UserRole.MANAGER,
  )
  async createInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFrontOfficeInvitationDto,
  ) {
    return this.frontOfficeAuthService.createInvitation(
      {
        userId: String(user.userId ?? ""),
        companyId: String(user.companyId ?? ""),
      },
      dto,
    );
  }

  @Get("invitations/:token")
  async getInvitationPreview(@Param("token") token: string) {
    return this.frontOfficeAuthService.getInvitationPreview(token);
  }

  @Post("activate")
  async activateInvitation(
    @Body() dto: ActivateFrontOfficeInvitationDto,
    @Headers("x-forwarded-for") forwardedFor?: string,
    @Headers("user-agent") userAgent?: string,
  ) {
    const ip = forwardedFor?.split(",")[0]?.trim() || null;
    return this.frontOfficeAuthService.activateInvitation(dto, {
      ip,
      userAgent: userAgent ?? null,
    });
  }

  @Post("login")
  async loginWithPassword(@Body() dto: FrontOfficePasswordLoginDto) {
    return this.frontOfficeAuthService.loginWithPassword(dto);
  }

  @Post("password")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FRONT_OFFICE_USER)
  async setPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetFrontOfficePasswordDto,
  ) {
    return this.frontOfficeAuthService.setPassword(
      String(user.userId ?? ""),
      String(user.companyId ?? ""),
      dto,
    );
  }
}
