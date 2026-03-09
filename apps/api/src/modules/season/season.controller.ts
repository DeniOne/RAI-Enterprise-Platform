import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { SeasonService } from "./season.service";

@Controller("seasons")
@UseGuards(JwtAuthGuard)
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.seasonService.findAll(user.companyId!);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.seasonService.findOne(id, user.companyId!);
  }
}
