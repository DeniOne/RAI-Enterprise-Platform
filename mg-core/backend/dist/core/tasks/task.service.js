"use strict";
/**
 * Task Service for BusinessCore
 *
 * POST-AUDIT FIX:
 * - FSM validation for status transitions
 * - task_history append-only logging
 * - Field-level access control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const common_enums_1 = require("@/dto/common/common.enums");
const prisma_1 = require("@/config/prisma");
// =============================================================================
// FSM: Allowed Status Transitions
// =============================================================================
/**
 * Finite State Machine for Task Status
 * Key: current status, Value: allowed next statuses
 */
const TASK_STATUS_FSM = {
    'pending': ['in_progress', 'cancelled'],
    'in_progress': ['pending', 'completed', 'on_hold', 'cancelled'],
    'on_hold': ['in_progress', 'cancelled'],
    'completed': [], // Terminal state - no transitions allowed
    'cancelled': [], // Terminal state - no transitions allowed
};
/**
 * Validates if status transition is allowed
 * @throws Error if transition is not allowed
 */
function validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = TASK_STATUS_FSM[currentStatus];
    if (!allowedTransitions) {
        throw new Error(`Unknown current status: ${currentStatus}`);
    }
    if (!allowedTransitions.includes(newStatus)) {
        throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}. ` +
            `Allowed transitions: ${allowedTransitions.join(', ') || 'none (terminal state)'}`);
    }
}
// =============================================================================
// Field-Level Access Control
// =============================================================================
/**
 * Sensitive fields that require Manager+ role to view
 */
const MANAGER_ONLY_FIELDS = ['mcReward', 'metadata'];
/**
 * Filters response fields based on user role
 */
function filterResponseByRole(response, userRole) {
    const managerRoles = [common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD];
    if (managerRoles.includes(userRole)) {
        // Managers see all fields
        return response;
    }
    // Non-managers: remove sensitive fields
    const filtered = { ...response };
    for (const field of MANAGER_ONLY_FIELDS) {
        delete filtered[field];
    }
    return filtered;
}
async function writeTaskHistory(entry) {
    await prisma_1.prisma.$executeRaw `
        INSERT INTO task_history (task_id, user_id, action, field_name, old_value, new_value, created_at)
        VALUES (${entry.taskId}::uuid, ${entry.userId}::uuid, ${entry.action}, ${entry.fieldName || null}, ${entry.oldValue || null}, ${entry.newValue || null}, NOW())
    `;
}
// =============================================================================
// Task Service
// =============================================================================
class TaskService {
    /**
     * Create a new task
     * Records 'created' action in task_history
     */
    async createTask(dto, creatorId) {
        const task = await prisma_1.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                creator_id: creatorId,
                assignee_id: dto.assigneeId,
                department_id: dto.departmentId,
                priority: dto.priority || 'medium',
                due_date: dto.dueDate ? new Date(dto.dueDate) : null,
                tags: dto.tags || [],
            },
            include: {
                creator: true,
                assignee: true,
                department: true
            }
        });
        // Write to task_history (append-only)
        await writeTaskHistory({
            taskId: task.id,
            userId: creatorId,
            action: 'created',
            newValue: JSON.stringify({ title: task.title, status: task.status })
        });
        return this.mapToResponse(task);
    }
    /**
     * Get task by ID with optional field filtering
     */
    async getTaskById(id, userRole) {
        const task = await prisma_1.prisma.task.findUnique({
            where: { id },
            include: {
                creator: true,
                assignee: true,
                department: true
            }
        });
        if (!task)
            return null;
        const response = this.mapToResponse(task);
        return userRole ? filterResponseByRole(response, userRole) : response;
    }
    /**
     * Update task with FSM validation and history logging
     */
    async updateTask(id, dto, userId) {
        // Get current task state for history
        const currentTask = await prisma_1.prisma.task.findUnique({ where: { id } });
        if (!currentTask) {
            throw new Error('Task not found');
        }
        // If status is being changed, validate FSM
        if (dto.status && dto.status !== currentTask.status) {
            validateStatusTransition(currentTask.status, dto.status);
        }
        const task = await prisma_1.prisma.task.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                assignee_id: dto.assigneeId,
                status: dto.status,
                priority: dto.priority,
                due_date: dto.dueDate ? new Date(dto.dueDate) : undefined,
            },
            include: {
                creator: true,
                assignee: true,
                department: true
            }
        });
        // Write to task_history for each changed field
        const changedFields = [];
        if (dto.title && dto.title !== currentTask.title)
            changedFields.push('title');
        if (dto.description && dto.description !== currentTask.description)
            changedFields.push('description');
        if (dto.status && dto.status !== currentTask.status)
            changedFields.push('status');
        if (dto.priority && dto.priority !== currentTask.priority)
            changedFields.push('priority');
        for (const field of changedFields) {
            await writeTaskHistory({
                taskId: id,
                userId,
                action: field === 'status' ? 'status_changed' : 'updated',
                fieldName: field,
                oldValue: String(currentTask[field] || ''),
                newValue: String(dto[field] || '')
            });
        }
        return this.mapToResponse(task);
    }
    /**
     * Update task status with FSM validation
     * @throws Error if transition is not allowed by FSM
     */
    async updateStatus(id, newStatus, userId) {
        // Get current task for FSM validation
        const currentTask = await prisma_1.prisma.task.findUnique({ where: { id } });
        if (!currentTask) {
            throw new Error('Task not found');
        }
        // FSM validation - throws if invalid
        validateStatusTransition(currentTask.status, newStatus);
        const task = await prisma_1.prisma.task.update({
            where: { id },
            data: {
                status: newStatus,
                completed_at: newStatus === common_enums_1.TaskStatus.DONE ? new Date() : null
            },
            include: {
                creator: true,
                assignee: true,
                department: true
            }
        });
        // Write to task_history
        await writeTaskHistory({
            taskId: id,
            userId,
            action: newStatus === common_enums_1.TaskStatus.DONE ? 'completed' : 'status_changed',
            fieldName: 'status',
            oldValue: currentTask.status,
            newValue: newStatus
        });
        return this.mapToResponse(task);
    }
    /**
     * Assign task to user with history logging
     */
    async assignTask(id, assigneeId, performedBy) {
        // Get current task for history
        const currentTask = await prisma_1.prisma.task.findUnique({ where: { id } });
        if (!currentTask) {
            throw new Error('Task not found');
        }
        const task = await prisma_1.prisma.task.update({
            where: { id },
            data: { assignee_id: assigneeId },
            include: {
                creator: true,
                assignee: true,
                department: true
            }
        });
        // Write to task_history
        await writeTaskHistory({
            taskId: id,
            userId: performedBy,
            action: 'assigned',
            fieldName: 'assignee_id',
            oldValue: currentTask.assignee_id || '',
            newValue: assigneeId
        });
        return this.mapToResponse(task);
    }
    /**
     * Get tasks with filters and optional field filtering
     */
    async getTasks(filters, userRole) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.assigneeId)
            where.assignee_id = filters.assigneeId;
        if (filters.departmentId)
            where.department_id = filters.departmentId;
        if (filters.priority)
            where.priority = filters.priority;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        const tasks = await prisma_1.prisma.task.findMany({
            where,
            include: {
                creator: true,
                assignee: true,
                department: true
            },
            orderBy: { created_at: 'desc' }
        });
        const responses = tasks.map(this.mapToResponse);
        return userRole
            ? responses.map(r => filterResponseByRole(r, userRole))
            : responses;
    }
    /**
     * Map database task to response DTO
     */
    mapToResponse(task) {
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            creatorId: task.creator_id,
            assigneeId: task.assignee_id || undefined,
            departmentId: task.department_id || undefined,
            dueDate: task.due_date?.toISOString(),
            completedAt: task.completed_at?.toISOString(),
            tags: task.tags,
            mcReward: task.mc_reward ? Number(task.mc_reward) : undefined,
            createdAt: task.created_at.toISOString(),
            updatedAt: task.updated_at.toISOString()
        };
    }
}
exports.TaskService = TaskService;
