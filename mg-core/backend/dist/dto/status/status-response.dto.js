"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToStatusResponse = mapToStatusResponse;
exports.mapToStatusHistory = mapToStatusHistory;
exports.mapToAvailableStatus = mapToAvailableStatus;
/**
 * Map UserParticipationStatus to StatusResponseDto
 */
function mapToStatusResponse(userStatus) {
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
function mapToStatusHistory(history) {
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
function mapToAvailableStatus(status) {
    return {
        code: status.code,
        description: status.description,
        governanceFlags: status.governance_flags || {},
        isActive: status.is_active
    };
}
