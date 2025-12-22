import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/database/db";
import {
  members,
  userProfiles,
  contributions,
} from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const result = await db
    .select({
      id: members.id,
      userId: members.userId,
      role: members.role,
      isActive: members.isActive,
      joinedAt: members.joinedAt,
      name: userProfiles.name,
      username: userProfiles.username,
      nationalId: userProfiles.nationalId,
      phone: userProfiles.phone,
      profileImage: userProfiles.profileImage,
    })
    .from(members)
    .innerJoin(userProfiles, eq(userProfiles.userId, members.userId))
    .where(eq(members.id, id))
    .limit(1);

  if (!result.length) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const memberContributions = await db
    .select({ amount: contributions.amount })
    .from(contributions)
    .where(eq(contributions.userId, result[0].userId));

  return NextResponse.json({
    ...result[0],
    contributions: memberContributions,
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const body = (await req.json()) as {
    role?: "chairperson" | "secretary" | "treasurer" | "member";
    isActive?: boolean;
    name?: string;
    username?: string;
    phone?: string;
    profileImage?: string;
  };

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, id))
    .limit(1);

  if (!member) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (body.role || body.isActive !== undefined) {
    await db
      .update(members)
      .set({
        ...(body.role && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(members.id, id));
  }

  if (body.name || body.username || body.phone || body.profileImage) {
    await db
      .update(userProfiles)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.username && { username: body.username }),
        ...(body.phone && { phone: body.phone }),
        ...(body.profileImage && { profileImage: body.profileImage }),
      })
      .where(eq(userProfiles.userId, member.userId));
  }

  const [updated] = await db
    .select({
      id: members.id,
      userId: members.userId,
      role: members.role,
      isActive: members.isActive,
      joinedAt: members.joinedAt,
      name: userProfiles.name,
      username: userProfiles.username,
      phone: userProfiles.phone,
      profileImage: userProfiles.profileImage,
    })
    .from(members)
    .innerJoin(userProfiles, eq(userProfiles.userId, members.userId))
    .where(eq(members.id, id));

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [deleted] = await db
    .delete(members)
    .where(eq(members.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Deleted" });
}
