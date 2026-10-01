import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  await destroySession();
  return NextResponse.json({ success: true, message: "Signed out successfully" });
}
