import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { GalleryFeed } from "@/components/intel/GalleryFeed";
import { getPosts } from "@/lib/data/posts";

export const metadata: Metadata = {
  title: "Intel — Post Gallery | The Spy Agency",
  description:
    "Browse high-performing AI real estate posts. Copy the prompt, see the model and context, remix it in the Studio.",
};

export const dynamic = "force-dynamic";

export default async function IntelPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Page header */}
        <div className="mb-8 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
            The Spy Agency / Intel
          </p>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
            Realtor Intel Ops — Post Gallery
          </h1>
          <p className="max-w-2xl text-sm text-lum-text-muted">
            Every dossier shows the render, the exact prompt recipe, and the AI
            model behind it. Copy a prompt to learn the craft — or remix it in
            the Studio to make it yours.
          </p>
        </div>

        <GalleryFeed posts={posts} />
      </main>

      <Footer />
    </div>
  );
}
