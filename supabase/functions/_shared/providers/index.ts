import type { PublishProvider } from "./types.ts";
import { PostizProvider } from "./postiz.ts";
import { OutstandProvider } from "./outstand.ts";

/**
 * Provider registry. publish_jobs.provider names the routing hint;
 * resolve it here. Postiz is the sole launch provider; Outstand stays
 * registered as a warm fallback (schema allows both). To add another
 * provider later, implement PublishProvider and add it to this array —
 * the dispatcher and analytics collector never change.
 */
const providers: PublishProvider[] = [new PostizProvider(), new OutstandProvider()];

export function resolveProvider(name: string): PublishProvider | null {
  return providers.find((p) => p.name === name) ?? null;
}

/**
 * Provider-agnostic secret resolution: secrets for provider "postiz" come
 * from POSTIZ_API_KEY / POSTIZ_BASE_URL, "outstand" from OUTSTAND_*, etc.
 * This is what lets the dispatcher/collector stay provider-neutral.
 */
export function secretsFor(providerName: string): {
  api_key: string;
  base_url?: string;
} {
  const prefix = providerName.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return {
    api_key: Deno.env.get(`${prefix}_API_KEY`) ?? "",
    base_url: Deno.env.get(`${prefix}_BASE_URL`),
  };
}
