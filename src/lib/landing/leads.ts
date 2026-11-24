/**
 * Leads inbox — showing requests attributed to the signed-in participant.
 *
 * Run through the cookie-session client (RLS): `showing_requests_owner_read`
 * only returns rows whose parent landing_link belongs to auth.uid(), so the
 * inner join narrows rather than widens what the owner can see. The token
 * comes along so the inbox can link each lead back to its landing page.
 *
 * MVP scope (deferred — revisit after real agents use the inbox): a `status`
 * column (new/contacted/closed) needs a schema change + UI state machine;
 * bulk select/delete; CSV export.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Lead {
  id: string;
  listingNo: string;
  visitorName: string;
  visitorEmail: string;
  /** ISO timestamp — the date/time the visitor asked to see the home. */
  requestedAt: string;
  note: string | null;
  /** ISO timestamp — when the request hit the wire (row created_at). */
  receivedAt: string;
  /** Token of the landing link that captured the lead ("" if join failed). */
  linkToken: string;
}

interface LeadRow {
  id: string;
  link_id: string;
  listing_no: string;
  visitor_name: string;
  visitor_email: string;
  requested_at: string;
  note: string | null;
  created_at: string;
  landing_links:
    | { token: string; listing_no: string }
    | { token: string; listing_no: string }[]
    | null;
}

/** MVP cap — plenty for launch; add pagination only if an inbox outgrows it. */
const MAX_ROWS = 100;

/** Newest first. Throws on query error so the page can degrade gracefully. */
export async function listLeads(supabase: SupabaseClient): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("showing_requests")
    .select("*, landing_links!inner(token, listing_no)")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) throw error;

  return ((data ?? []) as LeadRow[]).map((row) => {
    const link = Array.isArray(row.landing_links)
      ? row.landing_links[0]
      : row.landing_links;
    return {
      id: row.id,
      listingNo: link?.listing_no ?? row.listing_no,
      visitorName: row.visitor_name,
      visitorEmail: row.visitor_email,
      requestedAt: row.requested_at,
      note: row.note,
      receivedAt: row.created_at,
      linkToken: link?.token ?? "",
    };
  });
}

const DATE_FMT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};
const TIME_FMT: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

/** ISO → "Nov 23, 2026 · 2:30 p.m." in the viewer's local timezone. */
export function formatLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("en-CA", DATE_FMT)} · ${d.toLocaleTimeString("en-CA", TIME_FMT)}`;
}

/**
 * Row actions are plain `mailto:` links (SMTP is still disarmed — the agent's
 * own mail client sends). Both builders URL-encode; the forward body is kept
 * under ~1500 chars so every mail client accepts the URL.
 */
const SITE_ORIGIN = "https://thespyagency.com";
const FORWARD_BODY_CAP = 1500;

function mailto(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function capBody(body: string): string {
  if (body.length <= FORWARD_BODY_CAP) return body;
  return `${body.slice(0, FORWARD_BODY_CAP - 1).trimEnd()}…`;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "there";
}

/** Reply: straight to the visitor, quoting what they originally asked for. */
export function buildReplyHref(lead: Lead): string {
  const when = formatLocal(lead.requestedAt);
  const noteBlock = lead.note ? `\n\nTheir note: "${lead.note}"` : "";
  const body = `Hi ${firstName(lead.visitorName)},\n\nThanks for your showing request for MLS® #${lead.listingNo} — you asked for ${when}.${noteBlock}\n\n\n—\nThe Spy Agency · leads inbox`;
  return mailto(lead.visitorEmail, `Re: Showing request — ${lead.listingNo}`, body);
}

/** Forward: EMPTY to-field — the agent picks the recipient in their client. */
export function buildForwardHref(lead: Lead): string {
  const when = formatLocal(lead.requestedAt);
  const urlLine = lead.linkToken
    ? `\nCaptured via: ${SITE_ORIGIN}/l/${lead.linkToken}`
    : "";
  const body = capBody(
    `— Forwarded showing request · The Spy Agency —\n\nVisitor: ${lead.visitorName} <${lead.visitorEmail}>\nListing: MLS® #${lead.listingNo}\nRequested: ${when}\nNote: ${lead.note ? `"${lead.note}"` : "—"}${urlLine}`
  );
  return mailto("", `Fwd: Showing request — ${lead.listingNo}`, body);
}
