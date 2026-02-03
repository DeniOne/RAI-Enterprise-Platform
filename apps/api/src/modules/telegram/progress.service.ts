import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class ProgressService implements OnModuleInit {
  private readonly logger = new Logger(ProgressService.name);
  private lastStatsHash: string = "";
  private isWatching = false;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.watchProgress();
  }

  private getProgressFile() {
    const possiblePaths = [
      path.resolve(process.cwd(), "../../memory-bank/progress.md"),
      path.resolve(__dirname, "../../../../memory-bank/progress.md"),
      path.resolve(process.cwd(), "memory-bank/progress.md"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  public getProgressStats() {
    try {
      const progressPath = this.getProgressFile();
      if (!progressPath) return { alpha: 78, beta: 0, gamma: 0 };

      const content = fs.readFileSync(progressPath, "utf8");
      const tasks = content.match(/\[[x ]\]/g) || [];
      const completed = tasks.filter((t) => t === "[x]").length;
      const total = tasks.length;

      const alphaProgress =
        total > 0 ? Math.round((completed / total) * 100) : 0;
      return { alpha: alphaProgress, beta: 0, gamma: 0 };
    } catch (error) {
      this.logger.error("📊 Progress Parser Error:", error);
      return { alpha: 78, beta: 0, gamma: 0 };
    }
  }

  public getProgressBar(percent: number) {
    const filled = Math.round(percent / 10);
    return "█".repeat(filled) + "░".repeat(10 - filled);
  }

  public formatReport(stats: any) {
    return [
      "📢 *RAI_EP: ОБНОВЛЕНИЕ ПРОГРЕССА*",
      "",
      `🏗 *Phase Alpha*: ${stats.alpha}%`,
      `\`[${this.getProgressBar(stats.alpha)}]\``,
      "",
      `💎 *Phase Beta*: ${stats.beta}%`,
      `\`[${this.getProgressBar(stats.beta)}]\``,
      "",
      `🛰 *Phase Gamma*: ${stats.gamma}%`,
      `\`[${this.getProgressBar(stats.gamma)}]\``,
      "",
      "📈 _Изменения обнаружены в memory-bank/progress.md_",
    ].join("\n");
  }

  private watchProgress() {
    if (this.isWatching) return;

    const progressPath = this.getProgressFile();
    if (!progressPath) {
      this.logger.warn("⚠️ Progress file not found, watcher disabled.");
      return;
    }

    this.logger.log(`👁️ Watching progress file: ${progressPath}`);
    this.isWatching = true;

    // Initial hash
    const initialStats = this.getProgressStats();
    this.lastStatsHash = JSON.stringify(initialStats);

    fs.watch(progressPath, (event) => {
      if (event === "change") {
        // Small delay to let file system finish the write
        setTimeout(async () => {
          const currentStats = this.getProgressStats();
          const currentHash = JSON.stringify(currentStats);

          if (currentHash !== this.lastStatsHash) {
            this.lastStatsHash = currentHash;
            this.logger.log("📈 Progress updated! Broadcasting push...");
            await this.broadcastProgress(currentStats);
          }
        }, 500);
      }
    });
  }

  private async broadcastProgress(stats: any) {
    const report = this.formatReport(stats);
    const users = await this.prisma.user.findMany({
      where: {
        accessLevel: "ACTIVE",
        telegramId: { not: null },
      },
    });

    for (const user of users) {
      try {
        await this.bot.telegram.sendMessage(user.telegramId!, report, {
          parse_mode: "Markdown",
        });
      } catch (e) {
        this.logger.error(
          `❌ Failed to send push to ${user.telegramId}: ${e.message}`,
        );
      }
    }
  }
}
