/**
 * Persists generated market briefs to Supabase Storage so every report is
 * retrievable after generation (review, support, re-download). Bucket:
 * 'market-briefs' (private — access via short-lived signed URLs).
 */
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function storeBriefPdf(mlsNo: string, pdf: Buffer): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const path = `${mlsNo}/${Date.now()}.pdf`;
  const { error } = await supabase.storage
    .from('market-briefs')
    .upload(path, pdf, { contentType: 'application/pdf' });

  if (error) {
    // Missing bucket is a setup step, not a failure — log and continue.
    console.warn('Brief storage skipped:', error.message);
    return null;
  }

  const { data } = await supabase.storage
    .from('market-briefs')
    .createSignedUrl(path, 7 * 24 * 60 * 60); // 7 days

  return data?.signedUrl ?? null;
}
