import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Auth callback — Supabase redirects magic-link / OAuth clicks here.
 * Two link formats are handled:
 *   - PKCE (default): ?code=...            → exchangeCodeForSession
 *   - legacy implicit: ?token_hash=&type=  → verifyOtp
 * Session cookies are written explicitly onto the redirect response —
 * relying on the cookies() store alone can silently drop them on redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/profile";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || (!code && !(tokenHash && type))) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: type as "magiclink" | "signup" | "invite" | "recovery" | "email_change",
      });

  if (error) {
    console.error("[auth/callback] session exchange failed:", error.message);
    response = NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  return response;
}
