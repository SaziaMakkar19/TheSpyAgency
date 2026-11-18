"use client";

import { useState } from "react";
import type { Post } from "@/lib/data/posts";
import { AIRemixStudio } from "./AIRemixStudio";
import { ComposerStudio } from "./ComposerStudio";

/**
 * Studio mode switcher.
 *
 * - Co-Op Composer: the two-layer deterministic composer (locked compliance
 *   layer + editable participant layer). This is the campaign workflow.
 * - AI Remix Lab: the whole-image AI render pipeline (Ideogram/OpenAI) —
 *   creative exploration; renders feed /intel, not co-op campaigns.
 */
export function StudioModeSwitch({ sourcePost }: { sourcePost?: Post | null }) {
  const [mode, setMode] = useState<"composer" | "remix">("composer");

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border border-lum-border-glass bg-lum-surface/40 p-1 gap-1">
        <button
          onClick={() => setMode("composer")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === "composer"
              ? "bg-lum-primary text-lum-void"
              : "text-lum-text-muted hover:text-lum-text-primary"
          }`}
        >
          Co-Op Composer
        </button>
        <button
          onClick={() => setMode("remix")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === "remix"
              ? "bg-lum-primary text-lum-void"
              : "text-lum-text-muted hover:text-lum-text-primary"
          }`}
        >
          AI Remix Lab
        </button>
      </div>

      {mode === "composer" ? <ComposerStudio /> : <AIRemixStudio sourcePost={sourcePost} />}
    </div>
  );
}
