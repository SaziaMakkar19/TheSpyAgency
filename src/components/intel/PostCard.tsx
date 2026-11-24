"use client";

import Link from "next/link";
import type { Post } from "@/lib/data/posts";
import { RenderPlaceholder } from "./RenderPlaceholder";
import { PostActionsMenu } from "./PostActionsMenu";

interface PostCardProps {
  post: Post;
}

/**
 * PostCard / ImageCard — the gallery dossier tile (Ideogram-style).
 * Shows the render, style preset chip, verified agent, and engagement;
 * links to the dossier detail page at /intel/[id]. The whole card is a
 * link, so every action button isolates its click to avoid navigating.
 */
export function PostCard({ post }: PostCardProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!post.imageUrl) return;
    const a = document.createElement("a");
    a.href = post.imageUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Link href={`/intel/${post.id}`} className="group block">
      <article className="glass-card overflow-hidden transition-all duration-300 hover:border-lum-border-glow hover:shadow-[0_8px_32px_-4px_rgba(99,102,241,0.25)]">
        <div className="relative">
          <RenderPlaceholder
            seed={post.gradientSeed}
            aspect={post.aspectRatio}
            label={post.address}
            price={post.price}
            src={post.imageUrl}
          />

          {/* Bottom action row — always visible on touch, on hover on
              desktop. Frosted-glass buttons, min 32px targets. */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-end gap-1.5 p-2 opacity-100 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
            {/* Display-only engagement counters */}
            <span
              className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border border-white/15 bg-black/40 px-1.5 text-white/90 backdrop-blur-md"
              title={`${post.likesCount.toLocaleString()} likes`}
              aria-label={`${post.likesCount} likes`}
            >
              <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span className="text-[11px] font-semibold tabular-nums">
                {post.likesCount.toLocaleString()}
              </span>
            </span>
            <span
              className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border border-white/15 bg-black/40 px-1.5 text-white/90 backdrop-blur-md"
              title={`${post.remixCount} remixes`}
              aria-label={`${post.remixCount} remixes`}
            >
              <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <span className="text-[11px] font-semibold tabular-nums">
                {post.remixCount}
              </span>
            </span>

            {/* Download — only for real renders (Phase C); gradient
                placeholders don't render a file worth saving. */}
            {post.imageUrl && (
              <button
                type="button"
                onClick={handleDownload}
                aria-label="Download render"
                title="Download render"
                className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/15 bg-black/40 px-1.5 text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
              >
                <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            )}

            <PostActionsMenu post={post} />
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-lum-primary-bright to-lum-secondary text-lum-text-primary shadow-sm">
              {post.stylePreset}
            </span>
            {post.isProOnly && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-lum-primary/20 text-lum-primary-bright border border-lum-border-glow">
                Pro
              </span>
            )}
          </div>

          <h3 className="font-jakarta text-[15px] font-semibold leading-snug text-lum-text-primary line-clamp-2">
            {post.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-lum-text-muted">
            <svg className="w-3.5 h-3.5 fill-lum-tertiary" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
            </svg>
            <span className="truncate">
              {post.agentName} · {post.brokerage}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
