import { ValidationPipe, type ArgumentMetadata } from "@nestjs/common";
import { RaiChatRequestDto } from "../../shared/rai-chat/rai-chat.dto";

/** Контракт тела POST /rai/chat: совпадает с `RaiChatController` + `forbidNonWhitelisted`. */
describe("RaiChatRequestDto: whitelist контракт чата", () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  const meta: ArgumentMetadata = {
    metatype: RaiChatRequestDto,
    type: "body",
    data: "",
  };

  async function transformBody(value: object): Promise<RaiChatRequestDto> {
    return pipe.transform(value, meta) as Promise<RaiChatRequestDto>;
  }

  it("пропускает минимальное тело", async () => {
    const out = await transformBody({ message: "привет" });
    expect(out.message).toBe("привет");
  });

  it("отклоняет поддельный executionSurface (клиент не подменяет runtime surface)", async () => {
    await expect(
      transformBody({
        message: "x",
        executionSurface: {
          version: "v1",
          branches: [
            {
              branchId: "evil",
              lifecycle: "RUNNING",
              mutationState: "APPROVED",
            },
          ],
        },
      }),
    ).rejects.toThrow();
  });

  it("пропускает поля resume планировщика", async () => {
    const out = await transformBody({
      message: "продолжи",
      executionPlannerMutationApproved: true,
      executionPlannerApprovedPendingActionId: "pa-abc",
    });
    expect(out.executionPlannerMutationApproved).toBe(true);
    expect(out.executionPlannerApprovedPendingActionId).toBe("pa-abc");
  });
});
