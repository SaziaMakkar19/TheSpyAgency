"use client";

import {
  GENERATION_PROVIDERS,
  type GenerationProvider,
} from "@/lib/generation/providers";

interface ModelProviderSelectorProps {
  providers?: GenerationProvider[];
  selected: string;
  onChange: (id: string) => void;
}

/**
 * ModelProviderSelector — the AI model dropdown in the Remix Parametric
 * Tuner. Choosing a provider only stores the preference on the remix row;
 * the server-side generation handler resolves the actual API call and key.
 */
export function ModelProviderSelector({
  providers = GENERATION_PROVIDERS,
  selected,
  onChange,
}: ModelProviderSelectorProps) {
  const active = providers.find((p) => p.id === selected) ?? providers[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
          AI Model
        </span>
        {active.badge && (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-lum-primary/15 text-lum-primary-bright">
            {active.badge}
          </span>
        )}
      </div>

      <select
        value={active.id}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-lum-primary/40"
      >
        {providers.map((p) => (
          <option key={p.id} value={p.id} disabled={!p.available}>
            {p.label}
            {p.available ? "" : " — coming soon"}
          </option>
        ))}
      </select>

      <p className="text-[11px] text-lum-text-muted leading-relaxed">
        {active.blurb}
      </p>
    </div>
  );
}
