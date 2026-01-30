import { PrismaClient } from '@prisma/client';
import { statusAuditService } from './status-audit.service';

const prisma = new PrismaClient();

/**
 * StatusAssignmentService
 * 
 * Manages participation status assignments with full audit trail.
 * Canon: Status = governance influence, not automatic calculation.
 */
export class StatusAssignmentService {
    /**
     * Assign a participation status to a user
     * 
     * @param params - Assignment details
     * @returns Updated user status
     */
    async assignStatus(params: {
        userId: string;
        statusCode: string;
        assignedBy: string;
        reason: string;
    }) {
        const { userId, statusCode, assignedBy, reason } = params;

        // Validate required fields
        if (!userId || !statusCode || !assignedBy || !reason) {
            throw new Error('Missing required fields for status assignment');
        }

        // Validate reason is not empty
        if (reason.trim().length === 0) {
            throw new Error('Reason cannot be empty');
        }

        // Verify status exists and is active
        const status = await prisma.participationStatus.findUnique({
            where: { code: statusCode }
        });

        if (!status) {
            throw new Error(`Status '${statusCode}' does not exist`);
        }

        if (!status.is_active) {
            throw new Error(`Status '${statusCode}' is not active`);
        }

        // Get current status (if exists)
        const currentStatus = await this.getCurrentStatus(userId);
        const oldStatusCode = currentStatus?.status_code || null;

        // Check if status is already assigned
        if (oldStatusCode === statusCode) {
            throw new Error(`User already has status '${statusCode}'`);
        }

        // Perform assignment in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing status if present
            if (currentStatus) {
                await tx.userParticipationStatus.delete({
                    where: { user_id: userId }
                });
            }

            // Create new status assignment
            const newStatus = await tx.userParticipationStatus.create({
                data: {
                    user_id: userId,
                    status_code: statusCode,
                    assigned_by: assignedBy,
                    reason,
                    assigned_at: new Date()
                },
                include: {
                    status: true,
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    }
                }
            });

            // Log to audit trail (using separate service)
            await statusAuditService.logStatusChange({
                userId,
                oldStatus: oldStatusCode,
                newStatus: statusCode,
                reason,
                changedBy: assignedBy
            });

            return newStatus;
        });

        return result;
    }

    /**
     * Get current participation status for a user
     * 
     * @param userId - User ID
     * @returns Current status or null if not assigned
     */
    async getCurrentStatus(userId: string) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const status = await prisma.userParticipationStatus.findUnique({
            where: { user_id: userId },
            include: {
                status: true
            }
        });

        return status;
    }

    /**
     * Get status history for a user
     * 
     * @param userId - User ID
     * @returns Array of status changes
     */
    async getStatusHistory(userId: string) {
        return statusAuditService.getAuditTrail(userId);
    }

    /**
     * Get all available statuses
     * 
     * @returns Array of all active statuses
     */
    async getAllStatuses() {
        const statuses = await prisma.participationStatus.findMany({
            where: { is_active: true },
            orderBy: { code: 'asc' }
        });

        return statuses;
    }

    /**
     * Get all users with their current participation status
     * 
     * @returns Array of users with their current status
     */
    async getUsersWithStatuses() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                current_participation_status: {
                    include: {
                        status: true
                    }
                }
            },
            orderBy: {
                last_name: 'asc'
            }
        });

        return users;
    }
}

export const statusAssignmentService = new StatusAssignmentService();
