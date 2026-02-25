import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

export interface RFC7807ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId?: string; // Уникальный ID лога для расследования инцидентов
}

@Catch()
export class RFC7807ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RFC7807ExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = `trace-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = "Internal Server Error";
    let detail = "An unexpected error occurred during operation processing.";
    let type = "about:blank";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const tempResp = exception.getResponse() as any;

      title = tempResp.error || exception.message || "HTTP Error";
      detail = tempResp.message || exception.message;
      type = `https://api.rai.eco/errors/${status}`;
    }

    // Для Level F Institutional API - логируем каждый сбой с traceId
    this.logger.error(
      `[${traceId}] Gateway Error on ${request.url}: ${detail}`,
      exception instanceof Error ? exception.stack : "",
    );

    const problem: RFC7807ProblemDetails = {
      type,
      title,
      status,
      detail,
      instance: request.url,
      traceId,
    };

    // Строго возвращаем Content-Type: application/problem+json
    response
      .status(status)
      .setHeader("Content-Type", "application/problem+json")
      .json(problem);
  }
}
