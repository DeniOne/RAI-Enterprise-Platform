'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useAiChatStore, PanelMode, RiskLevel } from '@/lib/stores/ai-chat-store';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';
import { Send, AlertTriangle, ShieldCheck, PanelRightClose, Mic, Square } from 'lucide-react';
import clsx from 'clsx';
import { useAuthority } from '@/core/governance/AuthorityContext';
import { AiChatSessionsStrip } from './AiChatSessionsStrip';

interface AiChatPanelProps {
    variant?: 'overlay' | 'shell';
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
    { value: 'auto', label: 'Авто' },
    { value: 'ru-RU', label: 'Русский' },
    { value: 'en-US', label: 'English' },
    { value: 'uk-UA', label: 'Українська' },
    { value: 'kk-KZ', label: 'Қазақша' },
];

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const recognition = (
        window as Window & {
            SpeechRecognition?: SpeechRecognitionCtor;
            webkitSpeechRecognition?: SpeechRecognitionCtor;
        }
    );

    return recognition.SpeechRecognition ?? recognition.webkitSpeechRecognition ?? null;
}

export function AiChatPanel({ variant = 'overlay' }: AiChatPanelProps) {
    const {
        messages,
        isLoading,
        sendMessage,
        dispatch,
        fsmState,
        panelMode,
    } = useAiChatStore();
    const context = useWorkspaceContextStore((s) => s.context);
    const authority = useAuthority();
    const [inputText, setInputText] = useState('');
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [selectedRecognitionLanguage, setSelectedRecognitionLanguage] = useState('auto');
    const [voiceStatusText, setVoiceStatusText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const dictatedTextRef = useRef('');

    const getDisplayMemoryItems = (items: NonNullable<typeof messages[number]['memoryUsed']>) =>
        items.filter((item) => item.kind !== 'profile');

    // Скролл вниз при загрузке и новом сообщении
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Фокус на инпут при открытии
    useEffect(() => {
        if (fsmState === 'open' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [fsmState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (fsmState === 'closed') return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
            setInputText('');
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
        recognition.lang = selectedRecognitionLanguage === 'auto'
            ? (typeof navigator !== 'undefined' ? navigator.language : 'ru-RU')
            : selectedRecognitionLanguage;
        recognition.continuous = false;
        recognition.interimResults = true;
        dictatedTextRef.current = '';
        setVoiceStatusText('Слушаю...');

        recognition.onresult = (event) => {
            let transcript = '';
            let hasFinalResult = false;

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                transcript += event.results[index][0]?.transcript ?? '';
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
            setVoiceStatusText(hasFinalResult ? 'Распознавание завершено' : 'Слушаю...');
        };

        recognition.onerror = () => {
            setIsVoiceRecording(false);
            recognitionRef.current = null;
            setVoiceStatusText('Не удалось распознать речь');
        };

        recognition.onend = () => {
            setIsVoiceRecording(false);
            recognitionRef.current = null;
            const finalText = dictatedTextRef.current.trim();

            if (finalText && !isLoading) {
                sendMessage(finalText);
                setInputText('');
                dictatedTextRef.current = '';
                setVoiceStatusText('Отправлено');
                window.setTimeout(() => {
                    setVoiceStatusText('');
                }, 1400);
                return;
            }

            window.setTimeout(() => {
                setVoiceStatusText('');
            }, 1400);
        };

        recognitionRef.current = recognition;
        setIsVoiceRecording(true);
        recognition.start();
    };

    const getRiskColor = (level?: RiskLevel) => {
        switch (level) {
            case 'R0': return 'bg-gray-100 text-gray-600';
            case 'R1': return 'bg-blue-50 text-blue-600 border border-blue-200';
            case 'R2': return 'bg-amber-50 text-amber-600 border border-amber-200';
            case 'R3':
            case 'R4': return 'bg-red-50 text-red-600 border border-red-200 font-medium';
            default: return 'bg-gray-50';
        }
    };

    const panelWidthClass: Record<PanelMode, string> = {
        dock: 'w-[760px] max-w-[calc(100vw-32px)] h-[600px]',
        focus: 'w-[min(1120px,calc(100vw-32px))] h-[min(88vh,760px)]',
    };

    const shellWidthClass: Record<PanelMode, string> = {
        dock: 'w-full h-[calc(100vh-224px)]',
        focus: 'w-full h-[calc(100vh-224px)]',
    };

    return (
        <div
            className={clsx(
                'flex overflow-hidden border border-black/10 bg-white',
                variant === 'shell' ? shellWidthClass[panelMode] : panelWidthClass[panelMode],
                variant === 'shell' ? 'rounded-3xl shadow-sm' : 'rounded-2xl shadow-2xl'
            )}
        >
            <div className="flex min-w-0 min-h-0 flex-1 flex-col">

                {/* Шапка */}
                <div className="shrink-0 border-b border-black/5 bg-[#FCFBF8] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <h3 className="truncate text-base font-medium text-gray-950">RAI Ассистент</h3>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                В сети
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {variant === 'shell' ? (
                                <span className="hidden text-[10px] uppercase tracking-[0.18em] text-neutral-400 sm:inline">
                                    AI Dock
                                </span>
                            ) : null}
                            {variant !== 'shell' ? (
                                <button
                                    onClick={() => dispatch('CLOSE')}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-900"
                                    aria-label="Закрыть чат"
                                >
                                    <PanelRightClose className="w-4 h-4" />
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {variant === 'shell' ? <AiChatSessionsStrip /> : null}

                <div className="min-h-0 flex-1 overflow-hidden">
                    {/* Контекстная справка (Empty state) */}
                    {messages.length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center bg-gray-50/20 p-6 text-center">
                            <ShieldCheck className="mb-3 h-10 w-10 text-gray-300" />
                            <p className="mb-1 text-sm font-medium text-gray-900">Операционный помощник</p>
                            <p className="max-w-sm text-xs leading-5 text-gray-500">
                                {context?.route
                                    ? `Я вижу контекст страницы: ${context.route}. Сформулируйте задачу или задайте вопрос.`
                                    : 'В данный момент не выбран специфический контекст.'}
                            </p>
                        </div>
                    )}

                    {/* Зона сообщений */}
                    {messages.length > 0 && (
                        <div className="flex h-full min-h-0 flex-col">
                            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>

                                        {/* Пузырь сообщения */}
                                        <div className={`
                 max-w-[82%] px-3.5 py-2.5 text-[13px] leading-5
                 ${m.role === 'user'
                                                ? 'bg-gray-900 text-white rounded-2xl rounded-br-sm'
                                                : `rounded-2xl rounded-bl-sm ${getRiskColor(m.riskLevel)}`
                                            }
               `}>
                                            {/* Governance / Risk tag для ассистента */}
                                            {m.role === 'assistant' && m.riskLevel && m.riskLevel !== 'R0' && (
                                                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-black/10 text-xs uppercase tracking-wider opacity-80 font-medium">
                                                    {['R2', 'R3', 'R4'].includes(m.riskLevel) && <AlertTriangle className="w-3.5 h-3.5" />}
                                                    [{m.riskLevel}] Guard
                                                </div>
                                            )}

                                            <p className="whitespace-pre-wrap">{m.content}</p>

                                            {m.role === 'assistant' && authority.canApprove && m.memoryUsed && getDisplayMemoryItems(m.memoryUsed).length > 0 && (
                                                <div className="mt-2 rounded-xl border border-black/10 bg-white/70 p-3 text-xs text-gray-700">
                                                    <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-gray-400">
                                                        Использованная память
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {getDisplayMemoryItems(m.memoryUsed).map((item, index) => (
                                                            <div key={`${m.id}-memory-${index}`} className="flex flex-wrap items-center gap-2">
                                                                <span>{item.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Time */}
                                        <span className="mx-1 mt-1 text-[10px] text-gray-400">
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                {/* Input */}
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
                                'absolute right-12 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 transition-colors',
                                !voiceSupported || isLoading
                                    ? 'text-gray-300'
                                    : isVoiceRecording
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-black'
                            )}
                            aria-label={isVoiceRecording ? 'Остановить голосовой ввод' : 'Включить голосовой ввод'}
                            title={
                                !voiceSupported
                                    ? 'Голосовой ввод недоступен в этом браузере'
                                    : isVoiceRecording
                                        ? 'Остановить голосовой ввод'
                                        : 'Голосовой ввод'
                            }
                        >
                            {isVoiceRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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
                                <span className={clsx('ml-2', isVoiceRecording ? 'text-red-600' : voiceStatusText ? 'text-gray-500' : '')}>
                                    {isVoiceRecording ? '• Слушаю...' : voiceStatusText ? `• ${voiceStatusText}` : '• Микрофон готов'}
                                </span>
                            ) : null}
                        </div>
                        {voiceSupported ? (
                            <label className="flex shrink-0 items-center gap-2 text-[10px] text-gray-400">
                                <span>Язык</span>
                                <select
                                    value={selectedRecognitionLanguage}
                                    onChange={(event) => setSelectedRecognitionLanguage(event.target.value)}
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
        </div>
    );
}
