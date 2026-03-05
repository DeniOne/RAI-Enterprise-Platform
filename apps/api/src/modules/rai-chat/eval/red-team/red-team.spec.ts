import * as path from "path";
import * as fs from "fs";
import { Test, TestingModule } from "@nestjs/testing";
import { IntentRouterService } from "../../intent-router/intent-router.service";

const payloads: Array<{ id: string; message: string; category?: string }> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "red-team-payloads.json"), "utf-8"),
);

describe("Red-Team Suite", () => {
  let intentRouter: IntentRouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntentRouterService],
    }).compile();
    intentRouter = module.get(IntentRouterService);
  });

  it("IntentRouter не падает на вредоносных payload-ах", () => {
    const request = { message: "", workspaceContext: undefined };
    for (const p of payloads) {
      expect(() => {
        const classification = intentRouter.classify(p.message, request.workspaceContext);
        intentRouter.buildAutoToolCall(p.message, request as never, classification);
      }).not.toThrow();
    }
  });

  it("вредоносные payload-ы не дают опасного auto tool call (no_match или null build)", () => {
    const request = { message: "", workspaceContext: undefined };
    for (const p of payloads) {
      const classification = intentRouter.classify(p.message, request.workspaceContext);
      const autoCall = intentRouter.buildAutoToolCall(p.message, request as never, classification);
      expect(autoCall).toBeNull();
    }
  });
});
