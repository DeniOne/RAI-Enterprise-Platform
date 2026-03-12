import { AUTH_BOUNDARY_KEY } from "./auth-boundary.decorator";
import { AdaptiveLearningController } from "../../modules/adaptive-learning/adaptive-learning.controller";
import { HealthController } from "../../modules/health/health.controller";
import { TelegramAuthInternalController } from "./telegram-auth-internal.controller";
import { SnapshotController } from "../../level-f/snapshot/snapshot.controller";
import { ReplayController } from "../../level-f/gateway/replay/replay.controller";

describe("auth boundary metadata", () => {
  it("помечает internal API controllers явным boundary metadata", () => {
    expect(
      Reflect.getMetadata(AUTH_BOUNDARY_KEY, AdaptiveLearningController),
    ).toEqual(
      expect.objectContaining({
        kind: "internal_api_key",
        allowAnonymous: true,
      }),
    );

    expect(
      Reflect.getMetadata(AUTH_BOUNDARY_KEY, TelegramAuthInternalController),
    ).toEqual(
      expect.objectContaining({
        kind: "internal_api_key",
        allowAnonymous: true,
      }),
    );
  });

  it("помечает mTLS endpoints явным boundary metadata", () => {
    expect(Reflect.getMetadata(AUTH_BOUNDARY_KEY, SnapshotController)).toEqual(
      expect.objectContaining({
        kind: "mtls",
        allowAnonymous: true,
      }),
    );

    expect(
      Reflect.getMetadata(
        AUTH_BOUNDARY_KEY,
        ReplayController.prototype.replayTransaction,
      ),
    ).toEqual(
      expect.objectContaining({
        kind: "mtls",
        allowAnonymous: true,
      }),
    );
  });

  it("помечает health controller как public health boundary", () => {
    expect(Reflect.getMetadata(AUTH_BOUNDARY_KEY, HealthController)).toEqual(
      expect.objectContaining({
        kind: "public_health",
        allowAnonymous: true,
      }),
    );
  });
});
