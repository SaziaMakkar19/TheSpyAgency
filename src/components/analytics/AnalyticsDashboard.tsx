"use client";

import { useMemo, useState } from "react";
import {
  computeVelocity,
  type LeaderboardEntry,
  type MetricsSnapshot,
} from "@/lib/data/analytics";

interface AnalyticsDashboardProps {
  leaderboard: LeaderboardEntry[];
  snapshots: MetricsSnapshot[];
}

const MEDAL = ["🥇", "🥈", "🥉"];

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * AnalyticsDashboard — Milestone 6 read side.
 * Co-op leaderboard + per-post Conversion Velocity, both sourced from
 * publish_results snapshots (seed data stands in until the collector runs).
 */
export function AnalyticsDashboard({ leaderboard, snapshots }: AnalyticsDashboardProps) {
  const jobs = useMemo(
    () => [...new Map(snapshots.map((s) => [s.publishJobId, s.postLabel])).entries()],
    [snapshots]
  );
  const [activeJob, setActiveJob] = useState<string>(jobs[0]?.[0] ?? "");

  const jobSnapshots = useMemo(
    () => snapshots.filter((s) => s.publishJobId === activeJob),
    [snapshots, activeJob]
  );
  const velocity = useMemo(() => computeVelocity(jobSnapshots), [jobSnapshots]);
  const totals = jobSnapshots[jobSnapshots.length - 1];
  const maxViewsDelta = Math.max(1, ...velocity.map((v) => v.viewsDelta));

  return (
    <div className="space-y-8">
      {/* ── Co-op leaderboard ── */}
      <section className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-lum-border-glass">
          <div>
            <h2 className="font-jakarta text-lg font-bold text-lum-text-primary">
              Top Buyer Agents Leaderboard
            </h2>
            <p className="text-xs text-lum-text-muted">
              Reach-weighted across all published co-op posts
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-lum-tertiary/15 text-lum-tertiary-bright">
            Live from publish_results
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-lum-text-muted border-b border-lum-border-glass">
                <th className="text-left px-5 py-3 font-semibold">Agent</th>
                <th className="text-right px-4 py-3 font-semibold">Posts</th>
                <th className="text-right px-4 py-3 font-semibold">Views</th>
                <th className="text-right px-4 py-3 font-semibold">Likes</th>
                <th className="text-right px-4 py-3 font-semibold">Shares</th>
                <th className="text-right px-4 py-3 font-semibold">Leads</th>
                <th className="text-right px-5 py-3 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr
                  key={entry.agentName}
                  className="border-b border-lum-border-glass/50 last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center text-base">{MEDAL[i] ?? `#${i + 1}`}</span>
                      <div>
                        <p className="font-semibold text-lum-text-primary flex items-center gap-1.5">
                          {entry.agentName}
                          <svg className="w-3.5 h-3.5 fill-lum-tertiary" viewBox="0 0 24 24">
                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                          </svg>
                        </p>
                        <p className="text-[11px] text-lum-text-muted">{entry.brokerage}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3.5 text-lum-on-surface-variant">{entry.posts}</td>
                  <td className="text-right px-4 py-3.5 text-lum-on-surface-variant">{formatNum(entry.views)}</td>
                  <td className="text-right px-4 py-3.5 text-lum-on-surface-variant">{formatNum(entry.likes)}</td>
                  <td className="text-right px-4 py-3.5 text-lum-on-surface-variant">{formatNum(entry.shares)}</td>
                  <td className="text-right px-4 py-3.5 text-lum-tertiary-bright font-semibold">{entry.attributedLeads}</td>
                  <td className="text-right px-5 py-3.5">
                    <span
                      className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-xs font-bold ${
                        i === 0
                          ? "bg-gradient-to-r from-lum-primary-bright to-lum-secondary text-white"
                          : "bg-lum-high text-lum-text-primary"
                      }`}
                    >
                      {entry.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Per-post Conversion Velocity ── */}
      <section className="glass-card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-jakarta text-lg font-bold text-lum-text-primary">
              Conversion Velocity
            </h2>
            <p className="text-xs text-lum-text-muted">
              Growth between consecutive analytics snapshots
            </p>
          </div>
          <select
            value={activeJob}
            onChange={(e) => setActiveJob(e.target.value)}
            className="rounded-lg bg-lum-container border border-lum-border-glass px-3 py-2 text-xs text-lum-on-surface focus:outline-none focus:border-lum-border-glow"
          >
            {jobs.map(([jobId, label]) => (
              <option key={jobId} value={jobId}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {velocity.length === 0 ? (
          <p className="text-sm text-lum-text-muted py-6 text-center">
            Need at least two snapshots for velocity — the collector is still gathering.
          </p>
        ) : (
          <>
            {/* Bar chart of views deltas */}
            <div className="space-y-2">
              {velocity.map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-14 text-[11px] text-lum-text-muted shrink-0">{timeLabel(point.collectedAt)}</span>
                  <div className="flex-1 h-6 rounded bg-lum-void/60 overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-lum-primary-bright to-lum-secondary transition-all duration-500"
                      style={{ width: `${(point.viewsDelta / maxViewsDelta) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs font-semibold text-lum-text-primary shrink-0">
                    +{formatNum(point.viewsDelta)} views
                  </span>
                  <span className="hidden sm:block w-16 text-right text-[11px] text-lum-text-muted shrink-0">
                    +{point.likesDelta} likes
                  </span>
                </div>
              ))}
            </div>

            {/* Totals strip */}
            {totals && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-lum-border-glass">
                {[
                  { label: "Total Views", value: formatNum(totals.views) },
                  { label: "Total Likes", value: formatNum(totals.likes) },
                  { label: "Comments", value: String(totals.comments) },
                  { label: "Shares", value: String(totals.shares) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-lum-void/50 border border-lum-border-glass p-3">
                    <p className="font-jakarta text-xl font-bold text-lum-text-primary">{stat.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-lum-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
