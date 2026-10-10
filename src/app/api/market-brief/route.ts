/**
 * Tactical Market Brief endpoint — the homepage lead magnet.
 *
 * POST /api/market-brief
 *   Body: { query: "R3009847" | "2456 Marine Drive" }
 *   → Bridge lookup (demo mode when BRIDGE_API_KEY is absent)
 *   → render watermarked one-page PDF
 *   → record lead in `leads` table (service role)
 *   → email PDF to the listing agent's address on file (SMTP configured)
 *   → { ok, agentName, emailed, sampleUrl }
 *
 * POST /api/market-brief  { action: "newsletter", mlsNo }
 *   → opt the most recent lead for that MLS# into the digest
 *
 * GET /api/market-brief/sample
 *   → a sample brief PDF (demo data) for the "view a sample report" link
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  lookupListing,
  isDemoMode,
  ListingNotFoundError,
} from '@/lib/bridge/client';
import { renderBriefPdf } from '@/lib/market-brief/render';
import { isEmailConfigured, sendBriefEmail } from '@/lib/email/send';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { query?: string; action?: string; mlsNo?: string };
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
  if (query.length < 4) {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
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
    });
    if (error) console.warn('Lead insert failed:', error.message);
  }

  // 4. Email to the address on file
  let emailed = false;
  if (isEmailConfigured() && brief.agentEmail) {
    try {
      await sendBriefEmail({ to: brief.agentEmail, agentName: brief.agentName, brief, pdf });
      emailed = true;
    } catch (err) {
      console.error('Brief email failed:', err);
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
    agentName: brief.agentName,
    mlsNo: brief.mlsNo,
    sampleUrl: '/api/market-brief/sample',
  });
}
