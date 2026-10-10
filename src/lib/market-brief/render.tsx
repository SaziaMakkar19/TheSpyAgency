/**
 * Server-side rendering helpers for the Tactical Market Brief PDF.
 */
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { BriefDocument } from '@/lib/market-brief/document';
import type { ListingBrief } from '@/lib/bridge/client';

export async function renderBriefPdf(brief: ListingBrief): Promise<Buffer> {
  const render = async (b: ListingBrief) => {
    const blob = await pdf(<BriefDocument brief={b} generatedAt={new Date()} />).toBlob();
    return Buffer.from(await blob.arrayBuffer());
  };

  try {
    return await render(brief);
  } catch (err) {
    // Photo fetch is the most common failure (expired/authorized URLs) —
    // retry once without the photo rather than failing the whole brief.
    if (brief.photoUrl) {
      return render({ ...brief, photoUrl: null });
    }
    throw err;
  }
}
