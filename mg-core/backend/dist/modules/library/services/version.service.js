"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let VersionService = class VersionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create new version
     * CANON: Versions are immutable, append-only
     */
    async createVersion(dto, actorId) {
        // Validate semver format
        if (!this.isValidSemver(dto.version)) {
            throw new common_1.BadRequestException(`Invalid semver format: ${dto.version}`);
        }
        // Check if version already exists
        const existing = await this.prisma.libraryDocumentVersion.findUnique({
            where: {
                documentId_version: {
                    documentId: dto.documentId,
                    version: dto.version,
                },
            },
        });
        if (existing) {
            throw new common_1.ForbiddenException(`Version ${dto.version} already exists for document ${dto.documentId}`);
        }
        // Calculate checksum
        const checksum = this.calculateChecksum(dto.file);
        // TODO: Upload file to S3/MinIO
        const storageRef = `library/documents/${dto.documentId}/${crypto.randomUUID()}/file`;
        const version = await this.prisma.libraryDocumentVersion.create({
            data: {
                documentId: dto.documentId,
                version: dto.version,
                storageRef,
                checksum,
                fileSizeBytes: BigInt(dto.file.length),
                mimeType: dto.mimeType,
                createdByEmployeeId: actorId,
            },
        });
        // Emit audit event
        // TODO: Emit 'library.version_created' event
        return version;
    }
    /**
     * List all versions for document
     * CANON: All versions are preserved, read-only
     */
    async listVersions(documentId) {
        const versions = await this.prisma.libraryDocumentVersion.findMany({
            where: { documentId },
            orderBy: { createdAt: 'desc' },
        });
        return versions;
    }
    /**
     * Set active version
     * CANON: Only one active version per document
     */
    async setActiveVersion(documentId, versionId, actorId) {
        // Verify version exists and belongs to document
        const version = await this.prisma.libraryDocumentVersion.findUnique({
            where: { id: versionId },
        });
        if (!version || version.documentId !== documentId) {
            throw new common_1.NotFoundException(`Version ${versionId} not found for document ${documentId}`);
        }
        // Update document's current version
        await this.prisma.libraryDocument.update({
            where: { id: documentId },
            data: { currentVersionId: versionId },
        });
        // Emit audit event
        // TODO: Emit 'library.active_version_changed' event
        return version;
    }
    /**
     * Validate checksum
     * CANON: Ensure file integrity
     */
    async validateChecksum(versionId) {
        const version = await this.prisma.libraryDocumentVersion.findUnique({
            where: { id: versionId },
        });
        if (!version) {
            throw new common_1.NotFoundException(`Version ${versionId} not found`);
        }
        // TODO: Download file from S3/MinIO
        // TODO: Calculate checksum and compare with stored value
        return true; // Placeholder
    }
    /**
     * Calculate SHA256 checksum
     */
    calculateChecksum(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    /**
     * Validate semver format (X.Y.Z)
     */
    isValidSemver(version) {
        const semverRegex = /^\d+\.\d+\.\d+$/;
        return semverRegex.test(version);
    }
};
exports.VersionService = VersionService;
exports.VersionService = VersionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], VersionService);
