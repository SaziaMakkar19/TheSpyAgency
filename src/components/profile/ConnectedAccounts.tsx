"use client";

import { useState, useTransition } from "react";
import { CONNECTABLE_PLATFORMS, postizConnectUrl } from "@/lib/social/platforms";
import type { ConnectedAccount } from "@/lib/social/channels";
import {
  revokeAccountAction,
  syncChannelsAction,
  type ActionResult,
} from "@/app/profile/actions";

interface ConnectedAccountsProps {
  accounts: ConnectedAccount[];
}

const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  CONNECTABLE_PLATFORMS.map((p) => [p.platform, p.label])
);

/**
 * ConnectedAccounts — the "Head Quarters" profile panel.
 * Connect flow: open Postiz's OAuth page in a new tab → authorize → come
 * back → "Sync from Postiz" pulls the channel into social_accounts.
 */
export function ConnectedAccounts({ accounts }: ConnectedAccountsProps) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<ActionResult | null>(null);

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  const handleSync = () => {
    setNotice(null);
    startTransition(async () => {
      setNotice(await syncChannelsAction());
    });
  };

  const handleRevoke = (accountId: string) => {
    setNotice(null);
    startTransition(async () => {
      setNotice(await revokeAccountAction(accountId));
    });
  };

  return (
    <div className="space-y-6">
      {/* Connected list */}
      <section className="glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-jakarta text-lg font-bold text-lum-text-primary">
              Connected Accounts
            </h2>
            <p className="text-xs text-lum-text-muted">
              Channels your campaign posts publish through
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={pending}
            className="px-4 py-2 rounded-xl lum-gradient-btn text-xs font-semibold disabled:opacity-50"
          >
            {pending ? "Syncing…" : "Sync from Postiz"}
          </button>
        </div>

        {notice && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              notice.ok
                ? "bg-lum-tertiary/15 text-lum-tertiary-bright"
                : "bg-lum-error/15 text-lum-error"
            }`}
          >
            {notice.message}
          </p>
        )}

        {accounts.length === 0 ? (
          <div className="rounded-lg bg-lum-void/50 border border-dashed border-lum-border-glass p-6 text-center">
            <p className="text-sm text-lum-text-muted">
              No channels connected yet. Authorize a platform below, then hit
              <span className="text-lum-text-primary font-semibold"> Sync from Postiz</span>.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-lum-border-glass/60">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-lum-primary-bright to-lum-secondary text-lum-text-primary shrink-0">
                    {PLATFORM_LABEL[account.platform] ?? account.platform}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-lum-text-primary truncate">
                      {account.accountLabel}
                    </p>
                    <p className="text-[11px] text-lum-text-muted">
                      Connected {new Date(account.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(account.id)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-lum-high text-lum-on-surface-variant hover:text-lum-error transition-colors disabled:opacity-50 shrink-0"
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Available platforms */}
      <section className="glass-card p-5 space-y-4">
        <div>
          <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">
            Add a Channel
          </h3>
          <p className="text-xs text-lum-text-muted">
            Authorizes through Postiz in a new tab — X/Twitter is a future
            premium offering.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONNECTABLE_PLATFORMS.map(({ platform, label, hint }) => {
            const connected = connectedPlatforms.has(platform);
            return (
              <button
                key={platform}
                onClick={() => window.open(postizConnectUrl(platform), "_blank")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  connected
                    ? "border-lum-tertiary/40 bg-lum-tertiary/5 cursor-default"
                    : "border-lum-border-glass bg-lum-void/40 hover:border-lum-border-glow"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-lum-text-primary">{label}</p>
                  {connected && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-lum-tertiary-bright">
                      <svg className="w-3 h-3 fill-lum-tertiary" viewBox="0 0 24 24">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                      </svg>
                      Live
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-lum-text-muted">{hint}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
