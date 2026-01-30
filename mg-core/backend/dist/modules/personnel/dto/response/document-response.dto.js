"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentResponseDto = void 0;
class DocumentResponseDto {
    id;
    personalFileId;
    documentType;
    title;
    description;
    fileId;
    fileName;
    fileSize;
    mimeType;
    issueDate;
    expiryDate;
    issuer;
    documentNumber;
    uploadedById;
    createdAt;
    updatedAt;
    // Relations (optional)
    personalFile;
}
exports.DocumentResponseDto = DocumentResponseDto;
