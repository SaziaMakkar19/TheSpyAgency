/**
 * Newsletter signup endpoint — footer "Free Prompt Newsletter" form.
 *
 * POST /api/newsletter
 *   Body: { email: string, name?: string, source?: string }
 *   → validate email
 *   → upsert into newsletter_subscribers (service role; case-insensitive
 *     unique email via lower(email))
 *   → { ok: true, alreadySubscribed?: boolean }
 *
 * Table (run in Supabase SQL Editor — see footer commit / HANDOFF):
 *   newsletter_subscribers
 * No emails are sent here yet — double opt-in + digest sending land later.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; name?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || '').trim() || null;
  const source = (body.source || 'footer').trim().slice(0, 50) || 'footer';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 });
  }

  // Idempotent signup: an existing row (even unsubscribed) gets reactivated
  // rather than a duplicate row — the unique index is on lower(email).
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .ilike('email', email)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'subscribed') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'subscribed',
        name: name ?? undefined,
        source,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) {
      console.error('Newsletter resubscribe failed:', error.message);
      return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, resubscribed: true });
  }

  const { error } = await supabase.from('newsletter_subscribers').insert({
    email,
    name,
    source,
    status: 'subscribed',
  });

  if (error) {
    // Unique-violation race (someone double-submitted) reads as success.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }
    console.error('Newsletter insert failed:', error.message);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
