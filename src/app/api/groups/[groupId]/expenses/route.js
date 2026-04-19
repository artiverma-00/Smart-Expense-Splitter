import { NextResponse } from "next/server";
import mongoose from "mongoose";
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

    if (!mongoose.Types.ObjectId.isValid(params.groupId)) {
      return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(params.groupId).select("members createdBy");
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const isMember = group.members.some(
      (member) => member.user.toString() === decoded.userId,
    );

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const expenses = await Expense.find({ group: params.groupId })
        .populate("paidBy", "name email avatar")
        .populate("splits.user", "name email avatar")
        .sort({ date: -1 });

      return NextResponse.json({ expenses });
    } catch (populateError) {
      console.error("Expenses populate failed:", populateError);

      const fallbackExpenses = await Expense.find({ group: params.groupId })
        .sort({ date: -1 })
        .lean();

      return NextResponse.json({ expenses: fallbackExpenses });
    }
  } catch (error) {
    console.error("Expenses GET error:", error);
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
