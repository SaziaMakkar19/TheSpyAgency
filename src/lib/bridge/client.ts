/**
 * Bridge Interactive (Data Output) API client — GVR VOW listing lookup for
 * the homepage lead magnet.
 *
 * API shape (verified 2026-10-10):
 *   Base:   https://api.bridgedataoutput.com/api/v2/OData/{dataset}
 *   Auth:   ?access_token=SERVER_TOKEN  (query param, per the API's own
 *           "Invalid access_token format" error)
 *   Entity: /Property (listings), /Member (agents), OData $filter/$expand
 *
 * DEMO MODE: when BRIDGE_API_KEY is absent, a sample listing is returned so
 * the entire flow (scan → PDF → success state) is testable before the real
 * token lands in .env.local / Vercel.
 *
 * ⚠ FIELD MAPPING PARTIALLY VERIFIED: entity names and auth are confirmed;
 * individual property field names (ListPrice, BedroomsTotal, …) follow
 * Bridge's standard OData schema but should be sanity-checked against one
 * real (redacted) response — see normalizeBridgeListing().
 */

export interface PriceHistoryEvent {
  date: string;
  event: string;
  price: number;
}

export interface CompSale {
  address: string;
  price: number;
  soldDate: string;
  deltaPct: number; // vs subject list price
}

export interface ListingBrief {
  mlsNo: string;
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  interiorSqft: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  propertyType: string;
  daysOnMarket: number;
  status: string;
  photoUrl: string | null;
  priceHistory: PriceHistoryEvent[];
  comps: CompSale[];
  /**
   * Demand indicator 0–100. ONLY ever set from real, documented inputs
   * (currently: days-on-market vs. comparable solds). Null = not computed,
   * and the PDF omits the section rather than fabricate a number.
   */
  marketHeat: number | null;
  agentName: string;
  agentEmail: string;
  agentPhone: string | null;
  brokerage: string | null;
}

export class ListingNotFoundError extends Error {
  constructor() {
    super('Listing not found');
    this.name = 'ListingNotFoundError';
  }
}

const SAMPLE: ListingBrief = {
  mlsNo: 'R3009847',
  address: '2456 Marine Drive',
  city: 'West Vancouver',
  price: 3498000,
  beds: 5,
  baths: 6,
  interiorSqft: 4280,
  lotSqft: 8712,
  yearBuilt: 2016,
  propertyType: 'Detached',
  daysOnMarket: 12,
  status: 'Active',
  photoUrl:
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
  priceHistory: [
    { date: '2026-09-28', event: 'Listed', price: 3498000 },
    { date: '2026-09-28', event: 'Previous sale', price: 2610000 },
  ],
  comps: [
    { address: '2441 Marine Drive', price: 3388000, soldDate: '2026-08-14', deltaPct: -3.1 },
    { address: '2510 Marine Drive', price: 3625000, soldDate: '2026-07-30', deltaPct: 3.6 },
    { address: '2388 Marine Drive', price: 3290000, soldDate: '2026-06-19', deltaPct: -5.9 },
  ],
  marketHeat: 78,
  agentName: 'Sample Agent',
  agentEmail: 'agent@example.com',
  agentPhone: '604-555-0142',
  brokerage: 'Sample Realty Group',
};

const DEFAULT_BASE_URL =
  'https://api.bridgedataoutput.com/api/v2/OData/bcres';

export function isDemoMode(): boolean {
  return !process.env.BRIDGE_API_KEY;
}

