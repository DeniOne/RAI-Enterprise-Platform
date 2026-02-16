import { Controller, Get, Param, UseGuards, Query } from "@nestjs/common";
import { FieldObservationService } from "./field-observation.service";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { PaginationDto } from '../../shared/dto/pagination.dto';

@Controller("field-observation")
@UseGuards(JwtAuthGuard)
export class FieldObservationController {
    constructor(private readonly observationService: FieldObservationService) { }

    @Get()
    async findAll(
        @CurrentUser() user: any,
        @Query() pagination: PaginationDto
    ) {
        return this.observationService.findAll(user.companyId, {
            skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
            limit: pagination.limit || 20,
            page: pagination.page || 1
        });
    }

    @Get("task/:taskId")
    async getByTask(
        @Param("taskId") taskId: string,
        @CurrentUser() user: any,
        @Query() pagination: PaginationDto
    ) {
        return this.observationService.getByTask(taskId, user.companyId, {
            skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
            limit: pagination.limit || 20,
            page: pagination.page || 1
        });
    }
}
