import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/database/db";
import { sessions } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("rb_session")?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
  }

  cookieStore.delete("rb_session");

  return NextResponse.json({ message: "Logged out successfully" });
}
