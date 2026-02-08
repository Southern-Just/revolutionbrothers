"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/database/db";
import { users, sessions, userProfiles } from "@/lib/database/schema";
import { eq, gt, and, asc } from "drizzle-orm";
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

export type ResetPasswordInput = {
  email: string;
  pin: string;
  newPassword: string;
};

const SESSION_DURATION = 15 * 60 * 1000;

/* ---------------- TERMS CONSTANTS (ADDED) ---------------- */

const TERMS_DIR = path.join(process.cwd(), "private", "terms");
const TERMS_FILE = "Revolution-Brothers-Constitution.pdf";
const TERMS_META = "terms.meta.json";

/* ---------------- INTERNAL ---------------- */

async function ensureSecretary() {
  const [secretary] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "secretary"))
    .limit(1);

  if (secretary) return;

  const [oldest] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.createdAt))
    .limit(1);

  if (!oldest) return;

  await db
    .update(users)
    .set({ role: "secretary" })
    .where(eq(users.id, oldest.id));
}

/* ---------------- AUTH ---------------- */

export async function signIn({ email, password }: SignInInput) {
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  await ensureSecretary();

  const [updatedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!updatedUser) throw new Error("INVALID_USER");

  await db.delete(sessions).where(eq(sessions.userId, updatedUser.id));

  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const [session] = await db
    .insert(sessions)
    .values({
      userId: updatedUser.id,
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

  return { success: true };
}

export async function getCurrentUser() {
  await ensureSecretary();

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

export async function touchSession() {
  await ensureSecretary();

  const cookieStore = await cookies();
  const token = cookieStore.get("rb_session")?.value;
  if (!token) return;

  const newExpiry = new Date(Date.now() + SESSION_DURATION);

  const [session] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.sessionToken, token),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) return;

  await db
    .update(sessions)
    .set({ expiresAt: newExpiry })
    .where(eq(sessions.id, session.id));

  cookieStore.set("rb_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: newExpiry,
    path: "/",
  });
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("rb_session")?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
  }

  cookieStore.delete("rb_session");
}

export async function signUp({ email, password, pin }: SignUpInput) {
  if (pin !== "0802") throw new Error("INVALID_PIN");

  const normalizedEmail = email.toLowerCase().trim();
  const username = normalizedEmail.split("@")[0];

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length) throw new Error("USER_EXISTS");

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      pin,
      role: "member",
      isVerified: true,
    })
    .returning({ id: users.id });

  // await db.insert(userProfiles).values({
  //   userId: user.id,
  //   name: username,
  //   username,
  //   nationalId: "",
  //   phone: "",
  // });

  // await ensureSecretary();

  return { success: true };
}

export async function resetPassword({
  email,
  pin,
  newPassword,
}: ResetPasswordInput) {
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.pin !== pin) throw new Error("INVALID_PIN");

  const newHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, user.id));

  await db.delete(sessions).where(eq(sessions.userId, user.id));

  await ensureSecretary();

  return { success: true };
}

/* ---------------- TERMS PDF (ENHANCED) ---------------- */

export async function uploadTermsPdf(formData: FormData) {
  await ensureSecretary();

  const file = formData.get("file") as File;
  if (!file || file.type !== "application/pdf") {
    throw new Error("INVALID_FILE");
  }

  await fs.mkdir(TERMS_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(
    path.join(TERMS_DIR, TERMS_FILE),
    buffer
  );

  await fs.writeFile(
    path.join(TERMS_DIR, TERMS_META),
    JSON.stringify({ name: file.name })
  );
}
export async function getTermsMeta(): Promise<{ name: string } | null> {
  try {
    const metaPath = path.join(TERMS_DIR, TERMS_META);
    const raw = await fs.readFile(metaPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed?.name) return null;

    return { name: parsed.name };
  } catch {
    return null;
  }
}

export const getTermsPdf = async (): Promise<{
  file: ArrayBuffer;
  filename: string;
}> => {
  const filePath = path.join(TERMS_DIR, TERMS_FILE);
  const buffer = await fs.readFile(filePath);

  let filename = TERMS_FILE;

  try {
    const meta = JSON.parse(
      await fs.readFile(path.join(TERMS_DIR, TERMS_META), "utf8")
    );
    if (meta?.name) filename = meta.name;
  } catch {}

  return {
    file: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ),
    filename,
  };
};
