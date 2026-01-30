import { Department } from '@prisma/client';
import { DepartmentResponseDto, DepartmentKPIResponseDto } from '../dto/departments/department.dto';
import { KPIPeriod } from '../dto/common/common.enums';
import { prisma } from '../config/prisma';
import { cache, CacheKeys, CacheTTL } from '../config/cache';

/**
 * Department Service
 * Handles all department-related operations: CRUD, hierarchy, tree building
 */
export class DepartmentService {
    private static instance: DepartmentService;

    private constructor() { }

    public static getInstance(): DepartmentService {
        if (!DepartmentService.instance) {
            DepartmentService.instance = new DepartmentService();
        }
        return DepartmentService.instance;
    }

    // ==================== Basic CRUD ====================

    async getAllDepartments(): Promise<DepartmentResponseDto[]> {
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        return departments.map(this.mapToResponse);
    }

    async getDepartmentById(id: string): Promise<DepartmentResponseDto | null> {
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        return department ? this.mapToResponse(department) : null;
    }

    async getDepartmentKPI(departmentId: string, period: KPIPeriod): Promise<DepartmentKPIResponseDto> {
        return {
            departmentId,
            period,
            metrics: {
                revenue: 0,
                tasksCompleted: 0,
                averageEmotionalTone: 0,
                employeeEngagement: 0
            }
        };
    }

    // ==================== Extended Methods (from OFS) ====================

    /**
     * Get all departments with hierarchy (cached)
     */
    async getDepartments(includeInactive: boolean = false, format: 'tree' | 'flat' = 'flat') {
        const cacheKey = format === 'tree' ? CacheKeys.departmentTree() : CacheKeys.departments();

        if (includeInactive) {
            return this.fetchDepartments(includeInactive, format);
        }

        return cache.getOrSet(
            cacheKey,
            () => this.fetchDepartments(includeInactive, format),
            CacheTTL.MEDIUM
        );
    }

    /**
     * Fetch departments from database
     */
    private async fetchDepartments(includeInactive: boolean, format: 'tree' | 'flat') {
        const whereClause = includeInactive ? '' : 'WHERE d.is_active = true';

        const departments = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                d.*,
                u.first_name as head_first_name,
                u.last_name as head_last_name,
                (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id) as employees_count
            FROM departments d
            LEFT JOIN users u ON d.head_id = u.id
            ${whereClause}
            ORDER BY d.level, d.name
        `);

        if (format === 'tree') {
            return this.buildDepartmentTree(departments);
        }

        return departments;
    }

    /**
     * Build department tree from flat list
     */
    buildDepartmentTree(departments: any[]): any[] {
        const map = new Map();
        const roots: any[] = [];

        departments.forEach(dept => {
            map.set(dept.id, { ...dept, children: [] });
        });

        departments.forEach(dept => {
            const node = map.get(dept.id);
            if (dept.parent_id) {
                const parent = map.get(dept.parent_id);
                if (parent) {
                    parent.children.push(node);
                }
            } else {
                roots.push(node);
            }
        });

        return roots;
    }

    /**
     * Create new department (extended)
     */
    async createDepartment(data: {
        name: string;
        code?: string;
        description?: string;
        parent_id?: string;
        head_id?: string;
        functions?: string[];
        kpis?: any;
        annual_goals?: string;
        budget_annual?: number;
        hierarchy_level?: number;
        department_type?: string;
    }) {
        const code = data.code || this.generateDepartmentCode(data.name);

        const result = await prisma.department.create({
            data: {
                name: data.name,
                code: code,
                description: data.description,
                parent_id: data.parent_id,
                head_id: data.head_id,
                functions: data.functions || [],
                kpis: data.kpis || {},
                annual_goals: data.annual_goals,
                budget_annual: data.budget_annual,
                hierarchy_level: data.hierarchy_level || 4,
                department_type: data.department_type || 'operational',
                is_active: true,
                level: 0,
            },
        });

        await this.invalidateCache();
        return result;
    }

    /**
     * Generate department code from name
     */
    generateDepartmentCode(name: string): string {
        const translitMap: { [key: string]: string } = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };

        let code = name.toLowerCase()
            .split('')
            .map(char => translitMap[char] || char)
            .join('')
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 50);

        const timestamp = Date.now().toString(36).slice(-4);
        return `${code}_${timestamp}`.toUpperCase();
    }

    /**
     * Update department
     */
    async updateDepartment(id: string, data: {
        name?: string;
        code?: string;
        description?: string;
        parent_id?: string;
        head_id?: string;
        functions?: string[];
        kpis?: any;
        annual_goals?: string;
        budget_annual?: number;
        is_active?: boolean;
    }) {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.code !== undefined) { updates.push(`code = $${paramIndex++}`); values.push(data.code); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.parent_id !== undefined) { updates.push(`parent_id = $${paramIndex++}`); values.push(data.parent_id); }
        if (data.head_id !== undefined) { updates.push(`head_id = $${paramIndex++}`); values.push(data.head_id); }
        if (data.functions !== undefined) { updates.push(`functions = $${paramIndex++}::text[]`); values.push(data.functions); }
        if (data.kpis !== undefined) { updates.push(`kpis = $${paramIndex++}::jsonb`); values.push(JSON.stringify(data.kpis)); }
        if (data.annual_goals !== undefined) { updates.push(`annual_goals = $${paramIndex++}`); values.push(data.annual_goals); }
        if (data.budget_annual !== undefined) { updates.push(`budget_annual = $${paramIndex++}`); values.push(data.budget_annual); }
        if (data.is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(data.is_active); }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const query = `UPDATE departments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await prisma.$queryRawUnsafe<any[]>(query, ...values);

        await this.invalidateCache();
        return result[0];
    }

