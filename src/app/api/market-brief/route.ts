/**
 * Tactical Market Brief endpoint — the homepage lead magnet.
 *
 * POST /api/market-brief
 *   Body: {
 *     query: "R3009847" | "2456 Marine Drive",
 *     intent: "owner" | "inquiry",        // required — acts as the intent gate
 *     requesterEmail?: string,            // required when intent = "inquiry"
 *     requesterName?: string,             // optional
 *     company?: string,                   // honeypot — humans never fill this
 *   }
 *   → honeypot / rate-limit checks
 *   → Bridge lookup (demo mode when BRIDGE_API_KEY is absent)
 *   → render watermarked one-page PDF
 *   → record lead in `leads` table (service role)
 *   → owner:    email brief to agent on file (max 1 per listing per day)
 *     inquiry:  email brief to requester + lead alert to the listing agent
 *   → { ok, agentName, emailed, sampleUrl }
 *
 * POST /api/market-brief  { action: "newsletter", mlsNo }
 *   → opt the most recent lead for that MLS# into the digest
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  lookupListing,
  isDemoMode,
  ListingNotFoundError,
} from '@/lib/bridge/client';
import { renderBriefPdf } from '@/lib/market-brief/render';
import { isEmailConfigured, sendBriefEmail, sendLeadAlertEmail } from '@/lib/email/send';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_PER_HOUR = 5;

function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

export async function POST(req: NextRequest) {
  let body: {
    query?: string;
    action?: string;
    mlsNo?: string;
    intent?: string;
    requesterEmail?: string;
    requesterName?: string;
    company?: string; // honeypot
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Newsletter opt-in for a previously captured lead
  if (body.action === 'newsletter') {
    if (!body.mlsNo || !supabase) {
      return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
    }
    const { error } = await supabase
      .from('leads')
      .update({ newsletter_opt_in: true })
      .eq('mls_no', body.mlsNo.toUpperCase())
      .order('created_at', { ascending: false })
      .limit(1);
    return NextResponse.json({ ok: !error });
  }

  const query = (body.query || '').trim();
  const intent = body.intent;
  const ip = clientIp(req);

  // ── Anti-abuse layers ────────────────────────────────────────────────
  // 1. Honeypot: bots fill hidden fields humans never see. Pretend success
  //    but do absolutely nothing.
  if (body.company) {
    return NextResponse.json({ ok: true, demo: isDemoMode(), emailed: false });
  }

  // 2. Intent gate: a choice between the two checkboxes is required.
  if (intent !== 'owner' && intent !== 'inquiry') {
    return NextResponse.json({ ok: false, error: 'intent_required' }, { status: 400 });
  }

  // 3. Inquiries must self-verify: the brief only goes to a real inbox.
  const requesterEmail = (body.requesterEmail || '').trim();
  if (intent === 'inquiry' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(requesterEmail)) {
    return NextResponse.json({ ok: false, error: 'email_required' }, { status: 400 });
  }

  if (query.length < 4) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  // 4. Rate limit: max N scans per IP per hour (tracked via the leads table).
  if (supabase) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('requester_ip', ip)
      .gte('created_at', since);
    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
    }
  }

  // 1. Bridge lookup (demo fallback built in)
  let brief;
  try {
    brief = await lookupListing(query);
  } catch (err) {
    if (err instanceof ListingNotFoundError) {
      return NextResponse.json(
        { ok: false, error: 'not_found', demo: isDemoMode() },
        { status: 404 }
      );
    }
    console.error('Bridge lookup failed:', err);
    return NextResponse.json({ ok: false, error: 'upstream' }, { status: 502 });
  }

  // 2. Render the PDF
  let pdf: Buffer;
  try {
    pdf = await renderBriefPdf(brief);
  } catch (err) {
    console.error('Brief render failed:', err);
    return NextResponse.json({ ok: false, error: 'render_failed' }, { status: 500 });
  }

  // 3. Record the lead (never fail the request over logging)
  if (supabase) {
    const { error } = await supabase.from('leads').insert({
      mls_no: brief.mlsNo,
      address: `${brief.address}, ${brief.city}`,
      agent_email: brief.agentEmail,
      agent_name: brief.agentName,
      brokerage: brief.brokerage,
      source: 'homepage-brief',
      intent,
      requester_email: intent === 'inquiry' ? requesterEmail : null,
      requester_name: (body.requesterName || '').trim() || null,
      requester_ip: ip,
    });
    if (error) console.warn('Lead insert failed:', error.message);
  }

  // 4. Email routing by intent
  let emailed = false;
  let leadAlertSent = false;

  if (isEmailConfigured()) {
    if (intent === 'owner' && brief.agentEmail) {
      // Cap: never email an agent about the same listing more than once a day.
      let recentlyEmailed = false;
      if (supabase) {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('mls_no', brief.mlsNo)
          .eq('intent', 'owner')
          .eq('emailed', true)
          .gte('created_at', since);
        recentlyEmailed = (count ?? 0) > 0;
      }
      if (!recentlyEmailed) {
        try {
          await sendBriefEmail({ to: brief.agentEmail, agentName: brief.agentName, brief, pdf });
          emailed = true;
        } catch (err) {
          console.error('Brief email failed:', err);
        }
      } else {
        emailed = true; // already delivered earlier — report success, stay quiet
      }
    }

    if (intent === 'inquiry') {
      // Brief to the requester (self-verifies their address)…
      try {
        await sendBriefEmail({
          to: requesterEmail,
          agentName: body.requesterName?.trim() || 'there',
          brief,
          pdf,
        });
        emailed = true;
      } catch (err) {
        console.error('Requester brief email failed:', err);
      }
      // …and a lead alert to the listing agent (max 1 per day, same cap logic).
      if (brief.agentEmail) {
        let recentlyAlerted = false;
        if (supabase) {
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { count } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('mls_no', brief.mlsNo)
            .eq('intent', 'inquiry')
            .eq('emailed', true)
            .gte('created_at', since);
          recentlyAlerted = (count ?? 0) > 1; // >1: this row counts once inserted above
        }
        if (!recentlyAlerted) {
          try {
            await sendLeadAlertEmail({
              to: brief.agentEmail,
              agentName: brief.agentName,
              brief,
              requesterName: (body.requesterName || '').trim() || null,
              requesterEmail,
            });
            leadAlertSent = true;
          } catch (err) {
            console.error('Lead alert email failed:', err);
          }
        }
      }
    }

    if (emailed && supabase) {
      await supabase
        .from('leads')
        .update({ emailed: true })
        .eq('mls_no', brief.mlsNo)
        .order('created_at', { ascending: false })
        .limit(1);
    }
  }

  return NextResponse.json({
    ok: true,
    demo: isDemoMode(),
    emailed,
    leadAlertSent,
    agentName: brief.agentName,
    mlsNo: brief.mlsNo,
    sampleUrl: '/api/market-brief/sample',
  });
}
