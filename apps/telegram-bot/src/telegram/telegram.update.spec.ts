import { TelegramUpdate } from "./telegram.update";

describe("TelegramUpdate agro flow", () => {
  const progressService = {
    getProgressStats: jest.fn(),
    formatReport: jest.fn(),
  };

  const buildApiClient = () => ({
    getUser: jest.fn().mockResolvedValue({ id: "user-1", email: "worker@rai.local" }),
    createAgroEventDraft: jest.fn(),
    fixAgroEventDraft: jest.fn(),
    linkAgroEventDraft: jest.fn(),
    confirmAgroEventDraft: jest.fn(),
    recordAdvisoryFeedback: jest.fn(),
  });

  const buildSessionService = () => ({
    getSession: jest.fn(),
    saveSession: jest.fn(),
  });

  const buildTextContext = (text: string) =>
    ({
      from: { id: 101, username: "worker" },
      message: { text },
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
      reply: jest.fn(),
    }) as any;

  const buildPhotoContext = () =>
    ({
      from: { id: 101, username: "worker" },
      message: {
        photo: [{ file_id: "photo-small" }, { file_id: "photo-large", width: 1200, height: 900 }],
        caption: "лист с пятнами",
      },
      telegram: {
        getFileLink: jest.fn().mockResolvedValue(new URL("https://files.example/photo-large")),
      },
      reply: jest.fn(),
    }) as any;

  it("создаёт draft на обычный text-вход", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
    });
    apiClient.createAgroEventDraft.mockResolvedValue({
      draft: { id: "draft-1", status: "DRAFT", missingMust: ["fieldRef"] },
      ui: { message: "Draft создан" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildTextContext("опрыскивание завершено");

    await update.onText(ctx);

    expect(apiClient.createAgroEventDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "TELEGRAM_TEXT",
        payload: expect.objectContaining({
          description: "опрыскивание завершено",
        }),
      }),
      "token-1",
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("draft-1"),
      expect.objectContaining({ parse_mode: "HTML" }),
    );
  });

  it("не вызывает link без распознанных refs", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
      pendingAgroAction: {
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

    expect(apiClient.linkAgroEventDraft).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      "Нужен формат refs: farm=... field=... task=...",
    );
  });

  it("создаёт draft на photo-вход", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
      activeTaskId: "task-1",
      currentCoordinates: { lat: 1, lng: 2 },
    });
    apiClient.createAgroEventDraft.mockResolvedValue({
      draft: { id: "draft-photo", status: "DRAFT", missingMust: ["fieldRef"] },
      ui: { message: "Draft создан" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildPhotoContext();

    await update.onPhoto(ctx);

    expect(apiClient.createAgroEventDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "TELEGRAM_PHOTO",
        taskRef: "task-1",
        evidence: [
          expect.objectContaining({
            type: "photo",
            fileId: "photo-large",
          }),
        ],
      }),
      "token-1",
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("draft-photo"),
      expect.objectContaining({ parse_mode: "HTML" }),
    );
  });

  it("выполняет link по text refs для pending action", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
      pendingAgroAction: {
        action: "link",
        draftId: "draft-2",
      },
    });
    apiClient.linkAgroEventDraft.mockResolvedValue({
      draft: { id: "draft-2", status: "READY_FOR_CONFIRM", missingMust: [] },
      ui: { message: "Draft обновлён" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildTextContext("farm=farm-1 field=field-2 task=task-3");

    await update.onText(ctx);

    expect(apiClient.linkAgroEventDraft).toHaveBeenCalledWith(
      {
        draftId: "draft-2",
        farmRef: "farm-1",
        fieldRef: "field-2",
        taskRef: "task-3",
      },
      "token-1",
    );
    expect(sessionService.saveSession).toHaveBeenCalled();
  });

  it("по confirm-кнопке вызывает confirm API", async () => {
    const apiClient = buildApiClient();
    const sessionService = buildSessionService();
    sessionService.getSession.mockResolvedValue({
      token: "token-1",
      lastActive: Date.now(),
    });
    apiClient.confirmAgroEventDraft.mockResolvedValue({
      draft: { id: "draft-3", status: "COMMITTED", missingMust: [] },
      committed: { id: "commit-1", provenanceHash: "hash-1" },
      ui: { message: "Событие успешно закоммичено" },
    });

    const update = new TelegramUpdate(
      progressService as any,
      apiClient as any,
      sessionService as any,
    );
    const ctx = buildActionContext("ag:c:draft-3", ["ag:c:draft-3", "c", "draft-3"]);

    await update.onAgroAction(ctx);

    expect(apiClient.confirmAgroEventDraft).toHaveBeenCalledWith(
      "draft-3",
      "token-1",
    );
    expect(ctx.answerCbQuery).toHaveBeenCalledWith("Confirm отправлен");
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("commit-1"),
      expect.objectContaining({ parse_mode: "HTML" }),
    );
  });
});
