// users.systeme.ts
"use server";

import { db } from "@/lib/database/db";
import {
  users,
  userProfiles,
  transactions,
} from "@/lib/database/schema";
import { eq, asc, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/user.actions";

export type MemberRole =
  | "chairperson"
  | "secretary"
  | "treasurer"
  | "member";

export async function getMembers() {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  return db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      name: userProfiles.name,
      username: userProfiles.username,
      phone: userProfiles.phone,
      profileImage: userProfiles.profileImage,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id));
}

export async function getMemberById(userId: string) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  const [member] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      name: userProfiles.name,
      username: userProfiles.username,
      nationalId: userProfiles.nationalId,
      phone: userProfiles.phone,
      profileImage: userProfiles.profileImage,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!member) throw new Error("NOT_FOUND");

  if (!member.name) {
    await db.insert(userProfiles).values({
      userId,
      name: "",
      username: member.email.split("@")[0],
      nationalId: "",
    });
    const [updated] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        name: userProfiles.name,
        username: userProfiles.username,
        nationalId: userProfiles.nationalId,
        phone: userProfiles.phone,
        profileImage: userProfiles.profileImage,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);
    if (!updated) throw new Error("NOT_FOUND");
    Object.assign(member, updated);
  }

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
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(asc(transactions.month));

  return { ...member, contributions };
}

export async function updateMember(
  userId: string,
  data: {
    role?: MemberRole;
    name?: string;
    username?: string;
    phone?: string;
    profileImage?: string;
  }
) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  if (data.role !== undefined) {
    await db
      .update(users)
      .set({ role: data.role })
      .where(eq(users.id, userId));
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
      .where(eq(userProfiles.userId, userId));
  }

  const [updated] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      name: userProfiles.name,
      username: userProfiles.username,
      phone: userProfiles.phone,
      profileImage: userProfiles.profileImage,
    })
    .from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  return updated;
}

export async function deleteMember(userId: string) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  await db.delete(users).where(eq(users.id, userId));

  return { success: true };
}

export async function getTransactions(userId?: string) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  if (userId) {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.occurredAt));
  }

  return db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.occurredAt));
}

export async function getTransactionById(id: string) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  if (!transaction) throw new Error("NOT_FOUND");

  return transaction;
}

export async function updateTransaction(
  id: string,
  data: Partial<typeof transactions.$inferInsert>
) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  const [updated] = await db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, id))
    .returning();

  if (!updated) throw new Error("NOT_FOUND");

  return updated;
}

export async function deleteTransaction(id: string) {
  const auth = await getCurrentUser();
  if (!auth) throw new Error("UNAUTHORIZED");

  await db.delete(transactions).where(eq(transactions.id, id));

  return { success: true };
}