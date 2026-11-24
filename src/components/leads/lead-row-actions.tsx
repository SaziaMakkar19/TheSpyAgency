"use client";

/**
 * Per-row actions in the /leads inbox. Reply/Forward are mailto links
 * (rendered as <a> so the agent's mail client handles them); Delete calls
 * DELETE /api/leads/[id] and refreshes the server-rendered table.
 *
 * Touch targets are 44px, per the mobile requirement.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reply, Share2, Trash2 } from "lucide-react";

type Phase = "idle" | "confirm" | "pending" | "error";

const ICON_BTN =
  "h-11 w-11 inline-flex items-center justify-center rounded-lg text-lum-on-surface-variant " +
  "hover:text-lum-primary-bright hover:bg-lum-surface/60 transition-colors " +
  "disabled:opacity-40 disabled:pointer-events-none";

export function LeadRowActions({
  leadId,
  replyHref,
  forwardHref,
}: {
  leadId: string;
  replyHref: string;
  forwardHref: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");

  async function burn() {
    setPhase("pending");
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) {
        // Row disappears when the server component re-runs.
        setPhase("idle");
        router.refresh();
        return;
      }
      setPhase("error");
    } catch {
      setPhase("error");
    }
  }

  if (phase === "confirm") {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-lum-text-muted whitespace-nowrap">
          Burn this lead? This can&rsquo;t be undone.
        </span>
        <button
          type="button"
          onClick={burn}
          className="h-11 px-4 rounded-lg text-sm font-semibold bg-lum-error/15 text-lum-error hover:bg-lum-error/25 transition-colors"
        >
          Burn
        </button>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="h-11 px-4 rounded-lg text-sm font-semibold text-lum-on-surface-variant hover:bg-lum-surface/60 transition-colors"
        >
          Keep
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-lum-error whitespace-nowrap">
          The wire jammed — try again.
        </span>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="h-11 px-4 rounded-lg text-sm font-semibold text-lum-on-surface-variant hover:bg-lum-surface/60 transition-colors"
        >
          OK
        </button>
      </div>
    );
  }

  const busy = phase === "pending";

  return (
    <div className="flex items-center justify-end gap-1">
      <a
        href={replyHref}
        title="Reply by email"
        aria-label="Reply by email"
        aria-disabled={busy}
        className={ICON_BTN}
      >
        <Reply size={18} />
      </a>
      <a
        href={forwardHref}
        title="Forward by email"
        aria-label="Forward by email"
        aria-disabled={busy}
        className={ICON_BTN}
      >
        <Share2 size={18} />
      </a>
      <button
        type="button"
        onClick={() => setPhase("confirm")}
        disabled={busy}
        title="Delete lead"
        aria-label="Delete lead"
        className={`${ICON_BTN} hover:text-lum-error`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
