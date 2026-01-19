"use server";

import { db } from "@/lib/database/db";
import {
  investments,
  investmentVotes,
  users,
  userProfiles,
  sessions,
} from "@/lib/database/schema";
import { eq, and, sql, desc, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { OFFICIAL_ROLES } from "@/lib/utils/utils";

export type SuggestInvestmentInput = {
  name: string;
  cost: string;
  time: string;
  details: string;
  return?: string;
  selectedUserId?: string;
};

export type VoteInput = {
  investmentId: string;
};

export type RemoveInvestmentInput = {
  investmentId: string;
};

export type ApproveInvestmentInput = {
  investmentId: string;
};

export type UpdateInvestmentInput = {
  id: string;
  name: string;
  cost: string;
  time: string;
  details: string;
  return?: string;
  selectedUserId?: string;
};

export type ApproveInvestmentResponse = {
  success: boolean;
  message?: string;
};

const MIN_VOTES_TO_APPROVE = 2;

type UserRole = "chairperson" | "secretary" | "treasurer" | "member";

type User = {
  id: string;
  role: UserRole;
  email: string;
};

async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("rb_session")?.value;
  if (!token) return null;

  const [result] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.sessionToken, token),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!result?.user) return null;

  return {
    ...result.user,
    role: result.user.role as UserRole,
  };
}

export async function suggestInvestment({
  name,
  cost,
  time,
  details,
  return: returnValue,
  selectedUserId,
}: SuggestInvestmentInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const inCharge: string[] = [currentUser.id];
  if (selectedUserId) {
    inCharge.push(selectedUserId);
  }

  try {
    const [investment] = await db
      .insert(investments)
      .values({
        name,
        details,
        cost,
        time,
        return: returnValue,
        suggesterId: currentUser.id,
        status: "suggested",
        votes: 0,
        inCharge,
        progress: 0,
        amountInvested: 0,
      })
      .returning({ id: investments.id });

    return { success: true, investmentId: investment.id };
  } catch (error) {
    console.error("Database insert error:", error);
    throw new Error("Failed to insert investment into database");
  }
}

export async function voteOnInvestment({ investmentId }: VoteInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const existingVote = await db
    .select()
    .from(investmentVotes)
    .where(
      and(
        eq(investmentVotes.investmentId, investmentId),
        eq(investmentVotes.userId, currentUser.id)
      )
    )
    .limit(1);

  if (existingVote.length > 0) {
    await db
      .delete(investmentVotes)
      .where(
        and(
          eq(investmentVotes.investmentId, investmentId),
          eq(investmentVotes.userId, currentUser.id)
        )
      );
  } else {
    await db.insert(investmentVotes).values({
      investmentId,
      userId: currentUser.id,
    });
  }

  const [voteCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(investmentVotes)
    .where(eq(investmentVotes.investmentId, investmentId));

  return {
    success: true,
    votes: voteCount.count,
    hasVoted: existingVote.length === 0,
  };
}

export async function approveInvestment({
  investmentId,
}: ApproveInvestmentInput): Promise<ApproveInvestmentResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: "UNAUTHORIZED" };
  if (!OFFICIAL_ROLES.includes(currentUser.role as typeof OFFICIAL_ROLES[number])) return { success: false, message: "FORBIDDEN" };

  const [investment] = await db
    .select({ status: investments.status })
    .from(investments)
    .where(eq(investments.id, investmentId))
    .limit(1);

  if (!investment) return { success: false, message: "INVESTMENT_NOT_FOUND" };
  if (investment.status !== "suggested") return { success: false, message: "INVALID_STATUS" };

  const [voteCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(investmentVotes)
    .where(eq(investmentVotes.investmentId, investmentId));

  if (voteCount.count < MIN_VOTES_TO_APPROVE) {
    const remainder = MIN_VOTES_TO_APPROVE - voteCount.count;
    return { success: false, message: `Votes are not enough. ${remainder} remaining` };
  }

  await db
    .update(investments)
    .set({ status: "approved" })
    .where(eq(investments.id, investmentId));

  return { success: true };
}

export async function getInvestments() {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const investmentsWithVotes = await db
    .select({
      id: investments.id,
      name: investments.name,
      suggester: userProfiles.name,
      suggesterId: investments.suggesterId,
      details: investments.details,
      cost: investments.cost,
      return: investments.return,
      time: investments.time,
      status: investments.status,
      votes: sql<number>`count(${investmentVotes.id})`,
      hasVoted: sql<boolean>`bool_or(${investmentVotes.userId} = ${currentUser.id})`,
      inCharge: investments.inCharge,
      progress: investments.progress,
      amountInvested: investments.amountInvested,
      createdAt: investments.createdAt,
    })
    .from(investments)
    .leftJoin(userProfiles, eq(userProfiles.userId, investments.suggesterId))
    .leftJoin(investmentVotes, eq(investmentVotes.investmentId, investments.id))
    .groupBy(investments.id, userProfiles.name)
    .orderBy(desc(investments.createdAt));

  return investmentsWithVotes;
}

export async function removeInvestment({ investmentId }: RemoveInvestmentInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const [investment] = await db
    .select({
      suggesterId: investments.suggesterId,
      status: investments.status,
    })
    .from(investments)
    .where(eq(investments.id, investmentId))
    .limit(1);

  if (!investment) throw new Error("INVESTMENT_NOT_FOUND");
  if (investment.suggesterId !== currentUser.id) throw new Error("UNAUTHORIZED");
  if (investment.status !== "suggested") throw new Error("CANNOT_REMOVE_APPROVED_PROJECT");

  await db.delete(investments).where(eq(investments.id, investmentId));

  return { success: true };
}

export async function updateInvestment({
  id,
  name,
  cost,
  time,
  details,
  return: returnValue,
  selectedUserId,
}: UpdateInvestmentInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

  const [investment] = await db
    .select({ suggesterId: investments.suggesterId, status: investments.status })
    .from(investments)
    .where(eq(investments.id, id))
    .limit(1);

  if (!investment) throw new Error("INVESTMENT_NOT_FOUND");
  if (investment.suggesterId !== currentUser.id) throw new Error("FORBIDDEN");
  if (investment.status !== "suggested") throw new Error("CANNOT_UPDATE_APPROVED_PROJECT");

  await db.update(investments).set({
    name,
    cost,
    time,
    details,
    return: returnValue,
    inCharge: selectedUserId ? [currentUser.id, selectedUserId] : [currentUser.id],
  }).where(eq(investments.id, id));

  return { success: true };
}