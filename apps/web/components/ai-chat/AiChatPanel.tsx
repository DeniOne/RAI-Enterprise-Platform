'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useAiChatStore, RiskLevel } from '@/lib/stores/ai-chat-store';
import { X, Send, AlertTriangle, ShieldCheck } from 'lucide-react';

export function AiChatPanel() {
    const { messages, isLoading, sendMessage, dispatch, fsmState, context } = useAiChatStore();
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !isLoading) {
            sendMessage(inputText);
            setInputText('');
        }
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

    return (
        <div className="flex flex-col w-[420px] h-[600px] bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden">

            {/* Шапка */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-gray-50/50 shrink-0">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">RAI Ассистент</h3>
                    <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        в сети
                    </span>
                </div>
                <button
                    onClick={() => dispatch('CLOSE')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-900 transition-colors"
                    aria-label="Закрыть чат"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Контекстная справка (Empty state) */}
            {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
                    <ShieldCheck className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-sm font-medium text-gray-900 mb-2">Операционный помощник</p>
                    <p className="text-xs text-gray-500">
                        {context?.route
                            ? `Я вижу контекст страницы: ${context.route}. Сформулируйте задачу или задайте вопрос.`
                            : 'В данный момент не выбран специфический контекст.'}
                    </p>
                </div>
            )}

            {/* Зона сообщений */}
            {messages.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* Пузырь сообщения */}
                            <div className={`
                 max-w-[85%] px-4 py-3 text-sm 
                 ${m.role === 'user'
                                    ? 'bg-gray-900 text-white rounded-2xl rounded-br-sm'
                                    : `rounded-2xl rounded-bl-sm ${getRiskColor(m.riskLevel)}`
                                }
               `}>
                                {/* Governance / Risk tag для ассистента */}
                                {m.role === 'assistant' && m.riskLevel && m.riskLevel !== 'R0' && (
                                    <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-black/10 text-xs uppercase tracking-wider opacity-80 font-medium">
                                        {['R2', 'R3', 'R4'].includes(m.riskLevel) && <AlertTriangle className="w-3.5 h-3.5" />}
                                        [{m.riskLevel}] Institutional Guard
                                    </div>
                                )}

                                <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>

                            {/* Time */}
                            <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-400 px-2">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-black/5 shrink-0">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Опишите задачу (Ctrl+K)"
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-black/10 rounded-xl text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/20 focus:bg-white transition-all placeholder:text-gray-400"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 disabled:opacity-50 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
                        aria-label="Отправить запрос"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-400">Institutional LLM (Trace ID: th_active)</span>
                </div>
            </div>
        </div>
    );
}
