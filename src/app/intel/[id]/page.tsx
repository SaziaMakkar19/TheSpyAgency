import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PromptPanel } from "@/components/intel/PromptPanel";
import { RenderPlaceholder } from "@/components/intel/RenderPlaceholder";
import { getPost } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  return { title: post ? `${post.title} | Intel` : "Dossier | The Spy Agency" };
}

/**
 * Dossier detail — the Stitch "Dossier Inspector".
 * Render canvas + full prompt recipe (with model/context disclosure) +
 * compliance attribution + remix CTA into the Studio.
 */
export default async function DossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-lum-text-muted">
          <Link href="/intel" className="hover:text-lum-text-primary transition-colors">
            Intel
          </Link>
          <span>/</span>
          <span className="text-lum-on-surface-variant">Dossier {post.listingNo ?? post.id}</span>
        </nav>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Render canvas */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass-card overflow-hidden">
              <RenderPlaceholder
                seed={post.gradientSeed}
                aspect={post.aspectRatio}
                label={post.address}
                price={post.price}
                className="!rounded-none"
              />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-lum-primary-bright to-lum-secondary text-lum-text-primary">
                    {post.stylePreset}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-lum-high text-lum-on-surface-variant">
                    {post.aspectRatio}
                  </span>
                  {post.listingNo && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-lum-high text-lum-on-surface-variant">
                      MLS #{post.listingNo}
                    </span>
                  )}
                </div>
                <h1 className="font-jakarta text-2xl sm:text-3xl font-bold tracking-tight text-lum-text-primary">
                  {post.title}
                </h1>
                {post.address && (
                  <p className="text-sm text-lum-text-muted">{post.address}</p>
                )}
              </div>
            </div>

            {/* Attribution & compliance */}
            <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lum-primary to-lum-secondary flex items-center justify-center font-jakarta text-sm font-bold text-white">
                  {post.agentName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-lum-text-primary">
                    {post.agentName}
                    <svg className="w-4 h-4 fill-lum-tertiary" viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                    </svg>
                  </p>
                  <p className="text-xs text-lum-text-muted">{post.brokerage}</p>
                </div>
              </div>
              <p className="text-[11px] text-lum-text-muted max-w-xs text-right">
                Images courtesy of the listing brokerage. Reciprocity
                attribution set by the listing agent per board rules.
              </p>
            </div>
          </div>

          {/* Inspector rail */}
          <div className="lg:col-span-2 space-y-5">
            <PromptPanel prompt={post.prompt} model={post.aiModel} isProOnly={post.isProOnly} />

            {/* Stats */}
            <div className="glass-card p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="font-jakarta text-2xl font-bold text-lum-text-primary">
                  {post.likesCount.toLocaleString()}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-lum-text-muted">Likes</p>
              </div>
              <div>
                <p className="font-jakarta text-2xl font-bold text-lum-text-primary">
                  {post.remixCount}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-lum-text-muted">Remixes</p>
              </div>
            </div>

            {/* Remix CTA */}
            <Link
              href={`/studio?source=${post.id}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl lum-gradient-btn text-sm font-semibold"
            >
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.035.259a3.375 3.5 0 00-2.455 2.456z" />
              </svg>
              Remix This Post
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
