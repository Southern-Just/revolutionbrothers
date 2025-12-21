import { NextResponse } from "next/server";
import { signIn, type SignInInput } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SignInInput;
    await signIn(body);
    return NextResponse.json({ message: "Signed in successfully" });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
