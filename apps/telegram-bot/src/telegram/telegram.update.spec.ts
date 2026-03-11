import { TelegramUpdate } from "./telegram.update";

describe("TelegramUpdate front-office flow", () => {
  const progressService = {
    getProgressStats: jest.fn(),
    formatReport: jest.fn(),
  };

  const buildApiClient = () => ({
    getUser: jest.fn().mockResolvedValue({ id: "user-1", email: "worker@rai.local" }),
    getMyTasks: jest.fn(),
    startTask: jest.fn(),
    completeTask: jest.fn(),
    createFrontOfficeDraft: jest.fn(),
    fixFrontOfficeDraft: jest.fn(),
    linkFrontOfficeDraft: jest.fn(),
    confirmFrontOfficeDraft: jest.fn(),
    recordAdvisoryFeedback: jest.fn(),
  });

  const buildSessionService = () => ({
    getSession: jest.fn(),
    saveSession: jest.fn(),
  });

  const buildTextContext = (text: string) =>
    ({
      from: { id: 101, username: "worker" },
      chat: { id: 9001 },
      message: { text, message_id: 77 },
      reply: jest.fn(),
    }) as any;

  const buildActionContext = (data: string, match: string[]) =>
    ({
      from: { id: 101, username: "worker" },
      match,
      callbackQuery: {
        data,
        message: { text: "draft message" },
      },
      answerCbQuery: jest.fn(),
      editMessageText: jest.fn(),
      reply: jest.fn(),
    }) as any;

  const buildPhotoContext = () =>
    ({
      from: { id: 101, username: "worker" },
      chat: { id: 9001 },
      message: {
        message_id: 88,
        photo: [{ file_id: "photo-small" }, { file_id: "photo-large", width: 1200, height: 900 }],
        caption: "лист с пятнами",
      },
      telegram: {
        getFileLink: jest.fn().mockResolvedValue(new URL("https://files.example/photo-large")),
      },
      reply: jest.fn(),
    }) as any;

  it("создаёт front-office draft на обычный text-вход", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
      activeTaskId: "task-7",
      currentCoordinates: { lat: 50.1, lng: 36.2 },
    });
    apiClient.createFrontOfficeDraft.mockResolvedValue({
      status: "DRAFT_RECORDED",
      draftId: "draft-1",
      suggestedIntent: "observation",
      mustClarifications: [],
      allowedActions: ["CONFIRM", "FIX", "LINK"],
      draft: { id: "draft-1", status: "READY_TO_CONFIRM" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildTextContext("опрыскивание завершено");

    await update.onText(ctx);

    expect(apiClient.createFrontOfficeDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "telegram",
        messageText: "опрыскивание завершено",
        taskId: "task-7",
        coordinates: { lat: 50.1, lng: 36.2 },
        sourceMessageId: "77",
        chatId: "9001",
        threadExternalId: "9001",
        senderExternalId: "101",
      }),
      "token-1",
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("draft-1"),
      expect.objectContaining({ parse_mode: "HTML" }),
    );
  });

  it("не дублирует auto-reply, если backend уже ответил в thread", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
    });
    apiClient.createFrontOfficeDraft.mockResolvedValue({
      status: "COMMITTED",
      draftId: "draft-auto",
      resolutionMode: "AUTO_REPLY",
      replyStatus: "SENT",
      confirmationRequired: false,
      allowedActions: [],
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildTextContext("какая стадия по полю");

    await update.onText(ctx);

    expect(apiClient.createFrontOfficeDraft).toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("не маршрутизирует raw text менеджера в front-office intake", async () => {
    const apiClient = buildApiClient();
    apiClient.getUser.mockResolvedValue({
      id: "manager-1",
      email: "manager@rai.local",
      role: "MANAGER",
      telegramTunnel: "back_office_operator",
    });
    const sessionService = buildSessionService();
    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildTextContext("напиши клиенту, что я на связи");

    await update.onText(ctx);

    expect(apiClient.createFrontOfficeDraft).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Рабочее место бэкофиса"),
      expect.objectContaining({ parse_mode: "HTML" }),
    );
  });

  it("получает задачи и показывает CTA start/complete", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
    });
    apiClient.getMyTasks.mockResolvedValue([
      {
        id: "task-pending",
        name: "Осмотр поля",
        status: "PENDING",
        field: { name: "Поле 7" },
        seasonId: "season-1",
      },
      {
        id: "task-progress",
        name: "Подтверждение обработки",
        status: "IN_PROGRESS",
        field: { name: "Поле 8" },
        seasonId: "season-2",
      },
    ]);

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = {
      from: { id: 101, username: "worker" },
      reply: jest.fn(),
    } as any;

    await update.onMyTasks(ctx);

    expect(apiClient.getMyTasks).toHaveBeenCalledWith("token-1");
    expect(ctx.reply).toHaveBeenCalledTimes(2);
  });

  it("не вызывает link без распознанных refs", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
      pendingFrontOfficeAction: {
        action: "link",
        draftId: "draft-2",
      },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildTextContext("просто текст без refs");

    await update.onText(ctx);

    expect(apiClient.linkFrontOfficeDraft).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      "Нужен формат refs: field=... season=... task=...",
    );
  });

  it("создаёт front-office draft на photo-вход", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
      activeTaskId: "task-1",
      currentCoordinates: { lat: 1, lng: 2 },
    });
    apiClient.createFrontOfficeDraft.mockResolvedValue({
      status: "DRAFT_RECORDED",
      draftId: "draft-photo",
      suggestedIntent: "deviation",
      mustClarifications: ["LINK_SEASON"],
      allowedActions: ["CONFIRM", "FIX", "LINK"],
      draft: { id: "draft-photo", status: "NEEDS_LINK" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildPhotoContext();

    await update.onPhoto(ctx);

    expect(apiClient.createFrontOfficeDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "telegram",
        messageText: "лист с пятнами",
        taskId: "task-1",
        photoUrl: "https://files.example/photo-large",
        sourceMessageId: "88",
        chatId: "9001",
      }),
      "token-1",
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("draft-photo"),
      expect.objectContaining({ parse_mode: "HTML" }),
    );
  });

  it("выполняет link по text refs для pending front-office action", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
      pendingFrontOfficeAction: {
        action: "link",
        draftId: "draft-2",
      },
    });
    apiClient.linkFrontOfficeDraft.mockResolvedValue({
      status: "DRAFT_RECORDED",
      draftId: "draft-2",
      suggestedIntent: "deviation",
      mustClarifications: [],
      allowedActions: ["CONFIRM", "FIX", "LINK"],
      draft: { id: "draft-2", status: "READY_TO_CONFIRM" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildTextContext("field=field-2 season=season-4 task=task-3");

    await update.onText(ctx);

    expect(apiClient.linkFrontOfficeDraft).toHaveBeenCalledWith(
      "draft-2",
      {
        fieldId: "field-2",
        seasonId: "season-4",
        taskId: "task-3",
      },
      "token-1",
    );
    expect(sessionService.saveSession).toHaveBeenCalled();
  });

  it("по confirm-кнопке вызывает confirm front-office API", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
    });
    apiClient.confirmFrontOfficeDraft.mockResolvedValue({
      status: "COMMITTED",
      confirmationRequired: false,
      draftId: "draft-3",
      suggestedIntent: "observation",
      allowedActions: [],
      draft: { id: "draft-3", status: "COMMITTED" },
      commitResult: { kind: "observation", id: "obs-1" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildActionContext("fo:c:draft-3", ["fo:c:draft-3", "c", "draft-3"]);

    await update.onFrontOfficeAction(ctx);

    expect(apiClient.confirmFrontOfficeDraft).toHaveBeenCalledWith(
      "draft-3",
      "token-1",
    );
    expect(ctx.answerCbQuery).toHaveBeenCalledWith("Confirm отправлен");
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("obs-1"),
      expect.objectContaining({ parse_mode: "HTML" }),
    );
  });

  it("старт задачи вызывает API и сохраняет activeTaskId", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: 123,
    });
    apiClient.startTask.mockResolvedValue({ id: "task-42" });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildActionContext("start_task:task-42", [
      "start_task:task-42",
      "task-42",
    ]);

    await update.onStartTask(ctx);

    expect(apiClient.startTask).toHaveBeenCalledWith("task-42", "token-1");
    expect(sessionService.saveSession).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        activeTaskId: "task-42",
      }),
    );
    expect(ctx.answerCbQuery).toHaveBeenCalledWith("Задача начата! ▶");
  });

  it("завершение задачи вызывает complete API", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: 123,
    });
    apiClient.completeTask.mockResolvedValue({ id: "task-42" });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildActionContext("complete_task:task-42", [
      "complete_task:task-42",
      "task-42",
    ]);

    await update.onCompleteTask(ctx);

    expect(apiClient.completeTask).toHaveBeenCalledWith("task-42", "token-1");
    expect(ctx.answerCbQuery).toHaveBeenCalledWith("Задача завершена! ✅");
  });
});
