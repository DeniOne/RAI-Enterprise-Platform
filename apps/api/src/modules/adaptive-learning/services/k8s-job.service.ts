import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as k8sTypes from "@kubernetes/client-node";
import { RedisService } from "../../../shared/redis/redis.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";

export enum MLJobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  OOM = "OOM",
  QUARANTINED = "QUARANTINED",
}

@Injectable()
export class K8sJobService implements OnModuleInit {
  private readonly logger = new Logger(K8sJobService.name);
  private k8sApi: k8sTypes.BatchV1Api;
  private namespace: string;
  private readonly MAX_CONCURRENT_JOBS = 3;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log(
      "🛠️ K8sJobService: Loading ESM @kubernetes/client-node SDK...",
    );

    try {
      // Dynamic import workaround for ESM-only packages in CJS NestJS
      const k8s = await (eval(`import('@kubernetes/client-node')`) as Promise<
        typeof k8sTypes
      >);

      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      this.k8sApi = kc.makeApiClient(k8s.BatchV1Api);
      this.namespace = this.config.get<string>(
        "K8S_NAMESPACE",
        "rai-training-jobs",
      );

      this.logger.log(
        "✅ K8sJobService initialized. Running initial reconciliation...",
      );
      await this.reconcileJobs();
    } catch (error) {
      this.logger.error(
        `❌ Failed to initialize K8sJobService: ${error.message}`,
      );
    }
  }

  /**
   * Reconciliation Loop: Синхронизация состояния БД и K8s.
   * Выполняется при старте и каждые 5 минут.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileJobs() {
    this.logger.log("🔄 Running K8s Job Reconciliation Loop...");

    const runningRuns = await this.prisma.trainingRun.findMany({
      where: { status: "RUNNING" },
    });

    for (const run of runningRuns) {
      const jobName = `rai-train-${run.id.toLowerCase().substring(0, 8)}`;
      try {
        const status = await this.syncJobStatus(jobName);

        if (status !== MLJobStatus.RUNNING) {
          this.logger.log(
            `📍 Syncing status for ${run.id}: RUNNING -> ${status}`,
          );
          await this.prisma.trainingRun.update({
            where: { id: run.id },
            data: { status: status as any },
          });

          if (
            status === MLJobStatus.COMPLETED ||
            status === MLJobStatus.FAILED ||
            status === MLJobStatus.QUARANTINED ||
            status === MLJobStatus.OOM
          ) {
            const activeJobs = parseInt(
              (await this.redis.getClient().get("rai:total_active_jobs")) ||
                "0",
            );
            if (activeJobs > 0) {
              await this.redis
                .getClient()
                .set(
                  "rai:total_active_jobs",
                  (activeJobs - 1).toString(),
                  "EX",
                  3600,
                );
            }
          }
        }
      } catch (e) {
        if (e.response && e.response.statusCode === 404) {
          this.logger.error(
            `Job ${jobName} not found in K8s. Marking TrainingRun ${run.id} as QUARANTINED.`,
          );
          await this.prisma.trainingRun.update({
            where: { id: run.id },
            data: { status: MLJobStatus.QUARANTINED as any },
          });
          const activeJobs = parseInt(
            (await this.redis.getClient().get("rai:total_active_jobs")) || "0",
          );
          if (activeJobs > 0) {
            await this.redis
              .getClient()
              .set(
                "rai:total_active_jobs",
                (activeJobs - 1).toString(),
                "EX",
                3600,
              );
          }
        } else {
          this.logger.warn(
            `⚠️ Could not reconcile job ${jobName}: ${e.message}`,
          );
        }
      }
    }
  }

  async createTrainingJob(
    companyId: string,
    trainingRunId: string,
    image: string,
    envVars: Record<string, string>,
  ) {
    this.logger.log(`🚀 Creating K8s Job for TrainingRun: ${trainingRunId}`);

    // 1. Budget Enforcement (GPU Hours / Month)
    const monthlyUsage = await this.prisma.trainingRun.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: "COMPLETED",
      },
    });

    const MAX_MONTHLY_RUNS = 50;
    if (monthlyUsage >= MAX_MONTHLY_RUNS) {
      this.logger.error(
        `💸 Tenant ${companyId} exceeded monthly training budget (${monthlyUsage}/${MAX_MONTHLY_RUNS})`,
      );
      throw new InternalServerErrorException(
        "Monthly training budget exceeded for this tenant.",
      );
    }

    // 2. Проверка Global Concurrency Cap
    const activeJobsStr = await this.redis
      .getClient()
      .get("rai:total_active_jobs");
    const activeJobs = parseInt(activeJobsStr || "0");
    if (activeJobs >= this.MAX_CONCURRENT_JOBS) {
      this.logger.warn(
        `⏳ Global Job Quota exceeded (${this.MAX_CONCURRENT_JOBS}). Job deferred.`,
      );
      throw new InternalServerErrorException(
        "Global compute quota exceeded. Try again later.",
      );
    }

    const jobName = `rai-train-${trainingRunId.toLowerCase().substring(0, 8)}`;

    const jobSpec: k8sTypes.V1Job = {
      apiVersion: "batch/v1",
      kind: "Job",
      metadata: {
        name: jobName,
        namespace: this.namespace,
        labels: {
          "rai.io/training-run-id": trainingRunId,
          "rai.io/company-id": companyId,
        },
      },
      spec: {
        backoffLimit: 0,
        template: {
          spec: {
            restartPolicy: "Never",
            containers: [
              {
                name: "ml-trainer",
                image: image,
                env: Object.entries(envVars).map(([name, value]) => ({
                  name: String(name),
                  value: String(value),
                })),
                resources: {
                  limits: {
                    "nvidia.com/gpu": "1",
                    memory: "8Gi",
                    cpu: "4",
                  },
                },
              },
            ],
          },
        },
      },
    };

    try {
      // Атомарный инкремент в Redis
      await this.redis.getClient().incr("rai:total_active_jobs");
      await this.redis.getClient().expire("rai:total_active_jobs", 3600); // Продлеваем TTL

      await this.k8sApi.createNamespacedJob({
        namespace: this.namespace,
        body: jobSpec,
      });
      this.logger.log(`✅ K8s Job ${jobName} created successfully.`);
    } catch (error) {
      this.logger.error(`❌ Failed to create K8s Job: ${error.message}`);
      // Откатываем счетчик атомарно
      await this.redis.getClient().decr("rai:total_active_jobs");
      throw error;
    }
  }

  async syncJobStatus(jobName: string): Promise<MLJobStatus> {
    const job = await this.k8sApi.readNamespacedJobStatus({
      name: jobName,
      namespace: this.namespace,
    });

    if (!job.status) return MLJobStatus.PENDING;
    return this.mapK8sStatusToMLStatus(job.status);
  }

  private mapK8sStatusToMLStatus(status: k8sTypes.V1JobStatus): MLJobStatus {
    if (status.succeeded) return MLJobStatus.COMPLETED;

    if (status.failed) {
      const condition = status.conditions?.find((c) => c.type === "Failed");
      const reason = condition?.reason;

      this.logger.error(`❌ K8s Job Failed. Reason: ${reason}`);

      switch (reason) {
        case "DeadlineExceeded":
          return MLJobStatus.FAILED;
        case "BackoffLimitExceeded":
          return MLJobStatus.FAILED;
        case "Evicted":
          return MLJobStatus.QUARANTINED;
        default:
          return MLJobStatus.FAILED;
      }
    }

    if (status.active) return MLJobStatus.RUNNING;
    return MLJobStatus.PENDING;
  }
}
