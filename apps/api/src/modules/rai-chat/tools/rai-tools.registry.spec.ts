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
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"payload":{"wrong":true}'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"validation_failed"'),
    );
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
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"payload":{"route":"/tasks","lastUserAction":"open-task"}'),
    );
  });

  it("logs payload when handler execution fails", async () => {
    const registry = new RaiToolsRegistry();
    const warnSpy = jest
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => undefined);

    registry.register(
      RaiToolName.EchoMessage,
      Joi.object({
        message: Joi.string().required(),
      }),
      async () => {
        throw new Error("boom");
      },
    );

    await expect(
      registry.execute(
        RaiToolName.EchoMessage,
        { message: "hello" },
        actorContext,
      ),
    ).rejects.toThrow("boom");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"payload":{"message":"hello"}'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"handler_failed"'),
    );
  });
});
