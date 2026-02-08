"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpactMapper = void 0;
class ImpactMapper {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async mapRequirement(mapping, companyId) {
        await this.prisma.legalRequirement.update({
            where: {
                id: mapping.requirementId,
                companyId
            },
            data: {
                targetType: mapping.targetType
            }
        });
    }
    async getRequirementsForTarget(targetType, companyId) {
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
exports.ImpactMapper = ImpactMapper;
//# sourceMappingURL=ImpactMapper.js.map