'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Folder } from './folderView'
import { sendCampaignEmails } from '@/app/actions/campaign'

async function fetchListings(): Promise<Folder> {
    const response = await fetch('/api/listings', {
        method: 'GET',
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error('Failed to load listings.')
    }

    return response.json()
}

export const NewCampaignModal = ({ onClose }: { onClose: () => void }) => {
    const [selectedListing, setSelectedListing] = useState('')
    const [emailInput, setEmailInput] = useState('')
    const [emails, setEmails] = useState<string[]>([])
    const [isSending, setIsSending] = useState(false)

    // Pulls from cache instantly without redundant API calls
    const { data: rootNode, isLoading } = useQuery({
        queryKey: ['dashboard', 'listings'],
        queryFn: fetchListings,
        staleTime: 5 * 60 * 1000,
    })

    // Only map top-level children (civic addresses/listings), ignoring deep sub-folders
    const listings = rootNode?.children
        ? rootNode.children.map((child) => ({
              id: child.id,
              name: child.title,
          }))
        : []

    const handleAddEmail = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedEmail = emailInput.trim()
        if (trimmedEmail && !emails.includes(trimmedEmail)) {
            setEmails([...emails, trimmedEmail])
            setEmailInput('')
        }
    }

    const handleRemoveEmail = (emailToRemove: string) => {
        setEmails(emails.filter((email) => email !== emailToRemove))
    }

    const handleSubmit = async () => {
        setIsSending(true)

        console.log('Sending to Server Action:', {
            listingId: selectedListing,
            recipients: emails,
        })

        const result = await sendCampaignEmails(selectedListing, emails)

        if (result.success) {
            onClose()
        } else {
            alert('Failed to send emails. Please try again.')
            setIsSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                            New Campaign
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Share your listing with clients or partners.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <div className="space-y-6">
                    {/* Listing Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Listing
                        </label>
                        <select
                            value={selectedListing}
                            onChange={(e) => setSelectedListing(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all outline-none text-gray-700 appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="" disabled>
                                {isLoading
                                    ? 'Loading listings...'
                                    : 'Choose a property...'}
                            </option>
                            {listings.map((listing) => (
                                <option key={listing.id} value={listing.name}>
                                    {listing.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Email Sharing */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Invite People
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleAddEmail(e)
                                }
                                placeholder="name@example.com"
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all outline-none text-gray-700 placeholder-gray-400"
                            />
                            <button
                                onClick={handleAddEmail}
                                type="button"
                                className="px-5 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        {/* Selected Email "Chips" */}
                        {emails.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {emails.map((email) => (
                                    <span
                                        key={email}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all hover:bg-gray-100"
                                    >
                                        {email}
                                        <button
                                            onClick={() =>
                                                handleRemoveEmail(email)
                                            }
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            type="button"
                                        >
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="flex justify-end gap-3 mt-10">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            !selectedListing || emails.length === 0 || isSending
                        }
                        className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 focus:ring-4 focus:ring-gray-900/10 disabled:opacity-40 disabled:hover:bg-gray-900 transition-all shadow-sm"
                    >
                        {isSending ? 'Sending...' : 'Send Campaign'}
                    </button>
                </div>
            </div>
        </div>
    )
}
