// import Dashboard from '@/components/dashboard'
import { validateRequest } from '@/lib/utils/auth'
import { redirect } from 'next/navigation'
// import DashboardContent from '@/components/DashboardContent'

// export default async function DashboardPage() {
//     const { user } = await validateRequest()

//     if (!user) {
//         redirect('/login')
//     }
//     return <Dashboard user={user} />
// }

export default async function DashboardPage() {
    // 1. Check for the user on the server
    const { user } = await validateRequest()

    // 2. If no user, immediately redirect to login (Server-side)
    if (!user) {
        redirect('/login')
    }

    // 3. If user exists, render the dashboard, passing user as a prop
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
        </div>
    )
}
