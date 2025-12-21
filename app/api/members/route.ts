import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { members, userProfiles } from "@/lib/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select({
      id: members.id,
      userId: members.userId,
      role: members.role,
      isActive: members.isActive,
      name: userProfiles.name,
      username: userProfiles.username,
      profileImage: userProfiles.profileImage,
    })
    .from(members)
    .innerJoin(userProfiles, eq(userProfiles.userId, members.userId));

  return NextResponse.json(result);
}
