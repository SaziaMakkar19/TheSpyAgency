import { getCampaignData } from '@/lib/data/getCampaignData' // We will define this below
import { CampaignDetailClient } from '@/components/dashboard/campaignDetailClient'
import { notFound } from 'next/navigation'

export default async function CampaignDetailPage({
    params,
}: {
    params: Promise<{ campaignId: string }>
}) {
    const { campaignId } = await params

    const campaign = await getCampaignData(campaignId)

    if (!campaign) {
        return notFound() // This shows the default Next.js 404 page
    }

    return (
        <div className="p-6">
            <CampaignDetailClient campaign={campaign} />
        </div>
    )
}
