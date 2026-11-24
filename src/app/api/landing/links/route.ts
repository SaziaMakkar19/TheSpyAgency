/**
 * POST /api/landing/links — create a shareable co-branded landing link.
 * Auth required (cookie session). Body: { listingNo: string, campaignId? }
 * Reply: { token, url, id }
 *
 * GET /api/landing/links — list the signed-in agent's own links.
 */
import { type NextRequest } from "next/server";
import { getSupabaseServer, getCurrentUser } from "@/lib/supabase/server";
import { createLandingLink } from "@/lib/landing/links";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to create a landing link." }, { status: 401 });

  const supabase = await getSupabaseServer();
  if (!supabase) return Response.json({ error: "Supabase is not configured." }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const listingNo = String(body.listingNo ?? "").trim();
  if (!listingNo) return Response.json({ error: "listingNo is required" }, { status: 400 });

  try {
    const link = await createLandingLink(supabase, {
      userId: user.id,
      listingNo,
      campaignId: body.campaignId ?? null,
    });
    return Response.json({
      id: link.id,
      token: link.token,
      url: `${req.nextUrl.origin}/l/${link.token}`,
    });
  } catch (err) {
    console.error("Landing link create failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

  const supabase = await getSupabaseServer();
  if (!supabase) return Response.json({ error: "Supabase is not configured." }, { status: 500 });

  const { data, error } = await supabase
    .from("landing_links")
    .select("id, token, listing_no, campaign_id, clicks, created_at")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ links: data ?? [] });
}
