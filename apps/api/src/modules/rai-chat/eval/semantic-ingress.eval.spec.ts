import * as fs from "fs";
import * as path from "path";
import { IntentRouterService } from "../intent-router/intent-router.service";
import { SemanticRouterService } from "../semantic-router/semantic-router.service";
import { SemanticIngressService } from "../semantic-ingress.service";
import { RaiToolName } from "../tools/rai-tools.types";
import { IntentClassification } from "../../../shared/rai-chat/intent-router.types";

type SemanticIngressEvalCase = {
  corpusName?: string;
  id: string;
  request: {
    message: string;
    workspaceContext?: Record<string, unknown>;
  };
  expected: {
    intent: string;
    toolName: RaiToolName;
    proofSliceId: string;
    operationAuthority:
      | "direct_user_command"
      | "workflow_resume"
      | "delegated_or_autonomous"
      | "unknown";
    requiresConfirmation: boolean;
    inn: string;
  };
};

function loadCorpus(): SemanticIngressEvalCase[] {
  const fixturesDir = path.join(__dirname, "fixtures");
  return fs
    .readdirSync(fixturesDir)
    .filter((fileName) => fileName.endsWith("-semantic-ingress-eval-corpus.json"))
    .sort()
    .flatMap((fileName) => {
      const fixturePath = path.join(fixturesDir, fileName);
      const raw = JSON.parse(
        fs.readFileSync(fixturePath, "utf-8"),
      ) as SemanticIngressEvalCase[];
      return raw.map((item) => ({
        ...item,
        corpusName: fileName,
      }));
    });
}

describe("Semantic Ingress proof-slice eval corpus", () => {
  const openRouterGatewayMock = {
    generate: jest.fn(),
  };
  const routingCaseMemoryMock = {
    retrieveRelevantCases: jest.fn(),
  };

  let intentRouter: IntentRouterService;
  let semanticRouter: SemanticRouterService;
  let semanticIngress: SemanticIngressService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.RAI_SEMANTIC_ROUTER_LLM_ENABLED;
    routingCaseMemoryMock.retrieveRelevantCases.mockResolvedValue([]);
    intentRouter = new IntentRouterService();
    semanticRouter = new SemanticRouterService(
      openRouterGatewayMock as any,
      routingCaseMemoryMock as any,
    );
    semanticIngress = new SemanticIngressService();
  });

  for (const evalCase of loadCorpus()) {
    it(`проходит кейс ${evalCase.corpusName}:${evalCase.id}`, async () => {
      const request = {
        message: evalCase.request.message,
        workspaceContext: evalCase.request.workspaceContext,
      };

      const legacyClassification = intentRouter.classify(
        request.message,
        request.workspaceContext as any,
      );
      const autoToolCall = intentRouter.buildAutoToolCall(
        request.message,
        request as any,
        legacyClassification,
      );
      const requestedToolCalls = autoToolCall
        ? [
            {
              name: autoToolCall.name,
              payload: autoToolCall.payload as Record<string, unknown>,
            },
          ]
        : [];

      const semanticEvaluation = await semanticRouter.evaluate({
        companyId: "company-1",
        message: request.message,
        workspaceContext: request.workspaceContext as any,
        traceId: `trace-${evalCase.id}`,
        threadId: `thread-${evalCase.id}`,
        legacyClassification,
        requestedToolCalls,
        allowPrimaryPromotion: true,
      });

      const finalClassification: IntentClassification =
        semanticEvaluation.promotedPrimary
          ? semanticEvaluation.classification
          : legacyClassification;
      const finalRequestedToolCalls = semanticEvaluation.promotedPrimary
        ? semanticEvaluation.requestedToolCalls
        : requestedToolCalls;

      const frame = semanticIngress.buildFrame({
        request: request as any,
        legacyClassification,
        finalClassification,
        finalRequestedToolCalls,
        semanticEvaluation,
      });

      expect(legacyClassification.intent).toBe(evalCase.expected.intent);
      expect(legacyClassification.toolName).toBe(evalCase.expected.toolName);
      expect(finalRequestedToolCalls.map((toolCall) => toolCall.name)).toEqual([
        evalCase.expected.toolName,
      ]);
      expect(frame.proofSliceId).toBe(evalCase.expected.proofSliceId);
      expect(frame.operationAuthority).toBe(
        evalCase.expected.operationAuthority,
      );
      expect(frame.requiresConfirmation).toBe(
        evalCase.expected.requiresConfirmation,
      );
      expect(frame.requestedOperation.intent).toBe(evalCase.expected.intent);
      expect(frame.requestedOperation.toolName).toBe(evalCase.expected.toolName);
      expect(frame.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "inn",
            value: evalCase.expected.inn,
          }),
        ]),
      );
    });
  }
});
