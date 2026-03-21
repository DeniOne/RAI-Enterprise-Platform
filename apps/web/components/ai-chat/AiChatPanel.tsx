"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  type ChiefAgronomistReviewRequest,
  type ChiefAgronomistReviewResponse,
} from "@/lib/api";
import {
  useAiChatStore,
  PanelMode,
  RiskLevel,
  type ChatTrustSummary,
} from "@/lib/stores/ai-chat-store";
import { webFeatureFlags } from "@/lib/feature-flags";
import { useWorkspaceContextStore } from "@/lib/stores/workspace-context-store";
import {
  Send,
  AlertTriangle,
  ShieldCheck,
  PanelRightClose,
  Mic,
  Square,
} from "lucide-react";
import clsx from "clsx";
import { useAuthority } from "@/core/governance/AuthorityContext";
import { AiChatSessionsStrip } from "./AiChatSessionsStrip";

interface AiChatPanelProps {
  variant?: "overlay" | "shell";
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const RECOGNITION_LANGUAGES = [
  { value: "auto", label: "Авто" },
  { value: "ru-RU", label: "Русский" },
  { value: "en-US", label: "Английский" },
  { value: "uk-UA", label: "Украинский" },
  { value: "kk-KZ", label: "Казахский" },
];

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const recognition = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return (
    recognition.SpeechRecognition ?? recognition.webkitSpeechRecognition ?? null
  );
}

