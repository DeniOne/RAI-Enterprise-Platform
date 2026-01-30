import { PersonnelOrderType, OrderStatus } from '@prisma/client';

export class OrderResponseDto {
    id: string;
    personalFileId: string;
    orderType: PersonnelOrderType;
    orderNumber: string;
    title: string;
    content: string;
    basis?: string;
    orderDate: Date;
    effectiveDate: Date;
    status: OrderStatus;
    createdById: string;
    signedById?: string;
    signedAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Relations (optional)
    personalFile?: any;
}
