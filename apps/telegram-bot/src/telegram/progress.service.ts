import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectBot } from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";
import * as fs from "fs";
import * as path from "path";
import { ApiClientService } from "../shared/api-client/api-client.service";

@Injectable()
export class ProgressService implements OnModuleInit {
  private readonly logger = new Logger(ProgressService.name);
  private lastStatsHash: string = "";
  private isWatching = false;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly apiClient: ApiClientService,
  ) { }

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
      if (!progressPath) return { alpha: 100, beta: 0, gamma: 0 };

      const content = fs.readFileSync(progressPath, "utf8");

      const sections = {
        alpha: "",
        beta: "",
        gamma: ""
      };

      const betaIdx = content.indexOf("## Phase Beta");
      const gammaIdx = content.indexOf("## Phase Gamma");

      if (betaIdx !== -1) {
        sections.alpha = content.substring(0, betaIdx);
        if (gammaIdx !== -1) {
          sections.beta = content.substring(betaIdx, gammaIdx);
          sections.gamma = content.substring(gammaIdx);
        } else {
          sections.beta = content.substring(betaIdx);
        }
      } else {
        sections.alpha = content;
      }

      const calc = (text: string) => {
        const tasks = text.match(/\[[x ]\]/g) || [];
        if (tasks.length === 0) return 0;
        const completed = tasks.filter((t) => t === "[x]").length;
        return Math.round((completed / tasks.length) * 100);
      };

      // Special case: if Alpha is explicitly marked as "DONE" or "COMPLETE" in headers, ensure it's 100%
      // or just trust the checkbox count if we maintained it well.
      let alphaProgress = calc(sections.alpha);
      if (content.includes("PHASE ALPHA COMPLETE") || content.includes("PHASE ALPHA — DONE")) {
        alphaProgress = 100;
      }

      return {
        alpha: alphaProgress,
        beta: calc(sections.beta),
        gamma: calc(sections.gamma),
      };
    } catch (error) {
      this.logger.error("📊 Progress Parser Error:", error);
      return { alpha: 100, beta: 0, gamma: 0 };
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
      const users = await this.apiClient.getActiveUsers();
      for (const user of users) {
        try {
          if (user.telegramId) {
            await this.bot.telegram.sendMessage(user.telegramId, report, {
              parse_mode: "HTML",
            });
          }
        } catch (e) {
          this.logger.error(
            `❌ Failed to send push to ${user.telegramId}: ${e.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`❌ Failed to fetch active users: ${error.message}`);
    }
  }
}
