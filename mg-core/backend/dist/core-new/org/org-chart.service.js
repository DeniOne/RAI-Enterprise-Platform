"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgChartService = void 0;
const prisma_1 = require("@/config/prisma");
const cache_1 = require("@/config/cache");
/**
 * Org Chart Service
 * Handles organizational chart, structure history, and statistics
 */
class OrgChartService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!OrgChartService.instance) {
            OrgChartService.instance = new OrgChartService();
        }
        return OrgChartService.instance;
    }
    /**
     * Get org chart data (cached)
     */
    async getOrgChart(departmentId, depth = 3, includePhotos = false) {
        const cacheKey = cache_1.CacheKeys.orgChart(departmentId);
        return cache_1.cache.getOrSet(cacheKey, () => this.fetchOrgChart(departmentId, depth, includePhotos), cache_1.CacheTTL.MEDIUM);
    }
    async fetchOrgChart(departmentId, depth = 3, includePhotos = false) {
        const rootCondition = departmentId
            ? `WHERE d.id = '${departmentId}'`
            : 'WHERE d.parent_id IS NULL';
        const departments = await prisma_1.prisma.$queryRawUnsafe(`
            SELECT 
                d.*,
                u.first_name as head_first_name,
                u.last_name as head_last_name,
                ${includePhotos ? 'u.avatar as head_photo,' : ''}
                e.position as head_position,
                (SELECT COUNT(*) FROM employees emp WHERE emp.department_id = d.id) as employees_count
            FROM departments d
            LEFT JOIN users u ON d.head_id = u.id
            LEFT JOIN employees e ON e.user_id = u.id
            ${rootCondition} AND d.is_active = true
            ORDER BY d.path
        `);
        if (departments.length === 0) {
            return [];
        }
        return Promise.all(departments.map(dept => this.buildOrgChartTree(dept)));
    }
    /**
     * Build org chart tree recursively
     */
    async buildOrgChartTree(department) {
        const children = await prisma_1.prisma.$queryRawUnsafe(`
            SELECT 
                d.*,
                u.first_name as head_first_name,
                u.last_name as head_last_name,
                e.position as head_position,
                (SELECT COUNT(*) FROM employees emp WHERE emp.department_id = d.id) as employees_count
            FROM departments d
            LEFT JOIN users u ON d.head_id = u.id
            LEFT JOIN employees e ON e.user_id = u.id
            WHERE d.parent_id = '${department.id}' AND d.is_active = true
            ORDER BY d.name
        `);
        const node = {
            id: department.id,
            name: department.name,
            type: 'department',
            employees_count: department.employees_count
        };
        if (department.head_id) {
            node.head = {
                id: department.head_id,
                name: `${department.head_first_name} ${department.head_last_name}`,
                position: department.head_position
            };
        }
        if (children.length > 0) {
            node.children = await Promise.all(children.map(child => this.buildOrgChartTree(child)));
        }
        return node;
    }
    /**
     * Get structure change history
     */
    async getStructureHistory(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const offset = (page - 1) * limit;
        const whereConditions = [];
        if (filters.entity_type)
            whereConditions.push(`entity_type = '${filters.entity_type}'`);
        if (filters.entity_id)
            whereConditions.push(`entity_id = '${filters.entity_id}'`);
        if (filters.action)
            whereConditions.push(`action = '${filters.action}'`);
        if (filters.date_from)
            whereConditions.push(`created_at >= '${filters.date_from.toISOString()}'`);
        if (filters.date_to)
            whereConditions.push(`created_at <= '${filters.date_to.toISOString()}'`);
        if (filters.changed_by)
            whereConditions.push(`changed_by = '${filters.changed_by}'`);
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const history = await prisma_1.prisma.$queryRawUnsafe(`
            SELECT osh.*, u.first_name as changed_by_first_name, u.last_name as changed_by_last_name
            FROM org_structure_history osh
            LEFT JOIN users u ON osh.changed_by = u.id
            ${whereClause}
            ORDER BY osh.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
        const totalResult = await prisma_1.prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as total FROM org_structure_history ${whereClause}
        `);
        return {
            data: history,
            pagination: {
                page,
                limit,
                total: Number(totalResult[0]?.total || 0),
                totalPages: Math.ceil(Number(totalResult[0]?.total || 0) / limit)
            }
        };
    }
    /**
     * Log structure change
     */
    async logStructureChange(data) {
        await prisma_1.prisma.$executeRaw `
            INSERT INTO org_structure_history (
                entity_type, entity_id, action, old_data, new_data,
                reason, changed_by, ip_address, user_agent
            ) VALUES (
                ${data.entity_type},
                ${data.entity_id},
                ${data.action},
                ${data.old_data ? JSON.stringify(data.old_data) : null}::jsonb,
                ${data.new_data ? JSON.stringify(data.new_data) : null}::jsonb,
                ${data.reason || null},
                ${data.changed_by || null},
                ${data.ip_address || null}::inet,
                ${data.user_agent || null}
            )
        `;
    }
    /**
     * Get structure statistics
     */
    async getStructureStats() {
        const departmentStats = await prisma_1.prisma.$queryRaw `
            SELECT 
                COUNT(*) as total_departments,
                COUNT(CASE WHEN is_active THEN 1 END) as active_departments,
                MAX(level) as max_depth,
                AVG((SELECT COUNT(*) FROM employees WHERE department_id = d.id)) as avg_employees_per_dept
            FROM departments d
        `;
        const employeeStats = await prisma_1.prisma.$queryRaw `
            SELECT COUNT(*) as total_employees
            FROM employees e
            INNER JOIN users u ON e.user_id = u.id
            WHERE u.status = 'ACTIVE'
        `;
        const deptsByLevel = await prisma_1.prisma.$queryRaw `
            SELECT level, COUNT(*) as count
            FROM departments WHERE is_active = true
            GROUP BY level ORDER BY level
        `;
        const headcountByDept = await prisma_1.prisma.$queryRaw `
            SELECT d.name as department, COUNT(e.id) as count
            FROM departments d
            LEFT JOIN employees e ON e.department_id = d.id
            WHERE d.is_active = true
            GROUP BY d.id, d.name ORDER BY count DESC LIMIT 10
        `;
        return {
            total_departments: Number(departmentStats[0]?.total_departments || 0),
            active_departments: Number(departmentStats[0]?.active_departments || 0),
            total_employees: Number(employeeStats[0]?.total_employees || 0),
            average_department_size: Number(departmentStats[0]?.avg_employees_per_dept || 0).toFixed(1),
            hierarchy_depth: Number(departmentStats[0]?.max_depth || 0),
            departments_by_level: deptsByLevel,
            headcount_by_department: headcountByDept
        };
    }
}
exports.OrgChartService = OrgChartService;
exports.default = OrgChartService.getInstance();
