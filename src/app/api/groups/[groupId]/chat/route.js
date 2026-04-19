import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import ChatMessage from "@/models/ChatMessage";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const group = await Group.findById(params.groupId).select("members");
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === decoded.userId,
    );

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ChatMessage.updateMany(
      {
        group: params.groupId,
        sender: { $ne: decoded.userId },
      },
      { $addToSet: { seenBy: decoded.userId } },
    );

    const messages = await ChatMessage.find({ group: params.groupId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ messages: messages.reverse() });
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

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const group = await Group.findById(params.groupId).select("members");
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === decoded.userId,
    );

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { text } = await request.json();
    const trimmedText = String(text || "").trim();

    if (!trimmedText) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 },
      );
    }

    const message = await ChatMessage.create({
      group: params.groupId,
      sender: decoded.userId,
      text: trimmedText,
      seenBy: [decoded.userId],
    });

    await message.populate("sender", "name email avatar");

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
