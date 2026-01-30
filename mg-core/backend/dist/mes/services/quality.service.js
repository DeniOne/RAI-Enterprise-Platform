"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qualityService = exports.QualityService = void 0;
const prisma_1 = require("../../config/prisma");
class QualityService {
    async registerCheck(data, userId) {
        const check = await prisma_1.prisma.qualityCheck.create({
            data: {
                production_order_id: data.production_order_id,
                work_order_id: data.work_order_id,
                check_type: data.check_type,
                result: data.result,
                comments: data.comments,
                created_by_id: userId
            }
        });
        // Audit
        await prisma_1.prisma.auditLog.create({
            data: {
                action: 'MES_QUALITY_CHECK',
                entity_type: 'QualityCheck',
                entity_id: check.id,
                user_id: userId,
                details: { ...data }
            }
        });
        return check;
    }
}
exports.QualityService = QualityService;
exports.qualityService = new QualityService();
