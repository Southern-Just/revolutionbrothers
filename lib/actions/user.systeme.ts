"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/database/db";
import { users, userProfiles } from "@/lib/database/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "./user.actions";

import {
  type OfficialRole,
  isOfficialRole,
} from "@/lib/utils/utils";

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

export type UpdateAnyUserInput = {
  userId: string;
  role?: "chairperson" | "secretary" | "treasurer" | "member";
};

export type MembersResult = {
  activeUserId: string;
  officials: Partial<Record<OfficialRole, MemberDTO>>;
  others: MemberDTO[];
};

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

export async function updateMyProfile(
  input: UpdateUserProfileInput,
): Promise<{ success: true }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/");

  const { email, role, ...profileData } = input;

  if (email) {
    await db
      .update(users)
      .set({
        email: email.toLowerCase().trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));
  }

  if (role) {
    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
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
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, currentUser.id));
  } else {
    await db.insert(userProfiles).values({
      userId: currentUser.id,
      ...profileData,
    });
  }

  return { success: true };
}

/* ---------------- ADMIN / SECRETARY ---------------- */

export async function updateUserProfile(
  input: UpdateAnyUserInput,
): Promise<{ success: true }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "secretary") redirect("/");

  const { userId, role } = input;

  if (role) {
    if (role === "secretary") {
      await db
        .update(users)
        .set({ role: "member", updatedAt: new Date() })
        .where(eq(users.id, currentUser.id));
    }

    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  return { success: true };
}

/* ---------------- USERS ---------------- */

export async function getAllUsers(): Promise<MembersResult> {
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

  const officials: Partial<Record<OfficialRole, MemberDTO>> = {};
  const others: MemberDTO[] = [];

  for (const r of rows) {
    const member: MemberDTO = {
      userId: r.userId,
      name: r.name,
      role: r.role,
      username: r.username ?? null,
      phone: r.phone ?? null,
      profileImage: r.profileImage ?? null,
    };

    if (isOfficialRole(member.role)) {
      officials[member.role] = member;
    } else {
      others.push(member);
    }
  }

  return {
    activeUserId: currentUser.id,
    officials,
    others,
  };
}

export async function getTreasurerPhone(): Promise<string | null> {
  const { officials } = await getAllUsers();
  return officials.treasurer?.phone ?? null;
}
