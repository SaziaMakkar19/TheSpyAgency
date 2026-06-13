'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import React from 'react'
import { Input } from 'rizzui'

import { Envelop } from '@/components/icons/envelop'
import { Box, Button } from '@/components/layout'
import { requestMagicLinkAction } from '@/app/actions/auth'

export const EmailLogin = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [submittedEmail, setSubmittedEmail] = useState('')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)

        const form = event.currentTarget
        const formData = new FormData(form)
        const emailValue = formData.get('email') as string

        const response = await requestMagicLinkAction(formData)

        if (response?.error) {
            toast.error(response.error)
            setIsLoading(false)
        }

        if (response?.success) {
            toast.success('Magic link sent!')
            setSubmittedEmail(emailValue)
            setIsSuccess(true)
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="w-full flex flex-col items-center text-center space-y-5 py-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Icon */}
                <div className="relative group">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <Envelop className="w-8 h-8 text-emerald-400" />
                    </div>
                    {/* Subtle glow that pulses slightly on hover */}
                    <div className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-400/10 blur-xl -z-10 transition-opacity duration-300 opacity-70 group-hover:opacity-100" />
                </div>

                {/* Text */}
                <div className="space-y-2">
                    {/* FIX: Added dark:text-white so this isn't invisible in dark mode */}
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        Check your inbox
                    </h3>

                    <p className="text-sm max-w-[300px] mx-auto leading-relaxed text-slate-500 dark:text-slate-400">
                        We’ve sent a secure access link to your email
                    </p>

                    {/* Email pill */}
                    <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200 text-sm font-medium">
                        {submittedEmail}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setIsSuccess(false)
                        setSubmittedEmail('')
                    }}
                    className="
        group mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full
        text-sm font-medium text-slate-500 dark:text-slate-400
        bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60
        hover:text-slate-900 dark:hover:text-slate-100
        transition-all duration-300 ease-out active:scale-95
    "
                >
                    {/* Optional: A sleek back arrow that slides left on hover */}
                    <svg
                        className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    Try a different email
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <Box className="w-full">
                <Input
                    autoComplete="email"
                    name="email"
                    type="email"
                    required
                    disabled={isLoading}
                    placeholder="name@agency.com"
                    className="w-full"
                    inputClassName="
                        w-full h-12 lg:h-13 px-4 rounded-xl transition-all duration-200 border
                        bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80
                        text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
                        hover:border-slate-300 dark:hover:border-slate-600
                        focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 dark:focus:border-emerald-500
                        focus:ring-4 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/10
                        disabled:opacity-60 disabled:cursor-not-allowed
                    "
                    prefix={
                        <Envelop className="w-5 h-5 ml-1 text-slate-400 dark:text-slate-500 transition-colors group-hover:text-slate-500" />
                    }
                />
            </Box>

            <Button
                type="submit"
                loading={isLoading}
                className="w-full h-12 lg:h-13 mt-2 text-sm lg:text-base font-semibold tracking-wide text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
                Request Access Link
            </Button>
        </form>
    )
}
