/**
 * Participant layer renderer + final composite.
 *
 * The participant layer is the ONLY editable surface: hook, headline, CTA,
 * and the participant agent's own branding (headshot, logo, contact — the
 * fields onboarding will collect). It renders as a TRANSPARENT PNG overlay
 * which is then flattened over the stored locked layer with sharp.
 *
 * Hard rules enforced here:
 *   - The overlay never paints inside the locked credit strip (the bottom
 *     `creditBarHeight` px of the template) or over the header zone.
 *   - All text renders as vector paths — participant copy cannot alter,
 *     cover, or replace the baked-in credits.
 *
 * Server-only (fs fonts + native resvg/sharp) — nodejs runtime only.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { loadRenderFonts } from "./fonts";
import { fetchAsDataUri } from "./locked-layer";
import { getTemplate } from "./templates";
import type { ParticipantBrand } from "./participant";

export interface ParticipantLayerInput {
  brand: ParticipantBrand;
  /** Kicker line above the headline (short attention-grabber). */
  hook?: string | null;
  /** Main marketing line. */
  headline: string;
  /** Call to action rendered as a pill button. */
  cta?: string | null;
  /**
   * Vertical placement of the copy block, 0–1 fraction of canvas height
   * (block top edge). Default 0.33. CLAMPED to the clear middle band so the
   * participant can slide it (e.g. lower, to reveal a feature like a front
   * door) but never over the header zone, the agent card, or the locked
   * credit strip. The Studio's drag canvas writes this value.
   */
  copyBlockOffset?: number | null;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Render the participant overlay as a transparent PNG (full template size).
 * Everything outside the content blocks stays transparent so the locked
 * layer shows through untouched.
 */
export async function renderParticipantOverlay(
  input: ParticipantLayerInput,
  templateId?: string,
): Promise<Buffer> {
  const tpl = getTemplate(templateId);
  const { width: w, height: h, creditBarHeight: bar, fontScale: s } = tpl;
  const { brand } = input;
  const accent = brand.accentColor;

  const fonts = await loadRenderFonts();
  const headshot = brand.headshotUrl ? await fetchAsDataUri(brand.headshotUrl) : null;
  const logo = brand.logoUrl ? await fetchAsDataUri(brand.logoUrl) : null;

  const contact = [brand.phone, brand.email].filter(Boolean).join("  ·  ");

  // Clamp the copy block into the clear middle band: below the header scrim,
  // above the agent card + locked credit strip.
  const minOffset = (250 * s) / h;               // below header zone
  const maxOffset = 1 - (bar + 24 * s + 150 * s + 340 * s) / h; // above agent card
  const requested = input.copyBlockOffset ?? 0.33;
  const copyTop = h * Math.min(Math.max(requested, minOffset), Math.max(maxOffset, minOffset));

  const markup = (
    <div
      style={{
        width: w,
        height: h,
        display: "flex",
        position: "relative",
        fontFamily: "Inter",
      }}
    >
      {/* Copy block — hook / headline / CTA. Anchored in the clear middle
          band between the header zone and the agent card. */}
      <div
        style={{
          position: "absolute",
          left: 36 * s,
          right: 36 * s,
          top: copyTop,
          display: "flex",
          flexDirection: "column",
          gap: 16 * s,
          padding: `${28 * s}px ${32 * s}px`,
          backgroundColor: "rgba(5,6,12,0.58)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {input.hook && (
          <span
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 20 * s,
              letterSpacing: 3,
              color: accent,
            }}
          >
            {input.hook.toUpperCase()}
          </span>
        )}
        <span
          style={{
            fontFamily: "Plus Jakarta Sans",
            fontWeight: 800,
            fontSize: 46 * s,
            lineHeight: 1.15,
            color: "#ffffff",
          }}
        >
          {input.headline}
        </span>
        {input.cta && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 6 * s,
              padding: `${13 * s}px ${28 * s}px`,
              backgroundColor: accent,
              borderRadius: 999,
            }}
          >
            <span
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontWeight: 700,
                fontSize: 22 * s,
                color: "#05060c",
              }}
            >
              {input.cta}
            </span>
          </div>
        )}
      </div>

      {/* Agent card — sits ABOVE the locked credit strip, never inside it. */}
      <div
        style={{
          position: "absolute",
          left: 36 * s,
          right: 36 * s,
          bottom: bar + 24 * s,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${16 * s}px ${22 * s}px`,
          backgroundColor: "rgba(5,6,12,0.72)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 * s }}>
          {headshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={headshot}
              width={88 * s}
              height={88 * s}
              style={{
                borderRadius: 999,
                objectFit: "cover",
                border: `2px solid ${accent}`,
              }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 88 * s,
                height: 88 * s,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: accent,
                border: "2px solid rgba(255,255,255,0.25)",
              }}
            >
              <span
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: 800,
                  fontSize: 34 * s,
                  color: "#05060c",
                }}
              >
                {initialsOf(brand.displayName)}
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 3 * s }}>
            <span
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontWeight: 700,
                fontSize: 26 * s,
                color: "#ffffff",
              }}
            >
              {brand.displayName}
            </span>
            {brand.brokerage && (
              <span
                style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: 19 * s,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                {brand.brokerage}
              </span>
            )}
            {contact && (
              <span
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 19 * s,
                  color: accent,
                }}
              >
                {contact}
              </span>
            )}
          </div>
        </div>

        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            height={64 * s}
            style={{ objectFit: "contain", maxWidth: 220 * s }}
            alt=""
          />
        )}
      </div>
    </div>
  );

  const svg = await satori(markup, { width: w, height: h, fonts });
  return new Resvg(svg, { fitTo: { mode: "width", value: w }, background: "rgba(0,0,0,0)" })
    .render()
    .asPng();
}

/** Flatten: locked base (lossless PNG intermediate) + participant overlay →
 *  final WebP. Single lossy encode, so the credit pixels survive intact. */
export async function composePost(lockedPng: Buffer, overlayPng: Buffer): Promise<Buffer> {
  return sharp(lockedPng)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .webp({ quality: 88 })
    .toBuffer();
}
