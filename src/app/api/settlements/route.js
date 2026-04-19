import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import Settlement from "@/models/Settlement";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { calculateBalances, minimizeTransactions } from "@/lib/utils";

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

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("splits.user", "name email");

    const settlements = await Settlement.find({ group: groupId })
      .populate("fromUser", "name email")
      .populate("toUser", "name email");

    const balances = calculateBalances(expenses, settlements);
    const transactions = minimizeTransactions(balances);

    return NextResponse.json({ balances, transactions, settlements });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { groupId, toUserId, amount, note } = await request.json();

    if (!groupId || !toUserId || !amount) {
      return NextResponse.json(
        { error: "groupId, toUserId, amount are required" },
        { status: 400 },
      );
    }

    const settlement = await Settlement.create({
      group: groupId,
      fromUser: decoded.userId,
      toUser: toUserId,
      amount,
      note,
    });

    await settlement.populate("fromUser", "name email");
    await settlement.populate("toUser", "name email");

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
