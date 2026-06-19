'use client'
import React from 'react'

// --- Interfaces ---
export interface DocumentFile {
    id: string
    name: string
    type: string
    size: string
}

export interface Folder {
    id: string
    title: string
    description?: string
    children?: Folder[] // Recursively contains other subfolders [cite: 13, 18]
    files: DocumentFile[] // Files in the current directory level [cite: 14]
}

interface FolderViewProps {
    title?: string
    currentFolder: Folder | null
    parentFolderIds: string[] // Tracking array for infinite dynamic navigation paths [cite: 15]
    onNavigate: (folderId: string | null) => void
    onDeleteFile: (folderId: string, fileId: string) => void
    onAddFile: (folderId: string) => void
}

export const FolderView = ({
    title = 'Documents',
    currentFolder,
    parentFolderIds = [],
    onNavigate,
    onDeleteFile,
    onAddFile,
}: FolderViewProps) => {
    // --- VIEW 1: Fallback Root Selection (If no folder is provided) ---
    if (!currentFolder) {
        return (
            <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-8">
                    {title}
                </h2>
                <div className="text-center p-12 border border-dashed border-slate-300 rounded-2xl">
                    <p className="text-slate-500">
                        No folder selected. Please pass a valid root folder.
                    </p>
                </div>
            </div>
        )
    }

    // Safely extract the current node's sub-directories and files [cite: 14]
    const subfolders = currentFolder.children || []
    const files = currentFolder.files || []
    const hasParent = parentFolderIds.length > 0

    // --- VIEW 2: Unified Deep Folder Browser ---
    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-300">
            {/* Dynamic Breadcrumb Tracking Back Button [cite: 15] */}
            {hasParent && (
                <button
                    onClick={() => {
                        // Grab the immediate parent node out of the tracked historical stack [cite: 16]
                        const previousFolderId =
                            parentFolderIds[parentFolderIds.length - 1] || null
                        onNavigate(previousFolderId)
                    }}
                    className="mb-6 text-emerald-600 font-bold hover:underline flex items-center transition-colors"
                >
                    <span className="mr-1">←</span> Back
                </button>
            )}

            {/* Folder Identification & Action Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                        {currentFolder.title}
                    </h2>
                    {currentFolder.description && (
                        <p className="text-slate-500 mt-2 text-sm">
                            {currentFolder.description}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => onAddFile(currentFolder.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    + Add File
                </button>
            </div>

            {/* --- SECTION 1: NESTED SUBFOLDERS --- [cite: 17] */}
            {subfolders.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Folders
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {subfolders.map((folder) => {
                            // Sum elements to accurately evaluate inner density
                            const totalItems =
                                (folder.children?.length || 0) +
                                (folder.files?.length || 0)
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => onNavigate(folder.id)}
                                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 text-left group"
                                >
                                    {/* Folder Icon */}
                                    <div className="mb-3 text-emerald-500">
                                        <svg
                                            className="w-10 h-10"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M19.5 21a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H11.5l-1.5-1.5H4.5A2.25 2.25 0 002.25 6v12.75A2.25 2.25 0 004.5 21h15z"
                                                opacity="0.2"
                                            />
                                            <path
                                                d="M4.5 21h15A2.25 2.25 0 0021.75 18.75V7.5a2.25 2.25 0 00-2.25-2.25H11.5l-1.5-1.5H4.5A2.25 2.25 0 002.25 6v12.75A2.25 2.25 0 004.5 21z"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                        {folder.title}
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {totalItems}{' '}
                                        {totalItems === 1 ? 'item' : 'items'}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* --- SECTION 2: INDIVIDUAL FILES --- [cite: 17] */}
            <div>
                {files.length > 0 ? (
                    <>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                            Files
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="group relative p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all duration-200"
                                >
                                    {/* Action Button: Delete File */}
                                    <button
                                        onClick={() =>
                                            onDeleteFile(
                                                currentFolder.id,
                                                file.id,
                                            )
                                        }
                                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        title="Delete file"
                                    >
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>

                                    {/* File Layout Meta Info */}
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl">
                                            <svg
                                                className="w-6 h-6"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {file.size}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    // Absolute empty state block (triggers if there are no subfolders AND no files)
                    subfolders.length === 0 && (
                        <div className="text-center py-16 bg-slate-50 border border-slate-100 rounded-2xl">
                            <p className="text-slate-400 text-sm">
                                This folder is empty.
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
