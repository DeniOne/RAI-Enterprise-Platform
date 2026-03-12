import { Injectable, ExecutionContext } from "@nestjs/common";
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerStorage,
} from "@nestjs/throttler";
import { Reflector } from "@nestjs/core";
import { SecretsService } from "../config/secrets.service";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: any,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly secretsService: SecretsService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as tracker
    return req.ip || req.connection.remoteAddress;
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Whitelist internal services (optional: check for API key or specific IPs)
    const apiKey = request.headers["x-api-key"];
    const expectedApiKey = this.secretsService.getOptionalSecret("CORE_API_KEY");
    if (expectedApiKey && apiKey === expectedApiKey) {
      return true;
    }

    return false;
  }
}
