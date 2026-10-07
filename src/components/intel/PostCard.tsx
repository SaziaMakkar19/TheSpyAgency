import Link from "next/link";
import type { Post } from "@/lib/data/posts";
import { RenderPlaceholder } from "./RenderPlaceholder";

interface PostCardProps {
  post: Post;
}

/**
 * PostCard / ImageCard — the gallery dossier tile (Ideogram-style).
 * Shows the render, style preset chip, verified agent, and engagement;
 * links to the dossier detail page at /intel/[id].
 */
export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/intel/${post.id}`} className="group block">
      <article className="glass-card overflow-hidden transition-all duration-300 hover:border-lum-border-glow hover:shadow-[0_8px_32px_-4px_rgba(99,102,241,0.25)]">
        <div className="relative">
          <RenderPlaceholder
            seed={post.gradientSeed}
            aspect={post.aspectRatio}
            label={post.address}
            price={post.price}
          />
          {/* hover overlay */}
          <div className="absolute inset-0 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 via-transparent to-transparent">
            <span className="px-2 py-1 rounded bg-white/10 backdrop-blur text-[11px] font-medium text-lum-text-primary">
              {post.aspectRatio} • {post.aiModel}
            </span>
            <span className="px-2 py-1 rounded lum-gradient-btn text-[11px] font-semibold">
              View Dossier
            </span>
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

          <div className="flex items-center gap-4 pt-1 text-[11px] font-medium text-lum-text-muted">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {post.likesCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              {post.remixCount} remixes
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
