import { NextResponse } from 'next/server'

import { validateRequest } from '@/lib/utils/auth'
import { fetchListingsTree } from '@/lib/queries/listings'

export async function GET() {
    try {
        const { user } = await validateRequest()

        if (!user) {
            return NextResponse.json(
                {
                    error: 'Unauthorized',
                },
                {
                    status: 401,
                },
            )
        }

        /*
         * IMPORTANT:
         *
         * Replace this with the actual email
         * from your Lucia/session user object.
         *
         * You currently hardcoded:
         *
         * const userEmail = 'zen@zenwilson.com'
         */

        const userEmail = 'zen@zenwilson.com'

        if (!userEmail) {
            return NextResponse.json(
                {
                    error: 'User email not found.',
                },
                {
                    status: 401,
                },
            )
        }

        const tree = await fetchListingsTree(userEmail)

        return NextResponse.json(tree)
    } catch (error) {
        console.error('Listings API error:', error)

        return NextResponse.json(
            {
                error: 'Failed to load listings.',
            },
            {
                status: 500,
            },
        )
    }
}
