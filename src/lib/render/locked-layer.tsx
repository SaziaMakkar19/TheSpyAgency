/**
 * Locked compliance layer renderer — the demo's core test, in code.
 *
 * Pipeline: listing photo + verified credits → satori (JSX → SVG, text as
 * vector paths) → resvg (SVG → PNG) → sharp (PNG → WebP). Output is a single
 * immutable image; the credit strip is baked in and cannot be cropped,
 * altered, or obscured by the participant layer.
 *
 * Everything on the image comes from Bridge-verified listing data or the
 * verified directory profile — the no-slop policy applies to pixels too.
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
}

export interface LockedLayerResult {
  webp: Buffer;
  width: number;
  height: number;
  templateId: string;
}

/** Fetch a remote photo and hand satori a base64 data URI (it does not fetch). */
async function fetchAsDataUri(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Photo fetch failed (${res.status}): ${url}`);
  const type = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString("base64")}`;
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

  const brokerageLine = input.brokerage
    ? `${input.brokerage} · MLS® #${input.mlsNo}`
    : `MLS® #${input.mlsNo}`;
  // Primary line: the agent when known, otherwise the brokerage alone.
  const primaryLine = input.agentName
    ? `Listed by ${input.agentName}`
    : (input.brokerage ?? "");
  const secondaryLine = input.agentName ? brokerageLine : `MLS® #${input.mlsNo}`;

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

      {/* Scrim above the credit strip for legibility on any photo. */}
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

      {/* MLS badge, top-left. */}
      <div
        style={{
          position: "absolute",
          top: 32 * s,
          left: 32 * s,
          display: "flex",
          padding: `${10 * s}px ${18 * s}px`,
          backgroundColor: "rgba(5,6,12,0.72)",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 24 * s,
            color: "#ffffff",
            letterSpacing: 1.2,
          }}
        >
          MLS® #{input.mlsNo}
        </span>
      </div>

      {/* Credit strip — the locked zone. Canadian compliance: listing agent,
          brokerage, MLS® number. (No Equal Housing mark — US-only requirement.) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: bar,
          display: "flex",
          alignItems: "center",
          paddingLeft: 36 * s,
          paddingRight: 36 * s,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Plus Jakarta Sans",
              fontWeight: 700,
              fontSize: 30 * s,
              color: "#ffffff",
            }}
          >
            {primaryLine}
          </span>
          <span
            style={{
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 21 * s,
              color: "rgba(255,255,255,0.78)",
              marginTop: 2,
            }}
          >
            {secondaryLine}
          </span>
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

  return { webp, width: w, height: h, templateId: tpl.id };
}
