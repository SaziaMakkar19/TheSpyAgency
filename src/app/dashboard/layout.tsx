import React from 'react'
import Dashboard from '@/components/dashboard'
import { validateRequest } from '@/lib/utils/auth'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = await validateRequest()

    return <Dashboard user={user}>{children}</Dashboard>
}
