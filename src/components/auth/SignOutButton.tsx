"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 rounded-xl text-xs font-semibold bg-lum-high text-lum-on-surface-variant hover:text-lum-text-primary transition-colors"
    >
      Sign Out
    </button>
  );
}
