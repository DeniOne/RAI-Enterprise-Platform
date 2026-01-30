import { Request, Response } from 'express';
import ofsService from '../services/ofs.service';
import { filterRoleMatrixByRole, filterHistoryByRole, filterOFSArrayByRole } from '../services/ofs-acl.service';
import { UserRole } from '../dto/common/common.enums';

class OFSController {
    /**
     * GET /api/ofs/departments
     * Get all departments with hierarchy
     */
    async getDepartments(req: Request, res: Response): Promise<void> {
        try {
            const { include_inactive, format, with_stats } = req.query;

            const departments = await ofsService.getDepartments(
                include_inactive === 'true',
                (format as 'tree' | 'flat') || 'flat'
            );

            res.status(200).json({
                success: true,
                data: departments
            });
        } catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/departments
     * Create new department
     */
    /**
     * POST /api/ofs/departments
     * Create new department
     */
    async createDepartment(req: Request, res: Response): Promise<void> {
        try {
            const { force, reason, ...body } = req.body;
            // Pass force/reason merged into data
            const department = await ofsService.createDepartment({ ...body, force, reason });

            res.status(201).json({
                success: true,
                data: department
            });
        } catch (error) {
            console.error('Create department error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * PUT /api/ofs/departments/:id
     * Update department
     */
    async updateDepartment(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const department = await ofsService.updateDepartment(id, req.body);

            res.status(200).json({
                success: true,
                data: department
            });
        } catch (error) {
            console.error('Update department error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * DELETE /api/ofs/departments/:id
     * Delete/deactivate department
     */
    /**
     * DELETE /api/ofs/departments/:id
     * Delete/deactivate department
     */
    async deleteDepartment(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { hard, force, reason } = req.query;

            const result = await ofsService.deleteDepartment(
                id,
                hard !== 'true',
                force === 'true',
                reason as string
            );

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Delete department error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/departments/:id/move
     * Move department to new parent
     */
    /**
     * POST /api/ofs/departments/:id/move
     * Move department to new parent
     */
    async moveDepartment(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { new_parent_id, reason, force } = req.body;
            const userId = (req.user as any)?.id;

            const department = await ofsService.moveDepartment(
                id,
                new_parent_id,
                reason,
                userId,
                force
            );

            res.status(200).json({
                success: true,
                data: department
            });
        } catch (error) {
            console.error('Move department error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/role-matrix
     * Get role competency matrix
     */
    async getRoleMatrix(req: Request, res: Response): Promise<void> {
        try {
            const { department_id } = req.query;
            const userRole = (req.user as any)?.role as UserRole || UserRole.EMPLOYEE;

            const matrix = await ofsService.getRoleMatrix(department_id as string);
            const filtered = filterRoleMatrixByRole(matrix, userRole);

            res.status(200).json({
                success: true,
                data: filtered
            });
        } catch (error) {
            console.error('Get role matrix error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/role-matrix
     * Create new role in matrix
     */
    async createRole(req: Request, res: Response): Promise<void> {
        try {
            const role = await ofsService.createRole(req.body);

            res.status(201).json({
                success: true,
                data: role
            });
        } catch (error) {
            console.error('Create role error:', JSON.stringify(error, null, 2));
            res.status(500).json({
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Internal server error',
                    details: error
                }
            });
        }
    }

    /**
     * PUT /api/ofs/role-matrix/:id
     * Update role in matrix
     */
    async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const role = await ofsService.updateRole(id, req.body);

            res.status(200).json({
                success: true,
                data: role
            });
        } catch (error) {
            console.error('Update role error:', JSON.stringify(error, null, 2));
            res.status(500).json({
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Internal server error',
                    details: error
                }
            });
        }
    }

    /**
     * DELETE /api/ofs/role-matrix/:id
     * Delete role from matrix
     */
    async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await ofsService.deleteRole(id);

            res.status(200).json({
                success: true,
                data: { message: 'Role deleted successfully' }
            });
        } catch (error) {
            console.error('Delete role error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/role-matrix/:roleId/assign
     * Assign role to employee
     */
    async assignRole(req: Request, res: Response): Promise<void> {
        try {
            const { roleId } = req.params;
            const { employee_id, effective_from, reason } = req.body;
            const userId = (req.user as any)?.id;

            const assignment = await ofsService.assignRole({
                employee_id,
                role_matrix_id: roleId,
                effective_from: new Date(effective_from),
                assigned_by: userId,
                reason
            });

            res.status(201).json({
                success: true,
                data: assignment
            });
        } catch (error) {
            console.error('Assign role error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/employees
     * Get employees with extended info
     */
    async getEmployees(req: Request, res: Response): Promise<void> {
        try {
            const { department_id, role, status, has_competencies, page, limit } = req.query;
            const userRole = (req.user as any)?.role as UserRole || UserRole.EMPLOYEE;
            const userId = (req.user as any)?.id;

            const result = await ofsService.getEmployees({
                department_id: department_id as string,
                role: role as string,
                status: status as string,
                has_competencies: has_competencies ? (has_competencies as string).split(',') : undefined,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined
            });

            const filteredData = filterOFSArrayByRole(result.data, userRole, userId);

            res.status(200).json({
                success: true,
                data: filteredData,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Get employees error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * PUT /api/ofs/employees/:id/competencies
     * Update employee competencies
     */
    async updateEmployeeCompetencies(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const employee = await ofsService.updateEmployeeCompetencies(id, req.body);

            res.status(200).json({
                success: true,
                data: employee
            });
        } catch (error) {
            console.error('Update competencies error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/employees/:id/transfer
     * Transfer employee to another department
     */
    async transferEmployee(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { new_department_id, new_position, effective_date, reason } = req.body;
            const userId = (req.user as any)?.id;

            const employee = await ofsService.transferEmployee(id, {
                new_department_id,
                new_position,
                effective_date: new Date(effective_date),
                reason,
                changed_by: userId
            });

            res.status(200).json({
                success: true,
                data: employee
            });
        } catch (error) {
            console.error('Transfer employee error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/reporting/:employeeId
     * Get reporting relationships
     */
    async getReportingRelationships(req: Request, res: Response): Promise<void> {
        try {
            const { employeeId } = req.params;

            const relationships = await ofsService.getReportingRelationships(employeeId);

            res.status(200).json({
                success: true,
                data: relationships
            });
        } catch (error) {
            console.error('Get reporting relationships error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/reporting
     * Create new reporting relationship
     */
    async createReportingRelationship(req: Request, res: Response): Promise<void> {
        try {
            const { subordinate_id, supervisor_id, relationship_type, effective_from, reason } = req.body;

            const relationship = await ofsService.createReportingRelationship({
                subordinate_id,
                supervisor_id,
                relationship_type,
                effective_from: new Date(effective_from),
                reason
            });

            res.status(201).json({
                success: true,
                data: relationship
            });
        } catch (error) {
            console.error('Create reporting relationship error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/org-chart
     * Get org chart data
     */
    async getOrgChart(req: Request, res: Response): Promise<void> {
        try {
            const { department_id, depth, include_photos } = req.query;

            const chart = await ofsService.getOrgChart(
                department_id as string,
                depth ? Number(depth) : undefined,
                include_photos === 'true'
            );

            res.status(200).json({
                success: true,
                data: chart
            });
        } catch (error) {
            console.error('Get org chart error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/history
     * Get structure change history
     */
    async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const {
                entity_type,
                entity_id,
                action,
                date_from,
                date_to,
                changed_by,
                page,
                limit
            } = req.query;
            const userRole = (req.user as any)?.role as UserRole || UserRole.EMPLOYEE;

            const result = await ofsService.getStructureHistory({
                entity_type: entity_type as any,
                entity_id: entity_id as string,
                action: action as string,
                date_from: date_from ? new Date(date_from as string) : undefined,
                date_to: date_to ? new Date(date_to as string) : undefined,
                changed_by: changed_by as string,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined
            });

            const filteredData = filterHistoryByRole(result.data, userRole);

            res.status(200).json({
                success: true,
                data: filteredData,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Get history error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/reports/structure
     * Get structure statistics
     */
    async getStructureReport(req: Request, res: Response): Promise<void> {
        try {
            const stats = await ofsService.getStructureStats();

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get structure report error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/pyramid
     * Get Pyramid of Interdependence roles
     */
    async getPyramidRoles(req: Request, res: Response): Promise<void> {
        try {
            const roles = await ofsService.getPyramidRoles();

            res.status(200).json({
                success: true,
                data: roles
            });
        } catch (error) {
            console.error('Get pyramid roles error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/pyramid
     * Create pyramid role
     */
    async createPyramidRole(req: Request, res: Response): Promise<void> {
        try {
            const role = await ofsService.createPyramidRole(req.body);

            res.status(201).json({
                success: true,
                data: role
            });
        } catch (error) {
            console.error('Create pyramid role error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/triangle
     * Get Triangle of Interdependence assignments
     */
    async getTriangleAssignments(req: Request, res: Response): Promise<void> {
        try {
            const { employee_id } = req.query;

            const assignments = await ofsService.getTriangleAssignments(employee_id as string);

            res.status(200).json({
                success: true,
                data: assignments
            });
        } catch (error) {
            console.error('Get triangle assignments error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/triangle/assign
     * Assign employee to Triangle role
     */
    async assignTriangleRole(req: Request, res: Response): Promise<void> {
        try {
            const assignment = await ofsService.assignTriangleRole(req.body);

            res.status(201).json({
                success: true,
                data: assignment
            });
        } catch (error) {
            console.error('Assign triangle role error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/triangle/stats
     * Get Triangle statistics
     */
    async getTriangleStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await ofsService.getTriangleStats();

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get triangle stats error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/hierarchy/levels
     * Get 7-level organizational hierarchy
     */
    async getHierarchyLevels(req: Request, res: Response): Promise<void> {
        try {
            const levels = await ofsService.getHierarchyLevels();

            res.status(200).json({
                success: true,
                data: levels
            });
        } catch (error) {
            console.error('Get hierarchy levels error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/hierarchy/structure
     * Get departments grouped by hierarchy level
     */
    async getHierarchyStructure(req: Request, res: Response): Promise<void> {
        try {
            const structure = await ofsService.getDepartmentsByHierarchy();

            res.status(200).json({
                success: true,
                data: structure
            });
        } catch (error) {
            console.error('Get hierarchy structure error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/raci
     * Create RACI assignment for project
     */
    async createRACIAssignment(req: Request, res: Response): Promise<void> {
        try {
            const assignment = await ofsService.createRACIAssignment(req.body);

            res.status(201).json({
                success: true,
                data: assignment
            });
        } catch (error) {
            console.error('Create RACI assignment error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/raci/:projectName
     * Get RACI matrix for project
     */
    async getProjectRACI(req: Request, res: Response): Promise<void> {
        try {
            const { projectName } = req.params;
            const raci = await ofsService.getProjectRACI(projectName);

            res.status(200).json({
                success: true,
                data: raci
            });
        } catch (error) {
            console.error('Get project RACI error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/ideas
     * Submit idea through channel
     */
    async submitIdea(req: Request, res: Response): Promise<void> {
        try {
            const idea = await ofsService.submitIdea(req.body);

            res.status(201).json({
                success: true,
                data: idea
            });
        } catch (error) {
            console.error('Submit idea error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/ideas
     * Get ideas with filters
     */
    async getIdeas(req: Request, res: Response): Promise<void> {
        try {
            const { channel_type, status, submitted_by } = req.query;

            const ideas = await ofsService.getIdeas({
                channel_type: channel_type as string,
                status: status as string,
                submitted_by: submitted_by as string
            });

            res.status(200).json({
                success: true,
                data: ideas
            });
        } catch (error) {
            console.error('Get ideas error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * POST /api/ofs/hybrid/interaction
     * Log hybrid team interaction
     */
    async logHybridInteraction(req: Request, res: Response): Promise<void> {
        try {
            const interaction = await ofsService.logHybridInteraction(req.body);

            res.status(201).json({
                success: true,
                data: interaction
            });
        } catch (error) {
            console.error('Log hybrid interaction error:', error);
            res.status(500).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/hybrid/stats
     * Get hybrid team statistics
     */
    async getHybridTeamStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await ofsService.getHybridTeamStats();

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get hybrid team stats error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/locations
     * Get all active locations
     */
    async getLocations(req: Request, res: Response): Promise<void> {
        try {
            const locations = await ofsService.getLocations();

            res.status(200).json({
                success: true,
                data: locations
            });
        } catch (error) {
            console.error('Get locations error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }

    /**
     * GET /api/ofs/positions
     * Get all active positions
     */
    async getPositions(req: Request, res: Response): Promise<void> {
        try {
            const positions = await ofsService.getPositions();

            res.status(200).json({
                success: true,
                data: positions
            });
        } catch (error) {
            console.error('Get positions error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Internal server error' }
            });
        }
    }
}

export default new OFSController();
