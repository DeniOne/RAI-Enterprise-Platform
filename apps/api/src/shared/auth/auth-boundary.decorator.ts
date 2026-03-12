import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { InternalApiKeyGuard } from "./internal-api-key.guard";

export const AUTH_BOUNDARY_KEY = "auth_boundary";

export type AuthBoundaryKind =
  | "mtls"
  | "internal_api_key"
  | "public_health";

export interface AuthBoundaryMetadata {
  kind: AuthBoundaryKind;
  description: string;
  allowAnonymous: boolean;
}

export const AuthBoundary = (metadata: AuthBoundaryMetadata) =>
  SetMetadata(AUTH_BOUNDARY_KEY, metadata);

export function RequireInternalApiKey(
  description: string = "Internal service-to-service boundary",
) {
  return applyDecorators(
    AuthBoundary({
      kind: "internal_api_key",
      description,
      allowAnonymous: true,
    }),
    UseGuards(InternalApiKeyGuard),
  );
}

export function PublicHealthBoundary(
  description: string = "Public technical health-check boundary",
) {
  return AuthBoundary({
    kind: "public_health",
    description,
    allowAnonymous: true,
  });
}
