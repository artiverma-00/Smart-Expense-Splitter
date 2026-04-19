import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import { generateInsights } from "@/lib/gemini";
import { groupByCategory, getSpendingTrend } from "@/lib/utils";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    if (!groupId)
      return NextResponse.json({ error: "groupId required" }, { status: 400 });

    await connectDB();

    const expenses = await Expense.find({ group: groupId });
    const categoryBreakdown = groupByCategory(expenses);
    const trend = getSpendingTrend(expenses);

    const result = await generateInsights({
      categoryBreakdown,
      trend,
      totalExpenses: expenses.length,
    });

    return NextResponse.json({
      insights: result.insights,
      source: result.source,
      categoryBreakdown,
      trend,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
