import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLog } from "@prisma/client";

export interface AuditLogInput {
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: any;
}

export interface AuditLogFilter {
  action?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) { }

  /**
   * Log an audit event.
   */
  async log(data: AuditLogInput): Promise<AuditLog> {
    console.log(`[AUDIT] ${data.action} | User: ${data.userId || "GUEST"}`);
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        ip: data.ip,
        userAgent: data.userAgent,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Find all audit logs with optional filtering and pagination.
   */
  async findAll(
    filter?: AuditLogFilter,
    pagination?: PaginationOptions,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter?.action) {
      where.action = { contains: filter.action, mode: "insensitive" };
    }

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.dateFrom || filter?.dateTo) {
      where.createdAt = {};
      if (filter?.dateFrom) {
        where.createdAt.gte = filter.dateFrom;
      }
      if (filter?.dateTo) {
        where.createdAt.lte = filter.dateTo;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Find a single audit log by ID.
   */
  async findById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }
}
