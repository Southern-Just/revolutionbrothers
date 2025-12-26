"use server";

import { db } from "@/lib/database/db";
import { users, userProfiles } from "@/lib/database/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";

export type MemberDTO = {
  userId: string;
  name: string;
  role: string;
  username: string | null;
  phone: string | null;
  profileImage: string | null;
};
export type MyProfile = {
  email: string;
  name: string;
  username: string;
  phone: string;
  nationalId: string;
};

export type UpdateUserProfileInput = Partial<MyProfile>;

export async function getMyProfile(): Promise<MyProfile | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const [row] = await db
    .select({
      email: users.email,
      name: userProfiles.name,
      username: userProfiles.username,
      phone: userProfiles.phone,
      nationalId: userProfiles.nationalId,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(users.id, currentUser.id))
    .limit(1);

  return {
    email: row?.email ?? currentUser.email,
    name: row?.name ?? "",
    username: row?.username ?? "",
    phone: row?.phone ?? "",
    nationalId: row?.nationalId ?? "",
  };
}

export async function updateMyProfile(input: UpdateUserProfileInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const { email, ...profileData } = input;

  /* -------- email -------- */
  if (email) {
    await db
      .update(users)
      .set({
        email: email.toLowerCase().trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));
  }

  /* -------- profile (safe upsert) -------- */
  await db
    .insert(userProfiles)
    .values({
      userId: currentUser.id,
      ...profileData,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        ...profileData,
        updatedAt: new Date(),
      },
    });

  return { success: true };
}


/* ---------------- Fetch all users + profiles ---------------- */

export async function getAllUsers(): Promise<{
  activeUserId: string;
  members: MemberDTO[];
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const rows = await db
    .select({
      userId: users.id,
      role: users.role,
      name: sql<string>`coalesce(${userProfiles.name}, ${users.email})`,
      username: userProfiles.username,
      phone: userProfiles.phone,
      profileImage: userProfiles.profileImage,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

  const members: MemberDTO[] = rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    role: r.role,
    username: r.username ?? null,
    phone: r.phone ?? null,
    profileImage: r.profileImage ?? null,
  }));

  return { activeUserId: currentUser.id, members };
}
