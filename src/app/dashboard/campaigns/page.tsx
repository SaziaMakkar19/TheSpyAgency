// import { db } from '@/db'
// import { campaigns, campaignParticipants } from '@/db/schema'
// import { eq } from 'drizzle-orm'
// import { validateRequest } from '@/lib/utils/auth'
// import { redirect } from 'next/navigation'
// import Campaigns from '@/components/dashboard/campaigns'

// export default async function CampaignsPage() {
//     const { user } = await validateRequest()

//     // // 2. If not signed in, redirect to login WITH the return URL saved
//     // if (!user) {
//     //     // We encode the URL just in case the listing name has spaces or special characters
//     //     const currentPath = `/dashboard/campaigns`
//     //     const encodedPath = encodeURIComponent(currentPath)

//     //     console.log(encodedPath)

//     //     // Send them to login, passing the intended destination in the URL
//     //     redirect(`/login?redirectTo=${encodedPath}`)
//     // }

//     // 1. Fetch campaigns I own
//     // const owned = await db
//     //     .select()
//     //     .from(campaigns)
//     //     .where(eq(campaigns.ownerId, user.id))

//     // // 2. Fetch campaigns I participate in
//     // const participating = await db
//     //     .select({
//     //         id: campaigns.id,
//     //         listingName: campaigns.listingName,
//     //         createdAt: campaigns.createdAt,
//     //         status: campaignParticipants.status,
//     //     })
//     //     .from(campaigns)
//     //     .innerJoin(
//     //         campaignParticipants,
//     //         eq(campaigns.id, campaignParticipants.campaignId),
//     //     )
//     //     .where(eq(campaignParticipants.userId, user.id))

//     return <Campaigns user={user} />
// }

import { getCampaignFolders } from '@/lib/data/getCampaignFolders'
import { CampaignsClient } from '@/components/dashboard/campaignsClient'
import { validateRequest } from '@/lib/utils/auth' // Adjust this to your auth utility
import { redirect } from 'next/navigation'

export default async function CampaignsPage() {
    // 1. Fetch the user safely on the server
    const { user } = await validateRequest()

    if (!user) {
        redirect('/login')
    }

    // 2. Fetch the data
    const campaignData = await getCampaignFolders(user.id, user.email)
    console.log('campaignData', campaignData)

    return (
        <main className="min-h-screen bg-slate-50/50 py-8">
            <CampaignsClient
                data={campaignData}
                userId={user.id}
                userEmail={user.email}
            />
        </main>
    )
}
