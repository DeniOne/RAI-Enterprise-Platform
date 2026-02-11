import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Prisma } from "@rai/prisma-client";
import { randomUUID } from "crypto";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = "Internal server error";
        let errorCode = "INTERNAL_ERROR";

        // Handle HTTP exceptions
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === "object" && "message" in exceptionResponse) {
                message = exceptionResponse.message as string | string[];
            } else {
                message = exception.message;
            }

            errorCode = exception.constructor.name.replace("Exception", "").toUpperCase();
        }
        // Handle Prisma errors
        else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            status = HttpStatus.BAD_REQUEST;
            errorCode = `PRISMA_${exception.code}`;

            switch (exception.code) {
                case "P2002":
                    message = "Unique constraint violation";
                    break;
                case "P2025":
                    message = "Record not found";
                    status = HttpStatus.NOT_FOUND;
                    break;
                default:
                    message = "Database error";
            }
        }
        // Handle unknown errors
        else if (exception instanceof Error) {
            message = exception.message;
        }

        const traceId = randomUUID();

        const errorResponse = {
            statusCode: status,
            message,
            errorCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            traceId,
        };

        // Log error for debugging
        console.error(`[${traceId}] Error:`, exception);

        response.status(status).json(errorResponse);
    }
}
