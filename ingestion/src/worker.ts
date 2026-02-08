import type { QueueClient, QueueMessage } from "./transport.js";
import { Validator } from "./validation.js";
import { Logger } from "./logging.js";

export class IngestionWorker {
  private transport: QueueClient;
  private validator: Validator;
  private logger: Logger;

  constructor(transport: QueueClient, validator: Validator, logger: Logger) {
    this.transport = transport;
    this.validator = validator;
    this.logger = logger;
  }

  async start(): Promise<void> {
    await this.transport.subscribe((msg) => this.processMessage(msg));
  }

  async processMessage(msg: QueueMessage): Promise<void> {
    const traceId = msg.trace_id ?? "unknown";

    const result = await this.validator.validate(msg.payload);

    if (!result.ok) {
      this.logger.error("Ошибка валидации JSON Schema", traceId);

      // TODO: retry policy
      // TODO: dead-letter queue
      // TODO: enrichment

      if (this.transport.stop) {
        await this.transport.stop();
        return;
      }

      throw new Error("Validation failed. Processing stopped.");
    }

    this.logger.info("Валидация пройдена", traceId);

    await this.transport.ack(msg.id);

    // Пейлоад передается дальше без изменений.
    // TODO: передача в следующий этап пайплайна (без обогащения).
  }
}
