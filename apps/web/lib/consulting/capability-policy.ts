import { UserRole } from '../config/role-config';

export interface CapabilityFlags {
    canOverride: boolean;
    canSign: boolean;
    canEscalate: boolean;
    canEdit: boolean;
    canApprove: boolean;
}

const DEFAULT_CAPABILITIES: CapabilityFlags = {
    canOverride: false,
    canSign: false,
    canEscalate: false,
    canEdit: false,
    canApprove: false,
};

const ROLE_TO_CAPABILITIES: Record<UserRole, CapabilityFlags> = {
    CEO: { canOverride: true, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    DIRECTOR_OFS: { canOverride: false, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    DIRECTOR_FINANCE: { canOverride: false, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    DIRECTOR_ECONOMY: { canOverride: false, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    DIRECTOR_GR: { canOverride: false, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    DIRECTOR_HR: { canOverride: false, canSign: false, canEscalate: true, canEdit: true, canApprove: true },
    DIRECTOR_PRODUCTION: { canOverride: false, canSign: false, canEscalate: true, canEdit: true, canApprove: true },
    MANAGER: { canOverride: false, canSign: false, canEscalate: true, canEdit: true, canApprove: false },
    AGRONOMIST: { canOverride: false, canSign: false, canEscalate: false, canEdit: true, canApprove: false },
    ADMIN: { canOverride: true, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    SYSTEM_ADMIN: { canOverride: true, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    FOUNDER: { canOverride: true, canSign: true, canEscalate: true, canEdit: true, canApprove: true },
    FIELD_WORKER: { canOverride: false, canSign: false, canEscalate: false, canEdit: true, canApprove: false },
    CLIENT_ADMIN: { canOverride: false, canSign: false, canEscalate: false, canEdit: true, canApprove: false },
    USER: { canOverride: false, canSign: false, canEscalate: false, canEdit: false, canApprove: false },
};

export function capabilitiesFromRole(role: UserRole): CapabilityFlags {
    return ROLE_TO_CAPABILITIES[role] ?? DEFAULT_CAPABILITIES;
}
