import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/utils/auth'

export default async function Dashboard() {
    const { user } = await validateRequest()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold">Dashboard</h1>

            <p className="mt-4">
                Logged in as: <strong>{user.email}</strong>
            </p>

            <p>Name: {user.name}</p>

            <p>Status: {user.status}</p>
        </div>
    )
}
