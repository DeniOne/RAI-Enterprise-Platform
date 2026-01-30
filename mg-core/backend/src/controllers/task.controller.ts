/**
 * Task Controller for MatrixGin
 * 
 * POST-AUDIT FIX:
 * - Passes userId for history logging
 * - Passes userRole for field-level access
 * - FSM validation errors returned as 400
 */

import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { TaskStatus, UserRole } from '../dto/common/common.enums';

const taskService = new TaskService();

export class TaskController {

    /**
     * Create new task
     * POST /tasks
     */
    async create(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const task = await taskService.createTask(req.body, userId);
            res.status(201).json(task);
        } catch (error: any) {
            console.error('Error creating task:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Get all tasks with filters
     * GET /tasks
     * Field-level access applied based on user role
     */
    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const userRole = (req.user as any).role as UserRole;

            const result = await taskService.getTasks(req.query, userRole);

            // If result is already paginated, return as is
            if (result && typeof result === 'object' && 'data' in result) {
                return res.json(result);
            }

            // Otherwise, wrap in pagination format
            const tasks = Array.isArray(result) ? result : [];
            res.json({
                data: tasks,
                total: tasks.length,
                page,
                limit
            });
        } catch (error: any) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Get task by ID
     * GET /tasks/:id
     * Field-level access applied based on user role
     */
    async getById(req: Request, res: Response) {
        try {
            const userRole = (req.user as any).role as UserRole;
            const task = await taskService.getTaskById(req.params.id, userRole);

            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }
            res.json(task);
        } catch (error: any) {
            console.error('Error fetching task:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Update task
     * PUT /tasks/:id
     * FSM validation applied, history logged
     */
    async update(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const task = await taskService.updateTask(req.params.id, req.body, userId);
            res.json(task);
        } catch (error: any) {
            console.error('Error updating task:', error);
            // FSM validation errors should return 400
            if (error.message?.includes('Invalid status transition') || error.message?.includes('Task not found')) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Update task status
     * PATCH /tasks/:id/status
     * FSM validation applied, history logged
     */
    async updateStatus(req: Request, res: Response) {
        try {
            const { status } = req.body;
            const userId = (req.user as any).id;

            if (!Object.values(TaskStatus).includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }

            const task = await taskService.updateStatus(req.params.id, status, userId);
            res.json(task);
        } catch (error: any) {
            console.error('Error updating task status:', error);
            // FSM validation errors should return 400
            if (error.message?.includes('Invalid status transition') || error.message?.includes('Task not found')) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Assign task to user
     * POST /tasks/:id/assign
     * History logged
     */
    async assign(req: Request, res: Response) {
        try {
            const { assigneeId } = req.body;
            const performedBy = (req.user as any).id;

            if (!assigneeId) {
                return res.status(400).json({ message: 'Assignee ID is required' });
            }

            const task = await taskService.assignTask(req.params.id, assigneeId, performedBy);
            res.json(task);
        } catch (error: any) {
            console.error('Error assigning task:', error);
            if (error.message?.includes('Task not found')) {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
