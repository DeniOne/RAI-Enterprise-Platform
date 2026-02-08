import { PrismaClient, ImpactTargetType } from '@rai/prisma-client';
import { IImpactMapping } from '../interfaces/index';
export declare class ImpactMapper {
    private prisma;
    constructor(prisma: PrismaClient);
    mapRequirement(mapping: IImpactMapping, companyId: string): Promise<void>;
    getRequirementsForTarget(targetType: ImpactTargetType, companyId: string): Promise<({
        norm: {
            document: {
                type: import("@rai/prisma-client").$Enums.DocumentType;
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                version: string;
                externalId: string | null;
                regulatorId: string | null;
                sourceUrl: string | null;
                effectiveDate: Date | null;
                expirationDate: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            documentId: string;
            paragraph: string;
        };
    } & {
        type: import("@rai/prisma-client").$Enums.RequirementType;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        summary: string;
        status: import("@rai/prisma-client").$Enums.ComplianceStatus;
        normId: string;
        targetType: import("@rai/prisma-client").$Enums.ImpactTargetType;
    })[]>;
}
