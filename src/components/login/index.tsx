'use client'

import React, { Suspense } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Text } from 'rizzui'
import { Box, Flex } from '@/components/layout'
import { EmailLogin } from '@/components/login/email-login'
import { LoginIllustration } from '@/components/icons/login-illustration'
import Link from 'next/link'
import { HouseIcon } from '@/components/icons/home'

// 1. Extract the logic requiring useSearchParams into its own component
function LoginForm() {
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirectTo') || '/dashboard'

    return <EmailLogin redirectTo={redirectTo} />
}

export default function LoginView({ message }: { message?: string }) {
    return (
        <Box className="grid w-screen min-h-screen md:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-geist antialiased">
            {/* Left Column: Form Container */}
            <Flex
                className="p-6 sm:p-12 md:p-16 lg:p-24 w-full h-full bg-white dark:bg-slate-900"
                direction="col"
                justify="center"
                align="center"
            >
                <Link
                    href="/"
                    className="
                        absolute top-6 left-6 md:top-8 md:left-8 
                        group inline-flex items-center gap-2 text-sm font-medium 
                        text-slate-500 hover:text-slate-900 
                        dark:text-slate-400 dark:hover:text-slate-100 
                        transition-all duration-200 ease-out active:scale-95
                    "
                >
                    <HouseIcon />
                    Home
                </Link>
                <Box className="w-full max-w-[420px] flex flex-col gap-12 justify-center py-8">
                    {/* Logo / Brand Header */}
                    <Flex
                        justify="center"
                        className="tracking-[0.2em] uppercase font-bold text-xs text-slate-400 dark:text-slate-500"
                    >
                        The Spy Agency
                    </Flex>

                    {/* Heading and Intro Block */}
                    <Box className="relative text-center">
                        <Text className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 balance-text">
                            Welcome
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 mt-2.5 text-sm lg:text-base max-w-[32ch] mx-auto">
                            Sign in to gain secure access to your operations
                            dashboard.
                        </Text>
                    </Box>

                    {/* Core Login Component */}
                    <Box className="relative group">
                        {/* 2. Wrap the extracted component in a Suspense boundary */}
                        <Suspense
                            fallback={
                                <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"></div>
                            }
                        >
                            <LoginForm />
                        </Suspense>
                    </Box>

                    {/* Institutional Footer */}
                    <Text className="text-center text-xs font-medium tracking-wide text-slate-400 dark:text-slate-600 mt-4">
                        &copy; {new Date().getFullYear()} The Spy Agency. All
                        rights reserved.
                    </Text>
                </Box>
            </Flex>

            {/* Right Column: Visual Showcase Panel */}
            <Box className="relative overflow-hidden h-full hidden md:block select-none bg-[#020817]">
                <Flex
                    justify="center"
                    align="center"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                >
                    <Box className="absolute inset-0 bg-gradient-to-tr from-[#27DEBF]/20 via-transparent to-transparent opacity-70" />{' '}
                    {/* Hero Branding Illustration */}
                    <LoginIllustration className="w-[60%] max-w-[460px] h-auto relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform hover:scale-[1.02] transition-transform duration-700 ease-out" />
                </Flex>
            </Box>
        </Box>
    )
}
