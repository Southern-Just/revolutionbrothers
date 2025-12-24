"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/database/db";
import { users, sessions } from "@/lib/database/schema";
import { eq, and, gt } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export type AuthError = "INVALID_CREDENTIALS" | "UNAUTHORIZED";

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  pin: string;
};

/* ------------------------------------------------------------------ */
/* Sign In */
/* ------------------------------------------------------------------ */

export async function signInAction({ email, password }: SignInInput) {
  if (!email || !password) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!result.length) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = result[0];
  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      expiresAt,
    })
    .returning({ token: sessions.sessionToken });

  const cookieStore = await cookies();

  cookieStore.set("rb_session", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return { id: user.id, email: user.email };
}

/* ------------------------------------------------------------------ */
/* Sign Up */
/* ------------------------------------------------------------------ */

export async function signUpAction({
  email,
  password,
  pin,
}: SignUpInput) {
  if (!email || !password || !pin) {
    throw new Error("MISSING_FIELDS");
  }

  if (pin !== "9095") {
    throw new Error("INVALID_PIN");
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length) {
    throw new Error("USER_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email: normalizedEmail,
    passwordHash,
    pin: "9095",
    isVerified: true,
  });

  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Logout */
/* ------------------------------------------------------------------ */

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("rb_session")?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
  }

  cookieStore.delete("rb_session");

  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Session / User Helpers */
/* ------------------------------------------------------------------ */

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("rb_session")?.value;

  if (!token) return null;

  const result = await db
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

  return result.length ? result[0].user : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