function formatUiError(error: unknown, fallback: string) {
  const payload = (error as { response?: { data?: unknown; status?: number } })?.response?.data;
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (Array.isArray((payload as { message?: unknown })?.message)) {
    const message = ((payload as { message?: string[] }).message ?? [])
      .map((item) => String(item))
      .filter(Boolean)
      .join("; ");
    if (message) return message;
  }

  if (typeof (payload as { message?: unknown })?.message === "string") {
    return (payload as { message: string }).message;
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (status === 500) {
    return "Сервис временно недоступен. Повторите действие.";
  }

  return fallback;
}

function reviewStatusLabel(status: string) {
  const map: Record<string, string> = {
    completed: "завершено",
    needs_more_context: "нужно больше контекста",
    degraded: "ограниченный режим",
  };
  return map[status] ?? status;
}

function riskTierLabel(tier: string) {
  const map: Record<string, string> = {
    low: "низкий",
    medium: "средний",
    high: "высокий",
  };
  return map[tier] ?? tier;
}

function outcomeActionLabel(action: string) {
  const map: Record<string, string> = {
    accept: "принято",
    hand_off: "передано человеку",
    create_task: "создана задача",
  };
  return map[action] ?? action;
}

function formatTrustBranchCount(count: number) {
  if (count === 1) {
    return "1 ветка";
  }
  if (count > 1 && count < 5) {
    return `${count} ветки`;
  }
  return `${count} веток`;
}

function getTrustSummaryClass(verdict: ChatTrustSummary["verdict"]) {
  switch (verdict) {
    case "VERIFIED":
      return "border-emerald-200 bg-emerald-50/90 text-emerald-900";
    case "PARTIAL":
    case "UNVERIFIED":
      return "border-amber-200 bg-amber-50/90 text-amber-900";
    case "CONFLICTED":
    case "REJECTED":
      return "border-red-200 bg-red-50/90 text-red-900";
    default:
      return "border-black/10 bg-white/80 text-gray-800";
  }
}

export function AiChatPanel({ variant = "overlay" }: AiChatPanelProps) {
  const router = useRouter();
  const memoryHintsEnabled = webFeatureFlags.memoryHints;
  const chiefAgronomistPanelEnabled = webFeatureFlags.chiefAgronomistPanel;
  const { messages, isLoading, sendMessage, dispatch, fsmState, panelMode } =
    useAiChatStore();
  const context = useWorkspaceContextStore((s) => s.context);
  const authority = useAuthority();
  const [inputText, setInputText] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [selectedRecognitionLanguage, setSelectedRecognitionLanguage] =
    useState("auto");
  const [voiceStatusText, setVoiceStatusText] = useState("");
  const [expandedMemoryMessageIds, setExpandedMemoryMessageIds] = useState<
    string[]
  >([]);
  const [expertReviewLoading, setExpertReviewLoading] = useState(false);
  const [expertReviewError, setExpertReviewError] = useState<string | null>(null);
  const [expertReview, setExpertReview] =
    useState<ChiefAgronomistReviewResponse | null>(null);
  const [expertOutcomeLoading, setExpertOutcomeLoading] = useState<string | null>(null);
  const [expertOutcomeNote, setExpertOutcomeNote] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const dictatedTextRef = useRef("");

  const getDisplayMemoryItems = (
    items: NonNullable<(typeof messages)[number]["memoryUsed"]>,
  ) => items;

  const toggleMemoryDetails = (messageId: string) => {
    setExpandedMemoryMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId],
    );
  };

  const buildFallbackMemoryHint = (
    items: NonNullable<(typeof messages)[number]["memoryUsed"]> | undefined,
  ) => {
    if (!items?.length) return null;
    const first = items.find((item) => item.kind !== "profile") ?? items[0];
    if (!first) return null;
    if (first.kind === "profile") {
      return "Учтены предпочтения и политика компании";
    }
    if (first.kind === "active_alert") {
      return "Учтены активные отклонения и сигналы риска";
    }
    return "Учтён похожий кейс прошлого сезона";
  };

  const getVisibleSuggestedActions = (
    actions:
      | NonNullable<(typeof messages)[number]["suggestedActions"]>
      | undefined,
  ) => {
    if (!Array.isArray(actions)) {
      return [];
    }

    return actions.filter((action) => {
      if (action.kind === "expert_review") {
        return chiefAgronomistPanelEnabled;
      }
      return true;
    });
  };

  const handleSuggestedAction = async (
    action: NonNullable<(typeof messages)[number]["suggestedActions"]>[number],
  ) => {
    if (action.kind === "expert_review") {
      if (!chiefAgronomistPanelEnabled) {
        setExpertReview(null);
        setExpertReviewError(
          "Экспертная эскалация сейчас недоступна: функция отключена в настройках релиза.",
        );
        return;
      }
      try {
        setExpertReviewError(null);
        setExpertReviewLoading(true);
        const derivedContext = deriveExpertReviewContext(context);
        const actionPayload = (action.payload ?? {}) as Partial<ChiefAgronomistReviewRequest>;
        const payload: ChiefAgronomistReviewRequest = {
          ...derivedContext,
          ...actionPayload,
          entityType: actionPayload.entityType ?? derivedContext.entityType,
          entityId: actionPayload.entityId ?? derivedContext.entityId,
          reason:
            actionPayload.reason ??
            "Контекстная экспертная проверка по текущей рабочей сущности",
          ...(actionPayload.fieldId ?? derivedContext.fieldId
            ? { fieldId: actionPayload.fieldId ?? derivedContext.fieldId }
            : {}),
          ...(actionPayload.seasonId ?? derivedContext.seasonId
            ? { seasonId: actionPayload.seasonId ?? derivedContext.seasonId }
            : {}),
          ...(actionPayload.planId ?? derivedContext.planId
            ? { planId: actionPayload.planId ?? derivedContext.planId }
            : {}),
          ...(actionPayload.workspaceRoute ?? derivedContext.workspaceRoute
            ? {
                workspaceRoute:
                  actionPayload.workspaceRoute ?? derivedContext.workspaceRoute,
              }
            : {}),
          ...(actionPayload.traceParentId
            ? { traceParentId: actionPayload.traceParentId }
            : {}),
        };
        const response = await api.experts.chiefAgronomistReview(payload);
        setExpertReview(response.data);
      } catch (error) {
        setExpertReviewError(formatUiError(error, "Не удалось получить экспертное заключение"));
      } finally {
        setExpertReviewLoading(false);
      }
      return;
    }

    if (action.kind === "route" && action.href) {
      router.push(action.href);
      return;
    }

    if (action.kind === "tool" && action.toolName === "echo_message") {
      const message = typeof action.payload?.message === "string"
        ? action.payload.message
        : "";
      if (message) {
        setInputText(message);
      }
      return;
    }

    if (action.kind === "tool" && action.toolName === "workspace_snapshot") {
      await sendMessage("Сними срез рабочего контекста");
      return;
    }
  };

  const handleExpertOutcome = async (
    action: "accept" | "hand_off" | "create_task",
  ) => {
    if (!expertReview) return;
    try {
      setExpertReviewError(null);
      setExpertOutcomeLoading(action);
      const response = await api.experts.applyReviewOutcome(expertReview.reviewId, {
        action,
        ...(expertOutcomeNote.trim() ? { note: expertOutcomeNote.trim() } : {}),
      });
      setExpertReview(response.data);
      setExpertOutcomeNote("");
    } catch (error) {
      setExpertReviewError(formatUiError(error, "Не удалось применить итоговое действие"));
    } finally {
      setExpertOutcomeLoading(null);
    }
  };

  // Прокрутка вниз при загрузке и новом сообщении
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (fsmState === "open" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [fsmState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fsmState === "closed") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fsmState]);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText);
      setInputText("");
    }
  };

  const handleVoiceToggle = () => {
    if (isVoiceRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang =
      selectedRecognitionLanguage === "auto"
        ? typeof navigator !== "undefined"
          ? navigator.language
          : "ru-RU"
        : selectedRecognitionLanguage;
    recognition.continuous = false;
    recognition.interimResults = true;
    dictatedTextRef.current = "";
    setVoiceStatusText("Слушаю...");

    recognition.onresult = (event) => {
      let transcript = "";
      let hasFinalResult = false;

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        transcript += event.results[index][0]?.transcript ?? "";
        if (event.results[index]?.isFinal) {
          hasFinalResult = true;
        }
      }

      setInputText((current) => {
        const normalized = transcript.trim();
        if (!normalized) {
          return current;
        }

        return normalized;
      });
      dictatedTextRef.current = transcript.trim();
      setVoiceStatusText(
        hasFinalResult ? "Распознавание завершено" : "Слушаю...",
      );
    };

    recognition.onerror = () => {
      setIsVoiceRecording(false);
      recognitionRef.current = null;
      setVoiceStatusText("Не удалось распознать речь");
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
      recognitionRef.current = null;
      const finalText = dictatedTextRef.current.trim();

      if (finalText && !isLoading) {
        sendMessage(finalText);
        setInputText("");
        dictatedTextRef.current = "";
        setVoiceStatusText("Отправлено");
        window.setTimeout(() => {
          setVoiceStatusText("");
        }, 1400);
        return;
      }

      window.setTimeout(() => {
        setVoiceStatusText("");
      }, 1400);
    };

    recognitionRef.current = recognition;
    setIsVoiceRecording(true);
    recognition.start();
  };

  const getRiskColor = (level?: RiskLevel) => {
    switch (level) {
      case "R0":
        return "bg-gray-100 text-gray-600";
      case "R1":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "R2":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "R3":
      case "R4":
        return "bg-red-50 text-red-600 border border-red-200 font-medium";
      default:
        return "bg-gray-50";
    }
  };

  const panelWidthClass: Record<PanelMode, string> = {
    dock: "w-[760px] max-w-[calc(100vw-32px)] h-[600px]",
    focus: "w-[min(1120px,calc(100vw-32px))] h-[min(88vh,760px)]",
  };

  const shellWidthClass: Record<PanelMode, string> = {
    dock: "w-full h-[calc(100vh-224px)]",
    focus: "w-full h-[calc(100vh-224px)]",
  };

  return (
    <div
      className={clsx(
        "flex overflow-hidden border border-black/10 bg-white",
        variant === "shell"
          ? shellWidthClass[panelMode]
          : panelWidthClass[panelMode],
        variant === "shell"
          ? "rounded-3xl shadow-sm"
          : "rounded-2xl shadow-2xl",
      )}
    >
      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        {/* Верхняя панель */}
        <div className="shrink-0 border-b border-black/5 bg-[#FCFBF8] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <h3 className="truncate text-base font-medium text-gray-950">
                A-RAI
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />В
                сети
              </span>
            </div>
            <div className="flex items-center gap-2">
              {variant === "shell" ? (
                <span className="hidden text-[10px] uppercase tracking-[0.18em] text-neutral-400 sm:inline">
                  Панель ИИ
                </span>
              ) : null}
              {variant !== "shell" ? (
                <button
                  onClick={() => dispatch("CLOSE")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-900"
                  aria-label="Закрыть чат"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {variant === "shell" ? <AiChatSessionsStrip /> : null}

        <div className="min-h-0 flex-1 overflow-hidden">
          {/* Контекстная справка */}
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center bg-gray-50/20 p-6 text-center">
              <ShieldCheck className="mb-3 h-10 w-10 text-gray-300" />
              <p className="mb-1 text-sm font-medium text-gray-900">
                Операционный помощник
              </p>
              <p className="max-w-sm text-xs leading-5 text-gray-500">
                {context?.route
                  ? `Я вижу контекст страницы: ${context.route}. Сформулируйте задачу или задайте вопрос.`
                  : "В данный момент не выбран специфический контекст."}
              </p>
            </div>
          )}

          {/* Область сообщений */}
          {messages.length > 0 && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {/* Сообщение */}
                    <div
                      className={`
                 max-w-[82%] px-3.5 py-2.5 text-[13px] leading-5
                 ${
                   m.role === "user"
                     ? "bg-gray-900 text-white rounded-2xl rounded-br-sm"
                     : `rounded-2xl rounded-bl-sm ${getRiskColor(m.riskLevel)}`
                 }
               `}
                    >
                      {/* Метка уровня контроля */}
                      {m.role === "assistant" &&
                        m.riskLevel &&
                        m.riskLevel !== "R0" && (
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-black/10 text-xs uppercase tracking-wider opacity-80 font-medium">
                            {["R2", "R3", "R4"].includes(m.riskLevel) && (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                            [{m.riskLevel}] Контроль
                          </div>
                        )}

                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {m.role === "assistant" && m.trustSummary && (
                        <div
                          className={clsx(
                            "mt-2 rounded-xl border p-3 text-xs",
                            getTrustSummaryClass(m.trustSummary.verdict),
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                                Статус подтверждения
                              </div>
                              <div className="mt-1 font-medium">
                                {m.trustSummary.label}
                              </div>
                            </div>
                            <div className="shrink-0 rounded-full border border-current/15 bg-white/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                              {formatTrustBranchCount(m.trustSummary.branchCount)}
                            </div>
                          </div>
                          <div className="mt-2 text-[12px] leading-5">
                            {m.trustSummary.summary}
                          </div>
                          {m.trustSummary.disclosure.length > 0 ? (
                            <div className="mt-2 space-y-1.5 border-t border-current/15 pt-2 text-[11px] leading-4">
                              {m.trustSummary.disclosure.slice(0, 2).map((item) => (
                                <div key={`${m.id}-trust-${item}`}>{item}</div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {memoryHintsEnabled &&
                        m.role === "assistant" &&
                        (m.memorySummary?.primaryHint ||
                          buildFallbackMemoryHint(m.memoryUsed)) && (
                          <div className="mt-2 rounded-xl border border-black/10 bg-white/70 p-3 text-xs text-gray-700">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-gray-400">
                                  Почему этот ответ?
                                </div>
                                <div className="mt-1 text-[12px] leading-5 text-gray-700">
                                  {m.memorySummary?.primaryHint ??
                                    buildFallbackMemoryHint(m.memoryUsed)}
                                </div>
                              </div>
                              {authority.canApprove &&
                              m.memorySummary?.detailsAvailable &&
                              m.memoryUsed?.length ? (
                                <button
                                  type="button"
                                  onClick={() => toggleMemoryDetails(m.id)}
                                  className="shrink-0 rounded-lg border border-black/10 bg-white px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900"
                                >
                                  {expandedMemoryMessageIds.includes(m.id)
                                    ? "Скрыть"
                                    : "Детали"}
                                </button>
                              ) : null}
                            </div>
                            {authority.canApprove &&
                            expandedMemoryMessageIds.includes(m.id) &&
                            m.memoryUsed?.length ? (
                              <div className="mt-3 space-y-1.5 border-t border-black/10 pt-3">
                                {getDisplayMemoryItems(m.memoryUsed).map(
                                  (item, index) => (
                                    <div
                                      key={`${m.id}-memory-${index}`}
                                      className="flex flex-wrap items-center gap-2"
                                    >
                                      <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-gray-500">
                                        {item.kind}
                                      </span>
                                      <span>{item.label}</span>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}

                      {m.role === "assistant" &&
                        getVisibleSuggestedActions(m.suggestedActions).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getVisibleSuggestedActions(m.suggestedActions)
                              .slice(0, 3)
                              .map((action, index) => (
                              <button
                                key={`${m.id}-action-${index}`}
                                type="button"
                                onClick={() => void handleSuggestedAction(action)}
                                className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:bg-black/5 hover:text-gray-950"
                              >
                                {action.title}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Время */}
                    <span className="mx-1 mt-1 text-[10px] text-gray-400">
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 px-2 text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce"></span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Поле ввода */}
        <div className="p-4 bg-white border-t border-black/5 shrink-0">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Опишите задачу (Ctrl/Cmd+K)"
              className="w-full rounded-xl border border-black/10 bg-gray-50 py-3 pl-4 pr-20 text-sm font-normal text-gray-900 transition-all placeholder:text-gray-400 focus:border-black/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={!voiceSupported || isLoading}
              className={clsx(
                "absolute right-12 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 transition-colors",
                !voiceSupported || isLoading
                  ? "text-gray-300"
                  : isVoiceRecording
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "text-gray-400 hover:bg-gray-100 hover:text-black",
              )}
              aria-label={
                isVoiceRecording
                  ? "Остановить голосовой ввод"
                  : "Включить голосовой ввод"
              }
              title={
                !voiceSupported
                  ? "Голосовой ввод недоступен в этом браузере"
                  : isVoiceRecording
                    ? "Остановить голосовой ввод"
                    : "Голосовой ввод"
              }
            >
              {isVoiceRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              aria-label="Отправить запрос"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0 text-[10px] text-gray-400">
              <span>Ctrl/Cmd+K: ввод</span>
              {voiceSupported ? (
                <span
                  className={clsx(
                    "ml-2",
                    isVoiceRecording
                      ? "text-red-600"
                      : voiceStatusText
                        ? "text-gray-500"
                        : "",
                  )}
                >
                  {isVoiceRecording
                    ? "• Слушаю..."
                    : voiceStatusText
                      ? `• ${voiceStatusText}`
                      : "• Микрофон готов"}
                </span>
              ) : null}
            </div>
            {voiceSupported ? (
              <label className="flex shrink-0 items-center gap-2 text-[10px] text-gray-400">
                <span>Язык</span>
                <select
                  value={selectedRecognitionLanguage}
                  onChange={(event) =>
                    setSelectedRecognitionLanguage(event.target.value)
                  }
                  disabled={isVoiceRecording}
                  className="rounded-md border border-black/10 bg-white px-2 py-1 text-[10px] text-gray-600 outline-none transition-colors focus:border-black/20"
                  aria-label="Язык голосового ввода"
                >
                  {RECOGNITION_LANGUAGES.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </div>
      </div>
      {chiefAgronomistPanelEnabled &&
      (expertReview || expertReviewLoading || expertReviewError) && (
        <div className="absolute inset-0 z-20 flex justify-end bg-black/20 backdrop-blur-[1px]">
          <div className="h-full w-full max-w-md border-l border-black/10 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                  Экспертная эскалация
                </p>
                <h3 className="mt-1 text-lg font-medium text-[#030213]">
                  Экспертное заключение
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpertReview(null);
                  setExpertReviewError(null);
                }}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>

            {expertReviewLoading && (
              <div className="mt-6 rounded-2xl border border-black/10 bg-slate-50 px-4 py-5 text-[13px] text-[#717182]">
                Выполняется экспертная эскалация по текущему контексту...
              </div>
            )}

            {expertReviewError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-[13px] text-red-700">
                {expertReviewError}
              </div>
            )}

            {expertReview && (
              <div className="mt-6 space-y-4 overflow-y-auto pb-8">
                <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">
                    Вердикт
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#030213]">
                    {expertReview.verdict}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <CompactReviewCard label="Статус" value={reviewStatusLabel(expertReview.status)} />
                  <CompactReviewCard label="Уровень риска" value={riskTierLabel(expertReview.riskTier)} />
                </div>
                {(expertReview.outcomeAction || expertReview.resolvedAt) && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-800">
                      Итог
                    </p>
                    <p className="mt-2 text-[13px] text-emerald-900">
                      {expertReview.outcomeAction
                        ? outcomeActionLabel(expertReview.outcomeAction)
                        : "решено"}
                      {expertReview.resolvedAt ? ` • ${new Date(expertReview.resolvedAt).toLocaleString("ru-RU")}` : ""}
                    </p>
                    {expertReview.outcomeNote && (
                      <p className="mt-2 text-[13px] text-emerald-900">
                        {expertReview.outcomeNote}
                      </p>
                    )}
                    {expertReview.createdTaskId && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <p className="text-[13px] text-emerald-900">
                          ID задачи: {expertReview.createdTaskId}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/front-office/tasks/${expertReview.createdTaskId}`,
                            )
                          }
                          className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-800 transition hover:bg-emerald-100"
                        >
                          Открыть задачу
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <ReviewList
                  title="Что делать сейчас"
                  items={expertReview.actionsNow}
                  emptyLabel="Пока нет прямых действий."
                />
                <ReviewList
                  title="Альтернативы"
                  items={expertReview.alternatives}
                  emptyLabel="Альтернативы не предложены."
                />
                <ReviewList
                  title="На чём основано"
                  items={expertReview.basedOn}
                  emptyLabel="Основания не указаны."
                />
                <ReviewList
                  title="Чего не хватает"
                  items={expertReview.missingContext ?? []}
                  emptyLabel="Дополнительный контекст не требуется."
                />
                <textarea
                  value={expertOutcomeNote}
                  onChange={(event) => setExpertOutcomeNote(event.target.value)}
                  className="w-full min-h-[72px] rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] text-[#030213] outline-none transition focus:border-black/30"
                  placeholder="Комментарий к решению (опционально)"
                />
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => void handleExpertOutcome("accept")}
                    disabled={expertOutcomeLoading !== null}
                    className="rounded-xl bg-[#030213] px-4 py-3 text-[13px] font-medium text-white transition hover:bg-black disabled:opacity-50"
                  >
                    {expertOutcomeLoading === "accept" ? "Применение..." : "Принять"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExpertOutcome("hand_off")}
                    disabled={expertOutcomeLoading !== null}
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[13px] font-medium text-[#030213] transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {expertOutcomeLoading === "hand_off" ? "Передача..." : "Передать человеку"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExpertOutcome("create_task")}
                    disabled={expertOutcomeLoading !== null}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                  >
                    {expertOutcomeLoading === "create_task" ? "Создание..." : "Создать задачу"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function deriveExpertReviewContext(
  context: ReturnType<typeof useWorkspaceContextStore.getState>["context"],
): Omit<ChiefAgronomistReviewRequest, "reason" | "traceParentId"> {
  const fieldRef = context.activeEntityRefs?.find((ref) => ref.kind === "field");
  const techMapRef = context.activeEntityRefs?.find((ref) => ref.kind === "techmap");
  const selected = context.selectedRowSummary;
  return {
    entityType:
      techMapRef || selected?.kind === "techmap"
        ? "techmap"
        : fieldRef || selected?.kind === "field"
          ? "field"
          : context.route.includes("/deviations")
            ? "deviation"
            : "field",
    entityId: selected?.id ?? techMapRef?.id ?? fieldRef?.id ?? context.route,
    fieldId: fieldRef?.id ?? (selected?.kind === "field" ? selected.id : undefined),
    seasonId:
      typeof context.filters?.seasonId === "string"
        ? context.filters.seasonId
        : typeof context.filters?.seasonId === "number"
          ? String(context.filters.seasonId)
          : undefined,
    planId:
      typeof context.filters?.planId === "string"
        ? context.filters.planId
        : typeof context.filters?.planId === "number"
          ? String(context.filters.planId)
          : undefined,
    workspaceRoute: context.route,
  };
}

function CompactReviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[#717182]">{label}</p>
      <p className="mt-2 text-[13px] font-medium text-[#030213]">{value}</p>
    </div>
  );
}

function ReviewList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#717182]">{title}</p>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={`${title}:${item}`} className="rounded-xl bg-slate-50 px-3 py-2 text-[13px] text-[#030213]">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-[#717182]">{emptyLabel}</p>
      )}
    </div>
  );
}
