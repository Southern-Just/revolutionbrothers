"use server";

import { db } from "@/lib/database/db";
import {
  users,
  userProfiles,
  transactions,
} from "@/lib/database/schema";
import { eq, sql, and, desc } from "drizzle-orm";
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
};

export type UpdateUserProfileInput = Partial<MyProfile>;

export type TransactionDTO = {
  id: string;
  userId: string;
  month: string;
  amount: number;
  name: string;
  type: "credit" | "debit";
  status: "pending" | "verified" | "declined";
  category: string;
  transactionCode: string;
  occurredAt: Date;
  createdAt: Date;
};

export type CreateTransactionInput = {
  month: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  transactionCode: string;
  occurredAt: Date;
};

export type UpdateTransactionInput = Partial<{
  month: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  occurredAt: Date;
  status: "pending" | "verified" | "declined";
}>;

/* ---------------- USER PROFILE ---------------- */

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
      profileImage: userProfiles.profileImage,  // Added to fetch profileImage
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
    profileImage: row?.profileImage ?? null,  // Added to return profileImage
  };
}

export async function updateMyProfile(input: UpdateUserProfileInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const { email, ...profileData } = input;

  if (email) {
    await db
      .update(users)
      .set({
        email: email.toLowerCase().trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));
  }

  // Explicitly check if a userProfiles row exists for this user
  const existingProfile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, currentUser.id))
    .limit(1);

  if (existingProfile.length > 0) {
    // Update the existing row
    await db
      .update(userProfiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, currentUser.id));
  } else {
    // Insert a new row if none exists
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

/* ---------------- TRANSACTIONS ---------------- */

export async function createTransaction(input: CreateTransactionInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const [tx] = await db
    .insert(transactions)
    .values({
      userId: currentUser.id,
      month: input.month,
      amount: input.amount,
      type: input.type,
      category: input.category,
      transactionCode: input.transactionCode,
      occurredAt: input.occurredAt,
      status: "pending",
    })
    .returning();

  return tx;
}

export async function getMyTransactions(): Promise<TransactionDTO[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      name: sql<string>`coalesce(${userProfiles.name}, ${users.email})`,
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
    .leftJoin(users, eq(users.id, transactions.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(transactions.userId, currentUser.id))
    .orderBy(desc(transactions.occurredAt));

  return rows;
}

export async function getTransactionById(id: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const [tx] = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      name: sql<string>`coalesce(${userProfiles.name}, ${users.email})`,
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
    .leftJoin(users, eq(users.id, transactions.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.userId, currentUser.id)
      )
    )
    .limit(1);

  return tx ?? null;
}

export async function updateTransaction(
  transactionId: string,
  input: UpdateTransactionInput
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const [updated] = await db
    .update(transactions)
    .set(input)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, currentUser.id)
      )
    )
    .returning();

  if (!updated) throw new Error("NOT_FOUND");

  return updated;
}

export async function deleteTransaction(transactionId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const deleted = await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, currentUser.id)
      )
    )
    .returning();

  if (!deleted.length) throw new Error("NOT_FOUND");

  return { success: true };
}

export async function getRecentTransactions(limit = 6): Promise<TransactionDTO[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const rows = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      name: sql<string>`coalesce(${userProfiles.name}, ${users.email})`,
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
    .leftJoin(users, eq(users.id, transactions.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(transactions.userId, currentUser.id))
    .orderBy(desc(transactions.occurredAt))
    .limit(limit);

  return rows;
}