import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { ExperimentOrchestrator } from "@rai/rd-engine/orchestrator/ExperimentOrchestrator.js";
import { ProtocolValidator } from "@rai/rd-engine/services/ProtocolValidator.js";
import { StatisticalService } from "@rai/rd-engine/services/StatisticalService.js";

import { RdStrategicState } from "../../strategic/types";

@Injectable()
export class RdService {
  public orchestrator: ExperimentOrchestrator;
  public validator: ProtocolValidator;
  public stats: StatisticalService;

  constructor(private prisma: PrismaService) {
    this.orchestrator = new ExperimentOrchestrator(this.prisma);
    this.validator = new ProtocolValidator();
    this.stats = new StatisticalService();
  }

  /**
   * Strategic Read Model Snapshot
   * Does not mutate state. Returns deterministic projection.
   */
  async getStrategicSnapshot(): Promise<RdStrategicState> {
    const activeExperiments = await this.prisma.experiment.count({
      // tenant-lint:ignore global strategic snapshot aggregate
      where: { state: "RUNNING" },
    });

    // Simplified logic: "Violations" are Draft/Rejected protocols in Active experiments
    // For BETA phase, we just mock this part or query strictly if schema allows.
    // Assuming strict schema:
    const protocolViolations = 0; // Placeholder for logic

    return {
      activeExperiments,
      protocolViolations,
      coherence: 0.95, // Synthetic confidence score
    };
  }
}
