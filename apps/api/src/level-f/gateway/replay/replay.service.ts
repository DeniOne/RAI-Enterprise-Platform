import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
// Assuming we have a canonicalizer, or just stable stringify for now.
// Standard implementation uses fast-json-stable-stringify for B1 determinism.
import stableStringify = require("fast-json-stable-stringify");

@Injectable()
export class ReplayService {
  private readonly logger = new Logger(ReplayService.name);

  /**
   * Функция перепроигрывания транзакции.
   * Эмулирует детерминированный запуск Rating Engine или другого компонента
   * на основе старого Payload.
   */
  async verifyReplay(
    recordedHash: string,
    payload: any,
  ): Promise<{ isMatch: boolean; replayedHash: string }> {
    // Шаг 1: Каноническая сериализация payload (RFC 8785 in theory, or stable-stringify)
    const canonicalJson = stableStringify(payload);

    // Шаг 2: SHA-256 хеширование результата
    const replayedHash = crypto
      .createHash("sha256")
      .update(canonicalJson)
      .digest("hex");

    // Шаг 3: Сверка хешей
    const isMatch = recordedHash === replayedHash;

    if (isMatch) {
      this.logger.log(
        `Dispute resolved. Replay MATCH for hash: ${recordedHash}`,
      );
    } else {
      this.logger.warn(
        `Dispute DIVERGENCE! Recorded: ${recordedHash} != Replayed: ${replayedHash}`,
      );
    }

    return {
      isMatch,
      replayedHash,
    };
  }
}
