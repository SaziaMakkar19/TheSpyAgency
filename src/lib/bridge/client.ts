/**
 * Bridge API client — GVR VOW listing lookup for the homepage lead magnet.
 *
 * DEMO MODE: when BRIDGE_API_KEY is absent, a sample listing is returned so
 * the entire flow (scan → PDF → success state) is testable before the real
 * credentials land in .env.local / Vercel.
 *
 * ⚠ CALIBRATION PENDING: the exact request path, query params and response
 * shape of this GVR Bridge account are account-specific. Adjust the
 * BRIDGE_* env vars and `normalizeBridgeListing()` once a real (redacted)
 * response sample is available from the provider.
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
  marketHeat: number; // 0–100
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

export function isDemoMode(): boolean {
  return !process.env.BRIDGE_API_KEY;
}

/**
 * Normalize a raw Bridge API record into ListingBrief.
 * ⚠ Field mapping is a BEST GUESS until a real response is inspected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeBridgeListing(raw: any): ListingBrief {
  return {
    mlsNo: raw.MlsNumber ?? raw.mlsNumber ?? raw.mls_no ?? '',
    address: raw.UnformattedAddress ?? raw.address ?? '',
    city: raw.City ?? raw.city ?? '',
    price: Number(raw.ListPrice ?? raw.listPrice ?? raw.price ?? 0),
    beds: Number(raw.BedroomsTotal ?? raw.bedrooms ?? 0),
    baths: Number(raw.BathroomsTotalInteger ?? raw.bathrooms ?? 0),
    interiorSqft: raw.LivingArea ? Number(raw.LivingArea) : null,
    lotSqft: raw.LotSizeSquareFeet ? Number(raw.LotSizeSquareFeet) : null,
    yearBuilt: raw.YearBuilt ? Number(raw.YearBuilt) : null,
    propertyType: raw.PropertyType ?? raw.propertyType ?? '—',
    daysOnMarket: Number(raw.DaysOnMarket ?? raw.daysOnMarket ?? 0),
    status: raw.StandardStatus ?? raw.status ?? 'Active',
    photoUrl: raw.PhotoURI ?? raw.photoUrl ?? raw.photo ?? null,
    priceHistory: Array.isArray(raw.priceHistory) ? raw.priceHistory : [],
    comps: Array.isArray(raw.comps) ? raw.comps : [],
    marketHeat: 50,
    agentName: raw.ListAgentFullName ?? raw.agentName ?? '',
    agentEmail: raw.ListAgentEmail ?? raw.agentEmail ?? '',
    agentPhone: raw.ListAgentPreferredPhone ?? raw.agentPhone ?? null,
    brokerage: raw.ListOfficeName ?? raw.brokerage ?? null,
  };
}

/**
 * Look up a listing by MLS number or street address.
 * Demo mode returns the sample record for any non-empty query.
 */
export async function lookupListing(query: string): Promise<ListingBrief> {
  const q = query.trim();
  if (!q) throw new ListingNotFoundError();

  if (isDemoMode()) {
    // Simulate network + render latency so the scanning animation reads.
    await new Promise((r) => setTimeout(r, 1200));
    return { ...SAMPLE, mlsNo: /^[a-z]/i.test(q[0]) && /\d/.test(q) ? q.toUpperCase() : SAMPLE.mlsNo };
  }

  const base = (process.env.BRIDGE_BASE_URL || '').replace(/\/$/, '');
  const path = process.env.BRIDGE_SEARCH_PATH || '/search';
  const url = `${base}${path}?q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BRIDGE_API_KEY}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) throw new ListingNotFoundError();
  if (!res.ok) throw new Error(`Bridge API error: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const record = Array.isArray(data) ? data[0] : data?.value?.[0] ?? data?.results?.[0] ?? data;
  if (!record || !(record.MlsNumber ?? record.mlsNumber ?? record.mls_no)) {
    throw new ListingNotFoundError();
  }
  return normalizeBridgeListing(record);
}

/** Sample brief (powers the "view a sample report" link). */
export function getSampleListing(): ListingBrief {
  return SAMPLE;
}
