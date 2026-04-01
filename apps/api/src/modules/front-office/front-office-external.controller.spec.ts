import { PATH_METADATA } from "@nestjs/common/constants";
import { UserRole } from "@rai/prisma-client";
import { FrontOfficeExternalController } from "./front-office-external.controller";

describe("FrontOfficeExternalController", () => {
  const frontOfficeService = {
    listThreadsForViewer: jest.fn(),
    getThreadForViewer: jest.fn(),
    listMessagesForViewer: jest.fn(),
    intakeMessageForViewer: jest.fn(),
    replyToThread: jest.fn(),
    markThreadRead: jest.fn(),
  };

  const controller = new FrontOfficeExternalController(
    frontOfficeService as never,
  );

  const viewer = {
    userId: "user-1",
    companyId: "company-1",
    role: UserRole.FRONT_OFFICE_USER,
    accountId: "account-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses dedicated portal route-space", () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, FrontOfficeExternalController),
    ).toBe("portal/front-office");
  });

  it("lists threads through viewer-scoped service path", async () => {
    frontOfficeService.listThreadsForViewer.mockResolvedValueOnce(["thread"]);

    await expect(controller.listThreads(viewer)).resolves.toEqual(["thread"]);
    expect(frontOfficeService.listThreadsForViewer).toHaveBeenCalledWith(
      "company-1",
      {
        id: "user-1",
        role: UserRole.FRONT_OFFICE_USER,
        accountId: "account-1",
      },
    );
  });

  it("loads thread detail through viewer-scoped service path", async () => {
    frontOfficeService.getThreadForViewer.mockResolvedValueOnce({
      thread: { threadKey: "thread-1" },
    });

    await expect(controller.getThread(viewer, "thread-1")).resolves.toEqual({
      thread: { threadKey: "thread-1" },
    });
    expect(frontOfficeService.getThreadForViewer).toHaveBeenCalledWith(
      "company-1",
      {
        id: "user-1",
        role: UserRole.FRONT_OFFICE_USER,
        accountId: "account-1",
      },
      "thread-1",
    );
  });

  it("supports viewer-scoped intake and polling cursor on messages", async () => {
    frontOfficeService.intakeMessageForViewer.mockResolvedValueOnce({
      draftId: "draft-1",
    });
    frontOfficeService.listMessagesForViewer.mockResolvedValueOnce([
      { id: "m-2" },
    ]);

    await expect(
      controller.intakeMessage(viewer, {
        messageText: "Новый inbound",
        threadExternalId: "web-1",
      }),
    ).resolves.toEqual({ draftId: "draft-1" });

    await expect(
      controller.listMessages(viewer, "thread-1", "m-1", "40"),
    ).resolves.toEqual([{ id: "m-2" }]);

    expect(frontOfficeService.intakeMessageForViewer).toHaveBeenCalledWith(
      "company-1",
      {
        id: "user-1",
        role: UserRole.FRONT_OFFICE_USER,
        accountId: "account-1",
      },
      {
        messageText: "Новый inbound",
        threadExternalId: "web-1",
        dialogExternalId: undefined,
        sourceMessageId: undefined,
        route: undefined,
      },
    );
    expect(frontOfficeService.listMessagesForViewer).toHaveBeenCalledWith(
      "company-1",
      {
        id: "user-1",
        role: UserRole.FRONT_OFFICE_USER,
        accountId: "account-1",
      },
      "thread-1",
      {
        afterId: "m-1",
        limit: 40,
      },
    );
  });

  it("routes reply and read actions through viewer-scoped service path", async () => {
    frontOfficeService.replyToThread.mockResolvedValueOnce({ ok: true });
    frontOfficeService.markThreadRead.mockResolvedValueOnce({ ok: true });

    await expect(
      controller.replyToThread(viewer, "thread-1", { messageText: "reply" }),
    ).resolves.toEqual({ ok: true });
    await expect(
      controller.markThreadRead(viewer, "thread-1", {
        lastMessageId: "message-1",
      }),
    ).resolves.toEqual({ ok: true });

    expect(frontOfficeService.replyToThread).toHaveBeenCalledWith(
      "company-1",
      {
        id: "user-1",
        role: UserRole.FRONT_OFFICE_USER,
        accountId: "account-1",
      },
      "thread-1",
      "reply",
    );
    expect(frontOfficeService.markThreadRead).toHaveBeenCalledWith(
      "company-1",
      {
        id: "user-1",
        role: UserRole.FRONT_OFFICE_USER,
        accountId: "account-1",
      },
      "thread-1",
      "message-1",
    );
  });
});
