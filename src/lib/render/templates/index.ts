/**
 * Locked-layer template schema.
 *
 * A template defines the output geometry of the IMMUTABLE compliance layer:
 * the listing photo plus the credit block (listing agent, brokerage, MLS®
 * number, Equal Housing mark). Participants never edit this layer — their
 * hooks/headlines/CTAs live in a separate participant layer composited on top
 * at export time.
 *
 * Sizes are social-platform pixel targets; `creditBarHeight` is the reserved
 * bottom strip that downstream tools may not crop, alter, or obscure.
 */

export type TemplateAspect = "1:1" | "4:5" | "9:16" | "16:9";

export interface TemplateSpec {
  id: string;
  aspect: TemplateAspect;
  width: number;
  height: number;
  /** Reserved compliance strip at the bottom, in px. */
  creditBarHeight: number;
  /** Multiplier applied to base font sizes so text scales with canvas. */
  fontScale: number;
}

export const TEMPLATES: Record<string, TemplateSpec> = {
  "feed-1x1": {
    id: "feed-1x1",
    aspect: "1:1",
    width: 1080,
    height: 1080,
    creditBarHeight: 104,
    fontScale: 1,
  },
  "feed-4x5": {
    id: "feed-4x5",
    aspect: "4:5",
    width: 1080,
    height: 1350,
    creditBarHeight: 116,
    fontScale: 1,
  },
  "story-9x16": {
    id: "story-9x16",
    aspect: "9:16",
    width: 1080,
    height: 1920,
    creditBarHeight: 128,
    fontScale: 1.05,
  },
  "wide-16x9": {
    id: "wide-16x9",
    aspect: "16:9",
    width: 1920,
    height: 1080,
    creditBarHeight: 104,
    fontScale: 1,
  },
};

export const DEFAULT_TEMPLATE_ID = "feed-4x5";

export function getTemplate(id?: string | null): TemplateSpec {
  return (id && TEMPLATES[id]) || TEMPLATES[DEFAULT_TEMPLATE_ID];
}
