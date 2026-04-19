import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "List expenses" });
}

export async function POST(request) {
  const body = await request.json();
  return NextResponse.json({ message: "Create expense", body }, { status: 201 });
}
