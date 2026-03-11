"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Loader2,
  MessageCircleMore,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AiChatPanel } from "@/components/ai-chat/AiChatPanel";
import { useAiChatStore } from "@/lib/stores/ai-chat-store";
import { useWorkspaceContextStore } from "@/lib/stores/workspace-context-store";
import {
  frontOfficeApi,
  FrontOfficeManagerFarmInboxDto,
  FrontOfficeThreadListItemDto,
  FrontOfficeThreadMessageDto,
  TelegramWorkspaceBootstrapDto,
} from "@/lib/api/front-office";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

type TabKey = "farms" | "ai";
type MobilePane = "farms" | "topics" | "dialog";

async function postTelegramWebAppAuth(initData: string) {
  const response = await fetch("/api/auth/telegram-webapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error || "Не удалось выполнить вход через Telegram.",
    );
  }

  return response.json();
}

async function waitForTelegramWebAppInitData(timeoutMs = 2500) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.initData) {
      return webApp;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }

  return window.Telegram?.WebApp;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Нет активности";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareRussianText(left?: string | null, right?: string | null) {
  return (left || "").localeCompare(right || "", "ru");
}

function normalizeText(value?: string | null, fallback = "Без названия") {
  if (!value || !value.trim()) {
    return fallback;
  }

  if (value.includes("�")) {
    return fallback;
  }

  return value.trim();
}

function formatTopicCount(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${value} тема`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${value} темы`;
  }
  return `${value} тем`;
}

function localizeOwnerRole(value?: string | null) {
  switch (value) {
    case "contracts_agent":
      return "Договоры";
    case "crm_agent":
      return "Клиенты";
    case "agronomist":
      return "Агрономия";
    case "economist":
      return "Экономика";
    case "monitoring":
      return "Мониторинг";
    case "manual":
      return "Ручная обработка";
    default:
      return "Фронт-офис";
  }
}

function localizeHandoffStatus(value?: string | null) {
  switch (value) {
    case "ROUTED":
      return "Передано в работу";
    case "PENDING_APPROVAL":
      return "Ожидает согласования";
    case "MANUAL_REQUIRED":
      return "Нужна ручная обработка";
    case "CLAIMED":
      return "Принято в работу";
    case "COMPLETED":
      return "Исполнено";
    case "REJECTED":
      return "Возвращено";
    default:
      return "Статус уточняется";
  }
}

