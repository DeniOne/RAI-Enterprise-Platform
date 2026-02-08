import type { QueueClient, QueueMessage } from "./transport.js";
import { IngestionWorker } from "./worker.js";
import { Logger } from "./logging.js";
import { Validator } from "./validation.js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

class TestQueueClient implements QueueClient {
  public acked: string[] = [];

  async subscribe(_handler: (msg: QueueMessage) => Promise<void>): Promise<void> {
    // В smoke-тесте подписка не используется.
  }

  async ack(messageId: string): Promise<void> {
    this.acked.push(messageId);
  }
}

async function loadExample(fileName: string): Promise<Record<string, unknown>> {
  const path = resolve(process.cwd(), "..", "contracts", "examples", fileName);
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw);
}

async function run(): Promise<void> {
  const transport = new TestQueueClient();
  const logger = new Logger("ingestion", "0.1.0");
  const validator = new Validator();
  const worker = new IngestionWorker(transport, validator, logger);

  const examples = [
    "01-pest-disease-image-ingestion.example.json",
    "02-satellite-vegetation-indices.example.json"
  ];

  for (const file of examples) {
    const payload = await loadExample(file);
    const msg: QueueMessage = {
      id: `smoke-${file}`,
      payload,
      trace_id: "trace-smoke-001"
    };

    await worker.processMessage(msg);

    if (!transport.acked.includes(msg.id)) {
      throw new Error(`ACK не вызван для ${file}`);
    }
  }
}

run().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
