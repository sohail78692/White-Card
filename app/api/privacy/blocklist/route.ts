import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const userObjId = new ObjectId(user.userId);

    const blocks = await db.collection("blocklist").find({ userId: userObjId }).toArray();
    const verifierIds = blocks.map((b) => b.verifierId);

    const verifiers = await db
      .collection("verifiers")
      .find({ _id: { $in: verifierIds } })
      .toArray();

    const list = blocks.map((b) => {
      const v = verifiers.find((vf) => vf._id.toString() === b.verifierId.toString());
      return {
        id: b._id.toString(),
        verifierId: b.verifierId.toString(),
        verifierName: v?.name || "Unknown Verifier",
        verifierType: v?.type || "other",
        blockedAt: b.blockedAt || b.createdAt,
      };
    });

    return NextResponse.json({ blocklist: list });
  } catch (error) {
    logger.error({ error }, "Error fetching blocklist");
    return NextResponse.json({ error: "Failed to fetch blocklist" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.reason || "CSRF check failed" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { verifierId, action } = body; // action: 'block' | 'unblock'

    if (!verifierId) {
      return NextResponse.json({ error: "verifierId is required" }, { status: 400 });
    }

    const db = await getDb();
    const userObjId = new ObjectId(user.userId);
    const verifierObjId = new ObjectId(verifierId);

    if (action === "unblock") {
      await db.collection("blocklist").deleteOne({
        userId: userObjId,
        verifierId: verifierObjId,
      });
      return NextResponse.json({ success: true, message: "Verifier removed from blocklist." });
    } else {
      await db.collection("blocklist").updateOne(
        { userId: userObjId, verifierId: verifierObjId },
        {
          $setOnInsert: {
            userId: userObjId,
            verifierId: verifierObjId,
            blockedAt: new Date(),
          },
        },
        { upsert: true }
      );
      return NextResponse.json({ success: true, message: "Verifier added to blocklist." });
    }
  } catch (error) {
    logger.error({ error }, "Error updating blocklist");
    return NextResponse.json({ error: "Failed to update blocklist" }, { status: 500 });
  }
}
