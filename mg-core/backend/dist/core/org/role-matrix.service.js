"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleMatrixService = void 0;
const prisma_1 = require("@/config/prisma");
const cache_1 = require("@/config/cache");
/**
 * Role Matrix Service
 * Handles role competency matrix, MDR (Матрица должностной роли) and role assignments
 */
class RoleMatrixService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!RoleMatrixService.instance) {
            RoleMatrixService.instance = new RoleMatrixService();
        }
        return RoleMatrixService.instance;
    }
    /**
     * Get role competency matrix (cached)
     */
    async getRoleMatrix(departmentId) {
        const cacheKey = cache_1.CacheKeys.roleMatrix(departmentId);
        return cache_1.cache.getOrSet(cacheKey, () => this.fetchRoleMatrix(departmentId), cache_1.CacheTTL.MEDIUM);
    }
    async fetchRoleMatrix(departmentId) {
        const whereClause = departmentId ? `WHERE rcm.department_id = '${departmentId}'` : '';
        return await prisma_1.prisma.$queryRawUnsafe(`
            SELECT 
                rcm.*,
                d.name as department_name,
                (SELECT COUNT(*) FROM employee_roles er 
                 WHERE er.role_matrix_id = rcm.id AND er.is_active = true) as current_employees
            FROM role_competency_matrix rcm
            LEFT JOIN departments d ON rcm.department_id = d.id
            ${whereClause}
            ORDER BY d.name, rcm.role_name
        `);
    }
    /**
     * Create role in matrix (with MDR fields)
     */
    async createRole(data) {
        const result = await prisma_1.prisma.roleCompetencyMatrix.create({
            data: {
                role_name: data.role_name,
                department_id: data.department_id,
                required_competencies: data.required_competencies || {},
                responsibilities: data.responsibilities || [],
                permissions: data.permissions || {},
                salary_min: data.salary_min,
                salary_max: data.salary_max,
                purpose: data.purpose,
                expected_results: data.expected_results || [],
                required_knowledge: data.required_knowledge || [],
                required_skills: data.required_skills || [],
                interactions: data.interactions,
                corporate_university_courses: data.corporate_university_courses || [],
                golden_standard_processes: data.golden_standard_processes || [],
                efficiency_metrics: data.efficiency_metrics,
                lean_principles: data.lean_principles || [],
                documents: data.documents || []
            }
        });
        await cache_1.cache.delPattern('roles:*');
        return result;
    }
    /**
     * Update role in matrix
     */
    async updateRole(id, data) {
        const result = await prisma_1.prisma.roleCompetencyMatrix.update({
            where: { id },
            data: {
                role_name: data.role_name,
                department_id: data.department_id,
                required_competencies: data.required_competencies,
                responsibilities: data.responsibilities,
                permissions: data.permissions,
                salary_min: data.salary_min,
                salary_max: data.salary_max,
                purpose: data.purpose,
                expected_results: data.expected_results,
                required_knowledge: data.required_knowledge,
                required_skills: data.required_skills,
                interactions: data.interactions,
                corporate_university_courses: data.corporate_university_courses,
                golden_standard_processes: data.golden_standard_processes,
                efficiency_metrics: data.efficiency_metrics,
                lean_principles: data.lean_principles,
                documents: data.documents
            }
        });
        await cache_1.cache.delPattern('roles:*');
        return result;
    }
    /**
     * Delete role from matrix
     */
    async deleteRole(id) {
        await prisma_1.prisma.$executeRaw `DELETE FROM role_competency_matrix WHERE id = ${id}`;
        await cache_1.cache.delPattern('roles:*');
        return { success: true };
    }
    /**
     * Assign role to employee
     */
    async assignRole(data) {
        // CANON v2.2: Hard Gate - Foundation Check
        const acceptance = await prisma_1.prisma.foundationAcceptance.findUnique({
            where: { person_id: data.employee_id }
        });
        // 2026-01-23: Strict Versioning Support
        // TODO: Load active version from config
        const ACTIVE_VERSION = 'v1.0';
        if (!acceptance || acceptance.decision !== 'ACCEPTED') {
            throw new Error(`FOUNDATION_REQUIRED: Cannot assign role to user ${data.employee_id} without Foundation Acceptance.`);
        }
        if (acceptance.version !== ACTIVE_VERSION) {
            throw new Error(`FOUNDATION_VERSION_MISMATCH: User ${data.employee_id} has outdated Foundation version.`);
        }
        // Deactivate current roles
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_roles 
            SET is_active = false, effective_to = NOW()
            WHERE employee_id = ${data.employee_id} AND is_active = true
        `;
        // Create new role assignment
        const result = await prisma_1.prisma.$queryRaw `
            INSERT INTO employee_roles (
                employee_id, role_matrix_id, effective_from, assigned_by, reason, is_active
            ) VALUES (
                ${data.employee_id}, ${data.role_matrix_id}, ${data.effective_from}, 
                ${data.assigned_by}, ${data.reason || null}, true
            ) RETURNING *
        `;
        return result[0];
    }
    /**
     * Get employee's current role
     */
    async getEmployeeRole(employeeId) {
        const result = await prisma_1.prisma.$queryRaw `
            SELECT er.*, rcm.role_name, rcm.required_competencies, d.name as department_name
            FROM employee_roles er
            JOIN role_competency_matrix rcm ON er.role_matrix_id = rcm.id
            LEFT JOIN departments d ON rcm.department_id = d.id
            WHERE er.employee_id = ${employeeId} AND er.is_active = true
        `;
        return result[0] || null;
    }
    /**
     * Get role by ID with full details
     */
    async getRoleById(id) {
        return await prisma_1.prisma.roleCompetencyMatrix.findUnique({
            where: { id },
            include: {
                department: true
            }
        });
    }
}
exports.RoleMatrixService = RoleMatrixService;
exports.default = RoleMatrixService.getInstance();
