import { Injectable, Logger, Optional } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import type { ExecutionSurfaceState } from "../../shared/rai-chat/execution-target-state.types";
import type { PlannerThreadSliceV1 } from "./planner-thread-slice.types";
import { PrismaService } from "../../shared/prisma/prisma.service";

/**
 * In-memory срез branch-state для трассировки и тестов round-trip.
 * Срез по threadId — для продолжения плана между сообщениями.
 * При `RAI_PLANNER_THREAD_PERSIST=true` — upsert в `rai_planner_thread_states`.
 */
@Injectable()
export class BranchStatePlaneService {
  private readonly logger = new Logger(BranchStatePlaneService.name);

  private readonly snapshots = new Map<string, ExecutionSurfaceState>();
  private readonly threadPlannerSlices = new Map<string, PlannerThreadSliceV1>();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  private persistThreads(): boolean {
    return process.env.RAI_PLANNER_THREAD_PERSIST === "true";
  }

  private threadKey(companyId: string, threadId: string): string {
    return `${companyId}::${threadId}`;
  }

  recordSnapshot(traceId: string, surface: ExecutionSurfaceState): void {
    this.snapshots.set(traceId, JSON.parse(JSON.stringify(surface)) as ExecutionSurfaceState);
  }

  getSnapshot(traceId: string): ExecutionSurfaceState | undefined {
    const s = this.snapshots.get(traceId);
    return s ? (JSON.parse(JSON.stringify(s)) as ExecutionSurfaceState) : undefined;
  }

  async recordThreadPlannerSlice(
    companyId: string,
    threadId: string,
    slice: PlannerThreadSliceV1,
  ): Promise<void> {
    const key = this.threadKey(companyId, threadId);
    const clone = JSON.parse(JSON.stringify(slice)) as PlannerThreadSliceV1;
    this.threadPlannerSlices.set(key, clone);

    if (!this.persistThreads() || !this.prisma) {
      return;
    }
    try {
      await this.prisma.raiPlannerThreadState.upsert({
        where: {
          rai_planner_thread_state_company_thread_unique: {
            companyId,
            threadId,
          },
        },
        create: {
          companyId,
          threadId,
          sliceJson: clone as unknown as Prisma.InputJsonValue,
        },
        update: {
          sliceJson: clone as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      this.logger.warn(
        `recordThreadPlannerSlice: БД недоступна или ошибка записи: ${String((e as Error)?.message ?? e)}`,
      );
    }
  }

  async getThreadPlannerSlice(
    companyId: string,
    threadId: string,
  ): Promise<PlannerThreadSliceV1 | undefined> {
    const key = this.threadKey(companyId, threadId);

    if (this.persistThreads() && this.prisma) {
      try {
        const row = await this.prisma.raiPlannerThreadState.findUnique({
          where: {
            rai_planner_thread_state_company_thread_unique: {
              companyId,
              threadId,
            },
          },
        });
        if (row?.sliceJson !== undefined && row.sliceJson !== null) {
          const slice = JSON.parse(
            JSON.stringify(row.sliceJson),
          ) as PlannerThreadSliceV1;
          this.threadPlannerSlices.set(key, slice);
          return JSON.parse(JSON.stringify(slice)) as PlannerThreadSliceV1;
        }
      } catch (e) {
        this.logger.warn(
          `getThreadPlannerSlice: БД недоступна или ошибка чтения: ${String((e as Error)?.message ?? e)}`,
        );
      }
    }

    const s = this.threadPlannerSlices.get(key);
    return s ? (JSON.parse(JSON.stringify(s)) as PlannerThreadSliceV1) : undefined;
  }

  clearForTests(): void {
    this.snapshots.clear();
    this.threadPlannerSlices.clear();
  }
}
