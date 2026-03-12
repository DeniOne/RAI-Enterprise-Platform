import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InternalApiKeyGuard } from "./internal-api-key.guard";
import { AUTH_BOUNDARY_KEY } from "./auth-boundary.decorator";
import { SecretsService } from "../config/secrets.service";

function createHttpContext(request: Record<string, unknown>) {
  return {
    getHandler: () => "handler",
    getClass: () => "class",
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
}

describe("InternalApiKeyGuard", () => {
  it("работает только для явно помеченного internal_api_key boundary", () => {
    const guard = new InternalApiKeyGuard(
      {
        getOptionalSecret: jest.fn().mockReturnValue("secret"),
      } as unknown as SecretsService,
      {
        getAllAndOverride: jest.fn().mockReturnValue(undefined),
      } as unknown as Reflector,
    );

    expect(() =>
      guard.canActivate(
        createHttpContext({
          headers: { "x-internal-api-key": "secret" },
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it("пропускает корректный internal api key", () => {
    const request: Record<string, unknown> = {
      headers: { "x-internal-api-key": "secret" },
    };
    const guard = new InternalApiKeyGuard(
      {
        getOptionalSecret: jest.fn().mockReturnValue("secret"),
      } as unknown as SecretsService,
      {
        getAllAndOverride: jest.fn().mockImplementation((key: string) => {
          if (key === AUTH_BOUNDARY_KEY) {
            return {
              kind: "internal_api_key",
              allowAnonymous: true,
              description: "test",
            };
          }
          return undefined;
        }),
      } as unknown as Reflector,
    );

    expect(guard.canActivate(createHttpContext(request))).toBe(true);
    expect(request.authBoundary).toBe("internal_api_key");
  });

  it("отклоняет неверный internal api key", () => {
    const guard = new InternalApiKeyGuard(
      {
        getOptionalSecret: jest.fn().mockReturnValue("secret"),
      } as unknown as SecretsService,
      {
        getAllAndOverride: jest.fn().mockReturnValue({
          kind: "internal_api_key",
          allowAnonymous: true,
          description: "test",
        }),
      } as unknown as Reflector,
    );

    expect(() =>
      guard.canActivate(
        createHttpContext({
          headers: { "x-internal-api-key": "wrong" },
        }),
      ),
    ).toThrow(UnauthorizedException);
  });
});
