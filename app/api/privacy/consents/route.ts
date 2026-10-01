import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const consents = await db
      .collection("consents")
      .find({ userId: new ObjectId(user.userId) })
      .sort({ at: -1 })
      .limit(100)
      .toArray();

    const list = consents.map((c) => ({
      id: c._id.toString(),
      shareId: c.shareId,
      fields: c.fields,
      purpose: c.purpose,
      audience: c.audience,
      duration: c.duration,
      at: c.at,
    }));

    return NextResponse.json({ consents: list });
  } catch (error) {
    logger.error({ error }, "Error fetching consents");
    return NextResponse.json({ error: "Failed to fetch consent records" }, { status: 500 });
  }
}
