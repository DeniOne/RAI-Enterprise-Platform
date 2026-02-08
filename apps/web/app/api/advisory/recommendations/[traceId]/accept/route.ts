import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  _request: Request,
  { params }: { params: { traceId: string } },
) {
  try {
    const token = cookies().get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      `http://localhost:4000/api/advisory/recommendations/${params.traceId}/accept`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("advisory accept proxy failed", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}