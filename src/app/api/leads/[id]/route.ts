/**
 * DELETE /api/leads/[id] — burn one lead row.
 *
 * Runs through the USER-SCOPED Supabase client (never service role) so the
 * RLS policy `showing_requests_owner_delete` enforces ownership:
 *
 *   create policy "showing_requests_owner_delete" on public.showing_requests
 *     for delete using (exists (
 *       select 1 from public.landing_links
 *       where landing_links.id = showing_requests.link_id
 *         and landing_links.user_id = auth.uid()));
 *
 * (User runs that SQL in the Supabase SQL Editor before this ships.)
 *
 * 404 covers BOTH missing ids and rows owned by someone else — never leak
 * which lead rows exist.
 */
import { getCurrentUser, getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const leadId = String(id ?? "").trim().slice(0, 64);
  if (!leadId)
    return Response.json({ error: "Lead id required." }, { status: 400 });

  const supabase = await getSupabaseServer();
  if (!supabase)
    return Response.json({ error: "Service unavailable." }, { status: 500 });

  // `.select("id")` makes PostgREST return the deleted rows (still RLS-scoped
  // — without the delete policy this errors out, which we map to 500).
  const { data, error } = await supabase
    .from("showing_requests")
    .delete()
    .eq("id", leadId)
    .select("id");

  if (error) {
    console.error("Lead delete failed:", error);
    return Response.json({ error: "Could not delete the lead." }, { status: 500 });
  }
  if (!data || data.length === 0)
    return Response.json({ error: "Lead not found." }, { status: 404 });

  return Response.json({ ok: true });
}
