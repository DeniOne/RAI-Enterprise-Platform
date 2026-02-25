import { Injectable, ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as tracker
    return req.ip || req.connection.remoteAddress;
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Whitelist internal services (optional: check for API key or specific IPs)
    const apiKey = request.headers["x-api-key"];
    if (apiKey === process.env.CORE_API_KEY) {
      return true;
    }

    return false;
  }
}
