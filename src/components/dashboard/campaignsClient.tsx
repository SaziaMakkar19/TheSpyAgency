// 'use client'

// import React, { useState, useTransition } from 'react'
// import { FolderView, Folder } from './folderView'
// import { acceptCampaignInvitation } from '@/app/actions/campaign'
// import { useRouter } from 'next/navigation' // Add this

// interface CampaignsClientProps {
//     data: {
//         owned: Folder[]
//         participating: Folder[]
//         pending: Folder[]
//     }
//     userId: string
//     userEmail: string
// }

// export function CampaignsClient({
//     data,
//     userId,
//     userEmail,
// }: CampaignsClientProps) {
//     const router = useRouter()
//     // An empty array means we are at the very top (Root Dashboard)
//     const [path, setPath] = useState<string[]>([])

//     // Combine payloads for quick deep-dive searching
//     const allCampaigns = [...data.owned, ...data.participating, ...data.pending]
//     const currentFolderId = path[path.length - 1]

//     // Tactical search to find sub-folders if they dive deeper inside a campaign
//     const findFolder = (nodes: Folder[], targetId: string): Folder | null => {
//         for (const node of nodes) {
//             if (node.id === targetId) return node
//             if (node.children) {
//                 const found = findFolder(node.children, targetId)
//                 if (found) return found
//             }
//         }
//         return null
//     }

//     const handleNavigate = (folderId: string | null) => {
//         if (!folderId) {
//             // Backing out to the root dashboard
//             if (path.length <= 1) {
//                 setPath([])
//             } else {
//                 setPath(path.slice(0, -1))
//             }
//             return
//         }

//         if (path.includes(folderId)) {
//             // Retreating up the tree
//             const index = path.indexOf(folderId)
//             setPath(path.slice(0, index + 1))
//         } else {
//             // Advancing deeper
//             setPath([...path, folderId])
//         }
//     }

//     const handleAwaitingDatabase = () => {
//         console.warn('Awaiting DB integration: Files table does not exist yet.')
//     }

//     // --- VIEW 1: ROOT DASHBOARD (Headings & Campaign Folders) ---
//     if (path.length === 0) {
//         return (
//             <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-300">
//                 <div className="flex justify-between items-start mb-8">
//                     <div>
//                         <h2 className="text-xl font-extrabold text-slate-900">
//                             Campaigns Directory
//                         </h2>
//                         <p className="text-slate-500 mt-2 text-sm">
//                             Master index of all active operations.
//                         </p>
//                     </div>
//                 </div>

