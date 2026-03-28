import { NextResponse } from "next/server";

type LeadPayload = {
  phone?: string;
  source?: string;
  page?: string;
  requestedAsset?: string;
};

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса." }, { status: 400 });
  }

  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: "Укажите корректный номер телефона." }, { status: 400 });
  }

  const lead = {
    phone,
    source: payload.source || "unknown",
    page: payload.page || "/",
    requestedAsset: payload.requestedAsset || "unknown",
    submittedAt: new Date().toISOString(),
  };

  const webhookUrl = process.env.GRIPIL_LEAD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.info("[gripil-web-awwwards] lead captured without webhook", lead);
    return NextResponse.json({ ok: true, mode: "local-log" });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
      cache: "no-store",
    });

    if (!response.ok) {
      const webhookMessage = await response.text().catch(() => "");
      console.error("[gripil-web-awwwards] lead webhook rejected", {
        status: response.status,
        webhookMessage,
      });

      return NextResponse.json(
        { error: "Сервис приёма заявок временно недоступен. Повторите отправку позже." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, mode: "webhook" });
  } catch (error) {
    console.error("[gripil-web-awwwards] lead webhook failed", error);
    return NextResponse.json(
      { error: "Сервис приёма заявок временно недоступен. Повторите отправку позже." },
      { status: 502 }
    );
  }
}
