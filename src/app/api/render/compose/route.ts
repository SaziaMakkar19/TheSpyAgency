/**
 * POST /api/render/compose — full two-layer post: locked compliance layer +
 * participant layer, flattened server-side, persisted to Storage.
 *
 * Body: {
 *   mlsNo: string,                    // or "sample"
 *   templateId?: string,
 *   userId?: string,                  // resolve brand from their profile, OR
 *   participant?: {                   // explicit brand (testing / pre-onboarding)
 *     displayName: string, brokerage?: string, phone?: string, email?: string,
 *     headshotUrl?: string, logoUrl?: string, accentColor?: string
 *   },
 *   hook?: string, headline: string, cta?: string,
 *   persist?: boolean                 // default true
 * }
 * Reply: { path, publicUrl, width, height, templateId, demo, bytes }
 *
 * GET /api/render/compose?mls=R3184362&headline=...&raw=1 — test helper;
 * raw=1 streams the flattened WebP.
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
import { renderParticipantOverlay, composePost } from "@/lib/render/participant-layer";
import {
  resolveParticipantBrand,
  DEFAULT_ACCENT,
  type ParticipantBrand,
} from "@/lib/render/participant";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_TEMPLATE_ID } from "@/lib/render/templates";

export const runtime = "nodejs";

async function resolveBrand(body: {
  userId?: string;
  participant?: Partial<ParticipantBrand> & { displayName?: string };
}): Promise<ParticipantBrand | { error: string }> {
  if (body.userId) {
    const brand = await resolveParticipantBrand(body.userId);
    if (!brand) return { error: "No profile found for userId" };
    return brand;
  }
  if (body.participant?.displayName) {
    return {
      displayName: body.participant.displayName,
      brokerage: body.participant.brokerage ?? null,
      phone: body.participant.phone ?? null,
      email: body.participant.email ?? null,
      headshotUrl: body.participant.headshotUrl ?? null,
      logoUrl: body.participant.logoUrl ?? null,
      accentColor: body.participant.accentColor ?? DEFAULT_ACCENT,
    };
  }
  return { error: "Provide userId or an explicit participant object" };
}

async function renderComposed(opts: {
  mlsNo: string;
  templateId?: string;
  brand: ParticipantBrand;
  hook?: string | null;
  headline: string;
  cta?: string | null;
}) {
  const brief: ListingBrief =
    opts.mlsNo.toLowerCase() === "sample"
      ? getSampleListing()
      : await lookupListing(opts.mlsNo);
  const demo = opts.mlsNo.toLowerCase() === "sample" || isDemoMode();

  if (!brief.photoUrl) throw new Error(`Listing ${brief.mlsNo} has no photo to render.`);
  if (!brief.agentName && !brief.brokerage)
    throw new Error(`Listing ${brief.mlsNo} has no agent or brokerage — credits are mandatory.`);

  const locked = await renderLockedLayer(
    {
      photoUrl: brief.photoUrl,
      mlsNo: brief.mlsNo,
      agentName: brief.agentName || null,
      brokerage: brief.brokerage,
      address: brief.address,
      city: brief.city,
      price: brief.price,
      beds: brief.beds,
      baths: brief.baths,
      interiorSqft: brief.interiorSqft,
      status: brief.status,
    },
    opts.templateId,
  );

  const overlay = await renderParticipantOverlay(
    { brand: opts.brand, hook: opts.hook, headline: opts.headline, cta: opts.cta },
    opts.templateId,
  );

  const webp = await composePost(locked.png, overlay);
  return { brief, demo, rendered: { ...locked, webp } };
}

async function persist(mlsNo: string, webp: Buffer) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { path: null, publicUrl: null };

  const path = `${mlsNo}/composited/${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from("listing-renders")
    .upload(path, webp, { contentType: "image/webp" });
  if (error) {
    console.warn("Composited-post storage skipped:", error.message);
    return { path: null, publicUrl: null };
  }
  const { data } = supabase.storage.from("listing-renders").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const mlsNo = String(body.mlsNo ?? "").trim();
    const headline = String(body.headline ?? "").trim();
    if (!mlsNo) return Response.json({ error: "mlsNo is required" }, { status: 400 });
    if (!headline) return Response.json({ error: "headline is required" }, { status: 400 });

    const brand = await resolveBrand(body);
    if ("error" in brand) return Response.json(brand, { status: 400 });

    const { brief, demo, rendered } = await renderComposed({
      mlsNo,
      templateId: body.templateId,
      brand,
      hook: body.hook,
      headline,
      cta: body.cta,
    });
    const stored =
      body.persist === false ? { path: null, publicUrl: null } : await persist(brief.mlsNo, rendered.webp);

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
    console.error("Compose render failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mlsNo = (sp.get("mls") || "sample").trim();
  const headline = (sp.get("headline") || "Your Friday-evening showing awaits").trim();
  const hook = sp.get("hook") ?? "Just listed";
  const cta = sp.get("cta") ?? "Book a private tour";
  const templateId = sp.get("template") || DEFAULT_TEMPLATE_ID;

  // Test helper always renders with an explicit sample participant —
  // production flow passes userId and resolves from the profile.
  const brand: ParticipantBrand = {
    displayName: sp.get("name") || "Jordan Reeves",
    brokerage: sp.get("brokerage") || "Oakwyn Realty",
    phone: sp.get("phone") || "604-555-0192",
    email: sp.get("email") || "jordan@oakwyn.ca",
    headshotUrl: sp.get("headshot"),
    logoUrl: sp.get("logo"),
    accentColor: sp.get("accent") || DEFAULT_ACCENT,
  };

  try {
    const { rendered } = await renderComposed({
      mlsNo,
      templateId,
      brand,
      hook,
      headline,
      cta,
    });

    if (sp.get("raw") === "1") {
      return new Response(new Uint8Array(rendered.webp), {
        headers: { "Content-Type": "image/webp", "Cache-Control": "no-store" },
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
    console.error("Compose render failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 },
    );
  }
}
