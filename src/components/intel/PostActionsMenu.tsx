"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/data/posts";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * PostActionsMenu — the Ideogram-style "⋯" action menu on gallery cards.
 * The card itself is a <Link>, so every action isolates its click
 * (preventDefault + stopPropagation) to avoid navigating.
 *
 * Copy Prompt is registration-gated: anonymous agents are bounced to
 * /login and returned to the dossier after signing in. Prompt viewing/
 * copying lives only on the dossier page — Phase A keeps copying here
 * gated behind registration without revealing the recipe on the card.
 * (Report submissions are interim mailto links — a real reports table
 * lands with the Phase C render pipeline.)
 */

const MENU_WIDTH = 208;
const MENU_HEIGHTS = { main: 200, report: 160 };

const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-lum-on-surface-variant transition-colors hover:bg-lum-primary/15 hover:text-lum-text-primary";

const REPORT_REASONS = [
  "Poor image quality",
  "Inappropriate image",
  "Inappropriate prompt",
] as const;

function dossierUrl(postId: string): string {
  return `${window.location.origin}/intel/${postId}`;
}

export function PostActionsMenu({ post }: { post: Post }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<"report" | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSubmenu(null);
  }, []);

  const isolate = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const toggle = (e: React.MouseEvent) => {
    isolate(e);
    if (open) {
      close();
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.min(
        Math.max(8, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8
      );
      // Open upward over the render when there's room, below otherwise —
      // fixed positioning + these clamps keep the menu on-screen.
      const up = rect.top >= MENU_HEIGHTS.main + 16;
      const top = up
        ? Math.max(8, rect.top - MENU_HEIGHTS.main - 8)
        : Math.min(rect.bottom + 8, window.innerHeight - MENU_HEIGHTS.main - 8);
      setPos({ top, left });
    }
    setSubmenu(null);
    setOpen(true);
  };

  // Esc closes (focus returns to the trigger); outside pointerdown closes;
  // scroll/resize repositions are handled by simply closing.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open, close]);

  const copyImage = async (e: React.MouseEvent) => {
    isolate(e);
    close();
    if (!post.imageUrl) {
      showToast("Image available once renders ship.");
      return;
    }
    try {
      const res = await fetch(post.imageUrl, { mode: "cors" });
      const blob = await res.blob();
      const type = blob.type.startsWith("image/") ? blob.type : "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      showToast("Image copied");
    } catch {
      showToast("Couldn't copy the image");
    }
  };

  const copyPrompt = async (e: React.MouseEvent) => {
    isolate(e);
    close();
    const supabase = getSupabaseBrowser();
    const session = supabase
      ? (await supabase.auth.getSession()).data.session
      : null;
    if (!session) {
      // Registration required — sign in, then come straight back.
      window.location.href = `/login?next=${encodeURIComponent(`/intel/${post.id}`)}`;
      return;
    }
    try {
      await navigator.clipboard.writeText(post.prompt);
      showToast("Copied");
    } catch {
      showToast("Couldn't copy the prompt");
    }
  };

  const share = async (e: React.MouseEvent) => {
    isolate(e);
    close();
    const url = dossierUrl(post.id);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: post.title, url });
      } catch {
        // Share sheet dismissed — not an error worth surfacing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Couldn't copy the link");
    }
  };

  const remix = (e: React.MouseEvent) => {
    isolate(e);
    close();
    // Button + client-side navigation rather than a nested <Link> —
    // the card itself is already a link, and anchors can't nest.
    router.push(`/studio?source=${post.id}`);
  };

  const report = (e: React.MouseEvent, reason: string) => {
    isolate(e);
    close();
    const subject = `Report: ${reason} — dossier ${post.id}`;
    const body = `Dossier: ${dossierUrl(post.id)}`;
    const href = `mailto:info@thespyagency.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    // Anchor click rather than assigning location.href — keeps the
    // handler free of external-state mutation.
    const a = document.createElement("a");
    a.href = href;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Post actions"
        title="Post actions"
        onClick={toggle}
        className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border border-white/15 bg-black/40 px-1.5 text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6.75a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 20.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Post actions"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="glass-card fixed z-[100] p-1.5 shadow-[0_8px_32px_-4px_rgba(99,102,241,0.45)]"
          >
            {submenu === null ? (
              <>
                <button type="button" role="menuitem" onClick={copyImage} className={MENU_ITEM}>
                  <svg className="h-4 w-4 shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15.75l3-3 2.25 2.25 2.25-2.25 2.25 2.25M9 8.25h.007v.008H9v-.008z" />
                  </svg>
                  Copy Image
                </button>
                <button type="button" role="menuitem" onClick={copyPrompt} className={MENU_ITEM}>
                  <svg className="h-4 w-4 shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375" />
                  </svg>
                  Copy Prompt
                </button>
                <button type="button" role="menuitem" onClick={share} className={MENU_ITEM}>
                  <svg className="h-4 w-4 shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Share
                </button>
                <button type="button" role="menuitem" onClick={remix} className={MENU_ITEM}>
                  <svg className="h-4 w-4 shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  Remix
                </button>
                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup="menu"
                  aria-expanded={false}
                  onClick={(e) => {
                    isolate(e);
                    setSubmenu("report");
                  }}
                  className={MENU_ITEM}
                >
                  <svg className="h-4 w-4 shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                  </svg>
                  <span className="flex-1">Report</span>
                  <svg className="h-3 w-3 shrink-0 fill-none stroke-current opacity-60" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    isolate(e);
                    setSubmenu(null);
                  }}
                  className={`${MENU_ITEM} text-lum-text-muted`}
                >
                  <svg className="h-3.5 w-3.5 shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Back
                </button>
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    role="menuitem"
                    onClick={(e) => report(e, reason)}
                    className={MENU_ITEM}
                  >
                    {reason}
                  </button>
                ))}
              </>
            )}
          </div>,
          document.body
        )}

      {toast &&
        createPortal(
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-lg border border-lum-border-glass bg-lum-high/95 px-4 py-2.5 text-xs font-medium text-lum-text-primary shadow-[0_8px_32px_-4px_rgba(99,102,241,0.45)] backdrop-blur-xl"
          >
            {toast}
          </div>,
          document.body
        )}
    </>
  );
}
