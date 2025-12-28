"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/database/db";
import { users, sessions, userProfiles } from "@/lib/database/schema";
import { eq, gt, and } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  pin: string;
};

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

/* ---------------- SIGN IN ---------------- */

export async function signIn({ email, password }: SignInInput) {
  const standardEmail = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, standardEmail))
    .limit(1);

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new Error("INVALID_CREDENTIALS");

  const expiresAt = new Date(Date.now() + SESSION_DURATION);

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

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

/* ---------------- SIGN UP ---------------- */

export async function signUp({ email, password, pin }: SignUpInput) {
  if (pin !== "9095") throw new Error("INVALID_PIN");

  const normalizedEmail = email.toLowerCase().trim();
  const username = normalizedEmail.split("@")[0];

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser.length) throw new Error("USER_EXISTS");

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      pin,
      role: "member",
      isVerified: true,
    })
    .returning({ id: users.id });

  await db.insert(userProfiles).values({
    userId: newUser.id,
    name: username,
    username,
    nationalId: "",
    phone: "",
  });

  return { success: true };
}

/* ---------------- LOGOUT ---------------- */

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("rb_session")?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
    cookieStore.delete("rb_session");
  }

  return { success: true };
}

/* ---------------- CURRENT USER ---------------- */

export async function getCurrentUser() {
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


export const getTermsPdf = async (): Promise<{
  file: ArrayBuffer;
  filename: string;
}> => {
  const filePath = path.join(
    process.cwd(),
    "private",
    "terms",
    "Revolution-Brothers-Constitution.pdf"
  );

  const buffer = await fs.readFile(filePath);

  return {
    file: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ),
    filename: "Revolution-Brothers-Constitution.pdf",
  };
};
