import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as crypto from 'crypto';

interface CreateVersionDto {
    documentId: string;
    version: string; // semver (X.Y.Z)
    file: Buffer;
    mimeType: string;
}

@Injectable()
export class VersionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create new version
     * CANON: Versions are immutable, append-only
     */
    async createVersion(dto: CreateVersionDto, actorId: string) {
        // Validate semver format
        if (!this.isValidSemver(dto.version)) {
            throw new BadRequestException(`Invalid semver format: ${dto.version}`);
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
            throw new ForbiddenException(`Version ${dto.version} already exists for document ${dto.documentId}`);
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
    async listVersions(documentId: string) {
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
    async setActiveVersion(documentId: string, versionId: string, actorId: string) {
        // Verify version exists and belongs to document
        const version = await this.prisma.libraryDocumentVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.documentId !== documentId) {
            throw new NotFoundException(`Version ${versionId} not found for document ${documentId}`);
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
    async validateChecksum(versionId: string): Promise<boolean> {
        const version = await this.prisma.libraryDocumentVersion.findUnique({
            where: { id: versionId },
        });

        if (!version) {
            throw new NotFoundException(`Version ${versionId} not found`);
        }

        // TODO: Download file from S3/MinIO
        // TODO: Calculate checksum and compare with stored value

        return true; // Placeholder
    }

    /**
     * Calculate SHA256 checksum
     */
    private calculateChecksum(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Validate semver format (X.Y.Z)
     */
    private isValidSemver(version: string): boolean {
        const semverRegex = /^\d+\.\d+\.\d+$/;
        return semverRegex.test(version);
    }
}
