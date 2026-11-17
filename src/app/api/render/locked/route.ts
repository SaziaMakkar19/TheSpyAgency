/**
 * POST /api/render/locked — render the immutable locked compliance layer for
 * a listing.
 *
 * Body:   { mlsNo: string, templateId?: string, persist?: boolean }
 *         mlsNo "sample" renders the labeled demo listing (no Bridge call).
 * Reply:  { path, publicUrl, width, height, templateId, demo }
 *
 * GET /api/render/locked?mls=R3009847&raw=1 — test helper. raw=1 streams the
 * WebP straight back for eyeballing in a browser tab.
 *
 * Rendered layers persist to the public `listing-renders` bucket at
 * `<MLS>/locked/<timestamp>.webp` — they are the immutable base every
 * participant layer is composited over.
 */
import { type NextRequest } from "next/server";
import {
  lookupListing,
  getSampleListing,
  isDemoMode,
  ListingNotFoundError,
  type ListingBrief,
} from "@/lib/bridge/client";
import { renderLockedLayer } from "@/lib/render/locked-layer";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_TEMPLATE_ID } from "@/lib/render/templates";

export const runtime = "nodejs";

async function resolveListing(mlsNo: string): Promise<{ brief: ListingBrief; demo: boolean }> {
  if (mlsNo.toLowerCase() === "sample") {
    return { brief: getSampleListing(), demo: true };
  }
  const brief = await lookupListing(mlsNo);
  return { brief, demo: isDemoMode() };
}

async function renderForListing(mlsNo: string, templateId?: string) {
  const { brief, demo } = await resolveListing(mlsNo);
  if (!brief.photoUrl) throw new Error(`Listing ${brief.mlsNo} has no photo to render.`);
  if (!brief.agentName) throw new Error(`Listing ${brief.mlsNo} has no agent name — credits are mandatory.`);

  const rendered = await renderLockedLayer(
    {
      photoUrl: brief.photoUrl,
      mlsNo: brief.mlsNo,
      agentName: brief.agentName,
      brokerage: brief.brokerage,
    },
    templateId,
  );
  return { brief, demo, rendered };
}

async function persist(mlsNo: string, webp: Buffer) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { path: null, publicUrl: null };

  const path = `${mlsNo}/locked/${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from("listing-renders")
    .upload(path, webp, { contentType: "image/webp" });
  if (error) {
    console.warn("Locked-layer storage skipped:", error.message);
    return { path: null, publicUrl: null };
  }
  const { data } = supabase.storage.from("listing-renders").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mlsNo = String(body.mlsNo ?? body.query ?? "").trim();
    if (!mlsNo) return Response.json({ error: "mlsNo is required" }, { status: 400 });

    const { brief, demo, rendered } = await renderForListing(mlsNo, body.templateId);
    const stored = body.persist === false ? { path: null, publicUrl: null } : await persist(brief.mlsNo, rendered.webp);

    return Response.json({
      ...stored,
      width: rendered.width,
      height: rendered.height,
      templateId: rendered.templateId,
      demo,
      bytes: rendered.webp.length,
    });
  } catch (err) {
    if (err instanceof ListingNotFoundError) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    console.error("Locked-layer render failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mlsNo = (sp.get("mls") || "sample").trim();
  const templateId = sp.get("template") || DEFAULT_TEMPLATE_ID;

  try {
    const { rendered } = await renderForListing(mlsNo, templateId);

    if (sp.get("raw") === "1") {
      return new Response(new Uint8Array(rendered.webp), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "no-store",
        },
      });
    }
    return Response.json({
      width: rendered.width,
      height: rendered.height,
      templateId: rendered.templateId,
      bytes: rendered.webp.length,
    });
  } catch (err) {
    if (err instanceof ListingNotFoundError) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    console.error("Locked-layer render failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 },
    );
  }
}
