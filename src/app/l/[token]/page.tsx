import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLandingLink } from "@/lib/landing/links";
import { lookupListing, type ListingBrief } from "@/lib/bridge/client";
import { resolveParticipantBrand, type ParticipantBrand, DEFAULT_ACCENT } from "@/lib/render/participant";
import { BookingForm } from "@/components/landing/booking-form";

export const dynamic = "force-dynamic";

/** Same display rule as the locked layer: SHOUTING feed → title case. */
function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => {
      if (w.length <= 1) return w.toUpperCase();
      const m = w.match(/^(\d+)(ST|ND|RD|TH)$/i);
      if (m) return m[1] + m[2].toLowerCase();
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const link = await resolveLandingLink(token);
  return {
    title: link
      ? `Private tour — MLS® #${link.listing_no} | The Spy Agency`
      : "Listing | The Spy Agency",
    robots: { index: false }, // participant links are shared, not indexed
  };
}

function SpecChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1.5 rounded-lg bg-lum-surface/60 border border-lum-border-glass text-xs font-semibold text-lum-text-primary">
      {children}
    </span>
  );
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function PageShell({
  brief,
  brand,
  token,
}: {
  brief: ListingBrief | null;
  brand: ParticipantBrand;
  token: string;
}) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const firstName = brand.displayName.split(" ")[0] || "Your agent";
  const address = brief ? titleCase(brief.city ? `${brief.address}, ${brief.city}` : brief.address) : null;

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      {/* Slim brand bar */}
      <header className="border-b border-lum-border-glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-jakarta font-extrabold tracking-tight text-lum-text-primary">
            THE SPY <span className="text-lum-primary-bright">AGENCY</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-lum-text-muted">
            Private presentation
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <section
          className="relative rounded-2xl overflow-hidden border border-lum-border-glass bg-lum-surface"
          style={{ aspectRatio: "16/8", minHeight: 320 }}
        >
          {brief?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brief.photoUrl}
              alt={address ?? "Listing photo"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-lum-text-muted text-sm">
              {brief ? "No photo on file for this listing." : "Listing details are temporarily unavailable."}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          {brief && (
            <>
              <div className="absolute top-5 left-6 right-6 flex items-start justify-between gap-4">
                <h1 className="font-jakarta text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight max-w-[65%]">
                  {address}
                </h1>
                {brief.price > 0 && (
                  <span className="font-jakarta text-2xl sm:text-3xl font-extrabold text-white whitespace-nowrap">
                    ${brief.price.toLocaleString("en-CA")}
                  </span>
                )}
              </div>
              <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4">
                <p className="text-xs sm:text-sm text-white/80">
                  {brief.agentName ? `Listed by ${brief.agentName}` : ""}
                  {brief.agentName && brief.brokerage ? " · " : ""}
                  {brief.brokerage ?? ""}
                </p>
                <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/15 text-[11px] font-semibold text-white/90 whitespace-nowrap">
                  MLS® #{brief.mlsNo} · {brief.status === "Active" ? "Verified Active" : brief.status}
                </span>
              </div>
            </>
          )}
        </section>

        {/* Specs */}
        {brief && (
          <section className="flex flex-wrap gap-2">
            {brief.beds > 0 && <SpecChip>{brief.beds} Bed</SpecChip>}
            {brief.baths > 0 && <SpecChip>{brief.baths} Bath</SpecChip>}
            {brief.interiorSqft && <SpecChip>{brief.interiorSqft.toLocaleString("en-CA")} sqft</SpecChip>}
            {brief.propertyType && brief.propertyType !== "—" && <SpecChip>{brief.propertyType}</SpecChip>}
            {brief.yearBuilt && <SpecChip>Built {brief.yearBuilt}</SpecChip>}
            {brief.lotSqft && <SpecChip>{brief.lotSqft.toLocaleString("en-CA")} sqft lot</SpecChip>}
            <SpecChip>{brief.daysOnMarket} days on market</SpecChip>
          </section>
        )}

        {/* Brand card + booking */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-lum-border-glass bg-lum-surface/40 p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted">
              Your contact for this home
            </p>
            <div className="flex items-center gap-4">
              {brand.headshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.headshotUrl}
                  alt={brand.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2"
                  style={{ borderColor: accent }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-jakarta font-extrabold text-xl text-lum-void"
                  style={{ backgroundColor: accent }}
                >
                  {initialsOf(brand.displayName)}
                </div>
              )}
              <div>
                <p className="font-jakarta text-lg font-bold text-lum-text-primary">{brand.displayName}</p>
                {brand.brokerage && <p className="text-sm text-lum-text-muted">{brand.brokerage}</p>}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              {brand.phone && (
                <p>
                  <a href={`tel:${brand.phone}`} className="font-semibold" style={{ color: accent }}>
                    {brand.phone}
                  </a>
                </p>
              )}
              {brand.email && (
                <p>
                  <a href={`mailto:${brand.email}`} className="font-semibold" style={{ color: accent }}>
                    {brand.email}
                  </a>
                </p>
              )}
            </div>
            <p className="text-[11px] text-lum-text-muted">
              Leads from this page go to {firstName} — they do not become the
              property of the listing brokerage.
            </p>
          </div>

          {brief ? (
            <BookingForm token={token} agentFirstName={firstName} accent={accent} />
          ) : (
            <div className="rounded-xl border border-lum-border-glass bg-lum-surface/40 p-5 text-sm text-lum-text-muted flex items-center">
              Booking opens as soon as the listing feed is reachable — please
              check back shortly or contact {firstName} directly.
            </div>
          )}
        </section>

        {/* Compliance footer */}
        <footer className="pt-2 pb-6 border-t border-lum-border-glass text-[11px] text-lum-text-muted space-y-1">
          {brief && (
            <p>
              Listing data: Greater Vancouver REALTORS® MLS® feed · MLS® #{brief.mlsNo}
              {brief.brokerage ? ` · Courtesy of ${brief.brokerage}` : ""}.
              Information believed reliable but not guaranteed.
            </p>
          )}
          <p>Presented by {brand.displayName} via The Spy Agency.</p>
        </footer>
      </main>
    </div>
  );
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await resolveLandingLink(token);
  if (!link) notFound();

  const [briefResult, brand] = await Promise.all([
    lookupListing(link.listing_no).catch((err) => {
      console.error("Landing listing lookup failed:", err);
      return null;
    }),
    resolveParticipantBrand(link.user_id),
  ]);

  // If the profile vanished, fall back to a minimal anonymous brand block.
  const safeBrand: ParticipantBrand =
    brand ?? {
      displayName: "Your Agent",
      brokerage: null,
      phone: null,
      email: null,
      headshotUrl: null,
      logoUrl: null,
      accentColor: DEFAULT_ACCENT,
    };

  return <PageShell brief={briefResult} brand={safeBrand} token={token} />;
}
