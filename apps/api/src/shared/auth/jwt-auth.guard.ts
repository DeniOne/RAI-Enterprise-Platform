import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * JWT Auth Guard for REST controllers.
 * Uses Passport JWT strategy.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
