import { NextResponse } from "next/server";

type LeadPayload = {
  phone?: string;
  source?: string;
  page?: string;
  requestedAsset?: string;
};

const SERVICE_UNAVAILABLE_MESSAGE =
  "Приём заявок временно недоступен. Попробуйте ещё раз позже или используйте страницу контактов.";
const WEBHOOK_TIMEOUT_MS = 8_000;

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректное тело запроса." }, { status: 400 });
  }

  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ ok: false, error: "Укажите корректный номер телефона." }, { status: 400 });
  }

  const webhookUrl = process.env.GRIPIL_LEAD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("[gripil-web-awwwards] lead webhook is not configured");
    return NextResponse.json({ ok: false, error: SERVICE_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  const lead = {
    phone,
    source: payload.source || "unknown",
    page: payload.page || "/",
    requestedAsset: payload.requestedAsset || "unknown",
    submittedAt: new Date().toISOString(),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const webhookMessage = await response.text().catch(() => "");
      console.error("[gripil-web-awwwards] lead webhook rejected", {
        status: response.status,
        webhookMessage,
      });

      return NextResponse.json({ ok: false, error: SERVICE_UNAVAILABLE_MESSAGE }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[gripil-web-awwwards] lead webhook failed", error);
    return NextResponse.json({ ok: false, error: SERVICE_UNAVAILABLE_MESSAGE }, { status: 503 });
  } finally {
    clearTimeout(timeoutId);
  }
}
