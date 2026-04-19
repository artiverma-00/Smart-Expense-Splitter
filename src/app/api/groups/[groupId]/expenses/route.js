import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { calculateEqualSplit } from "@/lib/utils";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const expenses = await Expense.find({ group: params.groupId })
      .populate("paidBy", "name email avatar")
      .populate("splits.user", "name email avatar")
      .sort({ date: -1 });

    return NextResponse.json({ expenses });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { title, description, amount, splitType, splits, category, date } =
      await request.json();

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 },
      );
    }

    const group = await Group.findById(params.groupId);
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });

    let finalSplits = splits;
    if (splitType === "equal") {
      const memberIds = group.members.map((m) => m.user.toString());
      finalSplits = calculateEqualSplit(amount, memberIds);
    }

    const expense = await Expense.create({
      title,
      description,
      amount,
      category: category || "other",
      paidBy: decoded.userId,
      group: params.groupId,
      splitType: splitType || "equal",
      splits: finalSplits,
      date: date ? new Date(date) : new Date(),
    });

    group.totalExpenses += amount;
    await group.save();

    await expense.populate("paidBy", "name email avatar");
    await expense.populate("splits.user", "name email avatar");

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
