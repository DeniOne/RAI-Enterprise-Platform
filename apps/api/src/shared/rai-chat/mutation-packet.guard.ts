import type { MutationPacket } from "./execution-target-state.types";

/**
 * Пакет мутации без отметки policy не считается допустимым для применения.
 */
export function isMutationPacketEligibleForApply(
  packet: MutationPacket,
): boolean {
  return packet.policyApproved === true && packet.packetId.length > 0;
}
