"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractResponseDto = void 0;
class ContractResponseDto {
    id;
    personalFileId;
    contractNumber;
    contractType;
    contractDate;
    startDate;
    endDate;
    status;
    positionId;
    departmentId;
    salary;
    salaryType;
    workSchedule;
    probationDays;
    terminationDate;
    terminationReason;
    createdAt;
    updatedAt;
    // Relations (optional)
    personalFile;
    amendments;
}
exports.ContractResponseDto = ContractResponseDto;
