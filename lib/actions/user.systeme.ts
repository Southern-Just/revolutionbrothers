"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { users, userProfiles } from "@/lib/database/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";

/* ---------------- TYPES ---------------- */

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
  profileImage?: string | null;
  role: "chairperson" | "secretary" | "treasurer" | "member";
};

export type UpdateUserProfileInput = Partial<MyProfile>;

/* ---------------- PROFILE ---------------- */

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
      profileImage: userProfiles.profileImage,
      role: users.role,
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
    profileImage: row?.profileImage ?? null,
    role: row?.role ?? "member",
  };
}

export async function updateMyProfile(input: UpdateUserProfileInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  const { email, role, ...profileData } = input;

  if (email) {
    await db
      .update(users)
      .set({ email: email.toLowerCase().trim(), updatedAt: new Date() })
      .where(eq(users.id, currentUser.id));
  }

  if (role) {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, currentUser.id));
  }

  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, currentUser.id))
    .limit(1);

  if (existing.length) {
    await db
      .update(userProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(userProfiles.userId, currentUser.id));
  } else {
    await db.insert(userProfiles).values({
      userId: currentUser.id,
      ...profileData,
    });
  }

  return { success: true };
}

/* ---------------- USERS ---------------- */

export async function getAllUsers(): Promise<{
  activeUserId: string;
  members: MemberDTO[];
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

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

  return {
    activeUserId: currentUser.id,
    members: rows.map((r) => ({
      userId: r.userId,
      name: r.name,
      role: r.role,
      username: r.username ?? null,
      phone: r.phone ?? null,
      profileImage: r.profileImage ?? null,
    })),
  };
}

export async function getTreasurerPhone(): Promise<string | null> {
  const { members } = await getAllUsers();
  return members.find((m) => m.role === "treasurer")?.phone ?? null;
}
