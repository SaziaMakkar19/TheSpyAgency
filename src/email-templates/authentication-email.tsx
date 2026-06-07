import React from 'react'

interface AuthenticationEmailProps {
    url: string
}

export const AuthenticationEmail = ({ url }: AuthenticationEmailProps) => {
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
                Secure System Access Link
            </h2>
            <p
                style={{
                    color: '#334155',
                    fontSize: '16px',
                    lineHeight: '24px',
                }}
            >
                Click the authorization button below to access your account
                dashboard. This magic link remains valid for 2 hours.
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
                    Authenticate Dashboard Connection
                </a>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
                If you did not request this link, you can safely disregard this
                email notification.
            </p>
        </div>
    )
}

export default AuthenticationEmail
