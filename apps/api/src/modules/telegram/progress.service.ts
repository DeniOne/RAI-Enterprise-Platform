import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class ProgressService implements OnModuleInit {
  private readonly logger = new Logger(ProgressService.name);
  private lastStatsHash: string = "";
  private isWatching = false;

  constructor() {}

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
      "📢 <b>RAI_EP: ОБНОВЛЕНИЕ ПРОГРЕССА</b>",
      "",
      `🏗 <b>Phase Alpha</b>: ${stats.alpha}%`,
      `<code>[${this.getProgressBar(stats.alpha)}]</code>`,
      "",
      `💎 <b>Phase Beta</b>: ${stats.beta}%`,
      `<code>[${this.getProgressBar(stats.beta)}]</code>`,
      "",
      `🛰 <b>Phase Gamma</b>: ${stats.gamma}%`,
      `<code>[${this.getProgressBar(stats.gamma)}]</code>`,
      "",
      "📈 <i>Изменения обнаружены в memory-bank/progress.md</i>",
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
    try {
      await fetch(
        `${process.env.BOT_URL || "http://localhost:4002"}/internal/push-progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-API-Key": process.env.INTERNAL_API_KEY || "",
          },
          body: JSON.stringify({
            report,
          }),
        },
      );
      this.logger.log(`✅ Progress broadcasted via Bot Microservice`);
    } catch (error) {
      this.logger.error(`Failed to broadcast progress: ${error.message}`);
    }
  }
}
