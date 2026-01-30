"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defectService = exports.DefectService = void 0;
const prisma_1 = require("../../config/prisma");
class DefectService {
    async registerDefect(data, userId) {
        const defect = await prisma_1.prisma.defect.create({
            data: {
                production_order_id: data.production_order_id,
                quality_check_id: data.quality_check_id,
                defect_type: data.defect_type,
                severity: data.severity,
                root_cause: data.root_cause,
                requires_rework: data.requires_rework,
                registered_by_id: userId,
                resolved: false
            }
        });
        // Audit
        await prisma_1.prisma.auditLog.create({
            data: {
                action: 'MES_DEFECT_REGISTER',
                entity_type: 'Defect',
                entity_id: defect.id,
                user_id: userId,
                details: { ...data }
            }
        });
        return defect;
    }
    async resolveDefect(id, userId) {
        const defect = await prisma_1.prisma.defect.update({
            where: { id },
            data: { resolved: true }
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                action: 'MES_DEFECT_RESOLVE',
                entity_type: 'Defect',
                entity_id: id,
                user_id: userId,
                details: { resolved: true }
            }
        });
        return defect;
    }
}
exports.DefectService = DefectService;
exports.defectService = new DefectService();
