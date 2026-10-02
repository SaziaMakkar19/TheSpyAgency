import React from 'react'
import Dashboard from '@/components/dashboard'
import { validateRequest } from '@/lib/utils/auth'
import { realtorDb } from '@/lib/utils/supabase-server'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = await validateRequest()

    const { data: realtorData, error: realtorError } = await realtorDb
        .from('realtors')
        .select('*')
        .eq('MemberEmail', 'zen@zenwilson.com') // Ensure this matches your auth logic
        .single()

    if (realtorError || !realtorData?.MemberMlsId) {
        return <div>Error</div>
    }

    return (
        <Dashboard user={user} realtorData={realtorData}>
            {children}
        </Dashboard>
    )
}
