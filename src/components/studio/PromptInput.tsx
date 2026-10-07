"use client";

interface PromptInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
  disabled?: boolean;
}

/** PromptInput — labelled prompt text area in the Stitch studio style. */
export function PromptInput({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  mono = true,
  disabled = false,
}: PromptInputProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-lg bg-lum-void/70 border border-lum-border-glass px-3.5 py-3 text-[13px] leading-relaxed text-lum-on-surface placeholder:text-lum-text-muted/60 focus:outline-none focus:border-lum-border-glow transition-colors resize-y ${
          mono ? "font-mono" : "font-body"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      />
    </label>
  );
}
