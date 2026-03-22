import { TechMapStatus } from "@rai/prisma-client";
import {
  TECH_MAP_EDITABLE_PERSISTED_STATUSES,
  TECH_MAP_PERSISTED_STATUS_BY_PUBLICATION_STATE,
  TECH_MAP_PERSISTED_STATUS_TRANSITIONS,
  type TechMapPublicationState,
} from "./tech-map-governed-state.types";

export function canPersistedTechMapTransition(
  currentStatus: TechMapStatus,
  targetStatus: TechMapStatus,
): boolean {
  return TECH_MAP_PERSISTED_STATUS_TRANSITIONS[currentStatus].includes(
    targetStatus,
  );
}

export function isEditablePersistedTechMapStatus(
  status: TechMapStatus,
): boolean {
  return TECH_MAP_EDITABLE_PERSISTED_STATUSES.includes(
    status as (typeof TECH_MAP_EDITABLE_PERSISTED_STATUSES)[number],
  );
}

export function mapPublicationStateToPersistedStatus(
  publicationState: TechMapPublicationState,
): TechMapStatus | null {
  return TECH_MAP_PERSISTED_STATUS_BY_PUBLICATION_STATE[publicationState];
}
