import { UUID, ISODateTime } from '../common/common.types';
export declare class NotificationResponseDto {
    id: UUID;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    createdAt: ISODateTime;
}
export declare class CabinetDashboardDto {
    userId: UUID;
    tasksPending: number;
    mcBalance: number;
    nextSalaryDays: number;
    recentNotifications: NotificationResponseDto[];
}
//# sourceMappingURL=cabinet.dto.d.ts.map