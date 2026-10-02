import { DocumentFile } from '@/components/dashboard/folderView'

interface DeleteConfirmModalProps {
    isOpen: boolean
    file: DocumentFile | null
    onClose: () => void
    onConfirm: () => void
    isDeleting: boolean
}
export const DeleteConfirmModal = ({
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
