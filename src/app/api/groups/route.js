import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Group from "@/models/Group";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    const decoded = verifyToken(token);
    if (!decoded)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const groups = await Group.find({
      "members.user": decoded.userId,
    })
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatar")
      .sort({ createdAt: -1 });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error(error);
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
    const { name, description } = await request.json();

    if (!name)
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 },
      );

    const group = await Group.create({
      name,
      description,
      createdBy: decoded.userId,
      members: [{ user: decoded.userId }],
    });

    await group.populate("createdBy", "name email");
    await group.populate("members.user", "name email avatar");

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
