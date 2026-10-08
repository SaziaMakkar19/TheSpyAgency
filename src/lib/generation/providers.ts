/**
 * Generation provider registry — the Remix Studio model dropdown.
 *
 * Same pattern as the social publishers (supabase/functions/_shared/providers):
 * each provider is one file behind a shared interface; this registry is the
 * single source of truth for labels, server-side env var names, and which
 * options are live. `available: false` renders the option disabled in the UI
 * (e.g. the self-hosted FLUX plan that activates after launch).
 *
 * Security: every envVar here is SERVER-ONLY. Never prefix with
 * NEXT_PUBLIC_ — these keys sign paid API requests.
 */
export interface GenerationProvider {
  /** Stored in remixes.provider — stable identifier. */
  id: string;
  /** Dropdown label. */
  label: string;
  /** One-line capability note shown under the selector. */
  blurb: string;
  /** Server-side secret name the generation handler reads. */
  envVar: string;
  /** Optional chip text, e.g. "Default" / "Post-launch". */
  badge?: string;
  /** false → rendered disabled until wired up. */
  available: boolean;
}

export const GENERATION_PROVIDERS: GenerationProvider[] = [
  {
    id: "ideogram",
    label: "Ideogram 3.0",
    blurb:
      "Best-in-class text rendering inside images — poster copy, prices, and addresses stay legible.",
    envVar: "IDEOGRAM_API_KEY",
    badge: "Default",
    available: true,
  },
  {
    id: "openai",
    label: "OpenAI Images (gpt-image-1)",
    blurb: "Fast, strong all-rounder with consistent prompt adherence.",
    envVar: "OPENAI_API_KEY",
    available: true,
  },
  {
    id: "google-imagen",
    label: "Google Imagen 4",
    blurb: "Photoreal architectural shots; strong composition at poster sizes.",
    envVar: "GOOGLE_AI_API_KEY",
    available: true,
  },
  {
    id: "flux-selfhost",
    label: "FLUX — self-hosted (gaming rig)",
    blurb:
      "Zero marginal cost per render once volume makes API pricing sting. Activates post-launch.",
    envVar: "FAL_KEY / REPLICATE_API_TOKEN",
    badge: "Post-launch",
    available: false,
  },
];

export const DEFAULT_GENERATION_PROVIDER = "ideogram";
