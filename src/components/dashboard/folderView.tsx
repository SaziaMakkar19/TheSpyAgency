'use client'
import React, { useState } from 'react'

export interface DocumentFile {
    id: string
    name: string
    type: string
    size: string
    url?: string
}

export interface Folder {
    id: string
    title: string
    description?: string
    children?: Folder[]
    files: DocumentFile[]
}

interface FolderViewProps {
    title?: string
    currentFolder: Folder | null
    parentFolderIds: string[]
    onNavigate: (folderId: string | null) => void
    onDeleteFile?: (folderId: string, fileId: string) => void
    onAddFile?: (folderId: string) => void
    onFileClick?: (file: DocumentFile) => void
}

export const FolderView = ({
    title = 'Documents',
    currentFolder,
    parentFolderIds = [],
    onNavigate,
    onDeleteFile,
    onAddFile,
    onFileClick,
}: FolderViewProps) => {
    const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null)

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

    const subfolders = currentFolder.children || []
    const files = currentFolder.files || []
    const hasParent = parentFolderIds.length > 0

    const handleFilePress = (file: DocumentFile) => {
        if (onFileClick) {
            onFileClick(file)
        } else if (file.url) {
            setSelectedFile(file)
        }
    }

    const isImage = (filename: string) => {
        return /\.(jpeg|jpg|gif|png|webp)$/i.test(filename)
    }

    // --- NAVIGATION LOGIC FOR POPUP ---
    const currentIndex = selectedFile
        ? files.findIndex((f) => f.id === selectedFile.id)
        : -1
    const hasNext = currentIndex >= 0 && currentIndex < files.length - 1
    const hasPrev = currentIndex > 0

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (hasNext) setSelectedFile(files[currentIndex + 1])
    }

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (hasPrev) setSelectedFile(files[currentIndex - 1])
    }

    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-300 relative">
            {/* Back Button */}
            {hasParent && (
                <button
                    onClick={() => {
                        const previousFolderId =
                            parentFolderIds[parentFolderIds.length - 1] || null
                        onNavigate(previousFolderId)
                    }}
                    className="mb-6 text-emerald-600 font-bold hover:underline flex items-center transition-colors"
                >
                    <span className="mr-1">←</span> Back
                </button>
            )}

            {/* Folder Header */}
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
                {onAddFile && (
                    <button
                        onClick={() => onAddFile(currentFolder.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        + Add File
                    </button>
                )}
            </div>

            {/* Folders Grid */}
            {subfolders.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Folders
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {subfolders.map((folder) => {
                            const totalItems =
                                (folder.children?.length || 0) +
                                (folder.files?.length || 0)
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => onNavigate(folder.id)}
                                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 text-left group"
                                >
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

            {/* Files Grid */}
            <div>
                {files.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {files.map((file) => {
                                const hasImagePreview =
                                    file.url && isImage(file.name)

                                return (
                                    <div
                                        key={file.id}
                                        onClick={() => handleFilePress(file)}
                                        className="group relative h-56 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col"
                                    >
                                        {/* Background Visual (Thumbnail or Icon) */}
                                        {hasImagePreview ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110"
                                                style={{
                                                    backgroundImage: `url(${file.url})`,
                                                }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-white to-slate-100">
                                                <svg
                                                    className="w-16 h-16 text-slate-200 group-hover:text-emerald-400 transition-colors duration-300"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                        )}

                                        {/* File Actions (Delete Button) */}
                                        {onDeleteFile && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDeleteFile(
                                                        currentFolder.id,
                                                        file.id,
                                                    )
                                                }}
                                                className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm text-slate-400 hover:text-white hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 shadow-sm transition-all duration-200"
                                                title="Delete file"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2.5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        )}

                                        {/* Meta Information Footer */}
                                        <div
                                            className={`absolute bottom-0 left-0 right-0 z-10 flex flex-col justify-end p-4 ${
                                                hasImagePreview
                                                    ? 'h-32 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent text-white'
                                                    : 'bg-white/95 backdrop-blur-md border-t border-slate-100 text-slate-800'
                                            }`}
                                        >
                                            <p className="text-sm font-bold truncate tracking-tight">
                                                {file.name}
                                            </p>
                                            <p
                                                className={`text-xs mt-1 font-medium ${hasImagePreview ? 'text-slate-300' : 'text-emerald-600'}`}
                                            >
                                                {file.size}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    subfolders.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-300 rounded-3xl">
                            <div className="p-4 bg-slate-50 rounded-full mb-4">
                                <svg
                                    className="w-8 h-8 text-slate-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                            </div>
                            <p className="text-slate-500 font-medium">
                                This folder is empty.
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                Upload assets to get started.
                            </p>
                        </div>
                    )
                )}
            </div>

            {/* --- NEW: CENTERED POPUP MODAL --- */}
            {selectedFile && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-8 transition-opacity"
                    onClick={() => setSelectedFile(null)}
                >
                    <div
                        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 shrink-0">
                            <div className="overflow-hidden pr-4">
                                <h3
                                    className="text-lg font-bold text-slate-900 truncate"
                                    title={selectedFile.name}
                                >
                                    {selectedFile.name}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    {currentIndex + 1} of {files.length} •{' '}
                                    {selectedFile.size}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                                <a
                                    href={selectedFile.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-sm font-semibold hidden sm:flex items-center"
                                >
                                    <svg
                                        className="w-4 h-4 mr-1.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                    Open in new tab
                                </a>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content Area (Image or PDF) */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 relative p-4 flex items-center justify-center min-h-[400px]">
                            {/* Navigation: Previous Button */}
                            {hasPrev && (
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg text-slate-600 hover:text-emerald-600 hover:scale-110 transition-all z-10"
                                >
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
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>
                            )}

                            {/* Main File Preview */}
                            {selectedFile.url ? (
                                isImage(selectedFile.name) ? (
                                    <img
                                        src={selectedFile.url}
                                        alt={selectedFile.name}
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                    />
                                ) : (
                                    <iframe
                                        src={selectedFile.url}
                                        className="w-full h-[70vh] border-0 rounded-lg bg-white shadow-sm"
                                        title={selectedFile.name}
                                    />
                                )
                            ) : (
                                <div className="text-slate-400">
                                    No preview available.
                                </div>
                            )}

                            {/* Navigation: Next Button */}
                            {hasNext && (
                                <button
                                    onClick={handleNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg text-slate-600 hover:text-emerald-600 hover:scale-110 transition-all z-10"
                                >
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
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
