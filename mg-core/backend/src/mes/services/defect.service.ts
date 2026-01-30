import { prisma } from '../../config/prisma';
import { CreateDefectDto } from '../dto/mes.dto';

export class DefectService {

    async registerDefect(data: CreateDefectDto, userId: string) {
        const defect = await prisma.defect.create({
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
        await prisma.auditLog.create({
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

    async resolveDefect(id: string, userId: string) {
        const defect = await prisma.defect.update({
            where: { id },
            data: { resolved: true }
        });

        await prisma.auditLog.create({
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

export const defectService = new DefectService();
