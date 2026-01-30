import { prisma } from '../../config/prisma';
import { QualityResult } from '@prisma/client';
import { CreateQualityCheckDto } from '../dto/mes.dto';

export class QualityService {

    async registerCheck(data: CreateQualityCheckDto, userId: string) {
        const check = await prisma.qualityCheck.create({
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
        await prisma.auditLog.create({
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

export const qualityService = new QualityService();
