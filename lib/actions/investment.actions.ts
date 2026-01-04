"use server";

import { db } from "@/lib/database/db";
import { investments, investmentVotes, users, userProfiles, sessions } from "@/lib/database/schema";
import { eq, and, sql, desc, gt } from "drizzle-orm";
import { cookies } from "next/headers";

export type SuggestInvestmentInput = {
  name: string;
  cost: string;
  time: string;
  details: string;
  return?: string;
};

export type VoteInput = {
  investmentId: string;
};

export type RemoveInvestmentInput = {
  investmentId: string;
};

async function getCurrentUser() {
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

  return result?.user ?? null;
}

export async function suggestInvestment({
  name,
  cost,
  time,
  details,
  return: returnValue,
}: SuggestInvestmentInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("UNAUTHORIZED");

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
    })
    .returning({ id: investments.id });

  return { success: true, investmentId: investment.id };
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

  return { success: true, votes: voteCount.count, hasVoted: existingVote.length === 0 };
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
    .select({ suggesterId: investments.suggesterId, status: investments.status })
    .from(investments)
    .where(eq(investments.id, investmentId))
    .limit(1);

  if (!investment) throw new Error("INVESTMENT_NOT_FOUND");
  if (investment.suggesterId !== currentUser.id) throw new Error("UNAUTHORIZED");
  if (investment.status !== "suggested") throw new Error("CANNOT_REMOVE_APPROVED_PROJECT");

  await db.delete(investments).where(eq(investments.id, investmentId));

  return { success: true };
}