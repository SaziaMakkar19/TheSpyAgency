// 'use client'
// import React, { useState } from 'react'
// import { FolderView } from './folderView'

// const LISTINGS_DATA = [
//     {
//         id: 'folder-1',
//         title: 'Active Listings',
//         description: 'Currently on the market',
//         files: [
//             {
//                 id: 'f1',
//                 name: '123_Main_St_Floorplans.pdf',
//                 type: 'Document',
//                 size: '5 MB',
//             },
//         ],
//     },
//     {
//         id: 'folder-2',
//         title: 'Archive',
//         description: 'Past listings and sold properties',
//         files: [
//             {
//                 id: 'f2',
//                 name: '2025_Sales_Data.xlsx',
//                 type: 'Spreadsheet',
//                 size: '1.5 MB',
//             },
//         ],
//     },
// ]

// export const Listings = () => {
//     // 1. We keep all folders in state so we can add/delete files within them
//     const [folders, setFolders] = useState(LISTINGS_DATA)
//     // 2. Track which folder the user is currently viewing
//     const [activeFolderId, setActiveFolderId] = useState<string | null>(null)

//     // Find the folder object currently being viewed
//     const activeFolder = folders.find((f) => f.id === activeFolderId) || null

//     const handleDeleteFile = (folderId: string, fileId: string) => {
//         setFolders((prev) =>
//             prev.map((folder) =>
//                 folder.id === folderId
//                     ? {
//                           ...folder,
//                           files: folder.files.filter((f) => f.id !== fileId),
//                       }
//                     : folder,
//             ),
//         )
//     }

//     const handleAddFile = (folderId: string) => {
//         const newFile = {
//             id: Date.now().toString(),
//             name: 'New_File.pdf',
//             type: 'Document',
//             size: '0 KB',
//         }
//         setFolders((prev) =>
//             prev.map((folder) =>
//                 folder.id === folderId
//                     ? { ...folder, files: [...folder.files, newFile] }
//                     : folder,
//             ),
//         )
//     }

//     return (
//         <FolderView
//             title="Listings"
//             currentFolder={activeFolder}
//             allFolders={folders}
//             onNavigate={setActiveFolderId}
//             onDeleteFile={handleDeleteFile}
//             onAddFile={handleAddFile}
//         />
//     )
// }

'use client'
import React, { useState } from 'react'
import { FolderView, Folder, DocumentFile } from './folderView'

// --- 1. Restructured Intel Payload (Tree Format) ---
// We now wrap your data inside a "Root" master folder.
// Notice we added a 'children' array to demonstrate deep nesting capabilities.
const INITIAL_ROOT_NODE: Folder = {
    id: 'root',
    title: 'Campaigns Directory',
    description: 'Master index of all campaigns.',
    files: [],
    children: [
        {
            id: 'folder-1',
            title: 'Campaign 1',
            description: 'A sample campaign',
            files: [
                {
                    id: 'f1',
                    name: 'sample.pdf',
                    type: 'Document',
                    size: '5 MB',
                },
            ],
            children: [],
        },
        {
            id: 'folder-2',
            title: 'Campaign 2',
            description: 'Another campaign',
            files: [
                {
                    id: 'f2',
                    name: '2025_Sales_Data.xlsx',
                    type: 'Spreadsheet',
                    size: '1.5 MB',
                },
            ],
            children: [],
        },
    ],
}

export const Campaigns = () => {
    // --- 2. State Management ---
    // We hold the entire nested object graph in state
    const [rootNode, setRootNode] = useState<Folder>(INITIAL_ROOT_NODE)

    // We track the operative's drill-down path to generate breadcrumbs
    const [currentPath, setCurrentPath] = useState<string[]>(['root'])

    // --- 3. Tactical Helper Functions ---

    // Recursively hunt through the tree to find the currently active folder
    const findFolder = (node: Folder, targetId: string): Folder | null => {
        if (node.id === targetId) return node
        if (node.children) {
            for (const child of node.children) {
                const found = findFolder(child, targetId)
                if (found) return found
            }
        }
        return null
    }

    // Recursively rebuild the tree when adding/deleting a file deep within it
    const updateTree = (
        node: Folder,
        targetFolderId: string,
        updater: (f: Folder) => Folder,
    ): Folder => {
        if (node.id === targetFolderId) {
            return updater(node)
        }
        if (node.children) {
            return {
                ...node,
                children: node.children.map((child) =>
                    updateTree(child, targetFolderId, updater),
                ),
            }
        }
        return node
    }

    // --- 4. Core Handlers ---

    // The current ID is always the last ID in our tracked path
    const activeFolderId = currentPath[currentPath.length - 1]
    const activeFolder = findFolder(rootNode, activeFolderId)
    // Breadcrumbs are everything in the path EXCEPT the current folder
    const parentFolderIds = currentPath.slice(0, -1)

    const handleNavigate = (targetId: string | null) => {
        if (!targetId) return

        const targetIndex = currentPath.indexOf(targetId)
        if (targetIndex !== -1) {
            // BACKWARD NAVIGATION: Target exists in history, slice the array to travel back
            setCurrentPath(currentPath.slice(0, targetIndex + 1))
        } else {
            // FORWARD NAVIGATION: Pushing a new directory to the stack
            setCurrentPath([...currentPath, targetId])
        }
    }

    const handleDeleteFile = (folderId: string, fileId: string) => {
        setRootNode((prevRoot) =>
            updateTree(prevRoot, folderId, (folder) => ({
                ...folder,
                files: folder.files.filter((f) => f.id !== fileId),
            })),
        )
    }

    const handleAddFile = (folderId: string) => {
        const newFile: DocumentFile = {
            id: `file_${Date.now()}`,
            name: 'Classified_Addendum.pdf',
            type: 'Document',
            size: '120 KB',
        }

        setRootNode((prevRoot) =>
            updateTree(prevRoot, folderId, (folder) => ({
                ...folder,
                files: [...folder.files, newFile],
            })),
        )
    }

    return (
        <FolderView
            title="Intelligence Listings"
            currentFolder={activeFolder}
            parentFolderIds={parentFolderIds}
            onNavigate={handleNavigate}
            onDeleteFile={handleDeleteFile}
            onAddFile={handleAddFile}
        />
    )
}
