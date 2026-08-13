import { validateRequest } from '@/lib/utils/auth'
import Dashboard from '@/components/dashboard'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = await validateRequest()

    return <Dashboard user={user} children={children} />
}
