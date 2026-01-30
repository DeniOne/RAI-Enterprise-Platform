/**
 * Response DTO for participation status
 */
export interface StatusResponseDto {
    id: string;
    userId: string;
    statusCode: string;
    statusDescription: string;
    governanceFlags: any;
    assignedAt: Date;
    assignedBy: string;
    reason: string;
}

/**
 * Response DTO for status history entry
 */
export interface StatusHistoryDto {
    id: string;
    userId: string;
    oldStatus: string | null;
    newStatus: string;
    reason: string;
    changedAt: Date;
    changedBy: string;
}

/**
 * Response DTO for available status
 */
export interface AvailableStatusDto {
    code: string;
    description: string;
    governanceFlags: any;
    isActive: boolean;
}

/**
 * Map UserParticipationStatus to StatusResponseDto
 */
export function mapToStatusResponse(userStatus: any): StatusResponseDto {
    return {
        id: userStatus.id,
        userId: userStatus.user_id,
        statusCode: userStatus.status_code,
        statusDescription: userStatus.status?.description || '',
        governanceFlags: userStatus.status?.governance_flags || {},
        assignedAt: userStatus.assigned_at,
        assignedBy: userStatus.assigned_by,
        reason: userStatus.reason
    };
}

/**
 * Map ParticipationStatusHistory to StatusHistoryDto
 */
export function mapToStatusHistory(history: any): StatusHistoryDto {
    return {
        id: history.id,
        userId: history.user_id,
        oldStatus: history.old_status,
        newStatus: history.new_status,
        reason: history.reason,
        changedAt: history.changed_at,
        changedBy: history.changed_by
    };
}

/**
 * Map ParticipationStatus to AvailableStatusDto
 */
export function mapToAvailableStatus(status: any): AvailableStatusDto {
    return {
        code: status.code,
        description: status.description,
        governanceFlags: status.governance_flags || {},
        isActive: status.is_active
    };
}
