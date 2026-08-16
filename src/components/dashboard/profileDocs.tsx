'use client'

import { Folder, DocumentFile } from './folderView'
import { FileManager, FileManagerAPI } from '@/components/layout/fileManager'

const PROFILE_DOCS_FOLDER: Folder = {
    id: 'profile-docs',
    title: 'Profile Docs',
    description: 'Context documents, writing styles, and brand assets.',
    children: [],
    files: [],
}

export const ProfileDocs = () => {
    const api: FileManagerAPI = {
        fetchFiles: async () => {
            const response = await fetch(`/api/profile-docs/`, {
                method: 'GET',
            })
            if (!response.ok) throw new Error('Failed to fetch files')
            const data = await response.json()
            return (data.files as DocumentFile[]) || []
        },

        uploadFile: async (file: File, customName: string) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('customName', customName)

            const response = await fetch('/api/profile-docs', {
                method: 'POST',
                body: formData,
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Upload failed')

            return {
                id: result.file.id,
                name: result.file.name,
                type: result.file.type,
                size: result.file.sizeFormatted,
                url: result.file.url,
            } as DocumentFile
        },

        deleteFile: async (file: DocumentFile) => {
            const separatorIndex = file.id.indexOf('_')
            if (separatorIndex === -1)
                throw new Error('Invalid file ID format.')

            const memberMlsId = file.id.substring(0, separatorIndex)
            const fileName = file.id.substring(separatorIndex + 1)

            const response = await fetch('/api/profile-docs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, memberMlsId }),
            })

            const result = await response.json()
            if (!response.ok)
                throw new Error(result.error || 'Failed to delete file')

            return file.id // Return ID to remove it from cache
        },
    }

    return (
        <FileManager
            title="Campaign Documents"
            folderConfig={PROFILE_DOCS_FOLDER}
            queryKey={['profileDocs']} // Unique cache key
            api={api}
        />
    )
}
