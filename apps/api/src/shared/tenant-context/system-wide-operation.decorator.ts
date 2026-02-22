import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { SystemWideOperationInterceptor } from './system-wide-operation.interceptor';

export const SYSTEM_WIDE_KEY = 'is_system_wide';

/**
 * Marks an operation as system-wide, bypassing mandatory tenant isolation
 * but triggering elevated audit logging and restricted to elevated roles.
 */
export function SystemWideOperation() {
    return applyDecorators(
        SetMetadata(SYSTEM_WIDE_KEY, true),
        UseInterceptors(SystemWideOperationInterceptor),
    );
}
