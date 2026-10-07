"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/data/posts";
import { GALLERY_TAGS } from "@/lib/data/posts";
import { PostCard } from "./PostCard";
import { PromptPanel } from "./PromptPanel";

interface GalleryFeedProps {
  posts: Post[];
}

/**
 * GalleryFeed — the Intel "For You" masonry feed.
 * Free tier: tag browsing + curated selection. Registration gate lives on
 * prompt copy (handled in the dossier page / PromptPanel); Pro gating on
 * semantic keyword search, mirroring the Stitch free/pro split.
 */
export function GalleryFeed({ posts }: GalleryFeedProps) {
  const [activeTag, setActiveTag] = useState<string>("All Listings");
  const [query, setQuery] = useState("");
  const [isPro] = useState(false); // wire to Supabase profile.role === 'pro'

  const visible = useMemo(() => {
    let list = posts;
    if (activeTag !== "All Listings") {
      list = list.filter((p) => p.tags.includes(activeTag));
    }
    if (query.trim()) {
      // Semantic keyword search is a Pro entitlement (Stitch: "Unlock
      // Semantic Keyword Search — PRO TIER"). Free users get client-side
      // tag/title matching so the UI stays usable pre-auth.
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.stylePreset.toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, activeTag, query]);

  return (
    <div className="space-y-6">
      {/* Search — Pro feature flag shown, degrades gracefully for free users */}
      <div className="glass-toolbar flex items-center gap-3 px-4 py-3">
        <svg className="w-4 h-4 text-lum-text-muted fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            isPro
              ? "Camera & lens queries, MLS & style parameters…"
              : "Search titles & tags (Pro unlocks semantic search)"
          }
          className="flex-1 bg-transparent text-sm text-lum-text-primary placeholder:text-lum-text-muted/70 focus:outline-none"
        />
        {!isPro && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-lum-primary/15 text-lum-primary-bright border border-lum-border-glow">
            <svg className="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Pro
          </span>
        )}
      </div>

      {/* Curated style tags */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GALLERY_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTag === tag
                ? "lum-gradient-btn shadow-md"
                : "bg-lum-container text-lum-on-surface-variant border border-lum-border-glass hover:border-lum-border-glow hover:text-lum-text-primary"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Feed */}
      {visible.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-lum-text-muted">
          No dossiers match this filter — yet. The network is growing.
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
          {visible.map((post) => (
            <div key={post.id} className="mb-5 break-inside-avoid">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {/* Inline prompt inspector for quick preview */}
      <PromptPanel
        prompt={
          visible[0]?.prompt ??
          "Architectural twilight shot of a modern hillside villa, glass balustrades, glowing warm interior, hyperrealistic 8K, cinematic wide angle"
        }
        model={visible[0]?.aiModel ?? "Prompt Post Engine v4.2"}
        isProOnly={visible[0]?.isProOnly ?? false}
      />
    </div>
  );
}
