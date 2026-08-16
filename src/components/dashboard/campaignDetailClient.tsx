'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Folder } from '@/components/dashboard/folderView'
import { FileManager, FileManagerAPI } from '@/components/layout/fileManager' // Adjust import based on where you placed FileManager

interface CampaignDetailClientProps {
    campaign: Folder
    campaignId: string
}

export function CampaignDetailClient({
    campaign,
    campaignId,
}: CampaignDetailClientProps) {
    const router = useRouter()
    const [path, setPath] = useState<string[]>([])

    console.log('campaign', campaignId)

    // Define the specific API methods matching the new campaign route
    const campaignApi: FileManagerAPI = {
        fetchFiles: async () => {
            const res = await fetch(`/api/campaigns/${campaignId}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to fetch files')
            return data.files || []
        },
        uploadFile: async (file: File, customName: string) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('customName', customName)

            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')
            return data.file
        },
        deleteFile: async (file) => {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    memberMlsId: file.id.split('_')[1], // Extracts memberMlsId from ID pattern `${campaignId}_${memberMlsId}_${filename}`
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Delete failed')
            return file.id
        },
    }

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

    const folderConfig = {
        id: campaign.id,
        title: campaign.title || 'Campaign Workspace',
        description:
            campaign.description ||
            'Manage marketing documents and files for this campaign.',
    }

    return (
        <div className="space-y-6">
            {/* Reusable File Manager handling TanStack Query, Upload, and Delete UI */}
            <FileManager
                title="Campaign Documents"
                folderConfig={folderConfig}
                queryKey={['campaign-docs', campaignId]}
                api={campaignApi}
                onNavigate={handleNavigate}
                parentFolderIds={
                    path.length === 0
                        ? ['dashboard-root']
                        : ['dashboard-root', ...path]
                }
            />
        </div>
    )
}
