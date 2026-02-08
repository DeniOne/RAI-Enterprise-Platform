import type { QueueClient, QueueMessage } from "./transport.js";
import { IngestionWorker } from "./worker.js";
import { Logger } from "./logging.js";
import { Validator } from "./validation.js";
import http from "node:http";
import crypto from "node:crypto";

const TRACE_HEADER = "trace-id";

class NoopQueueClient implements QueueClient {
  async subscribe(_handler: (msg: QueueMessage) => Promise<void>): Promise<void> {
    // Пустая реализация: реальный брокер подключается в Sprint 2.
  }

  async ack(_messageId: string): Promise<void> {
    // Пустая реализация.
  }
}

const serviceName = process.env.SERVICE_NAME ?? "ingestion";
const serviceVersion = process.env.SERVICE_VERSION ?? "0.1.0";
const inferenceUrl = process.env.INFERENCE_URL ?? "http://inference-inference:8000/infer";
const port = Number(process.env.PORT ?? "8080");

const transport = new NoopQueueClient();
const logger = new Logger(serviceName, serviceVersion);
const worker = new IngestionWorker(transport, new Validator(), logger);

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && req.url === "/forward") {
    const traceId = req.headers[TRACE_HEADER] ? String(req.headers[TRACE_HEADER]) : crypto.randomUUID();

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      logger.info("Получен запрос forward", traceId);
      const payload = body ? JSON.parse(body) : {};

      const msg: QueueMessage = {
        id: `forward-${traceId}`,
        payload,
        trace_id: traceId
      };

      try {
        await worker.processMessage(msg);

        const response = await fetch(inferenceUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            [TRACE_HEADER]: traceId
          },
          body: JSON.stringify(payload)
        });

        const text = await response.text();
        res.writeHead(response.status, { "content-type": "application/json" });
        res.end(text);
        return;
      } catch (_err) {
        logger.error("Ошибка forward в inference", traceId);
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "error", trace_id: traceId }));
      }
    });

    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "not_found" }));
});

server.listen(port, "0.0.0.0");

// Старт воркера. В реальной среде тут подключается брокер сообщений.
worker.start().catch((err) => {
  // Логируем и завершаем процесс без повторов.
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
