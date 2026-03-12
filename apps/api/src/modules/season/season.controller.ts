import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { SeasonService } from "./season.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { PLANNING_READ_ROLES } from "../../shared/auth/rbac.constants";

@Controller("seasons")
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get()
  @Authorized(...PLANNING_READ_ROLES)
  async findAll(@CurrentUser() user: User) {
    return this.seasonService.findAll(user.companyId!);
  }

  @Get(":id")
  @Authorized(...PLANNING_READ_ROLES)
  async findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.seasonService.findOne(id, user.companyId!);
  }
}
