'use client'

import React, { useState } from 'react'
import { Folder, DocumentFile } from './folderView'
import { FileManager, FileManagerAPI } from '@/components/layout/fileManager'
import { DeleteConfirmModal } from '@/components/layout/delete'

// --- New Auto-Import Scraper Component ---
const AutoImportCard = ({
    onExtracted,
}: {
    onExtracted: (data: ExtractedProfileData) => void
}) => {
    const [url, setUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url.trim()) return

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/profile-docs/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            })

            const result = await response.json()
            if (!response.ok)
                throw new Error(result.error || 'Extraction failed')

            onExtracted(result.data)
            setUrl('')
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to extract profile data',
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/30 to-white rounded-xl border border-blue-100 p-6 shadow-sm mb-8">
            <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-3">
                    ✨ AI Quick Import
                </span>
                <h3 className="text-base font-bold text-gray-900">
                    Import from your website, Zillow, or Instagram
                </h3>
                <p className="text-xs text-gray-600 mt-1 mb-4">
                    Paste your URL or handle below. Gemini will automatically
                    extract your brand colors, bio, headshot, logo, writing
                    style, and typography preferences.
                </p>

                <form onSubmit={handleImport} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="e.g. https://yourwebsite.com or @agenthandle"
                            disabled={isLoading}
                            className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 shadow-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            'Auto-Extract'
                        )}
                    </button>
                </form>
                {error && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                        {error}
                    </p>
                )}
            </div>
        </div>
    )
}

// --- Extracted Data Preview & Edit Component ---
export interface ExtractedProfileData {
    bio: string
    writingStyle: string
    colors: string[]
    fontStyle: string
    fontFamilyHint: string
}

