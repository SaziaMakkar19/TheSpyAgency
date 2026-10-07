"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SEED_POSTS,
  STYLE_PRESETS,
  type Post,
} from "@/lib/data/posts";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { PromptInput } from "./PromptInput";
import { StylePresetSelector } from "./StylePresetSelector";

interface AIRemixStudioProps {
  sourcePost?: Post | null;
}

/**
 * AIRemixStudio — the Stitch "Co-Op Campaign Remix Studio v4.5", ported.
 *
 * Two-layer canvas model:
 *  - EDITABLE agent layer: headline, buyer-agent shift note, style preset,
 *    blend/infusion weights. Participating buyer agents input here.
 *  - LOCKED compliance layer: MLS Master Geometry + brokerage attribution,
 *    always composited and non-editable.
 *
 * Submits insert a row into the `remixes` table (status: queued) which the
 * backend generation handler picks up.
 */
export function AIRemixStudio({ sourcePost }: AIRemixStudioProps) {
  const searchParams = useSearchParams();
  const sourceId = sourcePost?.id ?? searchParams.get("source");
  const post =
    sourcePost ?? SEED_POSTS.find((p) => p.id === sourceId) ?? SEED_POSTS[0];

  const [headline, setHeadline] = useState(post.title);
  const [agentNote, setAgentNote] = useState("");
  const [basePrompt, setBasePrompt] = useState(post.prompt);
  const [coOpModifier, setCoOpModifier] = useState(
    "Twilight golden hour atmosphere, cinematic blue & amber volumetric haze, subtle architectural uplighting"
  );
  const [preset, setPreset] = useState(post.stylePreset);
  const [aspect, setAspect] = useState<string>(post.aspectRatio);
  const [blend, setBlend] = useState(65);
  const [infusion, setInfusion] = useState(75);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRemix = async () => {
    setSubmitting(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    try {
      if (supabase) {
        // RLS (remixes_owner_all) requires a signed-in owner on every row.
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Sign in to queue a remix.");

        const { error: insertError } = await supabase.from("remixes").insert({
          user_id: user.id,
          source_post_id: /^[0-9a-f-]{36}$/i.test(post.id) ? post.id : null,
          prompt: basePrompt,
          co_op_modifier: coOpModifier,
          style_preset: preset,
          aspect_ratio: aspect,
          headline,
          status: "queued",
          credits_spent: 2,
        });
        if (insertError) throw insertError;
      } else {
        throw new Error("Supabase is not configured — remix runs in demo mode.");
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to queue remix.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── Canvas (composited layers) ── */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted">
              Composite Preview
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-lum-tertiary/15 text-lum-tertiary-bright text-[10px] font-semibold uppercase tracking-wider">
              <svg className="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              MLS Co-Op Compliant
            </span>
          </div>

          {/* Canvas */}
          <div
            className="relative w-full overflow-hidden rounded-lg border border-lum-border-glass"
            style={{
              aspectRatio: aspect.replace(":", "/"),
              background: `linear-gradient(160deg, hsl(${post.gradientSeed} 45% 26%), hsl(${(post.gradientSeed + 30) % 360} 55% 14%) 45%, #0b0f17)`,
            }}
          >
            {/* L0: locked MLS geometry layer */}
            <div className="absolute inset-0" aria-hidden>
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background: `radial-gradient(ellipse 70% 55% at 65% 30%, hsl(${(post.gradientSeed + 20) % 360} 70% 55% / 0.35), transparent 70%)`,
                }}
              />
            </div>

            {/* L1: twilight grade layer (weight = blend) */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity"
              style={{ opacity: blend / 100 }}
              aria-hidden
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 via-transparent to-amber-600/20 mix-blend-soft-light" />
            </div>

            {/* L2: editable agent layer — headline */}
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-lum-tertiary-bright mb-1">
                {agentNote || post.brokerage}
              </p>
              <h2 className="font-jakarta font-extrabold tracking-tight text-white leading-tight text-xl sm:text-2xl">
                {headline || "Your headline here"}
              </h2>
              {post.price && (
                <p className="mt-1 text-sm font-semibold text-white/80">{post.price}</p>
              )}
            </div>

            {/* L3: locked attribution watermark */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-1 rounded bg-black/50 backdrop-blur text-[10px] font-medium text-white/70">
                🔒 {post.listingNo ? `MLS #${post.listingNo}` : "Master Geometry"} — locked
              </span>
              <span className="px-2 py-1 rounded bg-black/50 backdrop-blur text-[10px] font-medium text-white/70">
                Courtesy of {post.brokerage}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-lum-text-muted">
            Click the fields in the tuner to edit the agent layer. The locked
            geometry &amp; attribution layers are composited at render time and
            cannot be edited — protecting MLS reciprocity compliance.
          </p>
        </div>

        {/* Remix tuner */}
        <div className="glass-card p-5 space-y-5">
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary flex items-center gap-2">
            Remix Parametric Tuner
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-lum-tertiary/15 text-lum-tertiary-bright">
              Active
            </span>
          </h3>

          <PromptInput
            label="Headline (agent layer)"
            value={headline}
            onChange={setHeadline}
            rows={2}
            mono={false}
            placeholder="Your post headline — editable by every participating agent"
          />
          <PromptInput
            label="Buyer Agent Shift Note"
            value={agentNote}
            onChange={setAgentNote}
            rows={2}
            mono={false}
            placeholder="e.g. Your name & brokerage stamp, open house note, CTA…"
          />

          <div className="space-y-4">
            <label className="block">
              <span className="flex justify-between text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant mb-2">
                Atmospheric Blend Weight <span className="text-lum-primary-bright">{blend}%</span>
              </span>
              <input
                type="range" min={0} max={100} value={blend}
                onChange={(e) => setBlend(Number(e.target.value))}
                className="w-full accent-lum-primary"
              />
            </label>
            <label className="block">
              <span className="flex justify-between text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant mb-2">
                Prompt Infusion Strength <span className="text-lum-primary-bright">{infusion}%</span>
              </span>
              <input
                type="range" min={0} max={100} value={infusion}
                onChange={(e) => setInfusion(Number(e.target.value))}
                className="w-full accent-lum-primary"
              />
            </label>
          </div>

          <StylePresetSelector
            presets={STYLE_PRESETS}
            selectedPreset={preset}
            onPresetChange={setPreset}
            aspectRatio={aspect}
            onAspectChange={setAspect}
          />
        </div>
      </div>

      {/* ── Source vault + actions rail ── */}
      <div className="lg:col-span-2 space-y-5">
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">
            Source Listing Vault
          </h3>
          <p className="text-[11px] uppercase tracking-[0.12em] text-lum-text-muted">
            ID: #{post.id} · {post.listingNo ? `MLS #${post.listingNo}` : "Seed dossier"}
          </p>

          <PromptInput
            label="Base Prompt (from master dossier)"
            value={basePrompt}
            onChange={setBasePrompt}
            rows={6}
          />
          <PromptInput
            label="Co-Op Modifier Prompt (locked by campaign)"
            value={coOpModifier}
            onChange={setCoOpModifier}
            rows={3}
            disabled
          />
        </div>

        <div className="glass-card p-5 space-y-3">
          <button
            onClick={submitRemix}
            disabled={submitting || submitted}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl lum-gradient-btn text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitted
              ? "✓ Queued for Generation"
              : submitting
              ? "Queueing…"
              : "Generate & Publish Co-Op Post"}
          </button>
          {submitted && (
            <p className="text-xs text-lum-tertiary-bright text-center">
              Remix queued. The generation handler will deposit renders into your
              listing folder.
            </p>
          )}
          {error && (
            <p className="text-xs text-lum-error text-center">{error}</p>
          )}
          {!getSupabaseBrowser() && !submitted && (
            <p className="text-[11px] text-lum-text-muted text-center">
              Demo mode — set NEXT_PUBLIC_SUPABASE_URL to persist remixes.
            </p>
          )}
          <p className="text-[11px] text-lum-text-muted text-center">
            Cost: 2 tokens · Uniqueness cross-check runs before final render
          </p>
        </div>
      </div>
    </div>
  );
}
