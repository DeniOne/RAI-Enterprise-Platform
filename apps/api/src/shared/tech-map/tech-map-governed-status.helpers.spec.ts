import { TechMapStatus } from "@rai/prisma-client";
import {
  canPersistedTechMapTransition,
  isEditablePersistedTechMapStatus,
  mapPublicationStateToPersistedStatus,
} from "./tech-map-governed-status.helpers";

describe("tech-map-governed-status.helpers", () => {
  it("разрешает канонический persisted переход DRAFT -> REVIEW", () => {
    expect(
      canPersistedTechMapTransition(TechMapStatus.DRAFT, TechMapStatus.REVIEW),
    ).toBe(true);
  });

  it("запрещает persisted переход DRAFT -> ACTIVE", () => {
    expect(
      canPersistedTechMapTransition(TechMapStatus.DRAFT, TechMapStatus.ACTIVE),
    ).toBe(false);
  });

  it("считает editable только DRAFT и REVIEW", () => {
    expect(isEditablePersistedTechMapStatus(TechMapStatus.DRAFT)).toBe(true);
    expect(isEditablePersistedTechMapStatus(TechMapStatus.REVIEW)).toBe(true);
    expect(isEditablePersistedTechMapStatus(TechMapStatus.APPROVED)).toBe(
      false,
    );
  });

  it("маппит publication state в persisted status", () => {
    expect(mapPublicationStateToPersistedStatus("WORKING_DRAFT")).toBeNull();
    expect(mapPublicationStateToPersistedStatus("GOVERNED_DRAFT")).toBe(
      TechMapStatus.DRAFT,
    );
    expect(mapPublicationStateToPersistedStatus("PUBLISHABLE")).toBe(
      TechMapStatus.APPROVED,
    );
    expect(mapPublicationStateToPersistedStatus("PUBLISHED")).toBe(
      TechMapStatus.ACTIVE,
    );
  });
});
