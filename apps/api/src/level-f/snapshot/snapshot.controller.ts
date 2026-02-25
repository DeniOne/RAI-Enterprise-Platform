import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import { SnapshotService, DAGNode } from "./snapshot.service";
import { RequireMtls } from "../gateway/mtls.decorator";

@RequireMtls()
@Controller("v1/snapshot")
export class SnapshotController {
  constructor(private readonly snapshotService: SnapshotService) {}

  /**
   * Принудительное создание снимка состояния (обычно по Cron, но оставим API)
   */
  @Post("trigger/:companyId")
  async triggerSnapshot(
    @Param("companyId", ParseUUIDPipe) companyId: string,
    @Body("startDate") startDate: string,
    @Body("endDate") endDate: string,
  ): Promise<DAGNode> {
    return this.snapshotService.createSnapshot({
      companyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  }

  /**
   * Возвращает текущий Head Hash для DAG
   */
  @Get("head")
  getHeadHash() {
    return { currentHead: this.snapshotService.getHeadHash() };
  }

  /**
   * Принять внешний снимок для репликации/проверки
   */
  @Post("validate")
  validateSnapshot(@Body() node: DAGNode) {
    const trustedTimeMs = Date.now();
    const isValid = this.snapshotService.validateIncomingSnapshot(
      node,
      trustedTimeMs,
    );

    return {
      success: isValid,
      timestamp: trustedTimeMs,
    };
  }
}
