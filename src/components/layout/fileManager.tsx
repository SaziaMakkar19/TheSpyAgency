'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
    FolderView,
    Folder,
    DocumentFile,
} from '@/components/dashboard/folderView'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// --- REUSABLE MODALS (Keep your exact same modal code here) ---
// I've omitted the modal bodies for brevity, but you paste your UploadModal
// and DeleteConfirmModal exactly as they were in your original code.
interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (file: File, customName: string) => Promise<void>
    existingFiles: DocumentFile[]
}

const UploadModal = ({
    isOpen,
    onClose,
    onConfirm,
    existingFiles,
}: UploadModalProps) => {
    // ... [Content of UploadModal remains exactly the same as your provided code] ...
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [baseName, setBaseName] = useState('')
    const [extension, setExtension] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null)
            setBaseName('')
            setExtension('')
            setIsUploading(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const processFile = (file: File) => {
        setSelectedFile(file)
        const lastDotIndex = file.name.lastIndexOf('.')
        if (lastDotIndex !== -1) {
            setBaseName(file.name.substring(0, lastDotIndex))
            setExtension(file.name.substring(lastDotIndex))
        } else {
            setBaseName(file.name)
            setExtension('')
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!selectedFile) return
        try {
            setIsUploading(true)
            const finalName = `${baseName.trim()}${extension}`
            await onConfirm(selectedFile, finalName)
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setIsUploading(false)
        }
    }

    const finalFileName = `${baseName.trim()}${extension}`
    const isDuplicate = existingFiles.some((f) => f.name === finalFileName)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Upload Document
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 transition-colors"
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

                <div className="p-6">
                    {!selectedFile ? (
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
                                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                onChange={handleChange}
                            />
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                <svg
                                    className="w-8 h-8 text-blue-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                SVG, PNG, JPG, PDF or DOCX (max. 10MB)
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <svg
                                        className="w-6 h-6 text-gray-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(
                                            selectedFile.size /
                                            1024 /
                                            1024
                                        ).toFixed(2)}{' '}
                                        MB
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    File Name
                                </label>
                                <div className="flex bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden shadow-sm">
                                    <input
                                        type="text"
                                        value={baseName}
                                        onChange={(e) =>
                                            setBaseName(e.target.value)
                                        }
                                        className="flex-1 px-3 py-2 text-sm text-gray-900 outline-none"
                                        placeholder="Document name"
                                    />
                                    {extension && (
                                        <div className="px-3 py-2 bg-gray-50 border-l border-gray-200 text-sm text-gray-500 font-medium select-none">
                                            {extension}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isDuplicate && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <svg
                                        className="w-5 h-5 text-amber-500 shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <p className="text-xs text-amber-800 leading-relaxed">
                                        A file named{' '}
                                        <span className="font-semibold">
                                            {finalFileName}
                                        </span>{' '}
                                        already exists. Uploading will overwrite
                                        the existing file.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            !selectedFile || !baseName.trim() || isUploading
                        }
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </div>
        </div>
    )
}