    /**
     * Delete/deactivate department
     */
    async deleteDepartment(id: string, softDelete: boolean = true) {
        if (softDelete) {
            return this.updateDepartment(id, { is_active: false });
        } else {
            await prisma.$executeRaw`DELETE FROM departments WHERE id = ${id}`;
            await this.invalidateCache();
            return { success: true };
        }
    }

    /**
     * Get 7-level organizational hierarchy
     */
    async getHierarchyLevels() {
        return await prisma.$queryRaw<any[]>`
            SELECT * FROM org_hierarchy_levels ORDER BY level_number
        `;
    }

    /**
     * Get departments grouped by hierarchy level
     */
    async getDepartmentsByHierarchy() {
        const levels = await this.getHierarchyLevels();
        const departments = await prisma.$queryRaw<any[]>`
            SELECT d.*, hl.level_name, hl.level_name_ru, COUNT(e.id) as employee_count
            FROM departments d
            LEFT JOIN org_hierarchy_levels hl ON d.hierarchy_level = hl.level_number
            LEFT JOIN employees e ON e.department_id = d.id
            WHERE d.is_active = true
            GROUP BY d.id, hl.level_name, hl.level_name_ru
            ORDER BY d.hierarchy_level, d.name
        `;

        return levels.map(level => ({
            level_number: level.level_number,
            level_name: level.level_name,
            level_name_ru: level.level_name_ru,
            description: level.description,
            departments: departments.filter(d => d.hierarchy_level === level.level_number)
        }));
    }

    // ==================== Private Helpers ====================

    private async invalidateCache(): Promise<void> {
        await cache.del(CacheKeys.departments());
        await cache.del(CacheKeys.departmentTree());
    }

    private mapToResponse(dept: Department & { _count?: { employees: number } }): DepartmentResponseDto {
        return {
            id: dept.id,
            name: dept.name,
            code: dept.code,
            description: dept.description || undefined,
            headId: dept.head_id || undefined,
            employeeCount: dept._count?.employees || 0,
            createdAt: dept.created_at.toISOString(),
            updatedAt: dept.updated_at.toISOString()
        };
    }
}

export default DepartmentService.getInstance();
