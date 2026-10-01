import { NextResponse } from "next/server";
import { getCurrentUser, listUserSessions } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await listUserSessions(user.userId);
  return NextResponse.json({ sessions });
}
