import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { lucia } from '@/auth'
import { verificationTokens, users, UserStatus } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { isWithinExpirationDate } from 'oslo'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
        return new NextResponse('Verification token missing.', { status: 400 })
    }

    try {
        const dbToken = await db.query.verificationTokens.findFirst({
            where: eq(verificationTokens.id, token),
        })

        if (!dbToken || !isWithinExpirationDate(dbToken.expiresAt)) {
            return new NextResponse(
                'Verification token has expired or is invalid.',
                {
                    status: 400,
                },
            )
        }

        // Instantly delete to block replay operations
        await db
            .delete(verificationTokens)
            .where(eq(verificationTokens.id, token))

        // Promote status flag to Active
        await db
            .update(users)
            .set({ status: UserStatus.Active })
            .where(eq(users.id, dbToken.userId))

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

        return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
        console.error('Callback error:', error)
        return new NextResponse('Internal Authentication Failure', {
            status: 500,
        })
    }
}
