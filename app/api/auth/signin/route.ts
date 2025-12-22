import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing credentials" },
        { status: 400 }
      );
    }

    await signIn({ email, password });

    return NextResponse.json(
      { message: "Signin successful" },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof Error) {
      switch (err.message) {
        case "INVALID_CREDENTIALS":
          return NextResponse.json(
            { message: "Invalid email or password" },
            { status: 401 }
          );

        case "UNAUTHORIZED":
          return NextResponse.json(
            { message: "Unauthorized" },
            { status: 403 }
          );
      }
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
