'use server'

import { render } from '@react-email/render'
import { CampaignInvite } from '@/email-templates/campaign-invite'
import { sendEmail } from '@/lib/utils/email'
import { db } from '@/db'
import { campaignParticipants, campaigns, users } from '@/db/schema'
import { generateId } from 'lucia'
import { validateRequest } from '@/lib/utils/auth'
import { inArray, and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function sendCampaignEmails(
    listingName: string,
    emails: string[],
) {
    const { user } = await validateRequest()
    const campaignId = generateId(15)

    if (!user) {
        return { success: false, error: 'User not found' }
    }

    try {
        // 1. Render the HTML on the server
        const html = await render(
            CampaignInvite({
                listingName,
                url: `http://localhost:3000/api/invite/accept/${campaignId}`,
            }),
        )

        // 2. Send emails in parallel
        await Promise.all(
            emails.map((email) =>
                sendEmail({
                    to: email,
                    subject: 'New Campaign Shared With You',
                    html,
                }),
            ),
        )

        // 1. Create the campaign
        await db.insert(campaigns).values({
            id: campaignId,
            listingName,
            ownerId: user.id,
        })

        // 4. Cross-reference targets against known operatives
        const registeredUsers = await db
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(inArray(users.email, emails))

        // Create a rapid-lookup map for the registered targets (email -> id)
        const userLookup = new Map(registeredUsers.map((u) => [u.email, u.id]))

        // 5. Create the participants with the userId if they exist
        const participants = emails.map((email) => ({
            id: generateId(15),
            campaignId,
            email,
            userId: userLookup.get(email) || null, // Attaches the ID if found, otherwise null
            status: 'pending' as const,
        }))

        await db.insert(campaignParticipants).values(participants)

        revalidatePath('/dashboard/campaigns')

        return { success: true }
    } catch (error) {
        console.error('Error in sendCampaignEmails:', error)
        return { success: false, error: 'Failed to send emails' }
    }
}

export async function acceptCampaignInvitation(
    campaignId: string,
    userId: string,
    userEmail: string,
) {
    console.log('in accept campaign')
    try {
        // 1. Update status to 'active' (adjust 'active' to match your schema's value)
        await db
            .update(campaignParticipants)
            .set({ status: 'accepted', userId: userId })
            .where(
                and(
                    eq(campaignParticipants.campaignId, campaignId),
                    eq(campaignParticipants.email, userEmail),
                ),
            )

        // 2. Refresh the UI
        revalidatePath('/dashboard') // Adjust path as necessary
        return { success: true }
    } catch (error) {
        console.error('Failed to accept invitation:', error)
        return { success: false, error: 'Database handshake failed' }
    }
}
