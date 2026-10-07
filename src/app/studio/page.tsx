import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AIRemixStudio } from "@/components/studio/AIRemixStudio";
import { getPost } from "@/lib/data/posts";

export const metadata: Metadata = {
  title: "Special Ops — Campaign Remix Studio | The Spy Agency",
  description:
    "Multi-layer AI Remix Studio: personalize the agent layer while MLS geometry and attribution stay locked for compliance.",
};

export const dynamic = "force-dynamic";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const sourcePost = source ? await getPost(source) : null;

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
            The Spy Agency / Special Ops
          </p>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
            Campaign Remix Studio
          </h1>
          <p className="max-w-2xl text-sm text-lum-text-muted">
            Remix a gallery dossier into your own post. Edit the agent layer —
            headline, note, style, blend. The MLS geometry and courtesy
            attribution layers stay locked and composited at render time.
          </p>
        </div>

        <Suspense fallback={null}>
          <AIRemixStudio sourcePost={sourcePost} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
