'use client'

import React, { useState, useEffect } from 'react'
import { globalStyles } from '@/app/styles.global'
import { useRouter } from 'next/navigation'

export interface NavItem {
    label: string
    href: string
}

export interface NavbarProps {
    initialItems?: NavItem[]
}

const defaultNavItems: NavItem[] = [
    { label: 'Home', href: '#' },
    { label: 'Procing', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms & Coditions', href: '#' },
]

export const Navbar: React.FC<NavbarProps> = ({
    initialItems = defaultNavItems,
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const router = useRouter()

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const toggleMenu = (): void => setIsOpen(!isOpen)
    const closeMenu = (): void => setIsOpen(false)

    return (
        <>
            {/* Header Container */}
            <header className="w-full bg-slate-950/75 backdrop-blur-md border-b border-slate-900/80 px-6 py-4 fixed top-0 z-50 select-none transition-all duration-300">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="text-base font-bold tracking-wider text-white uppercase cursor-pointer select-none">
                        The Spy Agency
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        {initialItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="text-xs tracking-wide text-slate-400 hover:text-white transition-colors duration-200 ease-in-out relative py-1 group"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop Login Button */}
                    <button
                        onClick={() => router.push('/login')}
                        className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-md bg-white text-slate-950 text-xs font-bold hover:bg-slate-200 active:scale-95 transition-all duration-150"
                    >
                        <svg
                            className={`w-[18px] h-[18px] ${globalStyles.iconStroke2}`}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                        </svg>
                        Login
                    </button>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={toggleMenu}
                        className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-lg transition-colors"
                        aria-label="Toggle Menu"
                    >
                        <svg
                            className={`w-6 h-6 ${globalStyles.iconStroke2}`}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                            />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Drawer Backdrop Wrapper */}
            <div
                className={`fixed inset-0 z-50 lg:hidden bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
                onClick={closeMenu}
            >
                {/* Inner Content Panel */}
                <div
                    className={`w-[85%] max-w-sm h-full bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-6 overflow-y-auto shadow-2xl transition-transform duration-300 ease-in-out ${
                        isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between pb-6 border-b border-slate-900">
                            <div className="text-base font-bold tracking-wider text-white uppercase cursor-pointer select-none">
                                The Spy Agency
                            </div>
                            <button
                                onClick={closeMenu}
                                className="p-1 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                                aria-label="Close Menu"
                            >
                                <svg
                                    className={`w-6 h-6 ${globalStyles.iconStroke2}`}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Drawer Links */}
                        <nav className="flex flex-col space-y-5 pt-6">
                            {initialItems.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="text-sm tracking-wide text-slate-300 hover:text-emerald-400 transition-colors"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Drawer Login Button */}
                    <div className="pt-6 border-t border-slate-900">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 rounded-lg py-3 text-xs font-bold hover:bg-emerald-400 active:scale-95 transition-all"
                        >
                            <svg
                                className={`w-4 h-4 ${globalStyles.iconStroke2}`}
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                />
                            </svg>
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
