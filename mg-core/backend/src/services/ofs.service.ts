import { prisma } from '../config/prisma';
import departmentService from './department.service';
import roleMatrixService from './role-matrix.service';
import orgChartService from './org-chart.service';
import { registryBridgeService } from './registry-bridge.service';

/**
 * OFS Service - Facade
 * 
 * Organizational Functional Structure service.
 * Delegates to specialized services while maintaining backward compatibility.
 */
export class OFSService {
    private static instance: OFSService;

    private constructor() { }

    public static getInstance(): OFSService {
        if (!OFSService.instance) {
            OFSService.instance = new OFSService();
        }
        return OFSService.instance;
    }

    // ==================== Department Operations (delegated) ====================

    async getDepartments(includeInactive = false, format: 'tree' | 'flat' = 'flat') {
        return departmentService.getDepartments(includeInactive, format);
    }

    async createDepartment(data: Parameters<typeof departmentService.createDepartment>[0] & { force?: boolean; reason?: string }) {
        const dept = await departmentService.createDepartment(data);
        try {
            await registryBridgeService.createDepartmentStructure(dept.id, data.parent_id || null, data.force, data.reason);
        } catch (error) {
            // Compensating transaction: Rollback OFS creation
            await departmentService.deleteDepartment(dept.id, false);
            throw error;
        }
        return dept;
    }

    async updateDepartment(id: string, data: Parameters<typeof departmentService.updateDepartment>[1]) {
        return departmentService.updateDepartment(id, data);
    }

    async deleteDepartment(id: string, softDelete = true, force: boolean = false, reason?: string) {
        // Enforce Registry Impact Check first
        await registryBridgeService.deleteDepartmentStructure(id, force, reason);
        return departmentService.deleteDepartment(id, softDelete);
    }

    async moveDepartment(id: string, newParentId: string | null, reason?: string, changedBy?: string, force: boolean = false) {
        // 1. Validate with Registry (Impact Analysis + Execution)
        await registryBridgeService.moveDepartmentStructure(id, newParentId!, force, reason);

        const oldDept = await prisma.$queryRaw<any[]>`SELECT * FROM departments WHERE id = ${id}`;
        if (oldDept.length === 0) throw new Error('Department not found');

        const result = await departmentService.updateDepartment(id, { parent_id: newParentId || undefined });
        await orgChartService.logStructureChange({
            entity_type: 'department', entity_id: id, action: 'moved',
            old_data: oldDept[0], new_data: result, reason, changed_by: changedBy
        });
        return result;
    }

    async getHierarchyLevels() {
        return departmentService.getHierarchyLevels();
    }

    async getDepartmentsByHierarchy() {
        return departmentService.getDepartmentsByHierarchy();
    }

    // ==================== Role Operations (delegated) ====================

    async getRoleMatrix(departmentId?: string) {
        return roleMatrixService.getRoleMatrix(departmentId);
    }

    async createRole(data: Parameters<typeof roleMatrixService.createRole>[0]) {
        return roleMatrixService.createRole(data);
    }

    async updateRole(id: string, data: Parameters<typeof roleMatrixService.updateRole>[1]) {
        return roleMatrixService.updateRole(id, data);
    }

    async deleteRole(id: string) {
        return roleMatrixService.deleteRole(id);
    }

    async assignRole(data: Parameters<typeof roleMatrixService.assignRole>[0]) {
        const result = await roleMatrixService.assignRole(data);
        await orgChartService.logStructureChange({
            entity_type: 'role', entity_id: result.id, action: 'assigned',
            new_data: result, reason: data.reason, changed_by: data.assigned_by
        });
        return result;
    }

    // ==================== Org Chart Operations (delegated) ====================

    async getOrgChart(departmentId?: string, depth = 3, includePhotos = false) {
        return orgChartService.getOrgChart(departmentId, depth, includePhotos);
    }

    async getStructureHistory(filters: Parameters<typeof orgChartService.getStructureHistory>[0]) {
        return orgChartService.getStructureHistory(filters);
    }

    async logStructureChange(data: Parameters<typeof orgChartService.logStructureChange>[0]) {
        return orgChartService.logStructureChange(data);
    }

    async getStructureStats() {
        return orgChartService.getStructureStats();
    }

    // ==================== Employee Operations ====================

