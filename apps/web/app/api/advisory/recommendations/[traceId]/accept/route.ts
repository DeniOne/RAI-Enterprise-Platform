import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ traceId: string }> },
) {
  try {
    const { traceId } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const response = await fetch(
      `http://localhost:4000/api/advisory/recommendations/${traceId}/accept`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": `advisory-accept:${traceId}`,
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("advisory accept proxy failed", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервиса" }, { status: 500 });
  }
}
