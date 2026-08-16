import { db } from '@/db'
import { eq, and, ne } from 'drizzle-orm'
import { Folder } from '@/components/dashboard/folderView'
import { campaigns, campaignParticipants } from '@/db/schema'

export async function getCampaignFolders(
    userId: string,
    userEmail: string,
): Promise<{ owned: Folder[]; participating: Folder[]; pending: Folder[] }> {
    // 1. Fetch Owned and Participating Campaigns from DB
    const owned = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.ownerId, userId))

    const participating = await db
        .select()
        .from(campaigns)
        .innerJoin(
            campaignParticipants,
            eq(campaigns.id, campaignParticipants.campaignId),
        )
        .where(
            and(
                eq(campaignParticipants.userId, userId),
                ne(campaigns.ownerId, userId),
                // CRITICAL: Ensure we only get active/accepted invites here
                ne(campaignParticipants.status, 'pending'),
            ),
        )

    // 3. Fetch Pending Campaign Invitations
    const pending = await db
        .select()
        .from(campaigns)
        .innerJoin(
            campaignParticipants,
            eq(campaigns.id, campaignParticipants.campaignId),
        )
        .where(
            and(
                eq(campaignParticipants.email, userEmail),
                // Isolate only the pending intel
                eq(campaignParticipants.status, 'pending'),
            ),
        )

    // 2. Return two flat arrays of campaign folders
    return {
        owned: owned.map((c) => ({
            id: c.id,
            title: c.listingName,
            description: 'Campaign folder',
            files: [],
            children: [],
        })),
        participating: participating.map((row) => ({
            id: row.campaigns?.id,
            title: row.campaigns?.listingName,
            description: 'Participating folder',
            files: [],
            children: [],
        })),
        pending: pending.map((row) => ({
            id: row.campaigns?.id,
            title: row.campaigns?.listingName,
            description: 'Pending invitation',
            files: [],
            children: [],
        })),
    }
}
