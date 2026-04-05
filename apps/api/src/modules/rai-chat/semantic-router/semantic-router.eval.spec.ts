import * as fs from "fs";
import * as path from "path";
import { SemanticRouterService } from "./semantic-router.service";
import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";
import { IntentClassification } from "../../../shared/rai-chat/intent-router.types";

type EvalCorpusCase = {
  corpusName?: string;
  id: string;
  request: {
    message: string;
    workspaceContext?: Record<string, unknown>;
    baselineClassification: {
      targetRole: IntentClassification["targetRole"];
      intent: string | null;
      toolName: RaiToolName | null;
      confidence: number;
      method: IntentClassification["method"];
      reason: string;
    };
    requestedToolCalls: Array<{
      name: RaiToolName;
      payload: Record<string, unknown>;
    }>;
    allowPrimaryPromotion: boolean;
  };
  expected: {
    sliceId: string | null;
    promotedPrimary: boolean;
    executionPath: "semantic_route_shadow" | "semantic_route_primary";
    classificationIntent: string | null;
    classificationMethod: IntentClassification["method"];
    decisionType: string;
    recommendedExecutionMode: string;
    eligibleTools: RaiToolName[];
    requiredContextMissing: string[];
    requestedToolCalls: Array<{
      name: RaiToolName;
      payloadSubset?: Record<string, unknown>;
    }>;
    filtersSubset?: Record<string, unknown>;
    mismatchKinds?: string[];
  };
};

type LegacyEvalCorpusCase = Omit<EvalCorpusCase, "request"> & {
  request: Omit<EvalCorpusCase["request"], "baselineClassification"> & {
    baselineClassification?: EvalCorpusCase["request"]["baselineClassification"];
    legacyClassification?: EvalCorpusCase["request"]["baselineClassification"];
  };
};

function loadCorpus(): EvalCorpusCase[] {
  const fixturesDir = path.join(__dirname, "fixtures");
  return fs
    .readdirSync(fixturesDir)
    .filter((fileName) => fileName.endsWith("-routing-eval-corpus.json"))
    .sort()
    .flatMap((fileName) => {
      const fixturePath = path.join(fixturesDir, fileName);
      const raw = JSON.parse(
        fs.readFileSync(fixturePath, "utf-8"),
      ) as LegacyEvalCorpusCase[];
      return raw.map((item) => ({
        ...item,
        request: {
          ...item.request,
          baselineClassification:
            item.request.baselineClassification ??
            item.request.legacyClassification!,
        },
        corpusName: fileName,
      }));
    });
}

describe("SemanticRouterService primary slices eval corpus", () => {
  const openRouterGatewayMock = {
    generate: jest.fn(),
  };
  const routingCaseMemoryMock = {
    retrieveRelevantCases: jest.fn(),
  };

  let service: SemanticRouterService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.RAI_SEMANTIC_ROUTER_LLM_ENABLED;
    routingCaseMemoryMock.retrieveRelevantCases.mockResolvedValue([]);
    service = new SemanticRouterService(
      openRouterGatewayMock as any,
      routingCaseMemoryMock as any,
    );
  });

  for (const evalCase of loadCorpus()) {
    it(`проходит кейс ${evalCase.corpusName}:${evalCase.id}`, async () => {
      const result = await service.evaluate({
        companyId: "c1",
        message: evalCase.request.message,
        workspaceContext: evalCase.request.workspaceContext as any,
        traceId: `trace-${evalCase.id}`,
        threadId: `thread-${evalCase.id}`,
        baselineClassification: evalCase.request.baselineClassification,
        requestedToolCalls: evalCase.request.requestedToolCalls,
        allowPrimaryPromotion: evalCase.request.allowPrimaryPromotion,
      });

      expect(result.sliceId).toBe(evalCase.expected.sliceId);
      expect(result.promotedPrimary).toBe(evalCase.expected.promotedPrimary);
      expect(result.executionPath).toBe(evalCase.expected.executionPath);
      expect(result.classification.intent).toBe(
        evalCase.expected.classificationIntent,
      );
      expect(result.classification.method).toBe(
        evalCase.expected.classificationMethod,
      );
      expect(result.routeDecision.decisionType).toBe(
        evalCase.expected.decisionType,
      );
      expect(result.routeDecision.recommendedExecutionMode).toBe(
        evalCase.expected.recommendedExecutionMode,
      );
      expect(result.routeDecision.eligibleTools).toEqual(
        evalCase.expected.eligibleTools,
      );
      expect(result.routeDecision.requiredContextMissing).toEqual(
        evalCase.expected.requiredContextMissing,
      );
      expect(result.requestedToolCalls.map((item) => item.name)).toEqual(
        evalCase.expected.requestedToolCalls.map((item) => item.name),
      );

      for (const expectedToolCall of evalCase.expected.requestedToolCalls) {
        const actualToolCall = result.requestedToolCalls.find(
          (item) => item.name === expectedToolCall.name,
        );
        expect(actualToolCall).toBeDefined();
        if (expectedToolCall.payloadSubset) {
          expect(actualToolCall?.payload).toEqual(
            expect.objectContaining(expectedToolCall.payloadSubset),
          );
        }
      }

      if (evalCase.expected.filtersSubset) {
        expect(result.semanticIntent.filters).toEqual(
          expect.objectContaining(evalCase.expected.filtersSubset),
        );
      }

      if (evalCase.expected.mismatchKinds) {
        expect(result.divergence.mismatchKinds).toEqual(
          expect.arrayContaining(evalCase.expected.mismatchKinds),
        );
      }
    });
  }
});
