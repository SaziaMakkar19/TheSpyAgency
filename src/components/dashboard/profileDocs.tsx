// import React, { useState } from 'react'
// import { FolderView } from './folderView'

// const PROFILE_DOCS_FOLDER: any = {
//     title: 'Profile Docs',
//     description:
//         'Context documents, writing styles, and brand assets for AI generation.',
//     files: [
//         {
//             id: 'file1',
//             name: 'User_Headshots.zip',
//             type: 'Image',
//             size: '45 MB',
//         },
//         {
//             id: 'file2',
//             name: 'Local_Area_Guide_Langley.pdf',
//             type: 'Document',
//             size: '12 MB',
//         },
//         {
//             id: 'file3',
//             name: 'Past_Listing_Descriptions.docx',
//             type: 'Document',
//             size: '2 MB',
//         },
//         {
//             id: 'file4',
//             name: 'Brokerage_Logos_HighRes.png',
//             type: 'Image',
//             size: '8 MB',
//         },
//     ],
// }

// export const ProfileDocs = () => {
//     const [files, setFiles] = useState(PROFILE_DOCS_FOLDER.files)

//     const handleDelete = (id: string) => {
//         setFiles(files.filter((file: { id: string }) => file.id !== id))
//     }

//     const handleAdd = () => {
//         const newFile = {
//             id: Date.now().toString(),
//             name: 'New_File.pdf',
//             type: 'Document',
//             size: '0 KB',
//         }
//         setFiles([...files, newFile])
//     }

//     return (
//         <FolderView
//             folder={{
//                 title: PROFILE_DOCS_FOLDER.title,
//                 description: PROFILE_DOCS_FOLDER.description,
//             }}
//             files={files}
//             onDelete={handleDelete}
//             onAdd={handleAdd}
//         />
//     )
// }

'use client'
import React, { useState } from 'react'
import { FolderView } from './folderView'

const PROFILE_DOCS_FOLDER = {
    id: 'profile-docs',
    title: 'Profile Docs',
    description: 'Context documents, writing styles, and brand assets.',
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
    const [folderData, setFolderData] = useState(PROFILE_DOCS_FOLDER)

    const handleDeleteFile = (folderId: string, fileId: string) => {
        setFolderData((prev) => ({
            ...prev,
            files: prev.files.filter((f) => f.id !== fileId),
        }))
    }

    const handleAddFile = (folderId: string) => {
        const newFile = {
            id: Date.now().toString(),
            name: 'New_File.pdf',
            type: 'Document',
            size: '0 KB',
        }
        setFolderData((prev) => ({ ...prev, files: [...prev.files, newFile] }))
    }

    return (
        <FolderView
            currentFolder={folderData}
            onDeleteFile={handleDeleteFile}
            onAddFile={handleAddFile}
        />
    )
}
