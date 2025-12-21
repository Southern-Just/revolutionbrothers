import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { members } from "@/lib/database/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await db.select().from(members);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    userId: string;
    role?: "chairperson" | "secretary" | "treasurer" | "member";
    isActive?: boolean;
  };

  const [member] = await db
    .insert(members)
    .values({
      userId: body.userId,
      role: body.role ?? "member",
      isActive: body.isActive ?? true,
    })
    .returning();

  return NextResponse.json(member, { status: 201 });
}
