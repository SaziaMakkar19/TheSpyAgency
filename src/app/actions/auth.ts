'use server'

import { AuthService } from '@/services/auth.service'

export async function requestMagicLinkAction(formData: FormData) {
    const email = formData.get('email') as string

    if (!email || !email.includes('@')) {
        return { error: 'Please provide a valid email address.' }
    }

    try {
        const result = await AuthService.magicLogin(email)
        if (result && result.ok) {
            return { success: true }
        }
        return { error: 'Failed to dispatch magic token link.' }
    } catch (error) {
        console.error(error)
        return {
            error: 'An unexpected authentication service disruption occurred.',
        }
    }
}
