import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  UseInterceptors,
} from "@nestjs/common";
import { FieldRegistryService } from "./field-registry.service";
import { CreateFieldDto } from "./dto/create-field.dto";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller("registry/fields")
export class FieldRegistryController {
  constructor(private readonly fieldRegistryService: FieldRegistryService) { }

  @Post()
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async create(@Body() createFieldDto: CreateFieldDto, @Request() req) {
    const companyId = req.user.companyId;
    return this.fieldRegistryService.create(createFieldDto, companyId);
  }

  @Get()
  @Authorized(...PLANNING_READ_ROLES)
  async findAll(@Request() req) {
    const companyId = req.user.companyId;
    return this.fieldRegistryService.findAll(companyId);
  }

  @Get(":id")
  @Authorized(...PLANNING_READ_ROLES)
  async findOne(@Param("id") id: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.fieldRegistryService.findOne(id, companyId);
  }
}
