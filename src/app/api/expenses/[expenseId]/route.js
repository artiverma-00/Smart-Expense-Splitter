import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const expense = await Expense.findById(params.expenseId);
    if (!expense)
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    if (expense.paidBy.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the payer can delete this expense" },
        { status: 403 },
      );
    }

    await Group.findByIdAndUpdate(expense.group, {
      $inc: { totalExpenses: -expense.amount },
    });

    await expense.deleteOne();
    return NextResponse.json({ message: "Expense deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const updates = await request.json();

    const expense = await Expense.findByIdAndUpdate(
      params.expenseId,
      { $set: updates },
      { new: true },
    )
      .populate("paidBy", "name email avatar")
      .populate("splits.user", "name email avatar");

    if (!expense)
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    return NextResponse.json({ expense });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
