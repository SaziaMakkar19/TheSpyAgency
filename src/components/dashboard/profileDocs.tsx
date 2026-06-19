'use client'
import React, { useState } from 'react'
import { FolderView, Folder, DocumentFile } from './folderView'

// --- 1. Restructured Intel Payload ---
// We cast this to your upgraded 'Folder' interface and add an empty 'children' array
const PROFILE_DOCS_FOLDER: Folder = {
    id: 'profile-docs',
    title: 'Profile Docs',
    description: 'Context documents, writing styles, and brand assets.',
    children: [], // Added to satisfy the recursive type requirements
    files: [
        {
            id: 'file1',
            name: 'User_Headshots.zip',
            type: 'Image',
            size: '45 MB',
        },
        {
            id: 'file2',
            name: 'Local_Area_Guide_Langley.pdf',
            type: 'Document',
            size: '12 MB',
        },
    ],
}

export const ProfileDocs = () => {
    // We treat the folder as the 'active' folder immediately
    const [folderData, setFolderData] = useState<Folder>(PROFILE_DOCS_FOLDER)

    const handleDeleteFile = (folderId: string, fileId: string) => {
        setFolderData((prev) => ({
            ...prev,
            files: prev.files.filter((f) => f.id !== fileId),
        }))
    }

    const handleAddFile = (folderId: string) => {
        const newFile: DocumentFile = {
            id: Date.now().toString(),
            name: 'New_File.pdf',
            type: 'Document',
            size: '0 KB',
        }
        setFolderData((prev) => ({ ...prev, files: [...prev.files, newFile] }))
    }

    // --- 2. Dummy Navigation Handler ---
    // Since this is a flat folder with no sub-directories, we intercept navigation requests
    const handleNavigate = (targetId: string | null) => {
        console.warn(
            'Navigation locked: Operative is already at the designated root.',
        )
    }

    return (
        <FolderView
            title="Profile Intelligence"
            currentFolder={folderData}
            parentFolderIds={[]} // Passes an empty breadcrumb trail
            onNavigate={handleNavigate} // Satisfies the required function prop
            onDeleteFile={handleDeleteFile}
            onAddFile={handleAddFile}
        />
    )
}
