import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import {
  CONSULTING_ACCESS_POLICY_KEY,
  ConsultingAccessGuard,
  ConsultingAccessPolicy,
} from "./consulting-access.guard";

export function ConsultingAccess(policy: ConsultingAccessPolicy) {
  return applyDecorators(
    SetMetadata(CONSULTING_ACCESS_POLICY_KEY, policy),
    UseGuards(ConsultingAccessGuard),
  );
}
