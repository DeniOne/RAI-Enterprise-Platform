import { applyDecorators, SetMetadata } from "@nestjs/common";
import { AuthBoundary } from "../../shared/auth/auth-boundary.decorator";

export const REQUIRE_MTLS_KEY = "require_mtls";

/**
 * Marks an endpoint or controller as requiring an established mTLS connection.
 * Used in conjunction with `MtlsGuard`.
 */
export const RequireMtls = (
  description: string = "Internal mTLS-only service boundary",
) =>
  applyDecorators(
    SetMetadata(REQUIRE_MTLS_KEY, true),
    AuthBoundary({
      kind: "mtls",
      description,
      allowAnonymous: true,
    }),
  );
