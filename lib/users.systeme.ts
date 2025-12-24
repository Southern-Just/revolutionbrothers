"use server";

import { db } from "@/lib/database/db";
import { members, userProfiles, transactions } from "@/lib/database/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/user.actions";

type MemberRole = "chairperson" | "secretary" | "treasurer" | "member";

export async function getMembers() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  return db
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
}

export async function getMemberById(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const [member] = await db
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

  if (!member) throw new Error("NOT_FOUND");

  const contributions = await db
    .select({
      id: transactions.id,
      month: transactions.month,
      amount: transactions.amount,
      type: transactions.type,
      status: transactions.status,
      category: transactions.category,
      transactionCode: transactions.transactionCode,
      occurredAt: transactions.occurredAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, member.userId))
    .orderBy(asc(transactions.month));

  return { ...member, contributions };
}

export async function updateMember(
  id: string,
  data: {
    role?: MemberRole;
    isActive?: boolean;
    name?: string;
    username?: string;
    phone?: string;
    profileImage?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, id))
    .limit(1);

  if (!member) throw new Error("NOT_FOUND");

  if (data.role !== undefined || data.isActive !== undefined) {
    await db
      .update(members)
      .set({
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      })
      .where(eq(members.id, id));
  }

  if (
    data.name !== undefined ||
    data.username !== undefined ||
    data.phone !== undefined ||
    data.profileImage !== undefined
  ) {
    await db
      .update(userProfiles)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.profileImage !== undefined && {
          profileImage: data.profileImage,
        }),
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

  return updated;
}

export async function deleteMember(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const [deleted] = await db
    .delete(members)
    .where(eq(members.id, id))
    .returning();

  if (!deleted) throw new Error("NOT_FOUND");

  return { success: true };
}