const ExtractedDataEditor = ({
    data,
    onSave,
    onDiscard,
}: {
    data: ExtractedProfileData
    onSave: (updated: ExtractedProfileData) => Promise<void>
    onDiscard: () => void
}) => {
    const [formData, setFormData] = useState<ExtractedProfileData>(data)
    const [isSaving, setIsSaving] = useState(false)
    const [newColorInput, setNewColorInput] = useState('')

    const handleColorRemove = (indexToRemove: number) => {
        setFormData({
            ...formData,
            colors: formData.colors.filter((_, idx) => idx !== indexToRemove),
        })
    }

    const handleColorAdd = () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(newColorInput)) {
            setFormData({
                ...formData,
                colors: [...formData.colors, newColorInput],
            })
            setNewColorInput('')
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            await onSave(formData)
        } catch (err) {
            alert('Failed to save extracted data.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6 mb-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900">
                        Review & Edit Extracted Brand Profile
                    </h3>
                    <p className="text-xs text-gray-500">
                        Verify the details Gemini pulled from your link and make
                        any necessary tweaks.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onDiscard}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                    >
                        {isSaving ? 'Saving...' : 'Accept & Save Profile'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Writing Style & Bio */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Writing Style Tone
                        </label>
                        <input
                            type="text"
                            value={formData.writingStyle}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    writingStyle: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Extracted Bio
                        </label>
                        <textarea
                            rows={4}
                            value={formData.bio}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    bio: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Colors & Fonts Preview / Editor */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Detected Brand Colors
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.colors.map((color, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg"
                                >
                                    <span
                                        className="w-4 h-4 rounded-full border border-gray-300 shadow-inner"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-xs font-mono text-gray-700">
                                        {color}
                                    </span>
                                    <button
                                        onClick={() => handleColorRemove(idx)}
                                        className="text-gray-400 hover:text-red-600 ml-1 text-xs font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="#HEXCODE"
                                value={newColorInput}
                                onChange={(e) =>
                                    setNewColorInput(e.target.value)
                                }
                                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg w-28 uppercase"
                            />
                            <button
                                type="button"
                                onClick={handleColorAdd}
                                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 font-medium text-gray-700 rounded-lg"
                            >
                                Add Color
                            </button>
                        </div>
                    </div>

                    {/* Font Style & Typography Inputs */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Font Style
                            </label>
                            <input
                                type="text"
                                value={formData.fontStyle}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        fontStyle: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Font Family Hint
                            </label>
                            <input
                                type="text"
                                value={formData.fontFamilyHint}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        fontFamilyHint: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Dedicated Asset Uploader Component (Unchanged)
const DedicatedAssetCard = ({
    title,
    description,
    type,
    currentFile,
    onUpload,
    onDelete,
}: {
    title: string
    description: string
    type: 'logo' | 'headshot'
    currentFile: DocumentFile | null
    onUpload: (file: File, type: 'logo' | 'headshot') => Promise<void>
    onDelete: (type: 'logo' | 'headshot') => Promise<void>
}) => {
    const [isHovered, setIsHovered] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsProcessing(true)
            await onUpload(file, type)
        } catch (error) {
            console.error(`Error uploading ${type}:`, error)
            alert(error instanceof Error ? error.message : 'Upload failed')
        } finally {
            setIsProcessing(false)
            e.target.value = ''
        }
    }

    const handleDeleteConfirm = async () => {
        try {
            setIsProcessing(true)
            await onDelete(type)
            setIsDeleteModalOpen(false)
        } catch (error) {
            console.error(`Error deleting ${type}:`, error)
            alert('Delete failed')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <>
            <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex-1 relative">
                    <h3 className="text-sm font-semibold text-gray-900">
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>

                    <div
                        className={`mt-4 relative h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden
                        ${currentFile ? 'border-transparent bg-gray-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'}
                    `}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {isProcessing && (
                            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-20 backdrop-blur-[1px]">
                                <svg
                                    className="animate-spin h-6 w-6 text-blue-600 mb-2"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                <span className="text-xs font-medium text-gray-700">
                                    Processing...
                                </span>
                            </div>
                        )}

                        {currentFile ? (
                            <>
                                <img
                                    src={currentFile.url}
                                    alt={title}
                                    className="h-full w-full object-contain p-2"
                                />
                                {isHovered && !isProcessing && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
                                        <span className="text-white text-xs font-medium bg-gray-900/80 px-3 py-1.5 rounded-full">
                                            Click to replace
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <svg
                                    className="mx-auto h-8 w-8 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="mt-2 block text-xs font-medium text-gray-700">
                                    Upload {title}
                                </span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            disabled={isProcessing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>

                {currentFile && (
                    <div className="bg-green-50 px-5 py-2.5 flex items-center justify-between border-t border-green-100">
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-xs font-medium text-green-700 truncate max-w-[150px]">
                                {currentFile.name}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsDeleteModalOpen(true)
                            }}
                            disabled={isProcessing}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors z-20"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                file={currentFile}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                isDeleting={isProcessing}
            />
        </>
    )
}

const PROFILE_DOCS_FOLDER: Folder = {
    id: 'profile-docs',
    title: 'Additional Documents',
    description:
        'Upload feature sheets, context documents, or other brand assets.',
    children: [],
    files: [],
}

export const ProfileDocs = () => {
    const [headshotFile, setHeadshotFile] = useState<DocumentFile | null>(null)
    const [logoFile, setLogoFile] = useState<DocumentFile | null>(null)
    const [extractedData, setExtractedData] =
        useState<ExtractedProfileData | null>(null)

    const api: FileManagerAPI = {
        fetchFiles: async () => {
            const response = await fetch(`/api/profile-docs/`, {
                method: 'GET',
            })
            if (!response.ok) throw new Error('Failed to fetch files')

            const data = await response.json()
            const allFiles = (data.files as DocumentFile[]) || []

            const genericFiles: DocumentFile[] = []
            let currentHeadshot = null
            let currentLogo = null

            allFiles.forEach((file) => {
                const lowerName = file.name.toLowerCase()
                if (lowerName.startsWith('headshot')) {
                    currentHeadshot = file
                } else if (lowerName.startsWith('logo')) {
                    currentLogo = file
                } else {
                    genericFiles.push(file)
                }
            })

            setHeadshotFile(currentHeadshot)
            setLogoFile(currentLogo)
            return genericFiles
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

            return file.id
        },
    }

    const handleDedicatedUpload = async (
        file: File,
        type: 'headshot' | 'logo',
    ) => {
        const ext = file.name.includes('.')
            ? file.name.substring(file.name.lastIndexOf('.'))
            : ''
        const customName = `${type}${ext}`
        const uploadedFile = await api.uploadFile(file, customName)

        if (type === 'headshot') setHeadshotFile(uploadedFile)
        if (type === 'logo') setLogoFile(uploadedFile)
    }

    const handleDedicatedDelete = async (type: 'headshot' | 'logo') => {
        const fileToDelete = type === 'headshot' ? headshotFile : logoFile
        if (!fileToDelete) return

        await api.deleteFile(fileToDelete)
        if (type === 'headshot') setHeadshotFile(null)
        if (type === 'logo') setLogoFile(null)
    }

    const handleSaveExtractedProfile = async (
        updatedData: ExtractedProfileData,
    ) => {
        const response = await fetch('/api/profile-docs/save-scraped', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        })

        const result = await response.json()
        if (!response.ok)
            throw new Error(
                result.error || 'Failed to save profile configuration',
            )

        setExtractedData(null)
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-6">
            {/* AI Auto-Import Bar */}
            <AutoImportCard onExtracted={(data) => setExtractedData(data)} />

            {/* Extracted Data Review/Edit Panel */}
            {extractedData && (
                <ExtractedDataEditor
                    data={extractedData}
                    onSave={handleSaveExtractedProfile}
                    onDiscard={() => setExtractedData(null)}
                />
            )}

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Brand Assets
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Please upload your professional headshot and brokerage logo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DedicatedAssetCard
                        title="Professional Headshot"
                        description="High-resolution portrait photo (JPG or PNG)."
                        type="headshot"
                        currentFile={headshotFile}
                        onUpload={handleDedicatedUpload}
                        onDelete={handleDedicatedDelete}
                    />
                    <DedicatedAssetCard
                        title="Brokerage Logo"
                        description="Transparent background preferred (PNG)."
                        type="logo"
                        currentFile={logoFile}
                        onUpload={handleDedicatedUpload}
                        onDelete={handleDedicatedDelete}
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 pt-8">
                <FileManager
                    title="Additional Documents"
                    folderConfig={PROFILE_DOCS_FOLDER}
                    queryKey={['profileDocs']}
                    api={api}
                />
            </div>
        </div>
    )
}