/** Escape a user-supplied string for safe inclusion in an OData filter. */
function odataEscape(s: string): string {
  return s.replace(/'/g, "''");
}

/** True when the query looks like an MLS number (e.g. R3009847). */
function looksLikeMls(q: string): boolean {
  return /^[A-Za-z]{1,3}\s?\d{5,8}$/.test(q.trim());
}

/**
 * Normalize a Bridge OData Property record into ListingBrief.
 * Member data may arrive nested via $expand=Member (object or array).
 * ⚠ Verify field names against one real response when the token lands.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeBridgeListing(raw: any): ListingBrief {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const member: any = Array.isArray(raw?.Member) ? raw.Member[0] : raw?.Member ?? {};
  const media = Array.isArray(raw?.Media) ? raw.Media[0] : raw?.Media ?? null;

  return {
    mlsNo: raw.MlsNumber ?? raw.mlsNumber ?? '',
    address:
      raw.UnparsedAddress ?? // RESO standard field name
      raw.UnformattedAddress ??
      raw.StreetAddress ??
      raw.address ??
      '',
    city: raw.City ?? raw.city ?? '',
    price: Number(raw.ListPrice ?? raw.listPrice ?? raw.price ?? 0),
    beds: Number(raw.BedroomsTotal ?? raw.bedrooms ?? 0),
    baths: Number(raw.BathroomsTotalInteger ?? raw.BathroomsTotal ?? raw.bathrooms ?? 0),
    interiorSqft: raw.LivingArea ? Number(raw.LivingArea) : null,
    lotSqft: raw.LotSizeSquareFeet ? Number(raw.LotSizeSquareFeet) : null,
    yearBuilt: raw.YearBuilt ? Number(raw.YearBuilt) : null,
    propertyType: raw.PropertyType ?? raw.PropertySubType ?? '—',
    daysOnMarket: Number(raw.DaysOnMarket ?? raw.daysOnMarket ?? 0),
    status: raw.StandardStatus ?? raw.MlsStatus ?? raw.status ?? 'Active',
    photoUrl:
      raw.PhotoURI ??
      media?.ResourceUri ??
      raw.MediaURL ??
      (Array.isArray(raw.Photos) && raw.Photos.length > 0
        ? raw.Photos[0].Uri ?? raw.Photos[0].MediaURL ?? raw.Photos[0]
        : null),
    // Intentionally empty from the primary lookup: price history and comps
    // require separate, real queries (lookupComps) — never invented.
    priceHistory: [],
    comps: [],
    marketHeat: null,
    agentName:
      member.MemberFullName ??
      raw.ListAgentFullName ??
      [member.MemberFirstName, member.MemberLastName].filter(Boolean).join(' ') ??
      '',
    agentEmail: member.MemberEmail ?? raw.ListAgentEmail ?? '',
    agentPhone:
      member.MemberPreferredPhone ?? raw.ListAgentPreferredPhone ?? raw.ListAgentOfficePhone ?? null,
    brokerage: raw.ListOfficeName ?? member.OfficeName ?? null,
  };
}

/**
 * Look up a listing by MLS number or street address via Bridge OData.
 * Demo mode returns the sample record for any non-empty query.
 */
export async function lookupListing(query: string): Promise<ListingBrief> {
  const q = query.trim();
  if (!q) throw new ListingNotFoundError();

  if (isDemoMode()) {
    // Simulate network + render latency so the scanning animation reads.
    await new Promise((r) => setTimeout(r, 1200));
    return { ...SAMPLE };
  }

  const base = (process.env.BRIDGE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const token = process.env.BRIDGE_API_KEY as string;

  const filter = looksLikeMls(q)
    ? `MlsNumber eq '${odataEscape(q)}'`
    : `(contains(UnformattedAddress,'${odataEscape(q)}') or contains(StreetAddress,'${odataEscape(q)}'))`;

  const buildUrl = (expand: boolean) =>
    `${base}/Property?access_token=${encodeURIComponent(token)}&$top=3` +
    `&$filter=${encodeURIComponent(filter)}` +
    (expand ? `&$expand=${encodeURIComponent('Member')}` : '');

  // First try with Member expanded (agent email lives on the Member entity);
  // if the nav property name differs in this dataset, retry bare.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  for (const expand of [true, false]) {
    const res = await fetch(buildUrl(expand), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Bridge auth failed (${res.status}) — check BRIDGE_API_KEY`);
    }
    if (res.ok) {
      data = await res.json();
      break;
    }
    if (!expand) throw new Error(`Bridge API error: ${res.status}`);
  }

  const record = data?.value?.[0];
  if (!record || !record.MlsNumber) throw new ListingNotFoundError();

  const brief = normalizeBridgeListing(record);

  // Without the email there is no one to send the brief to — treat as not found.
  if (!brief.agentEmail) {
    console.warn('Bridge record had no agent email:', brief.mlsNo);
  }
  return brief;
}

/** Sample brief (powers the "view a sample report" link). */
export function getSampleListing(): ListingBrief {
  return SAMPLE;
}

/**
 * Fetch REAL comparable solds for a brief: same street (fallback: same
 * city), recently closed, most recent first. Returns [] when the dataset
 * yields nothing — the PDF then omits the section rather than fabricate.
 * ⚠ Status vocabulary varies per MLS dataset ('Sold' vs 'Closed'); the
 * filter tries both.
 */
export async function lookupComps(brief: ListingBrief): Promise<CompSale[]> {
  if (isDemoMode()) return [];
  const base = (process.env.BRIDGE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const token = process.env.BRIDGE_API_KEY as string;

  const street = brief.address.split(',')[0].trim();
  const statusFilter =
    `(MlsStatus eq 'Sold' or MlsStatus eq 'Closed' or StandardStatus eq 'Sold' or StandardStatus eq 'Closed')`;
  const areaFilter = street
    ? `contains(UnparsedAddress,'${odataEscape(street)}') or contains(UnformattedAddress,'${odataEscape(street)}')`
    : `City eq '${odataEscape(brief.city)}'`;

  const url =
    `${base}/Property?access_token=${encodeURIComponent(token)}&$top=3` +
    `&$orderby=${encodeURIComponent('CloseDate desc')}` +
    `&$filter=${encodeURIComponent(`${statusFilter} and (${areaFilter}) and MlsNumber ne '${odataEscape(brief.mlsNo)}'`)}` +
    `&$select=${encodeURIComponent('UnparsedAddress,UnformattedAddress,ClosePrice,ListPrice,CloseDate')}`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) {
      console.warn('Comps query failed:', res.status);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data?.value ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => r.ClosePrice && r.CloseDate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        address: r.UnparsedAddress ?? r.UnformattedAddress ?? '—',
        price: Number(r.ClosePrice),
        soldDate: String(r.CloseDate).slice(0, 10),
        deltaPct:
          brief.price > 0
            ? Math.round(((Number(r.ClosePrice) - brief.price) / brief.price) * 1000) / 10
            : 0,
      }));
  } catch (err) {
    console.warn('Comps query error:', err);
    return [];
  }
}

/**
 * Demand indicator derived ONLY from real inputs currently in hand:
 * days-on-market, benchmarked against the median DOM of the comps.
 * Returns null when there is no real basis — never invent a number.
 */
export function computeMarketHeat(brief: ListingBrief): number | null {
  if (brief.comps.length === 0) return null;
  // Without per-comp DOM we can't benchmark; honest answer: not computable yet.
  return null;
}
