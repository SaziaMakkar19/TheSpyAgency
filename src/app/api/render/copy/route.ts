/**
 * GET /api/render/copy?mls=R3184362 — 3 angled hook/headline/CTA variations
 * for the participant layer, generated from verified Bridge specs only.
 *
 * POST { mlsNo } — same, for programmatic callers.
 *
 * Reply: { variations: [{angle, hook, headline, cta} ×3], ai, demo, specs }
 * `ai: false` means the deterministic fallback answered (no OPENAI_API_KEY).
 *
 * The Studio calls this when a participant opens a listing, then feeds the
 * chosen variation into /api/render/compose.
 */
import { type NextRequest } from "next/server";
import {
  lookupListing,
  getSampleListing,
  isDemoMode,
  ListingNotFoundError,
} from "@/lib/bridge/client";
import { generateCopy } from "@/lib/ai/copy";

export const runtime = "nodejs";

async function handle(mlsNo: string) {
  if (!mlsNo) return Response.json({ error: "mls is required" }, { status: 400 });

  try {
    const brief =
      mlsNo.toLowerCase() === "sample" ? getSampleListing() : await lookupListing(mlsNo);
    const { variations, ai } = await generateCopy(brief);

    return Response.json({
      variations,
      ai,
      demo: mlsNo.toLowerCase() === "sample" || isDemoMode(),
      specs: {
        mlsNo: brief.mlsNo,
        address: brief.address,
        city: brief.city,
        price: brief.price,
        beds: brief.beds,
        baths: brief.baths,
        interiorSqft: brief.interiorSqft,
        propertyType: brief.propertyType,
      },
    });
  } catch (err) {
    if (err instanceof ListingNotFoundError) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    console.error("Copy generation failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Copy generation failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handle((req.nextUrl.searchParams.get("mls") || "").trim());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handle(String(body.mlsNo ?? "").trim());
}
