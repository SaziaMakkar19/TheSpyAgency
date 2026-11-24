/**
 * Leads inbox — showing requests attributed to the signed-in participant.
 *
 * Run through the cookie-session client (RLS): `showing_requests_owner_read`
 * only returns rows whose parent landing_link belongs to auth.uid(), so the
 * inner join narrows rather than widens what the owner can see. The token
 * comes along so the inbox can link each lead back to its landing page.
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

/** Newest first. Throws on query error so the page can degrade gracefully. */
export async function listLeads(supabase: SupabaseClient): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("showing_requests")
    .select("*, landing_links!inner(token, listing_no)")
    .order("created_at", { ascending: false });

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
