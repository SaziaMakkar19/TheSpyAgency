/**
 * POST /api/landing/lead — record a showing request from a public landing
 * page. Anonymous visitors; the parent link identifies which participant
 * gets credited (RLS blocks public inserts, so this writes service-role).
 *
 * After the insert succeeds, the owning agent is emailed via Resend inside
 * after() — the response never waits on, and never fails because of, email.
 *
 * Body: { token, name, email, date, time, note?, company? }
 * `company` is a honeypot — bots fill it, humans never see it; we fake
 * success and skip the insert.
 */
import { after, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { notifyAgentNewLead } from "@/lib/email/lead-notification";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Honeypot: silently accept but record nothing.
  if (body.company) return Response.json({ ok: true });

  const token = String(body.token ?? "").trim();
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const date = String(body.date ?? "").trim();
  const time = String(body.time ?? "").trim();
  const note = String(body.note ?? "").trim().slice(0, 1000) || null;

  if (!token) return Response.json({ error: "Missing link token." }, { status: 400 });
  if (!name || !EMAIL_RE.test(email))
    return Response.json({ error: "Name and a valid email are required." }, { status: 400 });

  const requestedAt = new Date(`${date}T${time || "12:00"}`);
  if (!date || Number.isNaN(requestedAt.getTime()))
    return Response.json({ error: "Pick a valid date." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return Response.json({ error: "Service unavailable." }, { status: 500 });

  // Resolve the link (validates token + gives us the attributed owner/listing).
  const { data: link, error: linkError } = await supabase
    .from("landing_links")
    .select("id, listing_no, user_id")
    .eq("token", token)
    .single();
  if (linkError || !link) return Response.json({ error: "Link not found." }, { status: 404 });

  const { error } = await supabase.from("showing_requests").insert({
    link_id: link.id,
    listing_no: link.listing_no,
    visitor_name: name,
    visitor_email: email,
    requested_at: requestedAt.toISOString(),
    note,
  });
  if (error) {
    console.error("Lead insert failed:", error);
    return Response.json({ error: "Could not record the request." }, { status: 500 });
  }

  // Email the owning agent (Resend, SMTP stays disarmed). after() runs once
  // the response is sent; notifyAgentNewLead swallows its own errors.
  after(() =>
    notifyAgentNewLead({
      ownerUserId: link.user_id,
      listingNo: link.listing_no,
      visitorName: name,
      visitorEmail: email,
      requestedAt,
      note,
    })
  );

  return Response.json({ ok: true });
}
