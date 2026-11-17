/**
 * Locked compliance layer renderer — the demo's core test, in code.
 *
 * Pipeline: listing photo + verified credits → satori (JSX → SVG, text as
 * vector paths) → resvg (SVG → PNG) → sharp (PNG → WebP). Output is a single
 * immutable image; the credit strip is baked in and cannot be cropped,
 * altered, or obscured by the participant layer.
 *
 * Layout (all data from Bridge-verified listing + directory profile):
 *   top:    header — address + list price; subheading — beds/baths/sqft icons
 *   bottom: credit strip (listing agent + brokerage) · MLS® badge with
 *           "Verified Active" status + render date (bottom-right)
 *
 * Canadian compliance: office/agent credits + MLS® number. No Equal Housing
 * mark (US-only requirement).
 *
 * Server-only (fs fonts + native resvg/sharp) — nodejs runtime only.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { loadRenderFonts } from "./fonts";
import { getTemplate } from "./templates";

export interface LockedLayerInput {
  /** Listing hero photo (Bridge MediaURL, https). */
  photoUrl: string;
  /** MLS® number, e.g. 'R3173189'. */
  mlsNo: string;
  /** Listing agent display name — null on terminated/expired listings, where
   *  Bridge nulls the ListAgent* fields; brokerage becomes the primary line. */
  agentName: string | null;
  /** Listing brokerage/office name, when known. */
  brokerage: string | null;
  /** Street address, e.g. '562 W 24TH AVENUE' (title-cased at render). */
  address: string;
  /** City, e.g. 'Vancouver'. */
  city: string;
  /** List price in dollars. */
  price: number;
  beds: number;
  baths: number;
  /** Interior living area in sqft; omitted from the subheading when null. */
  interiorSqft: number | null;
  /** Bridge MlsStatus — drives the "Verified Active" badge wording. */
  status: string;
}

export interface LockedLayerResult {
  /** Lossy delivery format — for storage/display. */
  webp: Buffer;
  /** Lossless intermediate — used as the composite base so credits survive
   *  flattening without a double lossy encode. */
  png: Buffer;
  width: number;
  height: number;
  templateId: string;
}

/** Fetch a remote photo and hand satori a base64 data URI (it does not fetch).
 *  Shared with the participant-layer renderer for headshots/logos. */
export async function fetchAsDataUri(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Photo fetch failed (${res.status}): ${url}`);
  const type = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString("base64")}`;
}

/** Bridge addresses arrive SHOUTING — title-case for display, preserving
 *  directional letters (W/E/N/S) and fixing ordinals (24TH → 24th). */
