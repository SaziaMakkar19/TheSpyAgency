import { NextResponse } from 'next/server'
import { realtorDb } from '@/lib/utils/supabase-server'
import { validateRequest } from '@/lib/utils/auth'
import { formatBytes } from '@/lib/utils/helper'

export async function GET(request: Request) {
    try {
        const { user } = await validateRequest()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Find the realtor
        const { data: realtorData, error: realtorError } = await realtorDb
            .from('realtors')
            .select('MemberMlsId')
            .eq('MemberEmail', 'zen@zenwilson.com') // Ensure this matches your auth logic
            .single()

        if (realtorError || !realtorData?.MemberMlsId) {
            return NextResponse.json(
                { error: 'Realtor profile or MLS ID not found' },
                { status: 404 },
            )
        }

        const memberMlsId = realtorData.MemberMlsId

        console.log('memberMlsId', memberMlsId)

        // 3. List files from Supabase Storage for this specific user's folder
        const { data: files, error: listError } = await realtorDb.storage
            .from('profile_docs')
            .list(`${memberMlsId}`)

        if (listError) {
            console.error('Failed to list files:', listError)
            return NextResponse.json(
                { error: 'Failed to retrieve files' },
                { status: 500 },
            )
        }

        console.log('files', files)

        // 4. Format files and generate public URLs
        const formattedFiles = files
            .filter((file) => file.name !== '.emptyFolderPlaceholder') // Ignore supabase system files
            .map((file) => {
                const storagePath = `${memberMlsId}/${file.name}`
                const { data: publicUrlData } = realtorDb.storage
                    .from('profile_docs')
                    .getPublicUrl(storagePath)

                // Determine type based on mimetype
                const isImage = file.metadata?.mimetype?.startsWith('image/')

                return {
                    id: `${memberMlsId}_${file.name}`,
                    name: file.name,
                    type: isImage ? 'Image' : 'Document',
                    size: formatBytes(file.metadata?.size || 0),
                    url: publicUrlData.publicUrl,
                }
            })

        return NextResponse.json({ success: true, files: formattedFiles })
    } catch (error) {
        console.error('Fetch profile docs error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export async function DELETE(request: Request) {
    try {
        // 1. Authenticate user
        const { user } = await validateRequest()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse the request body
        const body = await request.json()
        const { fileName, memberMlsId } = body

        if (!fileName || !memberMlsId) {
            return NextResponse.json(
                { error: 'Missing file name or MLS ID' },
                { status: 400 },
            )
        }

        // 4. Construct the path to delete
        // Based on your screenshot, the path is folderName/fileName
        const filePath = `${memberMlsId}/${fileName}`

        // 5. Delete the file from Supabase
        const { data, error } = await realtorDb.storage
            .from('profile_docs')
            .remove([filePath])

        if (error) {
            console.error('Supabase delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete file from storage' },
                { status: 500 },
            )
        }

        // Supabase returns an array of successfully deleted files.
        // If the array is empty, it means the file wasn't found (or another silent error).
        if (data && data.length === 0) {
            return NextResponse.json(
                { error: 'File not found or could not be deleted' },
                { status: 404 },
            )
        }

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
        })
    } catch (error) {
        console.error('Delete route error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export async function POST(request: Request) {
    try {
        // 1. Authenticate user
        const { user } = await validateRequest()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Get uploaded file and the custom name from the FormData
        const formData = await request.formData()
        const file = formData.get('file')
        const customName = formData.get('customName') as string | null

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 },
            )
        }

        // 3. Find the realtor
        const { data: realtorData, error: realtorError } = await realtorDb
            .from('realtors')
            .select('MemberMlsId, MemberFullName')
            .eq('MemberEmail', 'zen@zenwilson.com')
            .single()

        if (realtorError || !realtorData) {
            console.error('Failed to find realtor:', realtorError)
            return NextResponse.json(
                { error: 'Realtor profile not found' },
                { status: 404 },
            )
        }

        const memberMlsId = realtorData.MemberMlsId

        if (!memberMlsId) {
            return NextResponse.json(
                { error: 'Realtor MLS ID not found' },
                { status: 400 },
            )
        }

        // 4. Use the customName provided by the UI, fallback to file.name just in case
        const targetFileName =
            customName && customName.trim() !== '' ? customName : file.name
        const safeFileName = targetFileName.replace(/[^a-zA-Z0-9._-]/g, '_')

        // 5. Store inside profile_docs
        const storagePath = `${memberMlsId}/${safeFileName}`

        // 6. Convert File -> Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 7. Upload to Supabase Storage
        const { error: uploadError } = await realtorDb.storage
            .from('profile_docs')
            .upload(storagePath, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: true, // This allows overwriting duplicates
            })

        if (uploadError) {
            console.error('Profile document upload failed:', uploadError)
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 },
            )
        }

        // 8. Get URL
        const { data: publicUrlData } = realtorDb.storage
            .from('profile_docs')
            .getPublicUrl(storagePath)

        return NextResponse.json({
            success: true,
            file: {
                id: `${memberMlsId}_${safeFileName}`,
                name: safeFileName, // Return the safe, newly named file name back to the UI
                type: file.type.startsWith('image/') ? 'Image' : 'Document',
                size: file.size,
                sizeFormatted: formatBytes(file.size),
                url: publicUrlData.publicUrl,
                path: storagePath,
                memberMlsId,
            },
        })
    } catch (error) {
        console.error('Profile document upload error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}
