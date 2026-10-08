interface RenderPlaceholderProps {
  seed: number;
  aspect?: "16:9" | "4:5" | "9:16" | "1:1";
  label?: string;
  price?: string;
  /** Real render (Supabase Storage URL). When set, replaces the gradient stand-in. */
  src?: string;
  className?: string;
}

const ASPECT_CLASS: Record<string, string> = {
  "16:9": "aspect-video",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
};

/**
 * RenderPlaceholder — deterministic "AI render" stand-in.
 * The Stitch export styled its property imagery with layered twilight
 * gradients; we reproduce that look locally until real renders land in
 * Supabase Storage (images.storage_path).
 */
export function RenderPlaceholder({
  seed,
  aspect = "4:5",
  label,
  price,
  src,
  className = "",
}: RenderPlaceholderProps) {
  const h = seed % 360;
  return (
    <div
      className={`relative w-full overflow-hidden ${ASPECT_CLASS[aspect]} ${className}`}
      style={
        src
          ? undefined
          : {
              background: `linear-gradient(160deg, hsl(${h} 45% 26%) 0%, hsl(${(h + 30) % 360} 55% 14%) 45%, #0b0f17 100%)`,
            }
      }
    >
      {src ? (
        /* Real AI render from Supabase Storage */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        /* faux window light */
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(ellipse 70% 55% at 65% 30%, hsl(${(h + 20) % 360} 70% 55% / 0.35), transparent 70%)`,
          }}
        />
      )}
      {/* ground reflection */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-lum-void/90 via-transparent to-black/30 pointer-events-none" />

      {(label || price) && (
        <div className="absolute bottom-3 left-3 right-3">
          {price && (
            <p className="font-jakarta text-sm font-bold tracking-tight text-lum-text-primary drop-shadow">
              {price}
            </p>
          )}
          {label && (
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-white/60 truncate">
              {label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
