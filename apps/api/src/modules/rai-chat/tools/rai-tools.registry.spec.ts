import { BadRequestException, Logger } from "@nestjs/common";
import * as Joi from "joi";
import { RaiToolsRegistry } from "./rai-tools.registry";
import { RaiToolName } from "./rai-tools.types";

describe("RaiToolsRegistry", () => {
  const actorContext = {
    companyId: "company-1",
    traceId: "trace-1",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("executes a registered tool with a valid payload", async () => {
    const registry = new RaiToolsRegistry();
    registry.onModuleInit();

    const result = await registry.execute(
      RaiToolName.EchoMessage,
      { message: "hello" },
      actorContext,
    );

    expect(result).toEqual({
      echoedMessage: "hello",
      companyId: "company-1",
    });
  });

  it("rejects invalid payload and does not execute the handler", async () => {
    const registry = new RaiToolsRegistry();
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined);

    const handler = jest.fn().mockResolvedValue({
      echoedMessage: "x",
      companyId: "company-1",
    });

    registry.register(
      RaiToolName.EchoMessage,
      Joi.object({
        message: Joi.string().required(),
      }),
      handler,
    );

    await expect(
      registry.execute(RaiToolName.EchoMessage, { wrong: true }, actorContext),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(handler).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("logs every successful tool call", async () => {
    const registry = new RaiToolsRegistry();
    registry.onModuleInit();
    const logSpy = jest
      .spyOn(Logger.prototype, "log")
      .mockImplementation(() => undefined);

    await registry.execute(
      RaiToolName.WorkspaceSnapshot,
      { route: "/tasks", lastUserAction: "open-task" },
      actorContext,
    );

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"toolName":"workspace_snapshot"'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"status":"success"'),
    );
  });
});
