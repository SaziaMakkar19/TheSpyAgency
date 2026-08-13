// app/api/invite/accept/[campaignId]/route.ts
import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/utils/auth'
import { acceptCampaignInvitation } from '@/app/actions/campaign'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ campaignId: string }> },
) {
    // Await the params promise to access the campaignId
    const { campaignId } = await params

    const { user } = await validateRequest()

    console.log('user', user)

    // 1. If not logged in, redirect to login with a callback
    if (!user) {
        const loginUrl = new URL('/login', request.url)
        // This preserves the path so we can return here after login
        loginUrl.searchParams.set(
            'callbackUrl',
            `/api/invite/accept/${campaignId}`,
        )
        return NextResponse.redirect(loginUrl)
    }

    // 2. If logged in, process the invite
    await acceptCampaignInvitation(campaignId, user.id, user.email)

    // 3. Redirect to the campaign folder
    return NextResponse.redirect(
        new URL(`/dashboard/campaigns/${campaignId}`, request.url),
    )
}
