"use client";

import { useState } from "react";

interface PromptPanelProps {
  prompt: string;
  model: string;
}

/**
 * PromptPanel — the "prompt recipe" inspector from the Stitch intel feed.
 * Access control is handled at the page level: /intel/[id] redirects
 * anonymous visitors to /login, so this panel always renders the full
 * recipe for registered agents.
 */
export function PromptPanel({ prompt, model }: PromptPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-jakarta text-sm font-bold text-lum-text-primary">
          Prompt Recipe
        </h4>
        <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-lum-text-muted">
          {model}
        </span>
      </div>
      <div className="rounded-lg bg-lum-void/60 border border-lum-border-glass p-4">
        <p className="text-xs leading-relaxed text-lum-on-surface-variant font-mono break-words">
          {prompt}
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl lum-gradient-btn text-xs font-semibold"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Prompt Copied to Clipboard
          </>
        ) : (
          <>
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375" />
            </svg>
            Copy Prompt
          </>
        )}
      </button>
    </div>
  );
}
