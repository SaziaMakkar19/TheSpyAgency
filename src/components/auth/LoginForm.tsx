"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * LoginForm — passwordless email (magic link). signInWithOtp creates the
 * account on first use, so registration and login are the same flow —
 * the trigger auto-creates the profile row, and directory verification
 * runs on the profile page.
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setMessage("");

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setState("error");
      setMessage("Supabase is not configured — check .env.local.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  };

  if (state === "sent") {
    return (
      <div className="glass-card p-8 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-lum-tertiary/15 flex items-center justify-center">
          <svg className="w-6 h-6 fill-none stroke-lum-tertiary-bright" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-jakarta text-xl font-bold text-lum-text-primary">Check your inbox</h2>
        <p className="text-sm text-lum-text-muted max-w-sm mx-auto">
          We sent a secure sign-in link to{" "}
          <span className="text-lum-on-surface-variant font-medium">{email}</span>. Click it to
          enter Head Quarters — no password needed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
      <div className="space-y-1">
        <h2 className="font-jakarta text-xl font-bold text-lum-text-primary">Agent Access</h2>
        <p className="text-xs text-lum-text-muted">
          Enter your business email — we&apos;ll match it against the realtor directory and send
          a sign-in link. New here? The link creates your account.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">
          Email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbrokerage.com"
          className="w-full rounded-lg bg-lum-void/70 border border-lum-border-glass px-3.5 py-3 text-sm text-lum-on-surface placeholder:text-lum-text-muted/60 focus:outline-none focus:border-lum-border-glow transition-colors"
        />
      </label>

      {state === "error" && (
        <p className="rounded-lg bg-lum-error/15 px-3 py-2 text-xs text-lum-error">{message}</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full px-4 py-3 rounded-xl lum-gradient-btn text-sm font-semibold disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send Sign-In Link"}
      </button>

      <p className="text-[11px] text-lum-text-muted text-center">
        Registration is free. Pro plans unlock the Remix Studio limits — billed monthly with
        credit top-ups.
      </p>
    </form>
  );
}
