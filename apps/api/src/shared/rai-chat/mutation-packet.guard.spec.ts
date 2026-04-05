import { isMutationPacketEligibleForApply } from "./mutation-packet.guard";
import { RaiToolName } from "./rai-tools.types";

describe("mutation-packet.guard", () => {
  it("отклоняет пакет без policyApproved", () => {
    expect(
      isMutationPacketEligibleForApply({
        version: "v1",
        packetId: "p1",
        branchId: "b1",
        toolName: RaiToolName.EchoMessage,
        payload: {},
        policyApproved: false,
      }),
    ).toBe(false);
  });

  it("принимает пакет с policyApproved и непустым packetId", () => {
    expect(
      isMutationPacketEligibleForApply({
        version: "v1",
        packetId: "p1",
        branchId: "b1",
        toolName: RaiToolName.EchoMessage,
        payload: {},
        policyApproved: true,
      }),
    ).toBe(true);
  });

  it("отклоняет пустой packetId даже при policyApproved", () => {
    expect(
      isMutationPacketEligibleForApply({
        version: "v1",
        packetId: "",
        branchId: "b1",
        toolName: null,
        payload: {},
        policyApproved: true,
      }),
    ).toBe(false);
  });
});
