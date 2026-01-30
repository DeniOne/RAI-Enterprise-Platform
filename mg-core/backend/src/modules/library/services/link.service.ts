import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LinkType } from '@prisma/client';

@Injectable()
export class LinkService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create link to module entity
     * CANON: Links connect Library documents to other modules
     */
    async createLink(
        documentId: string,
        linkedModule: string,
        linkedEntityId: string,
        linkType: LinkType,
    ) {
        // Verify document exists
        const document = await this.prisma.libraryDocument.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException(`Document ${documentId} not found`);
        }

        const link = await this.prisma.libraryLink.create({
            data: {
                documentId,
                linkedModule,
                linkedEntityId,
                linkType,
            },
        });

        return link;
    }

    /**
     * List links for document
     */
    async listLinks(documentId: string) {
        const links = await this.prisma.libraryLink.findMany({
            where: { documentId },
            orderBy: { createdAt: 'desc' },
        });

        return links;
    }

    /**
     * Validate link integrity
     * CANON: Ensure linked entity still exists
     */
    async validateLinkIntegrity(linkId: string): Promise<boolean> {
        const link = await this.prisma.libraryLink.findUnique({
            where: { id: linkId },
        });

        if (!link) {
            throw new NotFoundException(`Link ${linkId} not found`);
        }

        // TODO: Verify linked entity exists in target module
        // This requires cross-module validation

        return true; // Placeholder
    }
}
