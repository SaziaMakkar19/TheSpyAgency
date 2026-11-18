/**
 * AI copy generation for the participant layer: 3 angled hook/headline/CTA
 * variations per listing.
 *
 * NO-SLOP POLICY APPLIES TO COPY: the model receives only verified Bridge
 * specs and is instructed to use nothing else — no invented features, views,
 * renovations, or neighbourhood claims. If the spec sheet doesn't say it,
 * the copy doesn't say it. Canadian advertising context (no US fair-housing
 * phrasing required, but steer clear of people/family-targeting language —
 * describe the PROPERTY, never the buyer).
 *
 * Distinct angles per variation — this is what makes co-op campaign posts
 * differ from each other when many agents share one listing:
 *   1. lifestyle   — the feeling of living there
 *   2. value       — price / space / numbers angle
 *   3. feature     — the standout spec or location
 *
 * Uses OPENAI_API_KEY (gpt-4o-mini per the architecture doc's free tier).
 * When the key is absent (demo mode), falls back to deterministic
 * template copy built from the same specs — never fabricated facts.
 */
import type { ListingBrief } from "@/lib/bridge/client";

export interface CopyVariation {
  angle: "lifestyle" | "value" | "feature";
  hook: string;
  headline: string;
  cta: string;
}

const SYSTEM_PROMPT = `You are a senior real-estate copywriter in Greater Vancouver, Canada, writing short social-post copy for participating agents.

STRICT RULES:
- Use ONLY the listing facts provided in the user message. Never invent features, views, finishes, renovations, schools, transit, or neighbourhood character.
- Describe the property, never the buyer. No family-status, demographic, or lifestyle-group targeting.
- Hook: max 6 words, punchy kicker (will render in ALL CAPS).
- Headline: max 12 words, sentence case, no exclamation marks.
- CTA: max 7 words, action phrase inviting a showing or inquiry.
- No emojis, no hashtags, no ALL CAPS in headline, no price formatting changes (use the price exactly as given if referenced).
- Canadian spelling.

Return JSON ONLY in this exact shape:
{"variations":[{"angle":"lifestyle","hook":"...","headline":"...","cta":"..."},{"angle":"value","hook":"...","headline":"...","cta":"..."},{"angle":"feature","hook":"...","headline":"...","cta":"..."}]}`;

function specSheet(brief: ListingBrief): string {
  const lines = [
    `Address: ${brief.address}, ${brief.city}`,
    `List price: $${brief.price.toLocaleString("en-CA")}`,
    `Beds: ${brief.beds}`,
    `Baths: ${brief.baths}`,
    brief.interiorSqft ? `Living area: ${brief.interiorSqft} sqft` : null,
    `Property type: ${brief.propertyType}`,
    brief.yearBuilt ? `Year built: ${brief.yearBuilt}` : null,
    `Days on market: ${brief.daysOnMarket}`,
    `Status: ${brief.status}`,
  ].filter(Boolean);
  return `LISTING FACTS (the only facts you may use):\n${lines.join("\n")}`;
}

/** Deterministic fallback when no AI key is configured (demo mode). */
function fallbackCopy(brief: ListingBrief): CopyVariation[] {
  const where = brief.city || "Greater Vancouver";
  const specs = [
    brief.beds ? `${brief.beds} bed` : null,
    brief.baths ? `${brief.baths} bath` : null,
    brief.interiorSqft ? `${brief.interiorSqft.toLocaleString("en-CA")} sqft` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return [
    {
      angle: "lifestyle",
      hook: `New in ${where}`,
      headline: `${brief.address} is ready for its next chapter`,
      cta: "Book a private tour",
    },
    {
      angle: "value",
      hook: `${specs} in ${where}`,
      headline: `Listed at $${brief.price.toLocaleString("en-CA")}`,
      cta: "See the full listing",
    },
    {
      angle: "feature",
      hook: `${brief.propertyType} living`,
      headline: `${brief.address}, ${where}`,
      cta: "Request a showing",
    },
  ];
}

/** Generate 3 angled copy variations from verified listing specs. */
export async function generateCopy(brief: ListingBrief): Promise<{ variations: CopyVariation[]; ai: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { variations: fallbackCopy(brief), ai: false };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: specSheet(brief) },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI copy generation failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");

  const parsed = JSON.parse(content);
  const variations = (parsed?.variations ?? []) as CopyVariation[];
  if (!Array.isArray(variations) || variations.length === 0) {
    throw new Error("OpenAI returned no variations");
  }

  // Enforce the no-slop contract mechanically: trim to the 3 angles and
  // hard-cap lengths so copy always fits the participant layer.
  const cap = (s: string, words: number) =>
    String(s ?? "").trim().split(/\s+/).slice(0, words).join(" ");

  return {
    variations: variations.slice(0, 3).map((v, i) => ({
      angle: (["lifestyle", "value", "feature"] as const)[i] ?? "feature",
      hook: cap(v.hook, 8),
      headline: cap(v.headline, 14),
      cta: cap(v.cta, 8),
    })),
    ai: true,
  };
}
