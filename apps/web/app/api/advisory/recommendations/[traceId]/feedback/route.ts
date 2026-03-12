import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: { traceId: string } },
) {
  try {
    const token = cookies().get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : null;
    const outcome =
      typeof body?.outcome === "string" && body.outcome.trim().length > 0
        ? body.outcome.trim()
        : null;

    const response = await fetch(
      `http://localhost:4000/api/advisory/recommendations/${params.traceId}/feedback`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `advisory-feedback:${params.traceId}:${(reason ?? "no-reason")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9:_-]+/g, "-")
            .slice(0, 80)}:${(outcome ?? "no-outcome")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9:_-]+/g, "-")
            .slice(0, 80)}`,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("advisory feedback proxy failed", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
