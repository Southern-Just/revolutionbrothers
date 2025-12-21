import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { members } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(members)
    .where(eq(members.id, params.id))
    .limit(1);

  if (!result.length) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    role?: "chairperson" | "secretary" | "treasurer" | "member";
    isActive?: boolean;
  };

  const [updated] = await db
    .update(members)
    .set({
      ...(body.role && { role: body.role }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    })
    .where(eq(members.id, params.id))
    .returning();

  if (!updated) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [deleted] = await db
    .delete(members)
    .where(eq(members.id, params.id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Deleted" });
}
