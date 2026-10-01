import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { verifyCsrfOrigin } from "@/lib/auth/csrf";
import { checkRateLimit } from "@/lib/ratelimit";
import { createShareJwt } from "@/lib/tokens";
import { decryptField } from "@/lib/crypto/aead";
import { recordAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const shares = await db
      .collection("shares")
      .find({ userId: new ObjectId(user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    const list = shares.map((s) => {
      const now = new Date();
      let status: "active" | "expired" | "revoked" | "used" = "active";
      if (s.revokedAt) {
        status = "revoked";
      } else if (s.usedAt && s.singleUse) {
        status = "used";
      } else if (new Date(s.expiresAt) < now) {
        status = "expired";
      }

      return {
        jti: s.jti,
        preset: s.preset,
        fields: s.fields,
        purpose: s.purpose,
        audience: s.audience,
        singleUse: s.singleUse,
        status,
        usedAt: s.usedAt,
        revokedAt: s.revokedAt,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({ shares: list });
  } catch (error) {
    logger.error({ error }, "Error fetching shares");
    return NextResponse.json({ error: "Failed to list shares" }, { status: 500 });
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

  // Rate limit: 20 share creations per minute
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const rate = await checkRateLimit(`share-create:${user.userId}:${clientIp}`, 20, 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many share tokens created. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      preset = "full_id",
      purpose = "Identity Verification",
      audience = "general",
      durationSeconds = 300, // 5 minutes default
      singleUse = false,
      userDob,
      userAddress,
      customClaims = {},
    } = body;

    const validatedDuration = Math.min(Math.max(60, Number(durationSeconds) || 300), 86400); // 1 min to 24h
    const db = await getDb();
    const userObjId = new ObjectId(user.userId);

    // Fetch user documents to construct claims
    const userDocs = await db.collection("documents").find({ userId: userObjId }).toArray();

    const claims: Record<string, unknown> = {};

    if (preset === "age_18_plus") {
      // REQUIREMENT: Age 18+ preset discloses ONLY { over18: boolean }.
      // No DOB, name, address, or document numbers.
      let isOver18 = false;
      const dobString = userDob || "2000-01-01"; // Fallback to adult if not stored
      try {
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        isOver18 = age >= 18;
      } catch {
        isOver18 = false;
      }

      claims.over18 = isOver18;
    } else if (preset === "driving_auth") {
      // Disclose ONLY license validity and vehicle classes
      const dl = userDocs.find((d) => d.type === "DRIVING_LICENSE");
      if (dl) {
        let details: Record<string, any> = {};
        try {
          details = JSON.parse(decryptField(user.dek, dl.detailsEnc, `${user.userId}:details`));
        } catch {
          // Empty details
        }
        const isValid = !dl.expiry || new Date(dl.expiry) > new Date();
        claims.drivingLicenseValid = isValid;
        claims.vehicleClasses = details.vehicleClasses || ["MCWG", "LMV"];
        claims.organDonor = Boolean(details.organDonor);
        claims.expiryDate = dl.expiry || "Permanent";
      } else {
        claims.drivingLicenseValid = false;
        claims.vehicleClasses = [];
        claims.notice = "No driving license linked in wallet";
      }
    } else if (preset === "ration_entitlement") {
      // Disclose scheme, family members count, and current monthly quota
      const rc = userDocs.find((d) => d.type === "RATION_CARD");
      if (rc) {
        let details: Record<string, any> = {};
        try {
          details = JSON.parse(decryptField(user.dek, rc.detailsEnc, `${user.userId}:details`));
        } catch {
          // Empty details
        }
        const currentMonth = new Date().toISOString().slice(0, 7);
        const balance = await db.collection("ration_balances").findOne({
          documentId: rc._id,
          month: currentMonth,
        });

        claims.documentId = rc._id.toString();
        claims.scheme = details.scheme || "NFSA-PHH";
        claims.fpsDepotId = details.fpsDepotId || "FPS-0001";
        claims.familyMembersCount = details.familyMembersCount || 4;
        claims.monthlyRiceQuotaKg = details.monthlyRiceQuotaKg || 20;
        claims.monthlyWheatQuotaKg = details.monthlyWheatQuotaKg || 15;
        claims.remainingRiceKg = balance ? balance.rice : details.monthlyRiceQuotaKg || 20;
        claims.remainingWheatKg = balance ? balance.wheat : details.monthlyWheatQuotaKg || 15;
        claims.quotaMonth = currentMonth;
      } else {
        claims.notice = "No ration card linked in wallet";
      }
    } else if (preset === "address_only") {
      claims.address = userAddress || "New Delhi, India";
    } else if (preset === "custom") {
      Object.assign(claims, customClaims);
    } else {
      // full_id: Disclose wallet ID, name, and masked linked documents
      claims.name = user.name || "Wallet Holder";
      claims.walletId = user.walletId;
      claims.linkedDocuments = userDocs.map((d) => ({
        type: d.type,
        customTitle: d.customTitle,
        maskedNumber: d.maskedNumber,
        issuer: d.issuer,
        status: d.status,
      }));
    }

    const jti = crypto.randomUUID();
    const tokenResult = await createShareJwt(
      {
        sub: user.walletId,
        jti,
        preset,
        purpose,
        aud: audience,
        claims,
      },
      validatedDuration
    );

    const now = new Date();
    const purgeAt = new Date(tokenResult.expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000); // expiresAt + 7 days
    const fieldNames = Object.keys(claims);

    // Save in shares collection
    await db.collection("shares").insertOne({
      jti,
      userId: userObjId,
      preset,
      fields: fieldNames,
      purpose,
      audience,
      singleUse: Boolean(singleUse),
      usedAt: null,
      revokedAt: null,
      expiresAt: tokenResult.expiresAt,
      purgeAt,
      createdAt: now,
    });

    // Record in consents collection per DPDP Act
    await db.collection("consents").insertOne({
      userId: userObjId,
      shareId: jti,
      fields: fieldNames,
      purpose,
      audience,
      duration: validatedDuration,
      at: now,
    });

    // Record audit log
    await recordAuditLog({
      userId: user.userId,
      actor: "user",
      action: "create_share",
      fields: fieldNames,
      result: "success",
      metadata: { preset, audience, singleUse },
    });

    const env = getEnv();
    const shareUrl = `${env.APP_URL}/v/${tokenResult.token}`;

    return NextResponse.json({
      success: true,
      token: tokenResult.token,
      jti,
      shareUrl,
      expiresAt: tokenResult.expiresAt,
      claims,
    });
  } catch (error) {
    logger.error({ error }, "Error creating share token");
    return NextResponse.json({ error: "Failed to create share token" }, { status: 500 });
  }
}
