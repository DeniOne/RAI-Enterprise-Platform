import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { REQUIRE_MTLS_KEY } from './mtls.decorator';

@Injectable()
export class MtlsGuard implements CanActivate {
    private readonly logger = new Logger(MtlsGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isMtlsRequired = this.reflector.getAllAndOverride<boolean>(REQUIRE_MTLS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isMtlsRequired) {
            return true; // If endpoint is not tagged with @RequireMtls(), allow access
        }

        const request = context.switchToHttp().getRequest<Request>();

        // NGINX sets these headers when ssl_verify_client is 'optional' or 'on'
        const verifyStatus = request.headers['x-client-verify'];
        const clientDn = request.headers['x-client-dn'];

        if (verifyStatus !== 'SUCCESS') {
            this.logger.warn(`mTLS connection rejected. Status: ${verifyStatus}, DN: ${clientDn}, IP: ${request.ip}`);
            throw new ForbiddenException({
                message: 'Client certificate required or validation failed',
                code: 'MTLS_VERIFICATION_FAILED',
            });
        }

        // Pass the DN to the request payload for further processing if needed
        (request as any).clientDn = clientDn;

        this.logger.debug(`mTLS verification passed for DN: ${clientDn}`);
        return true;
    }
}
