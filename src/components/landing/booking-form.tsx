"use client";

import { useState } from "react";

/**
 * Booking form on the co-branded landing page. Posts to /api/landing/lead;
 * the link token carries the attribution so the request lands in the owning
 * participant's leads inbox.
 */
export function BookingForm({
  token,
  agentFirstName,
  accent,
}: {
  token: string;
  agentFirstName: string;
  accent: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/landing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email, date, time, note, company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-lum-border-glass bg-lum-surface/40 p-5 text-center space-y-2">
        <p className="text-sm font-semibold text-lum-tertiary-bright">✓ Request sent</p>
        <p className="text-xs text-lum-text-muted">
          {agentFirstName} will confirm your showing by email shortly.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg bg-lum-surface/60 border border-lum-border-glass px-3 py-2 text-sm text-lum-text-primary placeholder:text-lum-text-muted focus:outline-none focus:border-lum-primary";

  return (
    <form onSubmit={submit} className="rounded-xl border border-lum-border-glass bg-lum-surface/40 p-5 space-y-3">
      <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">
        Book a private showing
      </h3>

      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Your name" required maxLength={120} />
      <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email" required maxLength={200} />

      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)}
          required min={new Date().toISOString().slice(0, 10)} />
        <select className={inputCls} value={time} onChange={(e) => setTime(e.target.value)}>
          {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <textarea className={`${inputCls} resize-none`} rows={2} value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anything we should know? (optional)" maxLength={1000} />

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-lum-void disabled:opacity-50"
        style={{ backgroundColor: accent }}
      >
        {submitting ? "Sending…" : "Request this showing"}
      </button>
      {error && <p className="text-xs text-lum-error text-center">{error}</p>}
    </form>
  );
}
