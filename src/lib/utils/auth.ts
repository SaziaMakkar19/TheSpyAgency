import { cookies } from 'next/headers'
import { lucia } from '@/auth'
import type { Session, User } from 'lucia'

interface ValidateRequestResult {
    user: User | null
    session: Session | null
}

export async function validateRequest(): Promise<ValidateRequestResult> {
    const sessionCookieName = lucia.sessionCookieName

    // 1. FIX: Await the cookies() utility since it is asynchronous in Next.js 15+
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(sessionCookieName)?.value ?? null

    if (!sessionId) {
        return { user: null, session: null }
    }

    // Verify the session authenticity using the database storage client via Lucia
    const result = await lucia.validateSession(sessionId)

    try {
        // 2. Refresh cookie expiration markers if updated by the database validation loop
        if (result.session && result.session.fresh) {
            const sessionCookie = lucia.createSessionCookie(result.session.id)
            cookieStore.set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes,
            )
        }

        // If the session was invalidated by the database, wipe the tracking cookie clean
        if (!result.session) {
            const blankCookie = lucia.createBlankSessionCookie()
            cookieStore.set(
                blankCookie.name,
                blankCookie.value,
                blankCookie.attributes,
            )
        }
    } catch {
        // Next.js prevents cookie updates if validation runs inside a read-only layout/render pass.
        // The try/catch ensures the app doesn't crash; the session remains active.
    }

    return result
}
