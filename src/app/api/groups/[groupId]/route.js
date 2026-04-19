import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import User from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const group = await Group.findById(params.groupId)
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatar");

    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const isMember = group.members.some(
      (m) => m.user._id.toString() === decoded.userId,
    );
    if (!isMember)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ group });
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
    const { email, removeUserId, name, description } = await request.json();

    const group = await Group.findById(params.groupId);
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const requesterIsMember = group.members.some(
      (m) => m.user.toString() === decoded.userId,
    );
    if (!requesterIsMember)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const requesterIsCreator = group.createdBy.toString() === decoded.userId;

    if (typeof name === "string") {
      if (!requesterIsCreator) {
        return NextResponse.json(
          { error: "Only group creator can edit group" },
          { status: 403 },
        );
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: "Group name is required" },
          { status: 400 },
        );
      }

      group.name = trimmedName;
      if (typeof description === "string") {
        group.description = description.trim();
      }

      await group.save();
      await group.populate("createdBy", "name email");
      await group.populate("members.user", "name email avatar");

      return NextResponse.json({ group });
    }

    if (removeUserId) {
      if (!requesterIsCreator) {
        return NextResponse.json(
          { error: "Only group creator can remove members" },
          { status: 403 },
        );
      }

      if (removeUserId === group.createdBy.toString()) {
        return NextResponse.json(
          { error: "Group creator cannot be removed" },
          { status: 400 },
        );
      }

      const beforeCount = group.members.length;
      group.members = group.members.filter(
        (m) => m.user.toString() !== removeUserId,
      );

      if (group.members.length === beforeCount) {
        return NextResponse.json(
          { error: "Member not found in group" },
          { status: 404 },
        );
      }

      await group.save();
      await group.populate("createdBy", "name email");
      await group.populate("members.user", "name email avatar");

      return NextResponse.json({ group });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!requesterIsCreator) {
      return NextResponse.json(
        { error: "Only group creator can add members" },
        { status: 403 },
      );
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const alreadyMember = group.members.some(
      (m) => m.user.toString() === userToAdd._id.toString(),
    );
    if (alreadyMember)
      return NextResponse.json(
        { error: "User already in group" },
        { status: 409 },
      );

    group.members.push({ user: userToAdd._id });
    await group.save();
    await group.populate("createdBy", "name email");
    await group.populate("members.user", "name email avatar");

    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const group = await Group.findById(params.groupId);
    if (!group)
      return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (group.createdBy.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Only group creator can delete" },
        { status: 403 },
      );
    }

    await group.deleteOne();
    return NextResponse.json({ message: "Group deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
