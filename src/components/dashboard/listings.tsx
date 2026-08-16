'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderView, Folder } from './folderView'
import { ListingsLoading } from '@/components/loader/loading'

/*
 * Fetch listings from our secure server API.
 */

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

export const Listings = () => {
    /*
     * React Query handles the cache.
     */

    const {
        data: rootNode,
        isLoading,
        isFetching,
        error,
    } = useQuery({
        queryKey: ['dashboard', 'listings'],

        queryFn: fetchListings,

        /*
         * Don't consider listings stale
         * for 5 minutes.
         */
        staleTime: 5 * 60 * 1000,

        /*
         * Keep them in memory for 30 minutes.
         */
        gcTime: 30 * 60 * 1000,

        /*
         * Switching browser tabs shouldn't
         * automatically hit Supabase.
         */
        refetchOnWindowFocus: false,
    })

    /*
     * Loading
     */

    if (isLoading) {
        return <ListingsLoading />
    }

    /*
     * Error
     */

    if (error || !rootNode) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <h2 className="font-bold text-red-700">
                        Unable to load listings
                    </h2>

                    <p className="mt-2 text-sm text-red-600">
                        Please try again later.
                    </p>
                </div>
            </div>
        )
    }

    return <ListingsContent rootNode={rootNode} isFetching={isFetching} />
}

/*
 * Folder navigation.
 */

function ListingsContent({
    rootNode,
    isFetching,
}: {
    rootNode: Folder
    isFetching: boolean
}) {
    /*
     * Track the user's current folder.
     */

    const [currentPath, setCurrentPath] = useState<string[]>(['root'])

    /*
     * Recursively find a folder.
     */

    const findFolder = (node: Folder, targetId: string): Folder | null => {
        if (node.id === targetId) {
            return node
        }

        if (node.children) {
            for (const child of node.children) {
                const found = findFolder(child, targetId)

                if (found) {
                    return found
                }
            }
        }

        return null
    }

    /*
     * Current folder.
     */

    const activeFolderId = currentPath[currentPath.length - 1]

    const activeFolder = findFolder(rootNode, activeFolderId)

    /*
     * Parent IDs for Back button.
     */

    const parentFolderIds = currentPath.slice(0, -1)

    /*
     * Navigation.
     */

    const handleNavigate = (targetId: string | null) => {
        if (!targetId) {
            return
        }

        const targetIndex = currentPath.indexOf(targetId)

        if (targetIndex !== -1) {
            setCurrentPath(currentPath.slice(0, targetIndex + 1))

            return
        }

        setCurrentPath([...currentPath, targetId])
    }

    return (
        <div className="relative">
            {/*
             * Tiny background refresh indicator
             */}

            {isFetching && (
                <div className="fixed right-6 top-6 z-40 rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-lg border border-slate-200">
                    Updating...
                </div>
            )}

            <FolderView
                title="Intelligence Listings"
                currentFolder={activeFolder}
                parentFolderIds={parentFolderIds}
                onNavigate={handleNavigate}
            />
        </div>
    )
}