    async getEmployees(filters: {
        department_id?: string; role?: string; status?: string;
        has_competencies?: string[]; page?: number; limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;

        const whereConditions: string[] = ["u.status = 'ACTIVE'"];
        if (filters.department_id) whereConditions.push(`e.department_id = '${filters.department_id}'`);
        if (filters.status) whereConditions.push(`u.status = '${filters.status}'`);
        if (filters.role) whereConditions.push(`rcm.role_name = '${filters.role}'`);

        const employees = await prisma.$queryRawUnsafe<any[]>(`
            SELECT e.*, u.first_name, u.last_name, u.email, u.avatar, u.status,
                d.name as department_name, rcm.role_name
            FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN employee_roles er ON er.employee_id = e.id AND er.is_active = true
            LEFT JOIN role_competency_matrix rcm ON er.role_matrix_id = rcm.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY u.last_name, u.first_name
            LIMIT ${limit} OFFSET ${offset}
        `);

        const countResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT COUNT(*) as total FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            WHERE ${whereConditions.join(' AND ')}
        `);

        return {
            data: employees,
            pagination: {
                page, limit, total: Number(countResult[0]?.total || 0),
                totalPages: Math.ceil(Number(countResult[0]?.total || 0) / limit)
            }
        };
    }

    async updateEmployeeCompetencies(userId: string, data: {
        competencies?: any; certifications?: any[]; skills?: string[];
        corporate_university_level?: string; faculty?: string;
    }) {
        const updates: string[] = [];
        if (data.skills) updates.push(`skills = ARRAY[${data.skills.map(s => `'${s}'`).join(',')}]`);
        if (data.corporate_university_level) updates.push(`corporate_university_level = '${data.corporate_university_level}'`);
        if (data.faculty) updates.push(`faculty = '${data.faculty}'`);

        if (updates.length === 0) return null;

        const result = await prisma.$queryRawUnsafe<any[]>(`
            UPDATE employees SET ${updates.join(', ')}, updated_at = NOW()
            WHERE user_id = '${userId}' RETURNING *
        `);
        return result[0];
    }

    async transferEmployee(userId: string, data: {
        new_department_id: string; new_position?: string;
        effective_date: Date; reason?: string; changed_by?: string;
    }) {
        const employee = await prisma.employee.findUnique({ where: { user_id: userId } });
        if (!employee) throw new Error('Employee not found');

        const result = await prisma.employee.update({
            where: { user_id: userId },
            data: { department_id: data.new_department_id, position: data.new_position }
        });

        await orgChartService.logStructureChange({
            entity_type: 'employee', entity_id: employee.id, action: 'transferred',
            old_data: employee, new_data: result, reason: data.reason, changed_by: data.changed_by
        });

        return result;
    }

    // ==================== Reporting Relationships ====================

    async getReportingRelationships(employeeId: string) {
        const subordinates = await prisma.$queryRaw<any[]>`
            SELECT rr.*, u.first_name, u.last_name, e.position
            FROM reporting_relationships rr
            JOIN employees e ON rr.subordinate_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE rr.supervisor_id = ${employeeId} AND rr.is_active = true
        `;

        const supervisors = await prisma.$queryRaw<any[]>`
            SELECT rr.*, u.first_name, u.last_name, e.position
            FROM reporting_relationships rr
            JOIN employees e ON rr.supervisor_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE rr.subordinate_id = ${employeeId} AND rr.is_active = true
        `;

        return { subordinates, supervisors };
    }

    async createReportingRelationship(data: {
        subordinate_id: string; supervisor_id: string;
        relationship_type?: 'direct' | 'functional' | 'dotted_line';
        effective_from: Date; reason?: string;
    }) {
        return await prisma.$queryRaw<any[]>`
            INSERT INTO reporting_relationships (
                subordinate_id, supervisor_id, relationship_type, effective_from, is_active
            ) VALUES (
                ${data.subordinate_id}, ${data.supervisor_id},
                ${data.relationship_type || 'direct'}, ${data.effective_from}::date, true
            ) RETURNING *
        `;
    }

    // ==================== Pyramid & Triangle (kept for backward compat) ====================

    async getPyramidRoles() {
        return await prisma.$queryRaw<any[]>`
            SELECT * FROM pyramid_roles WHERE is_active = true ORDER BY role_type, role_name
        `;
    }

    async getTriangleAssignments(employeeId?: string) {
        const whereClause = employeeId ? `WHERE ta.employee_id = '${employeeId}'` : '';
        return await prisma.$queryRawUnsafe<any[]>(`
            SELECT ta.*, u.first_name, u.last_name
            FROM triangle_assignments ta
            JOIN employees e ON ta.employee_id = e.id
            JOIN users u ON e.user_id = u.id ${whereClause}
            ORDER BY ta.triangle_role, u.last_name
        `);
    }

    async getTriangleStats() {
        return await prisma.$queryRaw<any[]>`
            SELECT triangle_role, COUNT(*) as count,
                AVG((flow_metrics->>'efficiency')::float) as avg_efficiency
            FROM triangle_assignments WHERE is_active = true
            GROUP BY triangle_role
        `;
    }

    // ==================== Pyramid Extended ====================

    async createPyramidRole(data: {
        role_type: 'management' | 'photographers' | 'production' | 'sales';
        role_name: string; description?: string; kpi_metrics?: any; interdependencies?: any;
    }) {
        return await prisma.$queryRaw<any[]>`
            INSERT INTO pyramid_roles (role_type, role_name, description, kpi_metrics, interdependencies, is_active)
            VALUES (${data.role_type}, ${data.role_name}, ${data.description || null}, 
                    ${data.kpi_metrics ? JSON.stringify(data.kpi_metrics) : null}::jsonb,
                    ${data.interdependencies ? JSON.stringify(data.interdependencies) : null}::jsonb, true)
            RETURNING *
        `;
    }

    async assignTriangleRole(data: {
        employee_id: string; triangle_role: 'photographer' | 'designer' | 'seller';
        is_primary?: boolean; flow_metrics?: any;
    }) {
        return await prisma.$queryRaw<any[]>`
            INSERT INTO triangle_assignments (employee_id, triangle_role, is_primary, flow_metrics, is_active)
            VALUES (${data.employee_id}, ${data.triangle_role}, ${data.is_primary || false},
                    ${data.flow_metrics ? JSON.stringify(data.flow_metrics) : null}::jsonb, true)
            RETURNING *
        `;
    }

    // ==================== RACI ====================

    async createRACIAssignment(data: {
        project_name: string; task_name: string; employee_id: string;
        role_id?: string; raci_role: 'R' | 'A' | 'C' | 'I'; description?: string;
    }) {
        return await prisma.$queryRaw<any[]>`
            INSERT INTO raci_assignments (project_name, task_name, employee_id, role_id, raci_role, description)
            VALUES (${data.project_name}, ${data.task_name}, ${data.employee_id}, 
                    ${data.role_id || null}, ${data.raci_role}, ${data.description || null})
            RETURNING *
        `;
    }

    async getProjectRACI(projectName: string) {
        return await prisma.$queryRawUnsafe<any[]>(`
            SELECT ra.*, u.first_name, u.last_name, rcm.role_name
            FROM raci_assignments ra
            JOIN employees e ON ra.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            LEFT JOIN role_competency_matrix rcm ON ra.role_id = rcm.id
            WHERE ra.project_name = '${projectName}'
            ORDER BY ra.task_name, ra.raci_role
        `);
    }

    // ==================== Ideas ====================

    async submitIdea(data: {
        channel_type: 'strategic' | 'tactical' | 'mentoring'; title: string;
        description?: string; submitted_by: string; target_level?: number;
        priority?: 'low' | 'medium' | 'high' | 'critical';
    }) {
        return await prisma.$queryRaw<any[]>`
            INSERT INTO idea_submissions (channel_type, title, description, submitted_by, target_level, priority, status)
            VALUES (${data.channel_type}, ${data.title}, ${data.description || null},
                    ${data.submitted_by}, ${data.target_level || null}, ${data.priority || 'medium'}, 'new')
            RETURNING *
        `;
    }

    async getIdeas(filters?: { channel_type?: string; status?: string; submitted_by?: string; }) {
        const conditions: string[] = [];
        if (filters?.channel_type) conditions.push(`channel_type = '${filters.channel_type}'`);
        if (filters?.status) conditions.push(`status = '${filters.status}'`);
        if (filters?.submitted_by) conditions.push(`submitted_by = '${filters.submitted_by}'`);
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        return await prisma.$queryRawUnsafe<any[]>(`
            SELECT i.*, u.first_name, u.last_name
            FROM idea_submissions i
            JOIN users u ON i.submitted_by = u.id
            ${whereClause}
            ORDER BY i.created_at DESC
        `);
    }

    // ==================== Hybrid Team ====================

    async logHybridInteraction(data: {
        human_employee_id: string; ai_agent_name: string; interaction_type: string;
        privacy_consent?: boolean; ai_mode_enabled?: boolean; interaction_data?: any;
    }) {
        return await prisma.$queryRaw<any[]>`
            INSERT INTO hybrid_interactions (human_employee_id, ai_agent_name, interaction_type, 
                                             privacy_consent, ai_mode_enabled, interaction_data)
            VALUES (${data.human_employee_id}, ${data.ai_agent_name}, ${data.interaction_type},
                    ${data.privacy_consent || false}, ${data.ai_mode_enabled || false},
                    ${data.interaction_data ? JSON.stringify(data.interaction_data) : null}::jsonb)
            RETURNING *
        `;
    }

    async getHybridTeamStats() {
        return await prisma.$queryRaw<any[]>`
            SELECT ai_agent_name, interaction_type, COUNT(*) as count,
                   MAX(created_at) as last_interaction
            FROM hybrid_interactions
            GROUP BY ai_agent_name, interaction_type
            ORDER BY count DESC
        `;
    }

    // ==================== Locations & Positions ====================

    async getLocations() {
        return await prisma.$queryRaw<any[]>`
            SELECT * FROM locations WHERE is_active = true ORDER BY name
        `;
    }

    async getPositions() {
        return await prisma.$queryRaw<any[]>`
            SELECT * FROM positions WHERE is_active = true ORDER BY name
        `;
    }
}

export default OFSService.getInstance();

