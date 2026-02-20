import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MTLS_KEY = 'require_mtls';

/**
 * Marks an endpoint or controller as requiring an established mTLS connection.
 * Used in conjunction with `MtlsGuard`.
 */
export const RequireMtls = () => SetMetadata(REQUIRE_MTLS_KEY, true);
