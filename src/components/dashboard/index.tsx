'use client'

import React, { useState } from 'react'
import { Button } from '../layout/button'
import { NewCampaignModal } from './newCampaign'
import { logoutAction } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { signOutAction } from '@/app/actions/auth'

type TabState =
    | 'profileDocs'
    | 'listings'
    | 'campaigns'
    | 'analytics'
    | 'connections'

// --- Inline SVG Icons (Zero Dependencies) ---
const Icons = {
    Menu: () => (
        <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
            ></path>
        </svg>
    ),
    Close: () => (
        <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
            ></path>
        </svg>
    ),
    Profile: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            ></path>
        </svg>
    ),
    Home: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            ></path>
        </svg>
    ),
    Rocket: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
            ></path>
        </svg>
    ),
    Chart: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
        </svg>
    ),
    Users: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            ></path>
        </svg>
    ),
    Logout: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
            />
        </svg>
    ),
}

// --- Main Dashboard Component ---

export default function Dashboard({
    user,
    children,
}: {
    user: any
    children: React.ReactNode
}) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabState | null>(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [openNewCampaignModal, setOpenNewCampaignModal] = useState(false)

    const handleCreateCampaign = () => {
        setOpenNewCampaignModal(true)
        // Add your logic here (e.g., set a modal open state)
    }

    const handleTabChange = (tab: TabState) => {
        setActiveTab(tab)
        setIsMobileMenuOpen(false) // Auto-close menu on mobile
        router.push(`/dashboard/${tab}`)
        setIsMobileMenuOpen(false)
    }

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)
            setIsMobileMenuOpen(false)
            await signOutAction()
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-30 shadow-md">
                <h1 className="text-lg font-bold tracking-widest text-emerald-500">
                    THE SPY AGENCY
                </h1>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-300 hover:text-white focus:outline-none"
                >
                    {isMobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside
                className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}
            >
                <div className="p-6 border-b border-slate-800 hidden md:block">
                    <h1 className="text-2xl font-black tracking-widest text-emerald-500">
                        SPY AGENCY
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                        Intelligence Hub
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-16 md:mt-0">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 mt-4">
                        Folders
                    </p>

                    <button
                        onClick={() => handleTabChange('profileDocs')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'profileDocs'
                                ? 'bg-emerald-500/20 text-white shadow-md'
                                : 'hover:bg-slate-800 hover:text-slate-100'
                        }`}
                    >
                        <Icons.Profile />
                        <span className="font-medium">Profile Docs</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('listings')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'listings'
                                ? 'bg-emerald-500/20 text-white shadow-md'
                                : 'hover:bg-slate-800 hover:text-slate-100'
                        }`}
                    >
                        <Icons.Home />
                        <span className="font-medium">Listings</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('campaigns')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'campaigns'
                                ? 'bg-emerald-500/20 text-white shadow-md'
                                : 'hover:bg-slate-800 hover:text-slate-100'
                        }`}
                    >
                        <Icons.Rocket />
                        <span className="font-medium">Campaigns</span>
                    </button>

                    <div className="px-4 py-6">
                        <Button
                            onClick={handleCreateCampaign}
                            className="
            !h-12 
            !bg-white/5 
            hover:!bg-white/10 
            border border-slate-700/50 
            hover:border-emerald-500/20 
            !text-slate-300 
            transition-all duration-300
            shadow-none hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]
        "
                        >
                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </span>
                            <span className="font-medium tracking-wide">
                                New Campaign
                            </span>
                        </Button>
                    </div>

                    <div className="my-6 border-t border-slate-800"></div>

                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                        System
                    </p>

                    <button
                        onClick={() => handleTabChange('analytics')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'analytics'
                                ? 'bg-emerald-500/20 text-white shadow-md'
                                : 'hover:bg-slate-800 hover:text-slate-100'
                        }`}
                    >
                        <Icons.Chart />
                        <span className="font-medium">Analytics</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('connections')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'connections'
                                ? 'bg-emerald-500/20 text-white shadow-md'
                                : 'hover:bg-slate-800 hover:text-slate-100'
                        }`}
                    >
                        <Icons.Users />
                        <span className="font-medium">Connections</span>
                    </button>

                    <div className="mt-6 px-4 pb-6">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Icons.Logout />
                            <span className="font-medium">
                                {isLoggingOut ? 'Logging out...' : 'Log off'}
                            </span>
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button
                        onClick={async () => {
                            // Assuming you have a sign-out action or call
                            await logoutAction()
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            {/* Main Content (Swaps based on URL) */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10">
                {children}
            </main>

            {openNewCampaignModal && (
                <NewCampaignModal
                    onClose={() => setOpenNewCampaignModal(false)}
                />
            )}
        </div>
    )
}
