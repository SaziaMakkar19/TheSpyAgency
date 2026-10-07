"use client";

export const ASPECT_OPTIONS = [
  { value: "1:1", label: "1:1 Square" },
  { value: "4:5", label: "4:5 IG Feed" },
  { value: "9:16", label: "9:16 Story" },
  { value: "16:9", label: "16:9 Banner" },
] as const;

interface StylePresetSelectorProps {
  presets: readonly string[];
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  aspectRatio: string;
  onAspectChange: (aspect: string) => void;
}

/** StylePresetSelector — preset chips + aspect pills (Stitch "Typography
 *  Layer / Cost: 2 credits" row). */
export function StylePresetSelector({
  presets,
  selectedPreset,
  onPresetChange,
  aspectRatio,
  onAspectChange,
}: StylePresetSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <span className="block mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
          Style Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => onPresetChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPreset === preset
                  ? "lum-gradient-btn shadow-md"
                  : "bg-lum-container text-lum-on-surface-variant border border-lum-border-glass hover:border-lum-border-glow hover:text-lum-text-primary"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
          Aspect <span className="text-lum-text-muted normal-case tracking-normal">· Cost: 2 credits</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onAspectChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                aspectRatio === opt.value
                  ? "bg-lum-primary/25 text-lum-primary-bright border border-lum-border-glow"
                  : "bg-lum-container text-lum-on-surface-variant border border-lum-border-glass hover:text-lum-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