function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => {
      if (w.length <= 1) return w.toUpperCase(); // W, E, N, S…
      const m = w.match(/^(\d+)(ST|ND|RD|TH)$/i);
      if (m) return m[1] + m[2].toLowerCase();
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic render date (no locale dependence). */
function renderDate(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatPrice(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/* ── Particulars icons (stroke style, 24×24) ─────────────────────── */

function BedIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M2 20h20" />
      <path d="M2 20v2 M22 20v2" />
      <path d="M6 10V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function BathIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2z" />
      <path d="M6 12V6a2 2 0 0 1 4 0" />
      <path d="M7 19l-1 2 M17 19l1 2" />
    </svg>
  );
}

function AreaIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

export async function renderLockedLayer(
  input: LockedLayerInput,
  templateId?: string,
): Promise<LockedLayerResult> {
  const tpl = getTemplate(templateId);
  const { width: w, height: h, creditBarHeight: bar, fontScale: s } = tpl;

  const [photo, fonts] = await Promise.all([
    fetchAsDataUri(input.photoUrl),
    loadRenderFonts(),
  ]);

  const addressLine = titleCase(
    input.city ? `${input.address}, ${input.city}` : input.address,
  );
  const priceLine = input.price > 0 ? formatPrice(input.price) : "";

  // Primary credit: the agent when known, otherwise the brokerage alone
  // (terminated listings lose ListAgent* in the feed; office credit is the
  // mandatory part).
  const primaryLine = input.agentName
    ? `Listed by ${input.agentName}`
    : (input.brokerage ?? "");
  const secondaryLine = input.agentName ? (input.brokerage ?? "") : "";

  const statusLabel = input.status === "Active" ? "Verified Active" : input.status;
  const statusColor = input.status === "Active" ? "#4ade80" : "#fbbf24";

  // Subheading particulars — omit anything the feed didn't provide.
  const particulars: Array<{ icon: "bed" | "bath" | "area"; label: string }> = [];
  if (input.beds > 0) particulars.push({ icon: "bed", label: `${input.beds} Bed` });
  if (input.baths > 0) particulars.push({ icon: "bath", label: `${input.baths} Bath` });
  if (input.interiorSqft && input.interiorSqft > 0)
    particulars.push({ icon: "area", label: `${input.interiorSqft.toLocaleString("en-US")} sqft` });

  const iconColor = "rgba(255,255,255,0.92)";
  const iconSize = 26 * s;

  const markup = (
    <div
      style={{
        width: w,
        height: h,
        display: "flex",
        position: "relative",
        backgroundColor: "#05060c",
        fontFamily: "Inter",
      }}
    >
      {/* Base photo, full-bleed cover crop. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        width={w}
        height={h}
        style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        alt=""
      />

      {/* Top scrim for header legibility. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 240 * s,
          display: "flex",
          backgroundImage:
            "linear-gradient(to bottom, rgba(5,6,12,0.82), rgba(5,6,12,0))",
        }}
      />

      {/* Scrim above the credit strip. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: bar * 2.4,
          display: "flex",
          backgroundImage:
            "linear-gradient(to top, rgba(5,6,12,0.94), rgba(5,6,12,0))",
        }}
      />

      {/* Header: address + list price. */}
      <div
        style={{
          position: "absolute",
          top: 36 * s,
          left: 36 * s,
          right: 36 * s,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: w * 0.66 }}>
          <span
            style={{
              fontFamily: "Plus Jakarta Sans",
              fontWeight: 700,
              fontSize: 30 * s,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            {addressLine}
          </span>

          {/* Subheading: particulars with icons. */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 * s, marginTop: 12 * s }}>
            {particulars.map((p) => (
              <div key={p.icon} style={{ display: "flex", alignItems: "center", gap: 8 * s }}>
                {p.icon === "bed" && <BedIcon size={iconSize} color={iconColor} />}
                {p.icon === "bath" && <BathIcon size={iconSize} color={iconColor} />}
                {p.icon === "area" && <AreaIcon size={iconSize} color={iconColor} />}
                <span
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: 21 * s,
                    color: iconColor,
                  }}
                >
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {priceLine && (
          <span
            style={{
              fontFamily: "Plus Jakarta Sans",
              fontWeight: 800,
              fontSize: 36 * s,
              color: "#ffffff",
            }}
          >
            {priceLine}
          </span>
        )}
      </div>

      {/* Credit strip + MLS badge — the locked zone. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: bar,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 36 * s,
          paddingRight: 36 * s,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Plus Jakarta Sans",
              fontWeight: 700,
              fontSize: 28 * s,
              color: "#ffffff",
            }}
          >
            {primaryLine}
          </span>
          {secondaryLine && (
            <span
              style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: 20 * s,
                color: "rgba(255,255,255,0.78)",
                marginTop: 2,
              }}
            >
              {secondaryLine}
            </span>
          )}
        </div>

        {/* MLS® badge + verified status + render date (bottom-right). */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            padding: `${10 * s}px ${16 * s}px`,
            backgroundColor: "rgba(5,6,12,0.72)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <span
            style={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 20 * s,
              color: "#ffffff",
              letterSpacing: 1,
            }}
          >
            MLS® #{input.mlsNo}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 7 * s, marginTop: 3 * s }}>
            <svg width={10 * s} height={10 * s} viewBox="0 0 10 10">
              <circle cx={5} cy={5} r={5} fill={statusColor} />
            </svg>
            <span
              style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: 16 * s,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {statusLabel} · {renderDate()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const svg = await satori(markup, { width: w, height: h, fonts });
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: w },
  })
    .render()
    .asPng();
  const webp = await sharp(png).webp({ quality: 88 }).toBuffer();

  return { webp, png, width: w, height: h, templateId: tpl.id };
}
