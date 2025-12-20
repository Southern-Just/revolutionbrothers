import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/database/db";
import { users } from "@/lib/database/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, pin } = body;

    if (!email || !password || !pin) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    if (pin !== "9095") {
      return NextResponse.json(
        { message: "Invalid PIN" },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      email: normalizedEmail,
      passwordHash,
      pin: "9095",
      isVerified: true,
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}