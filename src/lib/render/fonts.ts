/**
 * Font loading for the deterministic render engine (satori).
 *
 * Satori has NO access to system fonts — every weight must be supplied as a
 * buffer. We ship OFL-licensed WOFF files in `public/fonts/render/` (copied
 * from @fontsource packages at build time, committed to the repo) so the same
 * bytes are available locally and in the Vercel function bundle.
 *
 * Branding: Plus Jakarta Sans matches the site's `font-jakarta` display font;
 * Inter is the supporting text face.
 *
 * Server-only — do not import from client components.
 */
import { readFile } from "fs/promises";
import path from "path";

export interface RenderFont {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700 | 800;
  style: "normal";
}

const FONT_FILES: Array<[name: string, file: string, weight: RenderFont["weight"]]> = [
  ["Plus Jakarta Sans", "plus-jakarta-sans-latin-800-normal.woff", 800],
  ["Plus Jakarta Sans", "plus-jakarta-sans-latin-700-normal.woff", 700],
  ["Plus Jakarta Sans", "plus-jakarta-sans-latin-400-normal.woff", 400],
  ["Inter", "inter-latin-600-normal.woff", 600],
  ["Inter", "inter-latin-400-normal.woff", 400],
];

let cache: Promise<RenderFont[]> | null = null;

/** Load (once per process) all font buffers needed by the render templates. */
export function loadRenderFonts(): Promise<RenderFont[]> {
  if (!cache) {
    const dir = path.join(process.cwd(), "public", "fonts", "render");
    cache = Promise.all(
      FONT_FILES.map(async ([name, file, weight]) => ({
        name,
        weight,
        style: "normal" as const,
        data: await readFile(path.join(dir, file)),
      })),
    );
    // If the read fails (e.g. fonts not committed), don't cache the rejection.
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}
