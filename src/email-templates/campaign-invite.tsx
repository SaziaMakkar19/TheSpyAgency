import React from 'react'

interface CampaignInviteProps {
    listingName: string
    url: string
}

export const CampaignInvite = ({ listingName, url }: CampaignInviteProps) => {
    return (
        <div
            style={{
                fontFamily: 'sans-serif',
                padding: '24px',
                maxWidth: '600px',
                margin: '0 auto',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
            }}
        >
            <h2 style={{ color: '#0f172a', marginBottom: '16px' }}>
                Check out this property!
            </h2>

            <p
                style={{
                    color: '#0f172a',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 12px 0',
                }}
            >
                {listingName}
            </p>

            <p
                style={{
                    color: '#334155',
                    fontSize: '16px',
                    lineHeight: '24px',
                    margin: '0 0 24px 0',
                }}
            >
                You have been invited to view the details of this exclusive
                property listing. Click the link below to access the campaign,
                view photos, and see the full property breakdown.
            </p>

            <div style={{ margin: '24px 0' }}>
                <a
                    href={url}
                    style={{
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        display: 'inline-block',
                    }}
                >
                    View Listing Details
                </a>
            </div>

            <p style={{ color: '#64748b', fontSize: '14px' }}>
                If you have any questions, simply reply to this email.
            </p>
        </div>
    )
}

export default CampaignInvite
