"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderResponseDto = void 0;
class OrderResponseDto {
    id;
    personalFileId;
    orderType;
    orderNumber;
    title;
    content;
    basis;
    orderDate;
    effectiveDate;
    status;
    createdById;
    signedById;
    signedAt;
    createdAt;
    updatedAt;
    // Relations (optional)
    personalFile;
}
exports.OrderResponseDto = OrderResponseDto;
