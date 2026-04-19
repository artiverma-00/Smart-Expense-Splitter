import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import ChatMessage from "@/models/ChatMessage";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const [group, message] = await Promise.all([
      Group.findById(params.groupId).select("members createdBy"),
      ChatMessage.findOne({ _id: params.messageId, group: params.groupId }),
    ]);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === decoded.userId,
    );

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const canDelete =
      message.sender.toString() === decoded.userId ||
      group.createdBy.toString() === decoded.userId;

    if (!canDelete) {
      return NextResponse.json(
        { error: "Only sender or group creator can delete message" },
        { status: 403 },
      );
    }

    await message.deleteOne();

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
