import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ConnectedAccounts } from "@/components/profile/ConnectedAccounts";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getConnectedAccounts } from "@/lib/social/channels";
import { getCurrentUser } from "@/lib/supabase/server";
import { verifyAgainstDirectory } from "@/lib/auth/verification";

export const metadata: Metadata = {
  title: "Head Quarters — Profile | The Spy Agency",
  description: "Manage your verified identity and connected social channels.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
          <div className="mb-8 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
              The Spy Agency / Head Quarters
            </p>
            <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
              Agent Profile
            </h1>
          </div>
          <div className="glass-card p-10 text-center space-y-4">
            <p className="text-sm text-lum-text-muted">
              Sign in to manage your identity and connected accounts.
            </p>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl lum-gradient-btn text-sm font-semibold"
            >
              Sign In / Register
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const [accounts, verification] = await Promise.all([
    getConnectedAccounts(user.id),
    verifyAgainstDirectory(user),
  ]);

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
              The Spy Agency / Head Quarters
            </p>
            <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
              Agent Profile
            </h1>
            <p className="text-sm text-lum-text-muted">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {/* Directory verification badge */}
        <section
          className={`glass-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4 ${
            verification.status === "verified"
              ? "border-lum-tertiary/40"
              : ""
          }`}
        >
          <div className="flex items-center gap-3">
            {verification.status === "verified" ? (
              <>
                <svg className="w-8 h-8 fill-lum-tertiary" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                </svg>
                <div>
                  <p className="font-jakarta text-sm font-bold text-lum-text-primary">
                    Verified Agent{verification.fullName ? ` — ${verification.fullName}` : ""}
                  </p>
                  <p className="text-xs text-lum-text-muted">
                    {verification.brokerage}
                    {verification.market ? ` · ${verification.market}` : ""}
                    {verification.directoryMlsId ? ` · MLS #${verification.directoryMlsId}` : ""}
                  </p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 fill-lum-outline" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.73-4-2.37V7z" />
                </svg>
                <div>
                  <p className="font-jakarta text-sm font-bold text-lum-text-primary">
                    {verification.status === "ambiguous"
                      ? "Verification needs review"
                      : "Not yet verified"}
                  </p>
                  <p className="text-xs text-lum-text-muted">
                    {verification.status === "ambiguous"
                      ? "Your email matches multiple directory agents — we'll confirm manually."
                      : "We couldn't match your email to the realtor directory yet. Listing folders and campaigns unlock once verified."}
                  </p>
                </div>
              </>
            )}
          </div>
          {verification.status === "verified" && (
            <span className="px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-lum-tertiary/15 text-lum-tertiary-bright">
              Directory Verified
            </span>
          )}
        </section>

        <ConnectedAccounts accounts={accounts} />
      </main>

      <Footer />
    </div>
  );
}
