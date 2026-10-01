import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, revokeSessionById } from "@/lib/auth/session";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const success = await revokeSessionById(user.userId, params.id);
  if (!success) {
    return NextResponse.json({ error: "Session not found or already revoked" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Session revoked" });
}
