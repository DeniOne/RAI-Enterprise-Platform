import { NextResponse } from "next/server";

const BACKEND_URL = (() => {
  const candidate = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (candidate && /^https?:\/\//i.test(candidate)) {
    return candidate.replace(/\/$/, "");
  }
  return "http://localhost:4000/api";
})();

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData || typeof initData !== "string") {
      return NextResponse.json(
        { error: "Telegram initData не предоставлен" },
        { status: 400 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/auth/telegram-webapp-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ initData }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.accessToken) {
      return NextResponse.json(
        {
          error:
            payload?.message ||
            payload?.error ||
            "Telegram WebApp login failed",
        },
        { status: response.status || 401 },
      );
    }

    const responseBody = NextResponse.json({
      success: true,
      user: payload.user,
    });

    responseBody.cookies.set("auth_token", payload.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return responseBody;
  } catch (error) {
    console.error("[TelegramWebAppAuth] Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка Telegram WebApp auth" },
      { status: 500 },
    );
  }
}
