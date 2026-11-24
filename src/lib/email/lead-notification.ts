/**
 * New-lead notification to the owning agent, via Resend (HTTPS API).
 *
 * This is the ONLY transactional mail path at MVP — it does NOT revive the
 * disarmed SMTP route (send.ts stays cold; no marketing mail, ever).
 *
 * Discipline: this function NEVER throws. It runs inside `after()` in the
 * lead route, so a notification failure must never fail or delay the POST
 * that recorded the lead. When RESEND_API_KEY is absent we log
 * "lead email disarmed" and skip — the leads inbox remains the source of
 * truth either way.
 */
import { Resend } from "resend";
import { lookupListing } from "@/lib/bridge/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const FROM = "The Spy Agency Leads <leads@thespyagency.com>";
const INBOX_URL = "https://thespyagency.com/leads";

export async function notifyAgentNewLead(opts: {
  /** landing_links.user_id of the link that captured the lead. */
  ownerUserId: string;
  listingNo: string;
  visitorName: string;
  visitorEmail: string;
  /** The parsed instant the visitor picked. */
  requestedAt: Date;
  note: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("lead email disarmed: RESEND_API_KEY absent — lead recorded, no email sent");
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.error("lead email skipped: service-role client unavailable");
      return;
    }

    // profiles has no email column — auth.users is the only source.
    const { data, error } = await supabase.auth.admin.getUserById(opts.ownerUserId);
    const to = data?.user?.email;
    if (error || !to) {
      console.error("lead email skipped: owner email unresolvable", error);
      return;
    }

    let addressLine: string | null = null;
    try {
      const brief = await lookupListing(opts.listingNo);
      addressLine = `${brief.address}, ${brief.city}`;
    } catch {
      // Bridge unreachable / listing gone: send without the address rather
      // than skip the notification (no-slop: omit, never invent).
    }

    // The visitor picked a wall time; the route parsed it as server-local,
    // so formatting server-local here reproduces what they asked for.
    const when = opts.requestedAt.toLocaleString("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const listing = addressLine
      ? `MLS® #${opts.listingNo} — ${addressLine}`
      : `MLS® #${opts.listingNo}`;
    const noteLine = opts.note ? opts.note : "—";

    const text = [
      `New showing request on the wire.`,
      ``,
      `Visitor: ${opts.visitorName} <${opts.visitorEmail}>`,
      `Listing: ${listing}`,
      `Requested: ${when}`,
      `Note: ${noteLine}`,
      ``,
      `Open your leads inbox: ${INBOX_URL}`,
      ``,
      `— The Spy Agency`,
    ].join("\n");

    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const html = `
      <div style="margin:0;padding:24px;background:#020617;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:480px;margin:0 auto;background:#0f172a;border:1px solid #3730a3;border-radius:12px;overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #1e293b;">
            <div style="color:#a78bfa;font-size:10px;letter-spacing:3px;font-weight:bold;">THE SPY AGENCY · NEW LEAD</div>
            <div style="color:#ffffff;font-size:16px;font-weight:bold;margin-top:4px;">Showing request — MLS® #${esc(opts.listingNo)}</div>
          </div>
          <div style="padding:20px 24px;color:#e2e8f0;font-size:14px;line-height:1.6;">
            <p style="margin:0 0 12px;"><strong style="color:#ffffff;">${esc(opts.visitorName)}</strong> &lt;${esc(opts.visitorEmail)}&gt; requested a showing.</p>
            <table style="border-collapse:collapse;font-size:13px;color:#cbd5e1;">
              <tr><td style="padding:2px 12px 2px 0;color:#94a3b8;">Listing</td><td>${esc(listing)}</td></tr>
              <tr><td style="padding:2px 12px 2px 0;color:#94a3b8;">Requested</td><td>${esc(when)}</td></tr>
              <tr><td style="padding:2px 12px 2px 0;color:#94a3b8;vertical-align:top;">Note</td><td>${esc(noteLine)}</td></tr>
            </table>
            <p style="margin:16px 0 0;">
              <a href="${INBOX_URL}" style="display:inline-block;padding:10px 18px;background:linear-gradient(90deg,#8b5cf6,#6366f1);color:#ffffff;font-weight:bold;font-size:13px;border-radius:8px;text-decoration:none;">Open leads inbox</a>
            </p>
            <p style="margin:16px 0 0;font-size:12px;color:#64748b;">Hit Reply in your mail client to respond to the visitor directly.</p>
          </div>
        </div>
      </div>`;

    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to,
      replyTo: opts.visitorEmail,
      subject: `New showing request — ${opts.listingNo}`,
      text,
      html,
    });
    if (sendError) console.error("lead email send failed:", sendError);
  } catch (e) {
    console.error("lead notification failed:", e);
  }
}
