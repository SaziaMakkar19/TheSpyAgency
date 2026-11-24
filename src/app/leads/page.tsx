import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getCurrentUser, getSupabaseServer } from "@/lib/supabase/server";
import {
  listLeads,
  formatLocal,
  buildReplyHref,
  buildForwardHref,
  type Lead,
} from "@/lib/landing/leads";
import { LeadRowActions } from "@/components/leads/lead-row-actions";

export const metadata: Metadata = {
  title: "Leads Inbox — Head Quarters | The Spy Agency",
  description:
    "Showing requests from your co-branded landing pages, attributed to you and delivered on the wire.",
};

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
            The Spy Agency / Head Quarters
          </p>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
            Leads Inbox
          </h1>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted border-b border-lum-border-glass">
              <th className="px-4 py-3">Visitor</th>
              {/* Email/Note/Received hide on mobile so the actions column stays
                  reachable without horizontal scroll. */}
              <th className="px-4 py-3 hidden md:table-cell">Email</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3 hidden md:table-cell">Note</th>
              <th className="px-4 py-3 hidden md:table-cell">Received</th>
              <th className="px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-lum-border-glass/50 last:border-0 hover:bg-lum-surface/40 transition-colors"
              >
                <td className="px-4 py-3 font-semibold text-lum-text-primary">
                  {lead.visitorName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                  <a
                    href={`mailto:${lead.visitorEmail}`}
                    className="text-lum-primary-bright hover:underline"
                  >
                    {lead.visitorEmail}
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-lum-on-surface-variant">
                  {formatLocal(lead.requestedAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-lum-text-primary">
                  {lead.linkToken ? (
                    <a
                      href={`/l/${lead.linkToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-lum-primary-bright"
                      title="Open the landing page that captured this lead"
                    >
                      MLS® #{lead.listingNo}
                    </a>
                  ) : (
                    <>MLS® #{lead.listingNo}</>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[280px] hidden md:table-cell">
                  {lead.note ? (
                    <span
                      className="block line-clamp-2 break-words text-lum-text-muted"
                      title={lead.note}
                    >
                      {lead.note}
                    </span>
                  ) : (
                    <span className="text-lum-text-muted/60">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-lum-on-surface-variant hidden md:table-cell">
                  {formatLocal(lead.receivedAt)}
                </td>
                <td className="px-2 py-1">
                  <LeadRowActions
                    leadId={lead.id}
                    replyHref={buildReplyHref(lead)}
                    forwardHref={buildForwardHref(lead)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function LeadsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Shell>
        <div className="glass-card p-10 text-center space-y-4">
          <p className="text-sm text-lum-text-muted">
            Sign in to intercept leads from your landing pages.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl lum-gradient-btn text-sm font-semibold"
          >
            Sign In / Register
          </a>
        </div>
      </Shell>
    );
  }

  let leads: Lead[] = [];
  let loadError: string | null = null;
  const supabase = await getSupabaseServer();
  if (supabase) {
    try {
      leads = await listLeads(supabase);
    } catch (e) {
      console.error("Leads query failed:", e);
      loadError = e instanceof Error ? e.message : "Query failed.";
    }
  }

  return (
    <Shell>
      <p className="max-w-2xl text-sm text-lum-text-muted -mt-4 mb-8">
        Showing requests from your co-branded landing pages, attributed to you
        via your link — never to the listing brokerage. Email alerts are off at
        MVP (SMTP disarmed), so this inbox is the source of truth.
      </p>

      {loadError && (
        <div className="glass-card p-10 text-center">
          <p className="text-sm text-lum-error">
            The wire went quiet — could not load leads. Try again in a moment.
          </p>
        </div>
      )}

      {!loadError && leads.length === 0 && (
        <div className="glass-card p-12 text-center space-y-4">
          <p className="font-jakarta text-lg font-bold text-lum-text-primary">
            No leads on the wire yet
          </p>
          <p className="text-sm text-lum-text-muted max-w-md mx-auto">
            Share a landing link from the Studio — every showing request from
            your page lands here.
          </p>
          <a
            href="/studio"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl lum-gradient-btn text-sm font-semibold"
          >
            Open the Studio
          </a>
        </div>
      )}

      {!loadError && leads.length > 0 && (
        <>
          <p className="text-xs text-lum-text-muted mb-3">
            {leads.length} transmission{leads.length === 1 ? "" : "s"} · newest
            first
          </p>
          <LeadsTable leads={leads} />
        </>
      )}
    </Shell>
  );
}
