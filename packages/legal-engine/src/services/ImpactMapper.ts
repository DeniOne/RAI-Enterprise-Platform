import { PrismaClient, ImpactTargetType } from '@rai/prisma-client';
import { IImpactMapping } from '../interfaces/index';

export class ImpactMapper {
    constructor(private prisma: PrismaClient) { }

    /**
     * Связывает правовое требование с конкретным бизнес-объектом.
     */
    async mapRequirement(mapping: IImpactMapping, companyId: string): Promise<void> {
        // В текущей схеме Prisma ImpactMapping реализован через targetType в LegalRequirement.
        // Если нам нужна детальная связь 1:N с конкретными ID, 
        // мы можем использовать метаданные или расширить схему позже.

        // Пока реализуем базовое обновление контекста требования.
        await this.prisma.legalRequirement.update({
            where: {
                id: mapping.requirementId,
                companyId
            },
            data: {
                targetType: mapping.targetType
            }
        });

        // В будущем здесь будет логика регистрации в графе зависимостей.
    }

    /**
     * Получение всех требований, затрагивающих конкретный домен.
     */
    async getRequirementsForTarget(targetType: ImpactTargetType, companyId: string) {
        return this.prisma.legalRequirement.findMany({
            where: {
                targetType,
                companyId
            },
            include: {
                norm: {
                    include: {
                        document: true
                    }
                }
            }
        });
    }
}
