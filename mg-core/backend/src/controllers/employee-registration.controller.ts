import { Request, Response } from 'express';
import employeeRegistrationService from '../services/employee-registration.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class EmployeeRegistrationController {
    /**
     * Admin initiates registration invitation
     * POST /api/registration/invite
     */
    async inviteEmployee(req: Request, res: Response): Promise<void> {
        try {
            const { telegramId, departmentId, locationId } = req.body;
            const userId = (req.user as any)?.id;

            if (!telegramId) {
                res.status(400).json({
                    success: false,
                    error: { message: 'telegramId is required' }
                });
                return;
            }

            await employeeRegistrationService.sendRegistrationInvitation(
                telegramId,
                userId,
                departmentId,
                locationId
            );

            res.status(200).json({
                success: true,
                data: { message: 'Registration invitation sent successfully' }
            });
        } catch (error) {
            console.error('Invite employee error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * Get all registration requests
     * GET /api/registration/requests
     */
    async getRegistrationRequests(req: Request, res: Response): Promise<void> {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let whereClause = '';
            if (status) {
                whereClause = `WHERE r.status = '${status}'::registration_status`;
            } else {
                // By default, hide incomplete registrations (PENDING)
                whereClause = `WHERE r.status != 'PENDING'::registration_status`;
            }

            const requests = await prisma.$queryRawUnsafe<any[]>(`
                SELECT 
                    r.*,
                    u.first_name as invited_by_first_name,
                    u.last_name as invited_by_last_name,
                    d.name as department_name,
                    l.name as location_name
                FROM "employee_registration_requests" r
                LEFT JOIN "users" u ON r.invited_by = u.id
                LEFT JOIN "departments" d ON r.department_id = d.id
                LEFT JOIN "locations" l ON r.location_id = l.id
                ${whereClause}
                ORDER BY r.created_at DESC
                LIMIT ${Number(limit)} OFFSET ${offset}
            `);

            const totalResult = await prisma.$queryRawUnsafe<any[]>(`
                SELECT COUNT(*) as total 
                FROM "employee_registration_requests" r
                ${whereClause}
            `);

            const total = Number(totalResult[0]?.total || 0);

            res.status(200).json({
                success: true,
                data: requests,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('Get registration requests error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * Get single registration request
     * GET /api/registration/requests/:id
     */
    async getRegistrationRequest(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const requests = await prisma.$queryRaw<any[]>`
                SELECT 
                    r.*,
                    u.first_name as invited_by_first_name,
                    u.last_name as invited_by_last_name,
                    d.name as department_name,
                    l.name as location_name
                FROM "employee_registration_requests" r
                LEFT JOIN "users" u ON r.invited_by = u.id
                LEFT JOIN "departments" d ON r.department_id = d.id
                LEFT JOIN "locations" l ON r.location_id = l.id
                WHERE r.id = ${id}::uuid
            `;

            if (requests.length === 0) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Registration request not found' }
                });
                return;
            }

            // Get step history
            const history = await prisma.$queryRaw<any[]>`
                SELECT step, data, completed_at
                FROM "registration_step_history"
                WHERE registration_id = ${id}::uuid
                ORDER BY completed_at ASC
            `;

            res.status(200).json({
                success: true,
                data: {
                    ...requests[0],
                    step_history: history
                }
            });
        } catch (error) {
            console.error('Get registration request error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * Approve registration request
     * POST /api/registration/requests/:id/approve
     */
    async approveRegistration(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = (req.user as any)?.id;

            console.log(`[Approve] Approving registration ${id} by user ${userId}. Payload:`, req.body);

            await employeeRegistrationService.approveRegistration(id, userId, req.body);

            res.status(200).json({
                success: true,
                data: { message: 'Registration approved successfully' }
            });
        } catch (error: any) {
            console.error('Approve registration error:', error);
            const status = error.status || (error.message.includes('incomplete') ? 400 : 500);
            res.status(status).json({
                success: false,
                error: { message: error.message || 'Internal server error' }
            });
        }
    }

    /**
     * Reject registration request
     * POST /api/registration/requests/:id/reject
     */
    async rejectRegistration(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = (req.user as any)?.id;

            if (!reason) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Rejection reason is required' }
                });
                return;
            }

            await employeeRegistrationService.rejectRegistration(id, userId, reason);

            res.status(200).json({
                success: true,
                data: { message: 'Registration rejected successfully' }
            });
        } catch (error) {
            console.error('Reject registration error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * Get registration statistics
     * GET /api/registration/stats
     */
    async getRegistrationStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await prisma.$queryRaw<any[]>`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM "employee_registration_requests"
                GROUP BY status
            `;

            const recentRegistrations = await prisma.$queryRaw<any[]>`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM "employee_registration_requests"
                WHERE created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `;

            res.status(200).json({
                success: true,
                data: {
                    by_status: stats,
                    recent_registrations: recentRegistrations
                }
            });
        } catch (error) {
            console.error('Get registration stats error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }
}

export default new EmployeeRegistrationController();
