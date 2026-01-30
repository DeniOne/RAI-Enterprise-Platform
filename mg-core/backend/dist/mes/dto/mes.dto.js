"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDefectDto = exports.CreateQualityCheckDto = exports.CreateWorkOrderDto = exports.UpdateProductionOrderStatusDto = exports.CreateProductionOrderDto = void 0;
class CreateProductionOrderDto {
    source_type; // 'MANUAL' | 'PSEE'
    source_ref_id;
    product_type;
    quantity;
}
exports.CreateProductionOrderDto = CreateProductionOrderDto;
class UpdateProductionOrderStatusDto {
    status;
}
exports.UpdateProductionOrderStatusDto = UpdateProductionOrderStatusDto;
class CreateWorkOrderDto {
    production_order_id;
    operation_type;
    sequence_order;
    assigned_to_id;
}
exports.CreateWorkOrderDto = CreateWorkOrderDto;
class CreateQualityCheckDto {
    production_order_id;
    work_order_id;
    check_type;
    result;
    comments;
}
exports.CreateQualityCheckDto = CreateQualityCheckDto;
class CreateDefectDto {
    production_order_id;
    quality_check_id;
    defect_type;
    severity;
    root_cause;
    requires_rework;
}
exports.CreateDefectDto = CreateDefectDto;