function prettifyReferenceValue(value?: string | null) {
  if (!value || value === "-") {
    return "не выбрано";
  }

  return value
    .replace(/^manual-field-/, "")
    .replace(/^manual-season-/, "")
    .replace(/^manual-task-/, "")
    .replace(/^field-/, "")
    .replace(/^season-/, "")
    .replace(/^task-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatLinkSystemMessage(value: string) {
  const payload = value.slice("LINK applied:".length).trim();
  const params = new URLSearchParams(payload.replace(/\s+/g, "&"));
  const field = prettifyReferenceValue(params.get("field"));
  const season = prettifyReferenceValue(params.get("season"));
  const task = prettifyReferenceValue(params.get("task"));

  return [
    "Контекст диалога обновлён.",
    `Поле: ${field}.`,
    `Сезон: ${season}.`,
    `Задача: ${task}.`,
  ].join("\n");
}

function localizeCommitKind(value?: string | null) {
  switch (value) {
    case "observation":
      return "Наблюдение сохранено";
    case "deviation":
      return "Отклонение зафиксировано";
    case "consultation":
      return "Запрос на консультацию сохранён";
    case "context_update":
      return "Контекст обновлён";
    default:
      return "Изменения подтверждены";
  }
}

function localizeSystemMessageText(value?: string | null) {
  if (!value) {
    return "Пока нет сообщений";
  }

  if (value.startsWith("LINK applied:")) {
    return formatLinkSystemMessage(value);
  }

  if (value.startsWith("HANDOFF ")) {
    const payload = value.slice("HANDOFF ".length);
    const [rawRole, rawStatus] = payload.split(":");
    const roleTitle = localizeOwnerRole(rawRole?.trim());
    const statusTitle = localizeHandoffStatus(rawStatus?.trim() || null);
    return [
      `Передано в контур: ${roleTitle}.`,
      `Состояние: ${statusTitle}.`,
    ].join("\n");
  }

  if (value.startsWith("COMMIT ")) {
    const payload = value.slice("COMMIT ".length);
    const [rawKind] = payload.split(":");
    return localizeCommitKind(rawKind?.trim() || null);
  }

  return value;
}

function trimPreview(value?: string | null) {
  const normalized = localizeSystemMessageText(value);
  if (!normalized) {
    return "Пока нет сообщений";
  }

  return normalized.length > 140
    ? `${normalized.slice(0, 140)}...`
    : normalized;
}

function formatPersonName(name?: string | null, email?: string | null) {
  const normalizedName = normalizeText(name, "");
  if (normalizedName) {
    return normalizedName;
  }

  const emailLogin = email?.split("@")[0];
  return normalizeText(emailLogin, "Пользователь системы");
}

function getUserInitials(name?: string | null, email?: string | null) {
  const displayName = formatPersonName(name, email);
  const parts = displayName.split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "РМ"
  );
}

function sortFarms(list: FrontOfficeManagerFarmInboxDto[]) {
  return [...list].sort((left, right) => {
    const activityDelta =
      toTimestamp(right.lastMessageAt) - toTimestamp(left.lastMessageAt);
    if (activityDelta !== 0) {
      return activityDelta;
    }
    return compareRussianText(left.farmName, right.farmName);
  });
}

function sortThreads(list: FrontOfficeThreadListItemDto[]) {
  return [...list].sort((left, right) => {
    const activityDelta =
      toTimestamp(right.lastMessageAt) - toTimestamp(left.lastMessageAt);
    if (activityDelta !== 0) {
      return activityDelta;
    }
    return (right.unreadCount || 0) - (left.unreadCount || 0);
  });
}

function buildTopicTitle(thread: FrontOfficeThreadListItemDto, index: number) {
  const roleTitle = localizeOwnerRole(thread.currentOwnerRole);
  if (thread.currentHandoffStatus) {
    return `${roleTitle} · диалог ${index + 1}`;
  }
  return `Диалог ${index + 1}`;
}

export function TelegramWorkspaceClient() {
  const searchParams = useSearchParams();
  const searchThreadKey = searchParams.get("threadKey");

  const [authState, setAuthState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const [bootstrap, setBootstrap] =
    useState<TelegramWorkspaceBootstrapDto | null>(null);
  const [farms, setFarms] = useState<FrontOfficeManagerFarmInboxDto[]>([]);
  const [threads, setThreads] = useState<FrontOfficeThreadListItemDto[]>([]);
  const [messages, setMessages] = useState<FrontOfficeThreadMessageDto[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("farms");
  const [mobilePane, setMobilePane] = useState<MobilePane>("farms");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const farmsSectionRef = useRef<HTMLElement | null>(null);
  const topicsSectionRef = useRef<HTMLElement | null>(null);
  const dialogSectionRef = useRef<HTMLElement | null>(null);

  const aiMessages = useAiChatStore((state) => state.messages);
  const dispatchAi = useAiChatStore((state) => state.dispatch);
  const startNewChat = useAiChatStore((state) => state.startNewChat);
  const setRouteAndReset = useWorkspaceContextStore(
    (state) => state.setRouteAndReset,
  );
  const setActiveEntityRefs = useWorkspaceContextStore(
    (state) => state.setActiveEntityRefs,
  );
  const setSelectedRowSummary = useWorkspaceContextStore(
    (state) => state.setSelectedRowSummary,
  );
  const setFilters = useWorkspaceContextStore((state) => state.setFilters);
  const setLastUserAction = useWorkspaceContextStore(
    (state) => state.setLastUserAction,
  );

  const orderedFarms = sortFarms(farms);
  const orderedThreads = sortThreads(threads);
  const selectedFarm =
    orderedFarms.find((farm) => farm.farmAccountId === selectedFarmId) ?? null;
  const selectedThread =
    orderedThreads.find((thread) => thread.threadKey === selectedThreadKey) ??
    null;
  const latestAssistantReply =
    [...aiMessages].reverse().find((item) => item.role === "assistant")
      ?.content ?? "";
  const displayName = formatPersonName(
    bootstrap?.user.name,
    bootstrap?.user.email,
  );
  const displayInitials = getUserInitials(
    bootstrap?.user.name,
    bootstrap?.user.email,
  );
  const selectedThreadIndex = selectedThread
    ? orderedThreads.findIndex(
        (thread) => thread.threadKey === selectedThread.threadKey,
      )
    : -1;
  const selectedThreadTitle = selectedThread
    ? buildTopicTitle(
        selectedThread,
        selectedThreadIndex >= 0 ? selectedThreadIndex : 0,
      )
    : "Тема не выбрана";

  useEffect(() => {
    dispatchAi("OPEN");
  }, [dispatchAi]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const webApp = await waitForTelegramWebAppInitData();
        webApp?.ready?.();
        webApp?.expand?.();

        if (!webApp?.initData) {
          setAuthState("error");
          setErrorText(
            "Этот экран нужно открывать из мини-приложения Telegram. initData не найден.",
          );
          return;
        }

        await postTelegramWebAppAuth(webApp.initData);
        const nextBootstrap =
          (await frontOfficeApi.getManagerBootstrap()) as TelegramWorkspaceBootstrapDto;

        if (cancelled) {
          return;
        }

        if (nextBootstrap.telegramTunnel !== "back_office_operator") {
          setAuthState("error");
          setErrorText(
            "Это мини-приложение доступно только сотрудникам бэк-офиса.",
          );
          return;
        }

        setBootstrap(nextBootstrap);
        setAuthState("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAuthState("error");
        setErrorText(
          error instanceof Error
            ? error.message
            : "Не удалось авторизовать мини-приложение.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authState !== "ready") {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const nextFarms = sortFarms(
          (await frontOfficeApi.getManagerFarms()) as FrontOfficeManagerFarmInboxDto[],
        );
        if (cancelled) {
          return;
        }

        setFarms(nextFarms);

        if (searchThreadKey) {
          for (const farm of nextFarms) {
            const farmThreads = (await frontOfficeApi.getManagerFarmThreads(
              farm.farmAccountId,
            )) as FrontOfficeThreadListItemDto[];
            const matchingThread = farmThreads.find(
              (thread) => thread.threadKey === searchThreadKey,
            );
            if (matchingThread) {
              setSelectedFarmId(farm.farmAccountId);
              setThreads(sortThreads(farmThreads));
              setSelectedThreadKey(matchingThread.threadKey);
              setMobilePane("dialog");
              return;
            }
          }
        }

        if (nextFarms.length > 0) {
          setSelectedFarmId((current) => current ?? nextFarms[0].farmAccountId);
        }
      } catch (error) {
        setErrorText(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить хозяйства",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authState, searchThreadKey]);

  useEffect(() => {
    if (!selectedFarmId || authState !== "ready") {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const nextThreads = sortThreads(
          (await frontOfficeApi.getManagerFarmThreads(
            selectedFarmId,
          )) as FrontOfficeThreadListItemDto[],
        );
        if (cancelled) {
          return;
        }

        setThreads(nextThreads);
        setSelectedThreadKey((current) => {
          if (
            current &&
            nextThreads.some((thread) => thread.threadKey === current)
          ) {
            return current;
          }
          return nextThreads[0]?.threadKey ?? null;
        });
      } catch (error) {
        if (!cancelled) {
          setErrorText(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить темы диалога.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authState, selectedFarmId]);

  useEffect(() => {
    if (!selectedThreadKey || authState !== "ready") {
      setMessages([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const nextMessages = (await frontOfficeApi.getThreadMessages(
          selectedThreadKey,
        )) as FrontOfficeThreadMessageDto[];
        if (cancelled) {
          return;
        }

        setMessages(nextMessages);
        const lastMessageId = nextMessages.at(-1)?.id;
        await frontOfficeApi.markThreadRead(selectedThreadKey, lastMessageId);
        const [nextFarms, nextThreads] = await Promise.all([
          frontOfficeApi.getManagerFarms() as Promise<
            FrontOfficeManagerFarmInboxDto[]
          >,
          selectedFarmId
            ? (frontOfficeApi.getManagerFarmThreads(selectedFarmId) as Promise<
                FrontOfficeThreadListItemDto[]
              >)
            : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setFarms(sortFarms(nextFarms));
          setThreads(sortThreads(nextThreads));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorText(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить сообщения.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authState, selectedThreadKey]);

  useEffect(() => {
    if (!selectedFarm) {
      return;
    }

    const route =
      activeTab === "ai"
        ? "/telegram/workspace/ai"
        : "/telegram/workspace/farms";
    setRouteAndReset(route);
    setActiveEntityRefs([{ kind: "farm", id: selectedFarm.farmAccountId }]);
    setSelectedRowSummary({
      id: selectedFarm.farmAccountId,
      kind: "farm",
      title: normalizeText(selectedFarm.farmName, "Хозяйство"),
      subtitle: selectedThread ? selectedThreadTitle : "Все темы хозяйства",
      status: selectedThread?.currentHandoffStatus ?? undefined,
    });
    setFilters({
      farmAccountId: selectedFarm.farmAccountId,
      ...(selectedThread?.threadKey
        ? { threadKey: selectedThread.threadKey }
        : {}),
    });
    setLastUserAction(
      activeTab === "ai"
        ? `telegram-workspace:ai:${selectedFarm.farmAccountId}`
        : `telegram-workspace:farm:${selectedFarm.farmAccountId}`,
    );
  }, [
    activeTab,
    selectedFarm,
    selectedThread,
    setActiveEntityRefs,
    setFilters,
    setLastUserAction,
    setRouteAndReset,
    setSelectedRowSummary,
  ]);

  async function refreshCurrentThread() {
    if (!selectedThreadKey) {
      return;
    }

    const nextMessages = (await frontOfficeApi.getThreadMessages(
      selectedThreadKey,
    )) as FrontOfficeThreadMessageDto[];
    setMessages(nextMessages);
  }

  function navigateToSection(target: MobilePane) {
    if (typeof window === "undefined") {
      return;
    }

    if (window.innerWidth < 1280) {
      setMobilePane(target);
    }

    if (window.innerWidth >= 1280) {
      return;
    }

    const targetRef =
      target === "farms"
        ? farmsSectionRef
        : target === "topics"
          ? topicsSectionRef
          : dialogSectionRef;

    window.setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  async function handleReplySubmit() {
    if (!selectedThreadKey || !replyText.trim()) {
      return;
    }

    setIsSubmittingReply(true);
    setErrorText(null);
    try {
      await frontOfficeApi.replyToThread(selectedThreadKey, replyText.trim());
      setReplyText("");
      await refreshCurrentThread();
      const [nextThreads, nextFarms] = await Promise.all([
        selectedFarmId
          ? (frontOfficeApi.getManagerFarmThreads(selectedFarmId) as Promise<
              FrontOfficeThreadListItemDto[]
            >)
          : Promise.resolve([]),
        frontOfficeApi.getManagerFarms() as Promise<
          FrontOfficeManagerFarmInboxDto[]
        >,
      ]);
      setThreads(sortThreads(nextThreads));
      setFarms(sortFarms(nextFarms));
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Не удалось отправить сообщение",
      );
    } finally {
      setIsSubmittingReply(false);
    }
  }

  function handleOpenAiForFarm() {
    if (!selectedFarm) {
      return;
    }

    startTransition(() => {
      startNewChat();
      setActiveTab("ai");
    });
  }

  function handleInsertAiReply() {
    if (!latestAssistantReply) {
      return;
    }

    setReplyText(latestAssistantReply);
    setActiveTab("farms");
    navigateToSection("dialog");
  }

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(232,196,112,0.25),_transparent_38%),linear-gradient(180deg,#f4efe6_0%,#f8f5ef_55%,#fbfaf7_100%)] px-5 py-8 text-[#1f2a1f]">
        <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center rounded-[2rem] border border-black/5 bg-white/80 p-10 shadow-[0_30px_90px_rgba(94,72,32,0.08)] backdrop-blur">
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.24em] text-[#6b6048]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Подключение рабочего места
          </div>
        </div>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f6f0e7_0%,#fbfaf6_100%)] px-5 py-8 text-[#1f2a1f]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#d7cbb1] bg-white p-8 shadow-[0_25px_80px_rgba(94,72,32,0.08)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a7a56]">
            РАИ Менеджмент
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[#1f2a1f]">
            Доступ не открыт
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#5c564a]">{errorText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(203,166,89,0.22),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(116,144,103,0.12),_transparent_28%),linear-gradient(180deg,#f4efe6_0%,#f7f3ec_42%,#fbfaf7_100%)] px-4 py-4 text-[#1f2a1f] sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <section className="overflow-hidden rounded-[2rem] border border-black/5 bg-white/80 shadow-[0_30px_90px_rgba(94,72,32,0.08)] backdrop-blur">
          <div className="grid gap-4 border-b border-black/5 px-5 py-5 lg:grid-cols-[1.1fr_0.9fr] lg:px-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#8b7a55]">
                Рабочее место
              </p>
              <h1 className="mt-3 text-3xl leading-tight text-[#1f2a1f] sm:text-[2.7rem]">
                РАИ Менеджмент
              </h1>
            </div>
            <div className="rounded-[1.5rem] border border-[#e8dcc4] bg-[#fbf7ef] p-4 text-sm text-[#4f4a3f]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#304f37] text-base font-medium text-white">
                  {displayInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8b7a55]">
                    Пользователь
                  </p>
                  <h2 className="mt-2 truncate text-xl text-[#1f2a1f]">
                    {displayName}
                  </h2>
                </div>
                <UserRound className="ml-auto hidden h-5 w-5 text-[#8b7a55] sm:block" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5 py-4 md:px-7">
            {(
              [
                ["farms", "Хозяйства", Building2],
                ["ai", "A-RAI", Sparkles],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  activeTab === key
                    ? "border-[#3d5e41] bg-[#3d5e41] text-white"
                    : "border-[#d9ceb8] bg-white text-[#5d5648] hover:border-[#bca97a] hover:text-[#1f2a1f]",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            {isRefreshing ? (
              <div className="ml-auto text-xs text-[#746b58]">
                Обновление контекста...
              </div>
            ) : null}
          </div>
        </section>

        {errorText ? (
          <div className="rounded-[1.5rem] border border-[#efcfb1] bg-[#fff6eb] px-4 py-3 text-sm text-[#7b4d17]">
            {errorText}
          </div>
        ) : null}

        {activeTab === "farms" ? (
          <div className="grid gap-4 xl:grid-cols-[300px_320px_minmax(0,1fr)]">
            <section
              ref={farmsSectionRef}
              className={clsx(
                "scroll-mt-4 rounded-[1.75rem] border border-black/5 bg-white/85 p-4 shadow-[0_20px_60px_rgba(94,72,32,0.05)]",
                mobilePane === "farms" ? "block" : "hidden xl:block",
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8b7a55]">
                    Хозяйства
                  </p>
                  <h2 className="mt-2 text-lg text-[#1f2a1f]">
                    {orderedFarms.length}
                  </h2>
                </div>
                <Building2 className="h-5 w-5 text-[#7d6d49]" />
              </div>

              <div className="space-y-3">
                {orderedFarms.map((farm) => (
                  <button
                    key={farm.farmAccountId}
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        setSelectedFarmId(farm.farmAccountId);
                        setSelectedThreadKey(null);
                        setMessages([]);
                        navigateToSection("topics");
                      })
                    }
                    className={clsx(
                      "w-full rounded-[1.25rem] border p-4 text-left transition-colors",
                      selectedFarmId === farm.farmAccountId
                        ? "border-[#304f37] bg-[#304f37] text-white"
                        : "border-[#eadfca] bg-[#fcfaf6] text-[#423c31] hover:border-[#c9b27c]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">
                          {normalizeText(farm.farmName, "Хозяйство")}
                        </div>
                        <div
                          className={clsx(
                            "mt-1 text-xs",
                            selectedFarmId === farm.farmAccountId
                              ? "text-white/80"
                              : "text-[#7a715f]",
                          )}
                        >
                          {trimPreview(farm.lastMessagePreview)}
                        </div>
                      </div>
                      <div
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium",
                          selectedFarmId === farm.farmAccountId
                            ? "bg-white/15"
                            : "bg-[#efe3c9] text-[#7d6d49]",
                        )}
                      >
                        {farm.unreadCount}
                      </div>
                    </div>
                    <div
                      className={clsx(
                        "mt-3 flex items-center justify-between text-[11px]",
                        selectedFarmId === farm.farmAccountId
                          ? "text-white/80"
                          : "text-[#8b7a55]",
                      )}
                    >
                      <span>{formatTopicCount(farm.threadCount)}</span>
                      <span>{formatDateTime(farm.lastMessageAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section
              ref={topicsSectionRef}
              className={clsx(
                "scroll-mt-4 rounded-[1.75rem] border border-black/5 bg-white/85 p-4 shadow-[0_20px_60px_rgba(94,72,32,0.05)]",
                mobilePane === "topics" ? "block" : "hidden xl:block",
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8b7a55]">
                    Темы диалога
                  </p>
                  <h2 className="mt-2 text-lg text-[#1f2a1f]">
                    {selectedFarm
                      ? normalizeText(selectedFarm.farmName, "Хозяйство")
                      : "Выберите хозяйство"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateToSection("farms")}
                    className="inline-flex items-center gap-1 rounded-full border border-[#e2d5bc] px-3 py-1.5 text-xs text-[#6c5e43] xl:hidden"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />К хозяйствам
                  </button>
                  <MessageCircleMore className="h-5 w-5 text-[#7d6d49]" />
                </div>
              </div>

              <div className="space-y-3">
                {orderedThreads.map((thread, index) => (
                  <button
                    key={thread.threadKey}
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        setSelectedThreadKey(thread.threadKey);
                        navigateToSection("dialog");
                      })
                    }
                    className={clsx(
                      "w-full rounded-[1.25rem] border p-4 text-left transition-colors",
                      selectedThreadKey === thread.threadKey
                        ? "border-[#8b6a2b] bg-[#8b6a2b] text-white"
                        : "border-[#eadfca] bg-[#fdfbf7] text-[#423c31] hover:border-[#c9b27c]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {buildTopicTitle(thread, index)}
                        </div>
                        <div
                          className={clsx(
                            "mt-1 truncate text-xs",
                            selectedThreadKey === thread.threadKey
                              ? "text-white/80"
                              : "text-[#7a715f]",
                          )}
                        >
                          {trimPreview(thread.lastMessagePreview)}
                        </div>
                      </div>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-[11px]",
                          selectedThreadKey === thread.threadKey
                            ? "bg-white/15"
                            : "bg-[#efe3c9] text-[#7d6d49]",
                        )}
                      >
                        {thread.unreadCount}
                      </span>
                    </div>
                    <div
                      className={clsx(
                        "mt-3 flex items-center justify-between text-[11px]",
                        selectedThreadKey === thread.threadKey
                          ? "text-white/80"
                          : "text-[#8b7a55]",
                      )}
                    >
                      <span>
                        {thread.currentHandoffStatus
                          ? localizeHandoffStatus(thread.currentHandoffStatus)
                          : localizeOwnerRole(thread.currentOwnerRole)}
                      </span>
                      <span>{formatDateTime(thread.lastMessageAt)}</span>
                    </div>
                  </button>
                ))}

                {selectedFarmId && orderedThreads.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-[#d8ccb4] px-4 py-6 text-sm text-[#756c5b]">
                    Для этого хозяйства пока нет тем диалога.
                  </div>
                ) : null}
              </div>
            </section>

            <section
              ref={dialogSectionRef}
              className={clsx(
                "scroll-mt-4 rounded-[1.75rem] border border-black/5 bg-white/90 p-4 shadow-[0_20px_60px_rgba(94,72,32,0.05)]",
                mobilePane === "dialog" ? "block" : "hidden xl:block",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#8b7a55]">
                    Диалог
                  </p>
                  <h2 className="mt-2 text-lg text-[#1f2a1f]">
                    {selectedThread
                      ? selectedThreadTitle
                      : selectedFarm
                        ? normalizeText(selectedFarm.farmName, "Хозяйство")
                        : "Тема не выбрана"}
                  </h2>
                  {selectedFarm ? (
                    <p className="mt-1 text-xs text-[#7a715f]">
                      {normalizeText(selectedFarm.farmName, "Хозяйство")}
                    </p>
                  ) : null}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigateToSection("topics")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e2d5bc] px-4 py-2 text-sm text-[#6c5e43] xl:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />К темам
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAiForFarm}
                    disabled={!selectedFarm}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d7c8a9] bg-[#fff7e8] px-4 py-2 text-sm text-[#6d5724] transition-colors hover:border-[#b9974f] hover:text-[#3c331f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Bot className="h-4 w-4" />
                    Спросить A-RAI
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertAiReply}
                    disabled={!latestAssistantReply}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8d6c7] bg-white px-4 py-2 text-sm text-[#5f594f] transition-colors hover:border-[#b7b29d] hover:text-[#1f2a1f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Вставить ответ A-RAI
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={clsx(
                      "flex",
                      message.direction === "outbound"
                        ? "justify-end"
                        : "justify-start",
                    )}
                  >
                    <div
                      className={clsx(
                        "max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm",
                        message.direction === "outbound"
                          ? "rounded-br-md bg-[#334f37] text-white"
                          : "rounded-bl-md bg-[#f5eee2] text-[#2f2a23]",
                      )}
                    >
                      <div className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {localizeSystemMessageText(message.messageText)}
                      </div>
                      <div
                        className={clsx(
                          "mt-2 text-[11px]",
                          message.direction === "outbound"
                            ? "text-white/70"
                            : "text-[#8a7a56]",
                        )}
                      >
                        {formatDateTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}

                {selectedThreadKey && messages.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-[#d8ccb4] px-4 py-6 text-sm text-[#756c5b]">
                    В этой теме пока нет сообщений.
                  </div>
                ) : null}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#eadfca] bg-[#fcfaf6] p-4">
                <label className="text-[11px] uppercase tracking-[0.28em] text-[#8b7a55]">
                  Ответ хозяйству
                </label>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Ответ менеджера будет отправлен только в выбранную тему в Telegram."
                  className="mt-3 min-h-[140px] w-full rounded-[1.25rem] border border-[#ddd0b7] bg-white px-4 py-3 text-sm text-[#1f2a1f] outline-none transition-colors focus:border-[#b9974f]"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#756c5b]">
                    A-RAI не отправляет ответы наружу автоматически. Отправка
                    идёт только отсюда.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleReplySubmit()}
                    disabled={
                      !selectedThreadKey ||
                      !replyText.trim() ||
                      isSubmittingReply
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-[#1f2a1f] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#344534] disabled:cursor-not-allowed disabled:bg-[#9ca39a]"
                  >
                    {isSubmittingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Отправить
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <section className="rounded-[1.75rem] border border-black/5 bg-white/90 p-4 shadow-[0_20px_60px_rgba(94,72,32,0.05)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8b7a55]">
                  A-RAI
                </p>
                <h2 className="mt-2 text-lg text-[#1f2a1f]">
                  {selectedFarm
                    ? `Контекст: ${normalizeText(selectedFarm.farmName, "Хозяйство")}`
                    : "Выберите хозяйство во вкладке «Хозяйства»"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    startNewChat();
                    dispatchAi("OPEN");
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-[#d7c8a9] bg-[#fff7e8] px-4 py-2 text-sm text-[#6d5724] transition-colors hover:border-[#b9974f] hover:text-[#3c331f]"
              >
                <Sparkles className="h-4 w-4" />
                Новая ветка
              </button>
            </div>

            <AiChatPanel variant="shell" />
          </section>
        )}
      </div>
    </div>
  );
}
