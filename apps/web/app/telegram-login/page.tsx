"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Button } from "@/components/ui";

export default function TelegramLoginPage() {
    const [telegramId, setTelegramId] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "waiting" | "approved" | "denied">("idle");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");

        try {
            const response = await fetch("http://localhost:4000/api/auth/telegram-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ telegramId }),
            });

            if (!response.ok) {
                throw new Error("User not found");
            }

            const data = await response.json();
            setSessionId(data.sessionId);
            setStatus("waiting");
        } catch (err) {
            setError("Пользователь с таким Telegram ID не найден");
        }
    };

    // Polling logic
    useEffect(() => {
        if (!sessionId || status !== "waiting") return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/auth/telegram-login/${sessionId}`);
                const data = await response.json();

                if (data.status === "approved") {
                    setStatus("approved");
                    // Save token to cookie for middleware and server-side access
                    document.cookie = `auth_token=${data.accessToken}; path=/; max-age=86400; SameSite=Lax`;
                    localStorage.setItem("access_token", data.accessToken);
                    clearInterval(interval);
                    router.push("/dashboard");
                } else if (data.status === "denied") {
                    setStatus("denied");
                    setError("Вход был отклонён");
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [sessionId, status, router]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <h1 className="text-2xl font-medium mb-6">Вход через Telegram</h1>

                {status === "idle" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Telegram ID"
                            type="text"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            placeholder="Введите ваш Telegram ID"
                            error={error}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Напишите <code>/start</code> боту <strong>@RAI_EP_Bot</strong>, чтобы узнать свой ID
                        </p>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                        >
                            Войти
                        </Button>
                    </form>
                )}

                {status === "waiting" && (
                    <div className="text-center py-6 space-y-4">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-medium">Ожидание подтверждения...</h2>
                        <p className="text-sm text-gray-500">
                            Проверьте Telegram — вам пришло сообщение с кнопкой подтверждения
                        </p>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setStatus("idle");
                                setSessionId(null);
                            }}
                            className="text-xs"
                        >
                            Отменить
                        </Button>
                    </div>
                )}

                {status === "denied" && (
                    <div className="text-center py-6 space-y-4">
                        <div className="text-4xl">🚫</div>
                        <h2 className="text-xl font-medium text-red-600">Вход отклонён</h2>
                        <p className="text-sm text-gray-500">
                            Попытка входа была отклонена в приложении Telegram
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setStatus("idle");
                                setSessionId(null);
                                setError("");
                            }}
                            className="w-full"
                        >
                            Попробовать снова
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
