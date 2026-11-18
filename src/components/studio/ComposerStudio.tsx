"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ComposerStudio — the two-layer Co-Op composer.
 *
 * Workflow mirrors the campaign model:
 *   1. Pick a listing (MLS #) → verified specs + 3 AI copy variations
 *   2. Choose an angle (lifestyle / value / feature) — fills editable fields
 *   3. Edit hook / headline / CTA and agent branding
 *   4. Drag the copy block on the preview to position it (server clamps to
 *      the safe band — credits/header can never be covered)
 *   5. Export → server flattens over the locked compliance layer and returns
 *      the published image URL
 *
 * All rendering happens server-side; this component is a pure client of
 * /api/render/copy and /api/render/compose.
 */

interface ListingSpecs {
  mlsNo: string;
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  interiorSqft: number | null;
  propertyType: string;
}

interface CopyVariation {
  angle: "lifestyle" | "value" | "feature";
  hook: string;
  headline: string;
  cta: string;
}

interface ExportResult {
  path: string | null;
  publicUrl: string | null;
  width: number;
  height: number;
}

const TEMPLATES = [
  { id: "feed-4x5", label: "Feed 4:5", ratio: "4/5" },
  { id: "feed-1x1", label: "Square 1:1", ratio: "1/1" },
  { id: "story-9x16", label: "Story 9:16", ratio: "9/16" },
  { id: "wide-16x9", label: "Wide 16:9", ratio: "16/9" },
] as const;

const Y_MIN = 0.18;
const Y_MAX = 0.62;
const GHOST_HEIGHT_FRAC = 0.28; // approx. copy block height on canvas

const ANGLE_LABELS: Record<string, string> = {
  lifestyle: "Lifestyle",
  value: "Value",
  feature: "Feature",
};

export function ComposerStudio() {
  // ── Listing + copy state ──
  const [mlsInput, setMlsInput] = useState("");
  const [specs, setSpecs] = useState<ListingSpecs | null>(null);
  const [variations, setVariations] = useState<CopyVariation[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [loadingListing, setLoadingListing] = useState(false);

  // ── Editable participant layer ──
  const [hook, setHook] = useState("");
  const [headline, setHeadline] = useState("");
  const [cta, setCta] = useState("");
  const [y, setY] = useState(0.35);
  const [template, setTemplate] = useState<string>("feed-4x5");

  // ── Agent branding (pre-onboarding: manual; will hydrate from profile) ──
  const [brandName, setBrandName] = useState("");
  const [brandBrokerage, setBrandBrokerage] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandAccent, setBrandAccent] = useState("#d4af6a");

  // ── Preview + export ──
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const regenCounter = useRef(0);

  const tpl = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0];

  const buildPreviewUrl = useCallback(() => {
    if (!specs) return null;
    const p = new URLSearchParams({
      mls: specs.mlsNo,
      template,
      hook,
      headline,
      cta,
      y: y.toFixed(2),
      raw: "1",
      cb: String(++regenCounter.current),
    });
    if (brandName) p.set("name", brandName);
    if (brandBrokerage) p.set("brokerage", brandBrokerage);
    if (brandPhone) p.set("phone", brandPhone);
    if (brandEmail) p.set("email", brandEmail);
    if (brandAccent) p.set("accent", brandAccent);
    return `/api/render/compose?${p.toString()}`;
  }, [specs, template, hook, headline, cta, y, brandName, brandBrokerage, brandPhone, brandEmail, brandAccent]);

  const regenerate = useCallback(() => {
    const url = buildPreviewUrl();
    if (!url || !headline.trim()) return;
    setPreviewLoading(true);
    setPreviewSrc(url);
  }, [buildPreviewUrl, headline]);

  // Debounced regeneration on any editable change.
  useEffect(() => {
    if (!specs || !headline.trim()) return;
    const t = setTimeout(regenerate, 700);
    return () => clearTimeout(t);
  }, [regenerate, specs, headline]);

  // ── Listing picker ──
  const loadListing = async () => {
    const mls = mlsInput.trim() || "sample";
    setLoadingListing(true);
    setError(null);
    setExportResult(null);
    try {
      const res = await fetch(`/api/render/copy?mls=${encodeURIComponent(mls)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Lookup failed (${res.status})`);
      setSpecs(data.specs);
      setVariations(data.variations);
      setAiGenerated(data.ai);
      const first = data.variations[0];
      if (first) {
        setSelectedAngle(first.angle);
        setHook(first.hook);
        setHeadline(first.headline);
        setCta(first.cta);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
      setSpecs(null);
    } finally {
      setLoadingListing(false);
    }
  };

  const chooseVariation = (v: CopyVariation) => {
    setSelectedAngle(v.angle);
    setHook(v.hook);
    setHeadline(v.headline);
    setCta(v.cta);
  };

  // ── Drag-to-position ──
  const yFromPointer = (clientY: number) => {
    const box = previewBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const frac = (clientY - rect.top) / rect.height - GHOST_HEIGHT_FRAC / 2;
    setY(Math.min(Math.max(frac, Y_MIN), Y_MAX));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    yFromPointer(e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) yFromPointer(e.clientY);
  };
  const onPointerUp = () => {
    if (dragging) {
      setDragging(false);
      regenerate(); // final render at drop position (server re-clamps)
    }
  };

  // ── Export ──
  const exportPost = async () => {
    if (!specs || !headline.trim()) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/render/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mlsNo: specs.mlsNo,
          templateId: template,
          hook,
          headline,
          cta,
          copyBlockOffset: y,
          participant: {
            displayName: brandName || "Agent",
            brokerage: brandBrokerage || null,
            phone: brandPhone || null,
            email: brandEmail || null,
            accentColor: brandAccent,
          },
          persist: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Export failed (${res.status})`);
      setExportResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const inputCls =
    "w-full rounded-lg bg-lum-surface/60 border border-lum-border-glass px-3 py-2 text-sm text-lum-text-primary placeholder:text-lum-text-muted focus:outline-none focus:border-lum-primary";
  const labelCls =
    "block text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted mb-1.5";

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── Preview canvas ── */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted">
              Live Composite Preview
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-lum-tertiary/15 text-lum-tertiary-bright text-[10px] font-semibold uppercase tracking-wider">
              🔒 Locked layer protected
            </span>
          </div>

          <div
            ref={previewBoxRef}
            className="relative w-full overflow-hidden rounded-lg border border-lum-border-glass bg-lum-void"
            style={{ aspectRatio: tpl.ratio }}
          >
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Composite preview"
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => setPreviewLoading(false)}
                onError={() => {
                  setPreviewLoading(false);
                  setError("Preview render failed — check the listing and fields.");
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-lum-text-muted text-sm px-8 text-center">
                Load a listing by MLS® number to compose your post.
              </div>
            )}

            {/* Drag ghost — marks where the copy block sits; drag vertically */}
            {specs && (
              <div
                className={`absolute inset-x-0 cursor-ns-resize touch-none select-none transition-colors ${
                  dragging ? "bg-lum-primary/10" : "bg-transparent hover:bg-lum-primary/5"
                }`}
                style={{
                  top: `${y * 100}%`,
                  height: `${GHOST_HEIGHT_FRAC * 100}%`,
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                title="Drag to position the copy block"
              >
                <div
                  className={`absolute inset-x-2 inset-y-1 rounded-lg border-2 border-dashed transition-opacity ${
                    dragging ? "border-lum-primary opacity-100" : "border-lum-primary/50 opacity-0 hover:opacity-100"
                  }`}
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-lum-primary text-lum-void text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    ⇕ Drag copy block
                  </span>
                </div>
              </div>
            )}

            {previewLoading && previewSrc && (
              <div className="absolute inset-0 flex items-center justify-center bg-lum-void/40">
                <span className="text-xs text-white/80 animate-pulse">Rendering…</span>
              </div>
            )}
          </div>

          {/* Position slider (fine control) */}
          {specs && (
            <label className="block mt-3">
              <span className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant mb-1.5">
                Copy block position{" "}
                <span className="text-lum-primary-bright">{Math.round(y * 100)}%</span>
              </span>
              <input
                type="range"
                min={Y_MIN}
                max={Y_MAX}
                step={0.01}
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
                className="w-full accent-lum-primary"
              />
            </label>
          )}

          <p className="mt-2 text-[11px] text-lum-text-muted">
            The header, credit strip and MLS® badge are the locked compliance
            layer — the server clamps your block so it can never cover them.
          </p>
        </div>

        {/* ── Copy editor ── */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">
            Participant Layer — Editable Copy
          </h3>
          <div>
            <label className={labelCls}>Hook (kicker line)</label>
            <input className={inputCls} value={hook} onChange={(e) => setHook(e.target.value)}
              placeholder="e.g. Just listed in Cambie Village" maxLength={60} />
          </div>
          <div>
            <label className={labelCls}>Headline (required)</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Your main marketing line" maxLength={90} />
          </div>
          <div>
            <label className={labelCls}>Call to action</label>
            <input className={inputCls} value={cta} onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Book a private tour" maxLength={40} />
          </div>

          <div>
            <span className={labelCls}>Format</span>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    template === t.id
                      ? "bg-lum-primary text-lum-void border-lum-primary"
                      : "bg-lum-surface/60 text-lum-text-muted border-lum-border-glass hover:text-lum-text-primary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right rail: picker, variations, brand, export ── */}
      <div className="lg:col-span-2 space-y-5">
        {/* Listing picker */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">
            Listing
          </h3>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={mlsInput}
              onChange={(e) => setMlsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadListing()}
              placeholder="MLS® # e.g. R3184362"
            />
            <button
              onClick={loadListing}
              disabled={loadingListing}
              className="px-4 py-2 rounded-lg lum-gradient-btn text-sm font-semibold whitespace-nowrap disabled:opacity-50"
            >
              {loadingListing ? "Loading…" : "Load"}
            </button>
          </div>
          {specs && (
            <div className="text-xs text-lum-text-muted space-y-1 pt-1">
              <p className="text-lum-text-primary font-semibold">
                {specs.address}, {specs.city}
              </p>
              <p>
                ${specs.price.toLocaleString()} · {specs.beds} bed · {specs.baths} bath
                {specs.interiorSqft ? ` · ${specs.interiorSqft.toLocaleString()} sqft` : ""}
              </p>
              <p className="uppercase tracking-wider text-[10px]">
                {specs.propertyType} · MLS® #{specs.mlsNo}
              </p>
            </div>
          )}
          {error && <p className="text-xs text-lum-error">{error}</p>}
        </div>

        {/* AI variations */}
        {variations.length > 0 && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="font-jakarta text-sm font-bold text-lum-text-primary flex items-center gap-2">
              AI Copy Variations
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-lum-tertiary/15 text-lum-tertiary-bright">
                {aiGenerated ? "AI" : "Template"}
              </span>
            </h3>
            {variations.map((v) => (
              <button
                key={v.angle}
                onClick={() => chooseVariation(v)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedAngle === v.angle
                    ? "border-lum-primary bg-lum-primary/10"
                    : "border-lum-border-glass bg-lum-surface/40 hover:border-lum-primary/50"
                }`}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider text-lum-primary-bright mb-1">
                  {ANGLE_LABELS[v.angle] ?? v.angle} angle
                </span>
                <span className="block text-[11px] uppercase tracking-wider text-lum-text-muted">
                  {v.hook}
                </span>
                <span className="block text-sm font-semibold text-lum-text-primary">
                  {v.headline}
                </span>
                <span className="block text-xs text-lum-text-muted mt-1">→ {v.cta}</span>
              </button>
            ))}
            <p className="text-[11px] text-lum-text-muted">
              Pick an angle, then make it yours — every field stays editable.
            </p>
          </div>
        )}

        {/* Agent branding */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">
            Your Branding
          </h3>
          <input className={inputCls} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your name" />
          <input className={inputCls} value={brandBrokerage} onChange={(e) => setBrandBrokerage(e.target.value)} placeholder="Your brokerage" />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={brandPhone} onChange={(e) => setBrandPhone(e.target.value)} placeholder="Phone" />
            <input className={inputCls} value={brandEmail} onChange={(e) => setBrandEmail(e.target.value)} placeholder="Email" />
          </div>
          <label className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted">
              Accent
            </span>
            <input
              type="color"
              value={brandAccent}
              onChange={(e) => setBrandAccent(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer bg-transparent border border-lum-border-glass"
            />
            <span className="text-xs text-lum-text-muted">{brandAccent}</span>
          </label>
          <p className="text-[11px] text-lum-text-muted">
            Agent onboarding will pre-fill this from your verified profile —
            including headshot and logo once uploaded.
          </p>
        </div>

        {/* Export */}
        <div className="glass-card p-5 space-y-3">
          <button
            onClick={exportPost}
            disabled={!specs || !headline.trim() || exporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl lum-gradient-btn text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Flattening layers…" : "Export Final Post"}
          </button>
          {exportResult?.publicUrl && (
            <div className="space-y-2 text-center">
              <p className="text-xs text-lum-tertiary-bright">
                ✓ Flattened server-side — credits locked in
              </p>
              <a
                href={exportResult.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-lum-primary-bright underline break-all"
              >
                Open published image
              </a>
              <a
                href={exportResult.publicUrl}
                download
                className="inline-block px-4 py-2 rounded-lg bg-lum-surface/60 border border-lum-border-glass text-xs font-semibold text-lum-text-primary hover:border-lum-primary"
              >
                Download WebP ({exportResult.width}×{exportResult.height})
              </a>
            </div>
          )}
          <p className="text-[11px] text-lum-text-muted text-center">
            Export flattens over the locked layer server-side and stores to the
            listing&apos;s folder — ready for campaign scheduling.
          </p>
        </div>
      </div>
    </div>
  );
}
