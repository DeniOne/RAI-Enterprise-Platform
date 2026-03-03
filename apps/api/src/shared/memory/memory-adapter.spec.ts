import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { DefaultMemoryAdapter } from "./default-memory-adapter.service";
import { EpisodicRetrievalService } from "./episodic-retrieval.service";
import { PrismaService } from "../prisma/prisma.service";

describe("DefaultMemoryAdapter", () => {
    let adapter: DefaultMemoryAdapter;
    let warnSpy: jest.SpyInstance;
    const episodicRetrievalMock = {
        retrieve: jest.fn().mockResolvedValue({ items: [] }),
    };
    const prismaMock = {
        memoryInteraction: {
            create: jest.fn().mockResolvedValue({ id: "mi-1" }),
        },
        memoryEpisode: {
            create: jest.fn().mockResolvedValue({ id: "me-1" }),
        },
        memoryProfile: {
            findUnique: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({ id: "mp-1" }),
        },
        $executeRawUnsafe: jest.fn().mockResolvedValue([]),
        $transaction: jest.fn(async (cb) => cb(prismaMock)),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DefaultMemoryAdapter,
                { provide: EpisodicRetrievalService, useValue: episodicRetrievalMock },
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        adapter = module.get<DefaultMemoryAdapter>(DefaultMemoryAdapter);
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("appendInteraction writes to memoryInteraction with canonical carcass and flex fields", async () => {
        const ctx = {
            companyId: "company-1",
            traceId: "trace-1",
            sessionId: "session-1",
            userId: "user-1",
            metadata: {
                source: "rai-chat",
                channel: "web",
            },
        };
        const interaction = {
            userMessage: "Hello",
            agentResponse: "Hi there",
            embedding: [0.1, 0.2],
            toolCalls: [{ name: "search", status: "ok" }],
        };

        await adapter.appendInteraction(ctx, interaction);

        expect(prismaMock.memoryInteraction.create).toHaveBeenCalledWith({
            data: {
                companyId: "company-1",
                sessionId: "session-1",
                userId: "user-1",
                content: "user: Hello\n\nassistant: Hi there",
                attrs: {
                    schemaKey: "memory.interaction.v1",
                    provenance: "system",
                    confidence: 1,
                    traceId: "trace-1",
                    source: "rai-chat",
                    toolCalls: [{ name: "search", status: "ok" }],
                    userMessage: "Hello",
                    agentResponse: "Hi there",
                    metadata: {
                        source: "rai-chat",
                        channel: "web",
                    },
                },
            },
        });

        expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE memory_interactions SET embedding = $1::vector WHERE id = $2"),
            "[0.1,0.2]",
            "mi-1",
        );
        expect(prismaMock.memoryEpisode.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                companyId: "company-1",
                userId: "user-1",
                content: "Hello",
            }),
        });
    });

    it("appendInteraction sanitizes nested invalid JSON fields without dropping the whole payload", async () => {
        const circular: Record<string, unknown> = {
            ok: "keep-me",
            nested: {
                valid: 42,
            },
        };
        circular.self = circular;

        const ctx = {
            companyId: "company-2",
            traceId: "trace-2",
            metadata: {
                valid: "yes",
                invalidMap: new Map([["k", "v"]]),
                invalidFunc: () => { },
                invalidUndefined: undefined,
                circular,
            },
        };
        const interaction = {
            userMessage: "Hello",
            agentResponse: "Hi there",
            embedding: [0.3, 0.4],
            toolCalls: [
                { fn: () => { }, valid: true, nested: { when: new Date("2026-03-03T00:00:00.000Z") } },
                undefined,
                { status: "ok", circular },
            ],
        };

        await adapter.appendInteraction(ctx, interaction);

        const createCall = prismaMock.memoryInteraction.create.mock.calls[0][0];

        expect(createCall.data.attrs.metadata.valid).toBe("yes");
        expect(createCall.data.attrs.metadata.invalidMap).toEqual({ k: "v" });
        expect(createCall.data.attrs.metadata.invalidFunc).toBeNull();
        expect(createCall.data.attrs.metadata.invalidUndefined).toBeNull();
        expect(createCall.data.attrs.metadata.circular).toEqual({
            ok: "keep-me",
            nested: { valid: 42 },
            self: "[Circular]",
        });

        expect(createCall.data.attrs.toolCalls).toEqual([
            { valid: true, nested: { when: "2026-03-03T00:00:00.000Z" }, fn: null },
            null,
            {
                status: "ok",
                circular: {
                    ok: "keep-me",
                    nested: { valid: 42 },
                    self: "[Circular]",
                },
            },
        ]);

        expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE memory_interactions SET embedding = $1::vector WHERE id = $2"),
            "[0.3,0.4]",
            "mi-1",
        );
    });

    it("appendInteraction aborts transaction and logs warn for invalid embedding", async () => {
        const ctx = {
            companyId: "company-3",
            traceId: "trace-3",
            sessionId: "session-3",
        };
        const interaction = {
            userMessage: "Hello",
            agentResponse: "Hi there",
            embedding: [0.1, Number.NaN],
        };

        await adapter.appendInteraction(ctx, interaction);

        expect(prismaMock.memoryInteraction.create).toHaveBeenCalled();
        expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("Invalid embedding vector"),
        );
    });

    it("appendInteraction logs warn if raw embedding update fails", async () => {
        prismaMock.$executeRawUnsafe.mockRejectedValueOnce(new Error("vector update failed"));

        const ctx = {
            companyId: "company-4",
            traceId: "trace-4",
            sessionId: "session-4",
        };
        const interaction = {
            userMessage: "Hello",
            agentResponse: "Hi there",
            embedding: [0.9, 0.8],
        };

        await adapter.appendInteraction(ctx, interaction);

        expect(prismaMock.memoryInteraction.create).toHaveBeenCalled();
        expect(prismaMock.$executeRawUnsafe).toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("vector update failed"),
        );
    });

    it("getProfile returns stored attrs from MemoryProfile", async () => {
        prismaMock.memoryProfile.findUnique.mockResolvedValueOnce({
            id: "mp-1",
            attrs: {
                schemaKey: "memory.profile.v1",
                lastRoute: "/consulting/dashboard",
                lastMessagePreview: "hello",
            },
        });

        const result = await adapter.getProfile({
            companyId: "company-1",
            traceId: "trace-1",
            userId: "user-1",
        });

        expect(prismaMock.memoryProfile.findUnique).toHaveBeenCalledWith({
            where: {
                companyId_userId: {
                    companyId: "company-1",
                    userId: "user-1",
                },
            },
        });
        expect(result).toEqual(
            expect.objectContaining({
                lastRoute: "/consulting/dashboard",
                lastMessagePreview: "hello",
            }),
        );
    });

    it("updateProfile upserts sanitized profile attrs", async () => {
        prismaMock.memoryProfile.findUnique.mockResolvedValueOnce(null);

        await adapter.updateProfile(
            {
                companyId: "company-1",
                traceId: "trace-9",
                userId: "user-9",
            },
            {
                lastRoute: "/registry/fields",
                preferences: {
                    pinned: true,
                    onBroken: undefined,
                },
            },
        );

        expect(prismaMock.memoryProfile.upsert).toHaveBeenCalledWith({
            where: {
                companyId_userId: {
                    companyId: "company-1",
                    userId: "user-9",
                },
            },
            create: expect.objectContaining({
                companyId: "company-1",
                userId: "user-9",
                attrs: expect.objectContaining({
                    schemaKey: "memory.profile.v1",
                    lastRoute: "/registry/fields",
                    preferences: {
                        pinned: true,
                        onBroken: null,
                    },
                }),
            }),
            update: expect.objectContaining({
                attrs: expect.objectContaining({
                    schemaKey: "memory.profile.v1",
                    lastRoute: "/registry/fields",
                }),
            }),
        });
    });

    it("retrieve delegates to episodicRetrieval.retrieve", async () => {
        const ctx = {
            companyId: "company-1",
            traceId: "trace-1",
        };
        const embedding = [0.1, 0.2];
        const options = { limit: 5, minSimilarity: 0.7 };

        await adapter.retrieve(ctx, embedding, options);

        expect(episodicRetrievalMock.retrieve).toHaveBeenCalledWith({
            companyId: "company-1",
            embedding,
            traceId: "trace-1",
            limit: 5,
            minSimilarity: 0.7,
        });
    });

    it("handles errors in retrieve and returns empty result", async () => {
        episodicRetrievalMock.retrieve.mockRejectedValue(new Error("Boom"));
        const ctx = { companyId: "c1", traceId: "t1" };

        const result = await adapter.retrieve(ctx, [0.1], { limit: 1, minSimilarity: 0.1 });

        expect(result.items).toEqual([]);
        expect(result.total).toBe(0);
    });
});
