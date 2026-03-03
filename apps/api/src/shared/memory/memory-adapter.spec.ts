import { Test, TestingModule } from "@nestjs/testing";
import { DefaultMemoryAdapter } from "./default-memory-adapter.service";
import { MemoryManager } from "./memory-manager.service";
import { EpisodicRetrievalService } from "./episodic-retrieval.service";
import { RaiChatMemoryPolicy } from "./rai-chat-memory.policy";

describe("DefaultMemoryAdapter", () => {
    let adapter: DefaultMemoryAdapter;
    const memoryManagerMock = {
        store: jest.fn().mockResolvedValue(undefined),
    };
    const episodicRetrievalMock = {
        retrieve: jest.fn().mockResolvedValue({ items: [] }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DefaultMemoryAdapter,
                { provide: MemoryManager, useValue: memoryManagerMock },
                { provide: EpisodicRetrievalService, useValue: episodicRetrievalMock },
            ],
        }).compile();

        adapter = module.get<DefaultMemoryAdapter>(DefaultMemoryAdapter);
    });

    it("appendInteraction delegates to memoryManager.store", async () => {
        const ctx = {
            companyId: "company-1",
            traceId: "trace-1",
            sessionId: "session-1",
        };
        const interaction = {
            userMessage: "Hello",
            agentResponse: "Hi there",
            embedding: [0.1, 0.2],
        };

        await adapter.appendInteraction(ctx, interaction);

        expect(memoryManagerMock.store).toHaveBeenCalledWith(
            "Hello",
            [0.1, 0.2],
            expect.objectContaining({
                companyId: "company-1",
                traceId: "trace-1",
                sessionId: "session-1",
                source: "rai-chat",
            }),
            RaiChatMemoryPolicy,
        );
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
