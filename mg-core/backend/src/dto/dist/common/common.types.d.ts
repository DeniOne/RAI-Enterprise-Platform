export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;
export type Email = string;
export type EmotionalTone = number;
export declare class MetaInfoDto {
    timestamp: ISODateTime;
    requestId: UUID;
    version: string;
}
export declare class ApiResponse<T = any> {
    success: boolean;
    data: T;
    meta?: MetaInfoDto;
}
export declare class ErrorDetailsDto {
    [key: string]: any;
}
export declare class ErrorObjectDto {
    code: string;
    message: string;
    details?: ErrorDetailsDto;
}
export declare class ApiErrorDto {
    success: false;
    error: ErrorObjectDto;
}
export declare class PaginationParamsDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class PaginationMetaDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class PaginatedResponse<T = any> {
    items: T[];
    pagination: PaginationMetaDto;
}
//# sourceMappingURL=common.types.d.ts.map