interface DeleteConfirmModalProps {
    isOpen: boolean
    file: DocumentFile | null
    onClose: () => void
    onConfirm: () => void
    isDeleting: boolean
}
const DeleteConfirmModal = ({
    isOpen,
    file,
    onClose,
    onConfirm,
    isDeleting,
}: DeleteConfirmModalProps) => {
    if (!isOpen || !file) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                        <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
                        Delete File?
                    </h3>
                    <p className="text-sm text-center text-gray-500">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-gray-700">
                            {file.name}
                        </span>
                        ? This action cannot be undone.
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2 bg-gray-50">
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isDeleting ? 'Deleting...' : 'Yes, delete file'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- REUSABLE FILE MANAGER COMPONENT ---

export interface FileManagerAPI {
    fetchFiles: () => Promise<DocumentFile[]>
    uploadFile: (file: File, customName: string) => Promise<DocumentFile>
    deleteFile: (file: DocumentFile) => Promise<string> // Should return the ID of the deleted file
}

interface FileManagerProps {
    title: string
    folderConfig: Omit<Folder, 'files' | 'children'> // ID, title, description
    queryKey: string[]
    api: FileManagerAPI
    onNavigate?: (folderId: string | null) => void
    parentFolderIds?: string[]
}

export const FileManager = ({
    title,
    folderConfig,
    queryKey,
    api,
    onNavigate,
    parentFolderIds = [],
}: FileManagerProps) => {
    const queryClient = useQueryClient()
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

    const [deleteModalState, setDeleteModalState] = useState<{
        isOpen: boolean
        fileToDelete: DocumentFile | null
    }>({
        isOpen: false,
        fileToDelete: null,
    })

    // 1. GENERIC FETCH
    const { data: files = [], isLoading: isLoadingFiles } = useQuery({
        queryKey: queryKey,
        queryFn: api.fetchFiles,
        staleTime: 5 * 60 * 1000,
    })

    const currentFolderData: Folder = {
        ...folderConfig,
        children: [],
        files: files,
    }

    // 2. GENERIC UPLOAD
    const uploadMutation = useMutation({
        mutationFn: async ({
            file,
            customName,
        }: {
            file: File
            customName: string
        }) => {
            return await api.uploadFile(file, customName)
        },
        onSuccess: (newFile) => {
            queryClient.setQueryData(
                queryKey,
                (oldFiles: DocumentFile[] | undefined) => {
                    if (!oldFiles) return [newFile]
                    const filtered = oldFiles.filter(
                        (f) => f.name !== newFile.name,
                    )
                    return [...filtered, newFile]
                },
            )
        },
        onError: (error) => {
            console.error('File upload failed:', error)
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to upload file',
            )
        },
    })

    // 3. GENERIC DELETE
    const deleteMutation = useMutation({
        mutationFn: async (file: DocumentFile) => {
            return await api.deleteFile(file)
        },
        onSuccess: (deletedId) => {
            queryClient.setQueryData(
                queryKey,
                (oldFiles: DocumentFile[] | undefined) => {
                    if (!oldFiles) return []
                    return oldFiles.filter((f) => f.id !== deletedId)
                },
            )
            setDeleteModalState({ isOpen: false, fileToDelete: null })
        },
        onError: (error) => {
            console.error('File deletion failed:', error)
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete file',
            )
        },
    })

    const handleDeleteInitiated = (folderId: string, fileId: string) => {
        const file = files.find((f) => f.id === fileId)
        if (file) {
            setDeleteModalState({ isOpen: true, fileToDelete: file })
        }
    }

    const processUpload = async (file: File, customName: string) => {
        await uploadMutation.mutateAsync({ file, customName })
    }

    return (
        <div className="relative">
            {isLoadingFiles && (
                <div className="absolute top-4 right-4 z-10 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                    Loading files...
                </div>
            )}

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onConfirm={processUpload}
                existingFiles={files}
            />

            <DeleteConfirmModal
                isOpen={deleteModalState.isOpen}
                file={deleteModalState.fileToDelete}
                onClose={() =>
                    setDeleteModalState({ isOpen: false, fileToDelete: null })
                }
                onConfirm={() => {
                    if (deleteModalState.fileToDelete) {
                        deleteMutation.mutateAsync(
                            deleteModalState.fileToDelete,
                        )
                    }
                }}
                isDeleting={deleteMutation.isPending}
            />

            {onNavigate ? (
                <FolderView
                    title={title}
                    currentFolder={currentFolderData}
                    parentFolderIds={parentFolderIds}
                    onNavigate={onNavigate}
                    onDeleteFile={handleDeleteInitiated}
                    onAddFile={() => setIsUploadModalOpen(true)}
                />
            ) : (
                <FolderView
                    title={title}
                    currentFolder={currentFolderData}
                    parentFolderIds={[]}
                    onNavigate={() => console.warn('Navigation locked')}
                    onDeleteFile={handleDeleteInitiated}
                    onAddFile={() => setIsUploadModalOpen(true)}
                />
            )}
        </div>
    )
}
