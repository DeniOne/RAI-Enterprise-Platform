import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import {
    MemoryAdapter,
    MemoryContext,
    MemoryInteraction,
    MemoryRetrieveOptions,
} from "./memory-adapter.interface";
import {
    EpisodicRetrievalResponse,
    EpisodicRetrievalService,
} from "./episodic-retrieval.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DefaultMemoryAdapter implements MemoryAdapter {
    private readonly logger = new Logger(DefaultMemoryAdapter.name);

    constructor(
        private readonly episodicRetrieval: EpisodicRetrievalService,
        private readonly prisma: PrismaService,
    ) { }

    async appendInteraction(
        ctx: MemoryContext,
        interaction: MemoryInteraction,
    ): Promise<void> {
        const { companyId, traceId, sessionId, userId, metadata } = ctx;

        try {
            const source = (metadata?.source as string) || "rai-chat";
            const content = [
                `user: ${interaction.userMessage}`,
                `assistant: ${interaction.agentResponse}`,
            ].join("\n\n");

            const safeMetadata = this.sanitizeJsonValue(metadata ?? {}, new WeakSet());
            const safeToolCalls = this.sanitizeJsonValue(
                interaction.toolCalls ?? [],
                new WeakSet(),
            );

            const attrs: Prisma.InputJsonValue = {
                schemaKey: "memory.interaction.v1",
                provenance: "system",
                confidence: 1,
                traceId,
                source,
                toolCalls: safeToolCalls as Prisma.InputJsonValue,
                userMessage: interaction.userMessage,
                agentResponse: interaction.agentResponse.slice(0, 500),
                metadata: safeMetadata as Prisma.InputJsonValue,
            };

            await this.prisma.$transaction(async (tx) => {
                const created = await tx.memoryInteraction.create({
                    data: {
                        companyId,
                        sessionId,
                        userId,
                        content,
                        attrs,
                    },
                });

                const embedding = interaction.embedding;
                if (embedding && embedding.length > 0) {
                    const isValidEmbedding = Array.isArray(embedding) && embedding.every(n => typeof n === "number" && Number.isFinite(n));
                    if (!isValidEmbedding) {
                        throw new Error("Invalid embedding vector: contains non-finite numbers");
                    }
                    const vectorStr = `[${embedding.join(',')}]`;
                    await tx.$executeRawUnsafe(
                        `UPDATE memory_interactions SET embedding = $1::vector WHERE id = $2`,
                        vectorStr,
                        created.id
                    );
                }

                await tx.memoryEpisode.create({
                    data: {
                        companyId,
                        userId,
                        content: interaction.userMessage,
                        attrs: {
                            schemaKey: "memory.episode.v1",
                            provenance: source,
                            confidence: 0.7,
                            traceId,
                            source,
                            sessionId: sessionId ?? null,
                            summary: interaction.userMessage.slice(0, 240),
                            route:
                                metadata && typeof metadata.route === "string"
                                    ? metadata.route
                                    : null,
                        },
                    },
                });

                this.logger.debug(
                    `memory_interaction_appended companyId=${companyId} traceId=${traceId} id=${created.id}`,
                );
            });
        } catch (err) {
            this.logger.warn(
                `memory_interaction_append_error companyId=${companyId} traceId=${traceId} message=${String(
                    err?.message ?? err,
                )}`,
            );
        }
    }

    async retrieve(
        ctx: MemoryContext,
        embedding: number[],
        options: MemoryRetrieveOptions,
    ): Promise<EpisodicRetrievalResponse> {
        const { companyId, traceId } = ctx;

        try {
            return await this.episodicRetrieval.retrieve({
                companyId,
                embedding,
                traceId,
                limit: options.limit,
                minSimilarity: options.minSimilarity,
            });
        } catch (err) {
            this.logger.warn(
                `memory_retrieve_error companyId=${companyId} traceId=${traceId} message=${String(
                    err?.message ?? err,
                )}`,
            );
            return {
                traceId,
                total: 0,
                positive: 0,
                negative: 0,
                unknown: 0,
                items: [],
            };
        }
    }

    async getProfile(ctx: MemoryContext): Promise<Record<string, unknown>> {
        if (!ctx.userId) {
            return {};
        }

        const profile = await this.prisma.memoryProfile.findUnique({
            where: {
                companyId_userId: {
                    companyId: ctx.companyId,
                    userId: ctx.userId,
                },
            },
        });

        if (!profile || !profile.attrs || typeof profile.attrs !== "object" || Array.isArray(profile.attrs)) {
            return {};
        }

        return profile.attrs as Record<string, unknown>;
    }

    async updateProfile(
        ctx: MemoryContext,
        patch: Record<string, unknown>,
    ): Promise<void> {
        if (!ctx.userId) {
            return;
        }

        const existing = await this.prisma.memoryProfile.findUnique({
            where: {
                companyId_userId: {
                    companyId: ctx.companyId,
                    userId: ctx.userId,
                },
            },
        });

        const existingAttrs =
            existing && existing.attrs && typeof existing.attrs === "object" && !Array.isArray(existing.attrs)
                ? (existing.attrs as Record<string, unknown>)
                : {};

        const sanitizedPatch = this.sanitizeJsonValue(patch, new WeakSet());
        const patchObject =
            sanitizedPatch && typeof sanitizedPatch === "object" && !Array.isArray(sanitizedPatch)
                ? (sanitizedPatch as Record<string, Prisma.InputJsonValue | null>)
                : {};

        const attrs: Prisma.InputJsonValue = {
            schemaKey: "memory.profile.v1",
            provenance: "system",
            confidence: 0.8,
            updatedFromTraceId: ctx.traceId,
            ...existingAttrs,
            ...patchObject,
        };

        const content = JSON.stringify({
            route:
                patchObject && typeof patchObject.lastRoute === "string"
                    ? patchObject.lastRoute
                    : existingAttrs.lastRoute ?? null,
            preferences:
                patchObject && patchObject.preferences && typeof patchObject.preferences === "object"
                    ? patchObject.preferences
                    : existingAttrs.preferences ?? null,
        });

        await this.prisma.memoryProfile.upsert({
            where: {
                companyId_userId: {
                    companyId: ctx.companyId,
                    userId: ctx.userId,
                },
            },
            create: {
                companyId: ctx.companyId,
                userId: ctx.userId,
                content,
                attrs,
            },
            update: {
                content,
                attrs,
            },
        });
    }

    private sanitizeJsonValue(
        value: unknown,
        seen: WeakSet<object>,
    ): Prisma.InputJsonValue | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (
            typeof value === "string" ||
            typeof value === "boolean" ||
            (typeof value === "number" && Number.isFinite(value))
        ) {
            return value;
        }

        if (typeof value === "number") {
            return `[NonFiniteNumber:${String(value)}]`;
        }

        if (typeof value === "bigint") {
            return value.toString();
        }

        if (typeof value === "function" || typeof value === "symbol") {
            return null;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeJsonValue(item, seen));
        }

        if (typeof value === "object") {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);

            if (value instanceof Map) {
                const mapped: Record<string, Prisma.InputJsonValue | null> = {};
                for (const [key, entryValue] of value.entries()) {
                    mapped[String(key)] = this.sanitizeJsonValue(entryValue, seen);
                }
                seen.delete(value);
                return mapped;
            }

            if (value instanceof Set) {
                const result = Array.from(value).map((item) =>
                    this.sanitizeJsonValue(item, seen),
                );
                seen.delete(value);
                return result;
            }

            const sanitized: Record<string, Prisma.InputJsonValue | null> = {};
            for (const [key, entryValue] of Object.entries(value)) {
                sanitized[key] = this.sanitizeJsonValue(entryValue, seen);
            }
            seen.delete(value);
            return sanitized;
        }

        return `[Unsupported:${typeof value}]`;
    }
}
