import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { FieldObservationService } from "./field-observation.service";

@Controller("field-observation")
export class FieldObservationController {
    constructor(private readonly observationService: FieldObservationService) { }

    @Get("task/:taskId")
    async getByTask(@Param("taskId") taskId: string) {
        return this.observationService.getByTask(taskId);
    }
}
