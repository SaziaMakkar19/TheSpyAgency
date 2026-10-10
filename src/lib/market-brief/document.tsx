/**
 * Tactical Market Brief — one-page watermarked PDF (react-pdf/renderer).
 * Rendered server-side only (route handlers).
 */
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ListingBrief } from '@/lib/bridge/client';

const EMERALD = '#34d399';
const SLATE_950 = '#020617';
const SLATE_900 = '#0f172a';
const SLATE_400 = '#94a3b8';
const SLATE_300 = '#cbd5e1';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';

const fmt = (n: number) =>
  '$' + Math.round(n).toLocaleString('en-CA');

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    padding: 0,
  },
  watermark: {
    position: 'absolute',
    top: '42%',
    left: '-10%',
    width: '120%',
    textAlign: 'center',
    fontSize: 52,
    fontWeight: 'bold',
    color: '#0f172a',
    opacity: 0.05,
    transform: 'rotate(-32deg)',
    letterSpacing: 6,
  },
  header: {
    backgroundColor: SLATE_950,
    paddingHorizontal: 36,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  brandSub: {
    color: EMERALD,
    fontSize: 8,
    letterSpacing: 3,
    marginTop: 3,
  },
  mlsBadge: {
    color: SLATE_300,
    fontSize: 8,
    textAlign: 'right',
  },
  body: {
    paddingHorizontal: 36,
    paddingVertical: 20,
  },
  address: {
    fontSize: 17,
    fontWeight: 'bold',
    color: SLATE_950,
  },
  cityLine: {
    fontSize: 10,
    color: SLATE_400,
    marginTop: 2,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  photoBox: {
    width: '46%',
    height: 150,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: SLATE_100,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  factsBox: {
    flex: 1,
  },
  price: {
    fontSize: 21,
    fontWeight: 'bold',
    color: SLATE_950,
    marginBottom: 8,
  },
  statusChip: {
    color: '#047857',
    backgroundColor: '#d1fae5',
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
    letterSpacing: 1,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  fact: {
    width: '50%',
    fontSize: 8.5,
    color: '#475569',
  },
  factLabel: {
    color: SLATE_400,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: SLATE_900,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  heatTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: SLATE_100,
    marginBottom: 4,
    width: '100%',
  },
  heatFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: EMERALD,
  },
  heatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heatLabel: {
    fontSize: 8,
    color: SLATE_400,
  },
  heatValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#047857',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: SLATE_100,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: {
    fontSize: 8.5,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SLATE_950,
    paddingHorizontal: 36,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCta: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footerSub: {
    color: SLATE_400,
    fontSize: 7.5,
    marginTop: 2,
  },
  footerUrl: {
    color: EMERALD,
    fontSize: 9,
    letterSpacing: 1,
  },
  generatedFor: {
    position: 'absolute',
    bottom: 46,
    left: 36,
    fontSize: 7,
    color: SLATE_400,
  },
});

interface BriefDocumentProps {
  brief: ListingBrief;
  generatedAt: Date;
  /** Renders the fictional SAMPLE banner — never set on real briefs. */
  sample?: boolean;
}

export function BriefDocument({ brief, generatedAt, sample = false }: BriefDocumentProps) {
  const heatPct = Math.max(0, Math.min(100, brief.marketHeat ?? 0));
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PREVIEW · THESPYAGENCY.COM</Text>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>THE SPY AGENCY</Text>
            <Text style={styles.brandSub}>TACTICAL MARKET BRIEF</Text>
          </View>
          <View>
            <Text style={styles.mlsBadge}>MLS #{brief.mlsNo}</Text>
            <Text style={styles.mlsBadge}>
              Generated {generatedAt.toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {sample && (
            <View
              style={{
                backgroundColor: '#fef3c7',
                borderRadius: 4,
                paddingVertical: 6,
                paddingHorizontal: 10,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#92400e', letterSpacing: 1 }}>
                SAMPLE REPORT — ALL DATA ON THIS PAGE IS FICTIONAL · FOR ILLUSTRATION ONLY
              </Text>
            </View>
          )}
          <Text style={styles.address}>{brief.address}</Text>
          <Text style={styles.cityLine}>
            {brief.city} · {brief.propertyType} · {brief.status}
          </Text>

          <View style={styles.topRow}>
            {brief.photoUrl ? (
              <View style={styles.photoBox}>
                <Image src={brief.photoUrl} style={styles.photo} />
              </View>
            ) : null}
            <View style={styles.factsBox}>
              <Text style={styles.price}>{fmt(brief.price)}</Text>
              <Text style={styles.statusChip}>
                {brief.daysOnMarket} DAYS ON MARKET
              </Text>
              <View style={styles.factGrid}>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Bedrooms</Text>
                  <Text>{brief.beds}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Bathrooms</Text>
                  <Text>{brief.baths}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Interior</Text>
                  <Text>
                    {brief.interiorSqft ? `${brief.interiorSqft.toLocaleString()} sqft` : '—'}
                  </Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Lot</Text>
                  <Text>
                    {brief.lotSqft ? `${brief.lotSqft.toLocaleString()} sqft` : '—'}
                  </Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Year Built</Text>
                  <Text>{brief.yearBuilt ?? '—'}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>Listing Agent</Text>
                  <Text>{brief.agentName}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Market heat — only when a real, documented value exists.
              Never fabricated: the section disappears rather than invent one. */}
          {brief.marketHeat != null && (
            <View>
              <Text style={styles.sectionTitle}>Market Heat</Text>
              <View style={styles.heatTrack}>
                <View style={[styles.heatFill, { width: `${heatPct}%` }]} />
              </View>
              <View style={styles.heatRow}>
                <Text style={styles.heatLabel}>
                  Demand indicator derived from real market inputs
                </Text>
                <Text style={styles.heatValue}>{heatPct}/100</Text>
              </View>
            </View>
          )}

          {/* Price history */}
          {brief.priceHistory.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Price History</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: '30%' }]}>Date</Text>
                <Text style={[styles.th, { width: '45%' }]}>Event</Text>
                <Text style={[styles.th, { width: '25%', textAlign: 'right' }]}>Price</Text>
              </View>
              {brief.priceHistory.map((e, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { width: '30%' }]}>{e.date}</Text>
                  <Text style={[styles.td, { width: '45%' }]}>{e.event}</Text>
                  <Text style={[styles.td, { width: '25%', textAlign: 'right' }]}>
                    {fmt(e.price)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Comps */}
          {brief.comps.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.sectionTitle}>Recent Comparable Sales</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: '46%' }]}>Address</Text>
                <Text style={[styles.th, { width: '20%', textAlign: 'right' }]}>Sold</Text>
                <Text style={[styles.th, { width: '18%', textAlign: 'right' }]}>Date</Text>
                <Text style={[styles.th, { width: '16%', textAlign: 'right' }]}>Δ vs List</Text>
              </View>
              {brief.comps.map((c, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { width: '46%' }]}>{c.address}</Text>
                  <Text style={[styles.td, { width: '20%', textAlign: 'right' }]}>
                    {fmt(c.price)}
                  </Text>
                  <Text style={[styles.td, { width: '18%', textAlign: 'right' }]}>
                    {c.soldDate}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { width: '16%', textAlign: 'right', color: c.deltaPct > 0 ? '#047857' : '#b91c1c' },
                    ]}
                  >
                    {c.deltaPct > 0 ? '+' : ''}
                    {c.deltaPct}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Attribution + footer */}
        <Text style={styles.generatedFor}>
          Prepared for {brief.agentName}
          {brief.brokerage ? ` · ${brief.brokerage}` : ''} · MLS data via GVR Bridge API
        </Text>
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerCta}>Ready to blanket this market?</Text>
            <Text style={styles.footerSub}>
              Co-op social campaigns with verified local agents.
            </Text>
          </View>
          <Text style={styles.footerUrl}>THESPYAGENCY.COM</Text>
        </View>
      </Page>
    </Document>
  );
}
