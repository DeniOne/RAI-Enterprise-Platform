import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { FieldRegistryService } from "./field-registry.service";
import { CreateFieldDto } from "./dto/create-field.dto";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";

@Controller("registry/fields")
@UseGuards(JwtAuthGuard)
export class FieldRegistryController {
  constructor(private readonly fieldRegistryService: FieldRegistryService) { }

  @Post()
  async create(@Body() createFieldDto: CreateFieldDto, @Request() req) {
    const companyId = req.user.companyId;
    return this.fieldRegistryService.create(createFieldDto, companyId);
  }

  @Get()
  async findAll(@Request() req) {
    const companyId = req.user.companyId;
    return this.fieldRegistryService.findAll(companyId);
  }
}
