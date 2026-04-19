import { NextResponse } from "next/server";
import { categorizeExpense } from "@/lib/gemini";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description } = await request.json();
    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });

    const result = await categorizeExpense(title, description);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
