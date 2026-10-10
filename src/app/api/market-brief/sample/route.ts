/**
 * GET /api/market-brief/sample — a sample Tactical Market Brief PDF (demo
 * data) for the "view a sample report" link on the homepage CTA.
 */
import { NextResponse } from 'next/server';
import { getSampleListing } from '@/lib/bridge/client';
import { renderBriefPdf } from '@/lib/market-brief/render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pdf = await renderBriefPdf(getSampleListing());
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="market-brief-sample.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Sample brief render failed:', err);
    return NextResponse.json({ ok: false, error: 'render_failed' }, { status: 500 });
  }
}
