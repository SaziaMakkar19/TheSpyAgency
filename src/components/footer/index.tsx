'use client'

import Link from 'next/link'
import { useInView } from 'react-intersection-observer'
import { Text } from 'rizzui'

import { cn } from '@/lib/utils/cn'
import { Box, Flex } from '@/components/layout'

const menuItems = [
    { label: 'Support', href: '/', target: '_blank' },
    { label: 'Privacy', href: '/' },
    { label: 'Terms & Condition', href: '/' },
]

export const Footer = () => {
    const { ref } = useInView({
        threshold: 0,
    })

    return (
        <footer
            ref={ref}
            className="relative bottom-0 mt-8 font-geist bg-black text-center xl:mt-0 pt-16 pb-8"
        >
            <Box className="max-w-[120rem] md:px-8 3xl:px-40 px-4 mx-auto">
                {/* --- HERO SECTION FOR LANDING --- */}
                <div className="relative z-10 max-w-2xl mx-auto mb-20 flex flex-col items-center">
                    {/* Subtle Grid Background Grid Simulation */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] -z-10 pointer-events-none opacity-40" />

                    <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-3">
                        Join the Community
                    </span>

                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                        Connect with the{' '}
                        <span className="text-emerald-500">The Spy Agency</span>{' '}
                        Ecosystem
                    </h2>

                    <p className="text-gray-400 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
                        Hop into our Facebook community or follow our socials to
                        trade tips, report bugs, and chat with thousands of
                        active builders.
                    </p>

                    <button className="px-6 py-2.5 rounded-md border border-emerald-500/30 text-white font-medium text-sm bg-emerald-950/20 hover:bg-emerald-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        Join our Social Community
                    </button>

                    {/* Social Icons matching image_5ce3c2.jpg using precise SVGs */}
                    <div className="flex items-center gap-6 mt-12 text-gray-400">
                        {/* Facebook */}
                        <a
                            href="#"
                            className="hover:text-white transition-colors"
                            aria-label="Facebook"
                        >
                            <svg
                                className="w-5 h-5 fill-current"
                                viewBox="0 0 24 24"
                            >
                                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                            </svg>
                        </a>
                        {/* X / Twitter */}
                        <a
                            href="#"
                            className="hover:text-white transition-colors"
                            aria-label="X (formerly Twitter)"
                        >
                            <svg
                                className="w-4 h-4 fill-current"
                                viewBox="0 0 24 24"
                            >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                        {/* LinkedIn */}
                        <a
                            href="#"
                            className="hover:text-white transition-colors"
                            aria-label="LinkedIn"
                        >
                            <svg
                                className="w-4 h-4 fill-current"
                                viewBox="0 0 24 24"
                            >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* --- BASE FOOTER ROW --- */}
                <Flex
                    direction="col-reverse"
                    justify="between"
                    align="center"
                    className="gap-4 py-4 text-sm font-light sm:py-5 md:py-6 border-t sm:flex-row lg:py-8 text-[#E5E7EB]/80 border-gray-800 lg:text-base"
                >
                    <Text className="py-0.5">
                        &copy; {new Date().getFullYear()}{' '}
                        <Link
                            href="https://redq.io"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#E5E7EB]"
                        >
                            The Spy Agency
                        </Link>
                        . All rights reserved.
                    </Text>

                    <Flex
                        justify="between"
                        align="start"
                        className="sm:w-[unset] w-full [@media(min-width:375px)]:gap-6 [@media(min-width:375px)]:justify-center"
                    >
                        {menuItems.map((item) => (
                            <Link
                                key={`key-${item.label}`}
                                href={item.href}
                                {...(item.target
                                    ? { target: item.target, rel: 'noreferrer' }
                                    : {})}
                                className="duration-200 text-[#E5E7EB]/80 hover:text-[#E5E7EB]"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </Flex>
                </Flex>
            </Box>
        </footer>
    )
}
