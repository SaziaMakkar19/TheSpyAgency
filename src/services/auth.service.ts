import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { lucia } from '@/auth'
import { db } from '@/db'
import { users, UserStatus, verificationTokens } from '@/db/schema'
import AuthenticationEmail from '@/email-templates/authentication-email'
import { render } from '@react-email/render'
import { eq } from 'drizzle-orm'
import { generateId } from 'lucia'
import { createDate, TimeSpan } from 'oslo'

import { validateRequest } from '@/lib/utils/auth'
import { sendEmail } from '@/lib/utils/email'

// Standalone user creation placeholder service matching your structure
const UserService = {
    create: async (data: {
        name: string
        email: string
        status: 'Active' | 'Inactive'
    }) => {
        const userId = generateId(15)
        const newUsers = await db
            .insert(users)
            .values({ id: userId, ...data })
            .returning()
        return newUsers[0]
    },
}

export const AuthService = {
    signOut: async () => {
        const { session } = await validateRequest()
        if (!session) return

        await lucia.invalidateSession(session.id)

        const sessionCookie = lucia.createBlankSessionCookie()

        // FIX: Await cookies() here to handle Next.js 15+ asynchronous cookie store changes
        const cookieStore = await cookies()
        cookieStore.set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        )

        console.log('User signed out successfully.')

        redirect('/')
    },

    magicLogin: async (email: string) => {
        let user = await db.query.users.findFirst({
            where: eq(users.email, email),
        })

        const tempName = email.split('@')[0]
        if (!user) {
            user = await UserService.create({
                name: tempName,
                email,
                status: UserStatus.Inactive,
            })
        }

        const token = await AuthService.createEmailVerificationToken(
            user.id,
            email,
        )
        const link = `${process.env.SITE_URL}/login/verify?token=${token}`
        const html = await render(AuthenticationEmail({ url: link }))

        await sendEmail({
            to: email,
            subject: 'Secure Access Authentication Magic Link',
            html,
        })

        return { ok: true }
    },

    createEmailVerificationToken: async (userId: string, email: string) => {
        await db
            .delete(verificationTokens)
            .where(eq(verificationTokens.userId, userId))
            .execute()

        const tokenId = generateId(40)

        const expiresAt = createDate(new TimeSpan(2, 'h'))

        const result = await db
            .insert(verificationTokens)
            .values({
                id: tokenId,
                email,
                userId,
                expiresAt,
            })
            .returning()

        return tokenId
    },
}
