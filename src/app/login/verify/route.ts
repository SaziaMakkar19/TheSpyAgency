import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { lucia } from '@/auth'
import {
    verificationTokens,
    users,
    UserStatus,
    campaignParticipants,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { isWithinExpirationDate } from 'oslo'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    // const redirectTo = searchParams.get('redirectTo') || '/dashboard'

    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

    if (!token) {
        return new NextResponse('Verification token missing.', { status: 400 })
    }

    try {
        const dbToken = await db.query.verificationTokens.findFirst({
            where: eq(verificationTokens.id, token),
        })

        // 2. Validate existence AND expiration (Do NOT delete yet)
        if (!dbToken) {
            return new NextResponse('Invalid token.', { status: 400 })
        }

        if (!isWithinExpirationDate(dbToken.expiresAt)) {
            // It is expired: NOW you can delete it
            await db
                .delete(verificationTokens)
                .where(eq(verificationTokens.id, token))
            return new NextResponse('Token expired.', { status: 400 })
        }

        // Instantly delete to block replay operations
        // await db
        //     .delete(verificationTokens)
        //     .where(eq(verificationTokens.id, token))

        // Promote status flag to Active
        await db
            .update(users)
            .set({ status: UserStatus.Active })
            .where(eq(users.id, dbToken.userId))

        const email = dbToken.email // The email associated with the token

        // if (redirectTo === '/dashboard/campaigns') {
        //     await db
        //         .update(campaignParticipants)
        //         .set({
        //             userId: dbToken.userId, // Link the user ID
        //             status: 'accepted', // Automatically mark as accepted upon login
        //         })
        //         .where(eq(campaignParticipants.email, email))
        // }

        // Initialize Lucia Session Hook
        const session = await lucia.createSession(dbToken.userId, {})
        const sessionCookie = lucia.createSessionCookie(session.id)

        // FIX: Await cookies() here to handle Next.js 15+ asynchronous cookie store changes
        const cookieStore = await cookies()
        cookieStore.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        )

        return NextResponse.redirect(new URL(callbackUrl, request.url))
    } catch (error) {
        console.error('Callback error:', error)
        return new NextResponse('Internal Authentication Failure', {
            status: 500,
        })
    }
}
