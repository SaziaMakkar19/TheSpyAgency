// app/actions/designDocs.ts
'use server'

import { realtorDb } from '@/lib/utils/supabase-server'

export async function generateDesignManifest(realtorData: any) {
    try {
        console.log('realtorData', realtorData)
        const memberMlsId = realtorData.MemberMlsId
        const memberFullName = realtorData.MemberFullName || 'Unknown Agent'
        const officeName = realtorData.OfficeName || 'Unknown Office'

        const bucketName = 'profile_docs'
        const folderPath = `${memberMlsId}`

        // 1. List all files in the user's folder
        const { data: files, error: listError } = await realtorDb.storage
            .from(bucketName)
            .list(folderPath)

        if (listError) throw listError
        if (!files || files.length === 0)
            return { success: true, message: 'No files found' }

        // 2. Build the Markdown content
        let mdContent = `# Brand Assets & Context: ${memberFullName}\n\n`
        mdContent += `* **MLS ID:** ${memberMlsId}\n`
        mdContent += `* **Brokerage/Office:** ${officeName}\n\n`

        // ---------------------------------------------------------
        // NEW: Strict AI System Prompting / Compliance Section
        // ---------------------------------------------------------
        mdContent += `## Compliance Rule\n`
        mdContent += `Any AI agent or system generating social posts, email campaigns, or feature sheets using this profile **MUST** append the following required disclosure to the bottom of the generated content exactly as written:\n\n`
        mdContent += `> Listing by: ${officeName} - Agent: ${memberFullName}\n\n`
        mdContent += `---\n\n`

        mdContent += `## Files\n\n`
        mdContent += `This document contains references to verified agent assets.\n\n`

        files.forEach((file) => {
            // Ignore if a design.md already exists so we don't link it to itself
            if (
                file.name === 'design.md' ||
                file.name === '.emptyFolderPlaceholder'
            )
                return

            const { data: publicUrlData } = realtorDb.storage
                .from(bucketName)
                .getPublicUrl(`${folderPath}/${file.name}`)

            // Format differently if it's an image vs a regular doc
            const isImage = file.name.match(/\.(jpeg|jpg|gif|png)$/i) != null
            if (isImage) {
                mdContent += `* **${file.name}**: ![](${publicUrlData.publicUrl})\n`
            } else {
                mdContent += `* **${file.name}**: [Download Link](${publicUrlData.publicUrl})\n`
            }
        })

        // 3. Convert string to Buffer and Upload (Upsert overwrites if it exists)
        const fileBuffer = Buffer.from(mdContent, 'utf-8')

        const { error: uploadError } = await realtorDb.storage
            .from(bucketName)
            .upload(`${folderPath}/design.md`, fileBuffer, {
                contentType: 'text/markdown',
                upsert: true,
            })

        if (uploadError) throw uploadError

        return { success: true }
    } catch (error) {
        console.error('Failed to generate design.md:', error)
        return { success: false, error: 'Failed to generate design manifest' }
    }
}
