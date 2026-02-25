import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from "@nestjs/common";
import { RedisService } from "../../shared/redis/redis.service";

/**
 * Token Bucket Rate Limiting Guard для Institutional API Gateway.
 * Реализует жесткие лимиты: 1000 req/min/Tenant, 10000 req/min/Subnet.
 * Ошибка возвращается в формате RFC 7807 (Фаза 5).
 */
@Injectable()
export class TokenBucketGuard implements CanActivate {
  private readonly logger = new Logger(TokenBucketGuard.name);

  // Лимиты из LEVEL_F_IMPLEMENTATION_CHECKLIST
  private readonly TENANT_LIMIT = 1000;
  private readonly SUBNET_LIMIT = 10000;
  private readonly WINDOW_SECONDS = 60; // 1 min

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const redis = this.redisService.getClient();

    if (redis.status !== "ready") {
      this.logger.warn(
        "Redis is not ready. Rate limit checks bypassed (Fail-Open).",
      );
      return true;
    }

    // IP Subnet /24 extraction
    const ip =
      req.headers["x-forwarded-for"] ||
      req.ip ||
      req.connection?.remoteAddress ||
      "127.0.0.1";
    const parsedIp = Array.isArray(ip) ? ip[0] : ip.split(",")[0].trim();
    const subnet = this.extractSubnet(parsedIp);

    // Identify Tenant (от JWT, если он был спарсен в middleware/auth.guard)
    const companyId = req.user?.companyId || "ANONYMOUS_TENANT";

    // Fixed window (Token Bucket approximation to save performance/memory)
    const currentMinute = Math.floor(Date.now() / 1000 / this.WINDOW_SECONDS);

    const subnetKey = `rate:subnet:${subnet}:${currentMinute}`;
    const tenantKey = `rate:tenant:${companyId}:${currentMinute}`;

    const multi = redis.multi();
    multi.incr(subnetKey);
    multi.expire(subnetKey, this.WINDOW_SECONDS * 2);

    multi.incr(tenantKey);
    multi.expire(tenantKey, this.WINDOW_SECONDS * 2);

    const results = await multi.exec();

    if (!results) {
      this.logger.error("Redis exec failed during rate limit check");
      return true;
    }

    const subnetRequests = results[0][1] as number;
    const tenantRequests = results[2][1] as number;

    if (
      tenantRequests > this.TENANT_LIMIT ||
      subnetRequests > this.SUBNET_LIMIT
    ) {
      this.logger.warn(
        `Rate Limit Exceeded: IP ${parsedIp}, Tenant ${companyId}`,
      );

      // Возвращаем HTTP 429 по стандарту RFC 7807 Institutional API
      throw new HttpException(
        {
          type: "urn:rai:error:gateway:rate_limit_exceeded",
          title: "Too Many Requests",
          status: HttpStatus.TOO_MANY_REQUESTS,
          detail: `Rate limit exceeded. Token bucket is empty. Tenant: ${tenantRequests}/${this.TENANT_LIMIT}, Subnet: ${subnetRequests}/${this.SUBNET_LIMIT}`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private extractSubnet(ip: string): string {
    // В случае IPv4 возвращаем подсеть /24
    if (ip.includes(".")) {
      const parts = ip.split(".");
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
      }
    }
    return ip;
  }
}
