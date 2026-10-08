"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STYLE_PRESETS } from "@/lib/data/posts";
import type { InviteOptions } from "@/lib/data/campaigns";
import { createCampaign } from "@/app/campaigns/actions";

const ASPECTS = ["4:5", "1:1", "9:16", "16:9"] as const;

interface CampaignFormProps {
  inviteOptions: InviteOptions;
}

function ScopePicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const visible = options.filter((o) => o.toLowerCase().includes(filter.toLowerCase())).slice(0, 60);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
          {label} <span className="text-lum-text-muted">({selected.length} selected)</span>
        </span>
        {selected.length > 0 && (
          <button type="button" onClick={() => selected.forEach(onToggle)} className="text-[11px] text-lum-primary-bright hover:underline">
            Clear
          </button>
        )}
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter…"
        className="w-full rounded-lg bg-lum-surface-high/60 border border-lum-border-glass px-3 py-1.5 text-xs text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40"
      />
      <div className="max-h-36 overflow-y-auto rounded-lg border border-lum-border-glass divide-y divide-lum-border-glass/50">
        {visible.length === 0 && (
          <p className="p-3 text-[11px] text-lum-text-muted">No matches.</p>
        )}
        {visible.map((o) => (
          <label key={o} className="flex items-center gap-2 px-3 py-1.5 text-xs text-lum-text-primary hover:bg-lum-surface-high/40 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => onToggle(o)}
              className="accent-lum-primary"
            />
            <span className="truncate">{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * CampaignForm — listing agent creates a co-op campaign: locked modifier,
 * style, posting window, stagger, and invite scope from the directory.
 */
export function CampaignForm({ inviteOptions }: CampaignFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [listingNo, setListingNo] = useState("");
  const [splitNote, setSplitNote] = useState("50/50 Co-Op");
  const [modifierPrompt, setModifierPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState<string>(STYLE_PRESETS[0]);
  const [aspectRatio, setAspectRatio] = useState<string>("4:5");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [stagger, setStagger] = useState(30);
  const [brokerages, setBrokerages] = useState<string[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);

  const toggle = (setter: typeof setBrokerages) => (v: string) =>
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCampaign({
        listingNo,
        title: title || `MLS #${listingNo}`,
        splitNote,
        modifierPrompt,
        stylePreset,
        aspectRatio,
        inviteScope: { brokerages, markets },
        windowStart: windowStart ? new Date(windowStart).toISOString() : undefined,
        windowEnd: windowEnd ? new Date(windowEnd).toISOString() : undefined,
        staggerMinutes: stagger,
      });
      if (result.ok && result.id) router.push(`/campaigns/${result.id}`);
      else setError(result.error ?? "Could not create the campaign.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 space-y-5">
        <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">Listing & Terms</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Listing # *</span>
            <input value={listingNo} onChange={(e) => setListingNo(e.target.value)} placeholder="R1234567"
              className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Campaign Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Twilight launch — Anmore ridge estate"
              className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40" />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Co-Op Split Note</span>
          <input value={splitNote} onChange={(e) => setSplitNote(e.target.value)} placeholder="50/50 Co-Op"
            className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40" />
        </label>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div>
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">Locked Co-Op Layer</h3>
          <p className="text-[11px] text-lum-text-muted mt-1">
            Every participant&apos;s render composites this layer unchanged — the participating agents only
            edit their own headline and angle. Protects MLS reciprocity compliance.
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Co-Op Modifier Prompt (locked)</span>
          <textarea value={modifierPrompt} onChange={(e) => setModifierPrompt(e.target.value)} rows={3}
            placeholder="e.g. Cinematic twilight, warm interior glow, MLS-compliant attribution lockup…"
            className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm font-mono text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40" />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Style Preset</span>
            <select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)}
              className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40">
              {STYLE_PRESETS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Aspect Ratio</span>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40">
              {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="glass-card p-6 space-y-5">
        <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">Posting Window & Stagger</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Window Opens</span>
            <input type="datetime-local" value={windowStart} onChange={(e) => setWindowStart(e.target.value)}
              className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Window Closes</span>
            <input type="datetime-local" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)}
              className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Stagger (minutes)</span>
            <input type="number" min={5} step={5} value={stagger} onChange={(e) => setStagger(Number(e.target.value))}
              className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40" />
          </label>
        </div>
        <p className="text-[11px] text-lum-text-muted">
          Each joining agent gets a slot: window open + one stagger per join. Posts render first, then
          queue to the social provider at the agent&apos;s slot.
        </p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div>
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">Who Can Join</h3>
          <p className="text-[11px] text-lum-text-muted mt-1">
            Pulled live from the Greater Vancouver realtor directory. Leave empty to allow any verified agent.
          </p>
        </div>
        <ScopePicker label="Brokerages" options={inviteOptions.brokerages} selected={brokerages} onToggle={toggle(setBrokerages)} />
        <ScopePicker label="Local Markets" options={inviteOptions.markets} selected={markets} onToggle={toggle(setMarkets)} />
      </div>

      <div className="glass-card p-5 space-y-3">
        <button onClick={submit} disabled={pending || !listingNo.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl lum-gradient-btn text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          {pending ? "Creating…" : "Open Co-Op Campaign"}
        </button>
        {error && <p className="text-xs text-lum-error text-center">{error}</p>}
      </div>
    </div>
  );
}
