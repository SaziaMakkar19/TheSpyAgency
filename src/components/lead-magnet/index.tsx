'use client';

import { useEffect, useRef, useState } from 'react';
import { Section, Container, Box } from '@/components/layout/index';

type Phase = 'idle' | 'scanning' | 'success' | 'notFound' | 'error';
type Intent = 'owner' | 'inquiry' | null;

const SCAN_LINES = [
  '> Authenticating with GVR Bridge API…',
  '> Scanning 350,000-record VOW dataset…',
  '> Locating listing & agent of record…',
  '> Compiling tactical market brief…',
];

const TRUST_POINTS = [
  '350,000+ GVR VOW records scanned live',
  'One page: facts, comps, market signal',
  'Emailed in seconds',
];

export function LeadMagnet() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [query, setQuery] = useState('');
  const [intent, setIntent] = useState<Intent>(null);
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [agentName, setAgentName] = useState<string | null>(null);
  const [mlsNo, setMlsNo] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [leadAlertSent, setLeadAlertSent] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [newsletter, setNewsletter] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Honeypot — invisible to humans; bots fill it and get silently ignored.
  const [company, setCompany] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Advance the scanning status lines
  useEffect(() => {
    if (phase !== 'scanning') return;
    const t = setInterval(() => {
      setScanLine((i) => Math.min(i + 1, SCAN_LINES.length - 1));
    }, 900);
    return () => clearInterval(t);
  }, [phase]);

  const canSubmit =
    query.trim().length >= 4 &&
    intent !== null &&
    (intent === 'owner' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(requesterEmail.trim())) &&
    phase !== 'scanning';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setPhase('scanning');
    setScanLine(0);
    setNewsletter(false);
    setErrorMsg(null);

    const minDisplay = new Promise((r) => setTimeout(r, 3400)); // let the scan read
    try {
      const [res] = await Promise.all([
        fetch('/api/market-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query.trim(),
            intent,
            requesterEmail: requesterEmail.trim() || undefined,
            requesterName: requesterName.trim() || undefined,
            company: company || undefined, // honeypot
          }),
        }),
        minDisplay,
      ]);

      const data = await res.json();
      if (res.ok && data.ok) {
        setAgentName(data.agentName ?? null);
        setMlsNo(data.mlsNo ?? null);
        setReportUrl(data.reportUrl ?? null);
        setIsDemo(Boolean(data.demo));
        setLeadAlertSent(Boolean(data.leadAlertSent));
        setPhase('success');
      } else if (data.error === 'not_found') {
        setPhase('notFound');
      } else if (res.status === 429) {
        setErrorMsg('Too many scans in a short time — please try again in an hour.');
        setPhase('error');
      } else {
        setPhase('error');
      }
    } catch {
      await minDisplay;
      setPhase('error');
    }
  }

  async function optIntoNewsletter() {
    if (!mlsNo || newsletter) return;
    try {
      await fetch('/api/market-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'newsletter', mlsNo }),
      });
    } catch {
      /* best effort */
    }
    setNewsletter(true);
  }

  function reset() {
    setPhase('idle');
    setQuery('');
    setIntent(null);
    setRequesterEmail('');
    setRequesterName('');
    setAgentName(null);
    setMlsNo(null);
    setReportUrl(null);
    setIsDemo(false);
    setErrorMsg(null);
    inputRef.current?.focus();
  }

  return (
    <Section id="market-brief" className="bg-white py-16 lg:py-24 font-geist relative overflow-hidden border-t border-slate-100">
      {/* faint emerald radar grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #059669 0px, transparent 1px), radial-gradient(circle at 50% 50%, #059669 1px, transparent 1px)',
          backgroundSize: '56px 56px, 56px 56px',
        }}
      />
      <Container className="max-w-5xl px-4 sm:px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* Left: persuasive copy + trust points */}
          <Box className="space-y-5 text-center lg:text-left">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-widest uppercase">
              Free Tactical Market Brief
            </span>
            <h2 className="font-jakarta text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Your listing, decoded.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto lg:mx-0">
              Enter an MLS number or property address. We scan the GVR database and generate a
              one-page tactical market brief in seconds — delivered straight to an inbox.
            </p>
            <ul className="space-y-2.5 max-w-md mx-auto lg:mx-0">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </Box>

          {/* Right: the tool */}
          <Box>
          {phase === 'idle' || phase === 'scanning' ? (
            <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/70 p-5 sm:p-6">
              {/* Honeypot: hidden from humans, irresistible to bots */}
              <input
                type="text"
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] top-auto h-0 w-0 opacity-0"
              />

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="MLS# or property address"
                  disabled={phase === 'scanning'}
                  className="flex-1 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {phase === 'scanning' ? 'Scanning…' : 'Scan the MLS'}
                </button>
              </div>

              {/* Intent gate — "checkboxes as captcha" + lead routing */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setIntent('owner')}
                  aria-pressed={intent === 'owner'}
                  className={`flex-1 px-4 py-3 rounded-xl text-left text-xs border transition-all ${
                    intent === 'owner'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold block">✓ This is my listing</span>
                  <span className="text-[10px] opacity-70">
                    Email the brief to me, the listing agent
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIntent('inquiry')}
                  aria-pressed={intent === 'inquiry'}
                  className={`flex-1 px-4 py-3 rounded-xl text-left text-xs border transition-all ${
                    intent === 'inquiry'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold block">No, this is not my listing</span>
                  <span className="text-[10px] opacity-70">
                    I&apos;m interested in this property
                  </span>
                </button>
              </div>

              {/* Inquiry contact fields — revealed only when needed */}
              {intent === 'inquiry' && (
                <div className="grid sm:grid-cols-2 gap-2.5 animate-[fadeIn_0.25s_ease-out]">
                  <input
                    type="email"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    placeholder="Your email (required — the brief comes here)"
                    className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              )}

              {/* Terminal-style scan console — the dark spy-tech signature inside the light card */}
              <div
                className={`rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] leading-6 transition-opacity duration-500 ${
                  phase === 'scanning' ? 'opacity-100' : 'opacity-50'
                }`}
                aria-live="polite"
              >
                {SCAN_LINES.map((line, i) => (
                  <p
                    key={line}
                    className={
                      i < scanLine || phase !== 'scanning'
                        ? 'text-emerald-400/90'
                        : i === scanLine
                          ? 'text-emerald-300'
                          : 'text-slate-600'
                    }
                  >
                    {line}
                    {i === scanLine && phase === 'scanning' && <span className="animate-pulse">▌</span>}
                  </p>
                ))}
              </div>
            </form>
          ) : phase === 'success' ? (
            <div className="rounded-2xl bg-white border border-emerald-200 shadow-xl shadow-emerald-100/60 p-6 sm:p-8 text-center space-y-4">
              <div className="flex justify-center">
                <span className="relative flex h-10 w-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-10 w-10 bg-emerald-50 border border-emerald-300 items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="font-jakarta text-lg font-bold text-slate-900">Brief en route.</p>
                {intent === 'inquiry' ? (
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Check your inbox for the report{mlsNo ? ` on MLS #${mlsNo}` : ''}.
                    {leadAlertSent && agentName && (
                      <> The listing agent ({agentName}) has been notified of your interest and may reach out.</>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Check your inbox for the report — we&apos;ve emailed it to the address on file
                    {agentName ? ` for ${agentName}` : ''}
                    {mlsNo ? ` (MLS #${mlsNo})` : ''}.
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {reportUrl ? (
                    <>
                      <a
                        href={reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-500 underline underline-offset-2"
                      >
                        View your report
                      </a>
                      {' · '}
                    </>
                  ) : null}
                  While you wait:{' '}
                  <a
                    href="/api/market-brief/sample"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-500 underline underline-offset-2"
                  >
                    view a sample report
                  </a>
                  .
                </p>
                {isDemo && (
                  <p className="text-[10px] text-amber-600">
                    Demo mode — this report uses sample data. Add the Bridge Server Token
                    (BRIDGE_API_KEY) for live MLS data.
                  </p>
                )}
              </div>
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={optIntoNewsletter}
                  disabled={newsletter}
                  className="text-xs text-slate-600 border border-slate-200 hover:border-emerald-400 rounded-full px-4 py-2 transition-all disabled:opacity-60"
                >
                  {newsletter ? '✓ Subscribed to Market Intel' : 'Also send me the monthly Market Intel digest'}
                </button>
                <button
                  onClick={reset}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Scan another listing
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-red-200 shadow-xl shadow-red-100/50 p-6 sm:p-8 text-center space-y-4">
              <p className="font-jakarta text-lg font-bold text-slate-900">
                {phase === 'notFound' ? 'Listing not found.' : 'Something went sideways.'}
              </p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {phase === 'notFound'
                  ? 'Try an active MLS number or a full property address. The database only returns current VOW records.'
                  : (errorMsg ?? 'The scan hit an unexpected error. Please try again in a moment.')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all"
                >
                  Try again
                </button>
                <a
                  href="/api/market-brief/sample"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 hover:text-emerald-500 underline underline-offset-2"
                >
                  View a sample report
                </a>
              </div>
            </div>
          )}
          </Box>
        </div>
      </Container>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }`}</style>
    </Section>
  );
}
