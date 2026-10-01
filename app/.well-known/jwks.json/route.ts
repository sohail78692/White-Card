import { NextResponse } from "next/server";
import { getPublicJwk } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const publicJwk = await getPublicJwk();
    return NextResponse.json(
      {
        keys: [publicJwk],
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate JWKS" }, { status: 500 });
  }
}
