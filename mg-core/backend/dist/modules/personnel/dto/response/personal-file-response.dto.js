"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalFileResponseDto = void 0;
class PersonalFileResponseDto {
    id;
    employeeId;
    fileNumber;
    hrStatus;
    openedAt;
    closedAt;
    archiveId;
    libraryDocumentId;
    createdAt;
    updatedAt;
    // Relations (optional)
    employee;
    documents;
    orders;
    contracts;
}
exports.PersonalFileResponseDto = PersonalFileResponseDto;
