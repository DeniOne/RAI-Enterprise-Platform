
import { ProductionOrderStatus, WorkOrderStatus, QualityCheckType, QualityResult, DefectSeverity } from '@prisma/client';

export class CreateProductionOrderDto {
    source_type: string; // 'MANUAL' | 'PSEE'
    source_ref_id?: string;
    product_type: string;
    quantity: number;
}

export class UpdateProductionOrderStatusDto {
    status: ProductionOrderStatus;
}

export class CreateWorkOrderDto {
    production_order_id: string;
    operation_type: string;
    sequence_order: number;
    assigned_to_id?: string;
}

export class CreateQualityCheckDto {
    production_order_id: string;
    work_order_id?: string;
    check_type: QualityCheckType;
    result: QualityResult;
    comments?: string;
}

export class CreateDefectDto {
    production_order_id: string;
    quality_check_id?: string;
    defect_type: string;
    severity: DefectSeverity;
    root_cause?: string;
    requires_rework: boolean;
}
