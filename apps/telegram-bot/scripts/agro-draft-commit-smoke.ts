import { TelegramUpdate } from "../src/telegram/telegram.update";

async function main() {
  const logs: string[] = [];

  const progressService = {
    getProgressStats: () => ({}),
    formatReport: () => "",
  };

  const session = {
    token: "token-1",
    lastActive: Date.now(),
    activeTaskId: "task-1",
    currentCoordinates: { lat: 49.12, lng: 31.44 },
  };

  const apiClient = {
    getUser: async () => ({ id: "user-1", email: "worker@rai.local" }),
    createFrontOfficeDraft: async (payload: any) => {
      logs.push(`draft:create channel=${payload.channel}`);
      return {
        status: "DRAFT_RECORDED",
        confirmationRequired: true,
        draftId: "draft-smoke-1",
        draft: {
          id: "draft-smoke-1",
          status: "NEEDS_LINK",
          mustClarifications: ["LINK_OBJECT"],
        },
        mustClarifications: ["LINK_OBJECT"],
        allowedActions: ["LINK", "FIX", "CONFIRM"],
      };
    },
    fixFrontOfficeDraft: async () => {
      throw new Error("fix not used in smoke");
    },
    linkFrontOfficeDraft: async (draftId: string, payload: any) => {
      logs.push(
        `draft:link draftId=${draftId} farmRef=${payload.farmRef} fieldId=${payload.fieldId} taskId=${payload.taskId}`,
      );
      return {
        status: "DRAFT_RECORDED",
        confirmationRequired: true,
        draftId,
        draft: {
          id: draftId,
          status: "READY_TO_CONFIRM",
          mustClarifications: [],
        },
        mustClarifications: [],
        allowedActions: ["CONFIRM"],
      };
    },
    confirmFrontOfficeDraft: async (draftId: string) => {
      logs.push(`draft:confirm draftId=${draftId}`);
      return {
        status: "COMMITTED",
        confirmationRequired: false,
        draftId,
        draft: {
          id: draftId,
          status: "COMMITTED",
          mustClarifications: [],
        },
        commitResult: {
          kind: "handoff",
          id: "handoff-smoke-1",
          handoffId: "handoff-smoke-1",
          handoffStatus: "ROUTED",
        },
        handoffId: "handoff-smoke-1",
        handoffStatus: "ROUTED",
        targetOwnerRole: "crm_agent",
      };
    },
    recordAdvisoryFeedback: async () => ({ traceId: "trace-1", status: "RECORDED" }),
  };

  const sessionService = {
    getSession: async () => session,
    saveSession: async (_telegramUserId: number, nextSession: any) => {
      Object.assign(session, nextSession);
    },
  };

  const update = new TelegramUpdate(
    progressService as any,
    apiClient as any,
    sessionService as any,
  );

  const photoReplies: string[] = [];
  await update.onPhoto({
    from: { id: 101, username: "worker" },
    message: {
      photo: [{ file_id: "photo-low" }, { file_id: "photo-hi", width: 1024, height: 768 }],
      caption: "лист с пятнами",
    },
    telegram: {
      getFileLink: async () => new URL("https://files.example/photo-hi"),
    },
    reply: async (text: string) => {
      photoReplies.push(text);
      logs.push(`reply:photo ${text.replace(/\n/g, " | ")}`);
    },
  } as any);

  await update.onFrontOfficeAction({
    from: { id: 101, username: "worker" },
    match: ["fo:l:draft-smoke-1", "l", "draft-smoke-1"],
    callbackQuery: { data: "fo:l:draft-smoke-1" },
    answerCbQuery: async (text?: string) => {
      logs.push(`callback:link ${text ?? ""}`.trim());
    },
    reply: async (text: string) => {
      logs.push(`reply:link ${text.replace(/\n/g, " | ")}`);
    },
  } as any);

  await update.onText({
    from: { id: 101, username: "worker" },
    message: { text: "farm=farm-1 field=field-2 season=season-2 task=task-1" },
    reply: async (text: string) => {
      logs.push(`reply:text ${text.replace(/\n/g, " | ")}`);
    },
  } as any);

  await update.onFrontOfficeAction({
    from: { id: 101, username: "worker" },
    match: ["fo:c:draft-smoke-1", "c", "draft-smoke-1"],
    callbackQuery: { data: "fo:c:draft-smoke-1" },
    answerCbQuery: async (text?: string) => {
      logs.push(`callback:confirm ${text ?? ""}`.trim());
    },
    reply: async (text: string) => {
      logs.push(`reply:confirm ${text.replace(/\n/g, " | ")}`);
    },
  } as any);

  console.log("smoke: telegram front-office draft->link->confirm");
  for (const line of logs) {
    console.log(line);
  }
}

main().catch((error) => {
  console.error("smoke: FAIL", error);
  process.exitCode = 1;
});
