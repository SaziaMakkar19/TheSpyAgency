/**
 * Bridge Interactive (Data Output) API client — GVR VOW listing lookup for
 * the homepage lead magnet.
 *
 * API shape (VERIFIED 2026-10-10 against the live bcres dataset):
 *   Base:   https://api.bridgedataoutput.com/api/v2/OData/bcres
 *   Auth:   ?access_token=SERVER_TOKEN  (query param, per the API's own
 *           "Invalid access_token format" error)
 *   Entity: /Property (listings), /Member (agents), /Office (brokerages)
 *
 * Dataset-specific facts that differ from RESO "standard" guesses and are
 * pinned here deliberately:
 *   - MLS number field is `ListingId` (e.g. 'R3173189'); `MlsNumber` does
 *     NOT exist ("Cannot find property 'MlsNumber'").
 *   - Address field is `UnparsedAddress`; `UnformattedAddress`/`StreetAddress`
 *     do NOT exist.
 *   - `$expand` is NOT supported ("Invalid field in $expand parameter") —
 *     agent and office data require separate two-step lookups by key.
 *   - Closed sales have `MlsStatus eq 'Closed'` (not 'Sold').
 *   - Media photos: `Media` array, filter MediaCategory eq 'Photo', sort by
 *     `Order`, use `MediaURL`.
 *   - No DaysOnMarket field: DOM is computed from `ListingContractDate`.
 *
 * DEMO MODE: when BRIDGE_API_KEY is absent, a sample listing is returned so
 * the entire flow (scan → PDF → success state) is testable before the real
 * token lands in .env.local / Vercel.
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
 * Normalize a Bridge bcres Property record into ListingBrief.
 * Agent (Member) and brokerage (Office) records arrive from separate lookups
 * and are passed in — verified that this dataset does not support $expand.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeBridgeListing(raw: any, member: any = {}, officeName: string | null = null): ListingBrief {
  // UnparsedAddress carries "STREET, City BC Postal" — keep the street
  // portion for `address`; `city` comes from the dedicated City field.
  const fullAddress: string = raw.UnparsedAddress ?? '';
  const street = fullAddress.split(',')[0]?.trim() ?? fullAddress;

  // Photos: Media array sorted by Order, photos only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photos: any[] = (Array.isArray(raw?.Media) ? raw.Media : [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((m: any) => m?.MediaCategory === 'Photo' && m?.MediaURL)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (a?.Order ?? 0) - (b?.Order ?? 0));

  // Days on market: no DOM field in this dataset — compute from the
  // ListingContractDate (the day it went on market).
  let daysOnMarket = 0;
  if (raw.ListingContractDate) {
    const listed = new Date(raw.ListingContractDate).getTime();
    if (!Number.isNaN(listed)) {
      daysOnMarket = Math.max(0, Math.floor((Date.now() - listed) / 86400000));
    }
  }

  // Real price history only: the listing event (with its contract date) and
  // the original list price when it differs from today's. No invented dates.
  const priceHistory: PriceHistoryEvent[] = [];
  const listDate = raw.ListingContractDate ? String(raw.ListingContractDate).slice(0, 10) : null;
  if (listDate && raw.ListPrice) {
    priceHistory.push({ date: listDate, event: 'Listed', price: Number(raw.ListPrice) });
  }
  if (listDate && raw.OriginalListPrice && Number(raw.OriginalListPrice) !== Number(raw.ListPrice ?? 0)) {
    priceHistory.push({ date: listDate, event: 'Original list price', price: Number(raw.OriginalListPrice) });
  }

  return {
    mlsNo: raw.ListingId ?? '',
    address: street,
    city: raw.City ?? '',
    price: Number(raw.ListPrice ?? 0),
    beds: Number(raw.BedroomsTotal ?? 0),
    baths: Number(raw.BathroomsTotalInteger ?? 0),
    interiorSqft: raw.LivingArea ? Number(raw.LivingArea) : null,
    lotSqft: raw.LotSizeSquareFeet ? Number(raw.LotSizeSquareFeet) : null,
    yearBuilt: raw.YearBuilt ? Number(raw.YearBuilt) : null,
    propertyType: raw.PropertySubType ?? raw.PropertyType ?? '—',
    daysOnMarket,
    status: raw.MlsStatus ?? raw.StandardStatus ?? 'Active',
    photoUrl: photos[0]?.MediaURL ?? null,
    priceHistory,
    comps: [],
    marketHeat: null,
    agentName:
      member?.MemberFullName ??
      [member?.MemberFirstName, member?.MemberLastName].filter(Boolean).join(' ') ??
      '',
    agentEmail: member?.MemberEmail ?? '',
    agentPhone: member?.MemberPreferredPhone ?? null,
    brokerage: officeName,
  };
}

/** Fetch the listing agent (Member) record by key — verified two-step shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMember(base: string, token: string, memberKey: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${base}/Member?access_token=${encodeURIComponent(token)}&$top=1` +
        `&$filter=${encodeURIComponent(`MemberKey eq '${odataEscape(memberKey)}'`)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    );
    if (!res.ok) {
      console.warn('Member lookup failed:', res.status);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    return data?.value?.[0] ?? null;
  } catch (err) {
    console.warn('Member lookup error:', err);
    return null;
  }
}

/** Fetch a brokerage display name (OfficeName) by OfficeMlsId. */
async function fetchOfficeName(base: string, token: string, officeMlsId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${base}/Office?access_token=${encodeURIComponent(token)}&$top=1` +
        `&$filter=${encodeURIComponent(`OfficeMlsId eq '${odataEscape(officeMlsId)}'`)}` +
        `&$select=${encodeURIComponent('OfficeName')}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    );
    if (!res.ok) {
      console.warn('Office lookup failed:', res.status);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    return data?.value?.[0]?.OfficeName ?? null;
  } catch (err) {
    console.warn('Office lookup error:', err);
    return null;
  }
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
    ? `ListingId eq '${odataEscape(q)}'` // verified field name in bcres
    : `contains(UnparsedAddress,'${odataEscape(q)}')`;

  const res = await fetch(
    `${base}/Property?access_token=${encodeURIComponent(token)}&$top=3` +
      `&$filter=${encodeURIComponent(filter)}`,
    { headers: { Accept: 'application/json' }, cache: 'no-store' }
  );
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Bridge auth failed (${res.status}) — check BRIDGE_API_KEY`);
  }
  if (!res.ok) throw new Error(`Bridge API error: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const record = data?.value?.[0];
  if (!record || !record.ListingId) throw new ListingNotFoundError();

  // Enrich: agent (Member) + brokerage (Office) are separate entities here —
  // $expand is not supported by this dataset (verified).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [member, officeName] = await Promise.all([
    record.ListAgentKey ? fetchMember(base, token, record.ListAgentKey) : Promise.resolve(null),
    record.ListOfficeMlsId ? fetchOfficeName(base, token, record.ListOfficeMlsId) : Promise.resolve(null),
  ]);

  const brief = normalizeBridgeListing(record, member, officeName);

  // Without the email there is no one to send the brief to — log loudly.
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
 * Fetch REAL comparable solds for a brief: same street name (fallback: same
 * city), most recent closings first. Returns [] when the dataset yields
 * nothing — the PDF then omits the section rather than fabricate.
 * Verified: closed sales in bcres carry MlsStatus eq 'Closed'.
 */
export async function lookupComps(brief: ListingBrief): Promise<CompSale[]> {
  if (isDemoMode()) return [];
  const base = (process.env.BRIDGE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const token = process.env.BRIDGE_API_KEY as string;

  // Strip the street number so the comp search matches neighbours, not the
  // subject itself: "38590 WESTWAY AVENUE" → "WESTWAY AVENUE".
  const streetName = brief.address.replace(/^\d+\s+/, '').trim();
  const statusFilter = `MlsStatus eq 'Closed'`;
  const areaFilter = streetName
    ? `contains(UnparsedAddress,'${odataEscape(streetName)}')`
    : `City eq '${odataEscape(brief.city)}'`;

  const url =
    `${base}/Property?access_token=${encodeURIComponent(token)}&$top=3` +
    `&$orderby=${encodeURIComponent('CloseDate desc')}` +
    `&$filter=${encodeURIComponent(`${statusFilter} and (${areaFilter}) and ListingId ne '${odataEscape(brief.mlsNo)}'`)}` +
    `&$select=${encodeURIComponent('UnparsedAddress,ClosePrice,CloseDate')}`;

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
        address: r.UnparsedAddress?.split(',')[0]?.trim() ?? '—',
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
