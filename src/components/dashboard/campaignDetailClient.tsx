'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderView, Folder } from '@/components/dashboard/folderView'

export function CampaignDetailClient({ campaign }: { campaign: Folder }) {
    const router = useRouter()

    // Tracks if the user clicks into nested sub-folders inside this campaign
    const [path, setPath] = useState<string[]>([])

    const handleNavigate = (folderId: string | null) => {
        if (!folderId || folderId === 'dashboard-root') {
            if (path.length === 0) {
                // 1. If at the root of the campaign, go back to the master list
                router.push('/dashboard/campaigns')
            } else {
                // 2. If deep inside a sub-folder, step back up the path
                // (Logic for popping the last folder off the path array goes here later)
                setPath(path.slice(0, -1))
            }
            return
        }

        console.log('Navigating to sub-folder ID:', folderId)
        // 3. Advancing deeper into a sub-folder
        setPath([...path, folderId])
    }

    const handleAction = () => {
        console.warn('Awaiting DB implementation for files')
    }

    return (
        <FolderView
            title="Campaign Workspace"
            currentFolder={campaign}
            // By passing a dummy ID when path is empty, FolderView knows to render the Back button
            parentFolderIds={
                path.length === 0
                    ? ['dashboard-root']
                    : ['dashboard-root', ...path]
            }
            onNavigate={handleNavigate}
            onDeleteFile={handleAction}
            onAddFile={handleAction}
        />
    )
}
