import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from "@nestjs/common";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { SeasonService } from "./season.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";
import { CreateSeasonInput } from "./dto/create-season.input";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";

@Controller("seasons")
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Post()
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async create(@Body() input: CreateSeasonInput, @CurrentUser() user: User) {
    return this.seasonService.create(input, user, user.companyId!);
  }

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