//                 {/* HEADING 1: MY CAMPAIGNS */}
//                 <div className="mb-8">
//                     <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
//                         My Campaigns
//                     </h3>
//                     {data.owned.length > 0 ? (
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                             {data.owned.map((folder) => (
//                                 <FolderCard
//                                     key={folder.id}
//                                     folder={folder}
//                                     onClick={() =>
//                                         router.push(
//                                             `/dashboard/campaigns/${folder.id}`,
//                                         )
//                                     }
//                                 />
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl">
//                             No active campaigns owned.
//                         </div>
//                     )}
//                 </div>

//                 {/* HEADING 2: PARTICIPATING */}
//                 <div className="mb-8">
//                     <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
//                         Participating
//                     </h3>
//                     {data.participating.length > 0 ? (
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                             {data.participating.map((folder) => (
//                                 <FolderCard
//                                     key={folder.id}
//                                     folder={folder}
//                                     onClick={() =>
//                                         router.push(
//                                             `/dashboard/campaigns/${folder.id}`,
//                                         )
//                                     }
//                                 />
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl">
//                             No external campaign invitations found.
//                         </div>
//                     )}
//                 </div>

//                 <div className="mb-8">
//                     <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
//                         Pending Invitations
//                     </h3>
//                     {data.pending.length > 0 ? (
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                             {data.pending.map((campaign) => (
//                                 <InvitationCard
//                                     key={campaign.id}
//                                     campaign={campaign}
//                                     userId={userId} // Ensure user.id is passed from server component
//                                     email={userEmail}
//                                 />
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-700 rounded-xl">
//                             No pending invitations found.
//                         </div>
//                     )}
//                 </div>
//             </div>
//         )
//     }

//     // --- VIEW 2: DEEP DATA VAULT (Inside a specific campaign) ---
//     const activeFolder = findFolder(allCampaigns, currentFolderId)

//     // Fallback if folder gets deleted or path corrupts
//     if (!activeFolder) {
//         return (
//             <div className="p-6 text-red-500">Error: Directory not found.</div>
//         )
//     }

//     return (
//         <FolderView
//             title="Campaigns Directory"
//             currentFolder={activeFolder}
//             parentFolderIds={path.slice(0, -1)}
//             onNavigate={handleNavigate}
//             onDeleteFile={handleAwaitingDatabase}
//             onAddFile={handleAwaitingDatabase}
//         />
//     )
// }

// Extract the card UI from your original FolderView so it visually matches perfectly
// function FolderCard({
//     folder,
//     onClick,
// }: {
//     folder: Folder
//     onClick: () => void
// }) {
//     const totalItems =
//         (folder.children?.length || 0) + (folder.files?.length || 0)
//     return (
//         <button
//             onClick={onClick}
//             className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 text-left group"
//         >
//             <div className="mb-3 text-emerald-500">
//                 <svg
//                     className="w-10 h-10"
//                     fill="currentColor"
//                     viewBox="0 0 24 24"
//                 >
//                     <path
//                         d="M19.5 21a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H11.5l-1.5-1.5H4.5A2.25 2.25 0 002.25 6v12.75A2.25 2.25 0 004.5 21h15z"
//                         opacity="0.2"
//                     />
//                     <path
//                         d="M4.5 21h15A2.25 2.25 0 0021.75 18.75V7.5a2.25 2.25 0 00-2.25-2.25H11.5l-1.5-1.5H4.5A2.25 2.25 0 002.25 6v12.75A2.25 2.25 0 004.5 21z"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="1.5"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                     />
//                 </svg>
//             </div>
//             <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1">
//                 {folder.title}
//             </h4>
//             <p className="text-xs text-slate-400 mt-1">
//                 {totalItems} {totalItems === 1 ? 'item' : 'items'}
//             </p>
//         </button>
//     )
// }

// export const InvitationCard = ({
//     campaign,
//     userId,
//     email,
// }: {
//     campaign: any
//     userId: string
//     email: string
// }) => {
//     const [isPending, startTransition] = useTransition()

//     const handleAccept = () => {
//         startTransition(async () => {
//             await acceptCampaignInvitation(campaign.id, userId, email)
//         })
//     }

//     return (
//         <div className="rounded-2xl p-5 flex flex-col justify-between shadow-sm border border-slate-800/50">
//             <div>
//                 <h4 className="font-semibold text-base">{campaign.title}</h4>
//                 <p className="text-slate-400 text-sm mt-1 font-medium">
//                     Pending invitation
//                 </p>
//             </div>

//             <button
//                 onClick={handleAccept}
//                 disabled={isPending}
//                 className="mt-6 w-full bg-black text-white hover:bg-emerald-600 transition-colors text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//                 {isPending ? 'Accepting...' : 'Accept Invitation'}
//             </button>
//         </div>
//     )
// }

'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Folder } from '@/components/dashboard/folderView'
import { acceptCampaignInvitation } from '@/app/actions/campaign'

interface CampaignsClientProps {
    data: {
        owned: Folder[]
        participating: Folder[]
        pending: Folder[]
    }
    userId: string
    userEmail: string
}

export function CampaignsClient({
    data,
    userId,
    userEmail,
}: CampaignsClientProps) {
    const router = useRouter()

    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                        Campaigns Directory
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        Master index of all active operations.
                    </p>
                </div>
            </div>

            {/* HEADING 1: MY CAMPAIGNS */}
            <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    My Campaigns
                </h3>
                {data.owned.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {data.owned.map((folder) => (
                            <FolderCard
                                key={folder.id}
                                folder={folder}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/campaigns/${folder.id}`,
                                    )
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl">
                        No active campaigns owned.
                    </div>
                )}
            </div>

            {/* HEADING 2: PARTICIPATING */}
            <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Participating
                </h3>
                {data.participating.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {data.participating.map((folder) => (
                            <FolderCard
                                key={folder.id}
                                folder={folder}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/campaigns/${folder.id}`,
                                    )
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-200 rounded-xl">
                        No external campaign invitations found.
                    </div>
                )}
            </div>

            {/* HEADING 3: PENDING INVITATIONS */}
            <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Pending Invitations
                </h3>
                {data.pending.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {data.pending.map((campaign) => (
                            <InvitationCard
                                key={campaign.id}
                                campaign={campaign}
                                userId={userId}
                                email={userEmail}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-slate-400 p-4 border border-dashed border-slate-700 rounded-xl">
                        No pending invitations found.
                    </div>
                )}
            </div>
        </div>
    )
}

function FolderCard({
    folder,
    onClick,
}: {
    folder: Folder
    onClick: () => void
}) {
    const totalItems =
        (folder.children?.length || 0) + (folder.files?.length || 0)
    return (
        <button
            onClick={onClick}
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
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </p>
        </button>
    )
}

function InvitationCard({
    campaign,
    userId,
    email,
}: {
    campaign: any
    userId: string
    email: string
}) {
    const [isPending, startTransition] = useTransition()

    const handleAccept = () => {
        startTransition(async () => {
            await acceptCampaignInvitation(campaign.id, userId, email)
        })
    }

    return (
        <div className="rounded-2xl p-5 flex flex-col justify-between shadow-sm border border-slate-800/50 bg-slate-900">
            <div>
                <h4 className="font-semibold text-base text-white">
                    {campaign.title}
                </h4>
                <p className="text-slate-400 text-sm mt-1 font-medium">
                    Pending invitation
                </p>
            </div>
            <button
                onClick={handleAccept}
                disabled={isPending}
                className="mt-6 w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-slate-200 text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? 'Accepting...' : 'Accept Invitation'}
            </button>
        </div>
    )
}
