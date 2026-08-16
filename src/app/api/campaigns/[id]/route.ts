import { NextResponse } from 'next/server'
import { realtorDb } from '@/lib/utils/supabase-server'
import { validateRequest } from '@/lib/utils/auth'
import { formatBytes } from '@/lib/utils/helper'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: campaignId } = await params

        console.log('campaignId', campaignId)

        // 1. Find the realtor
        const { data: realtorData, error: realtorError } = await realtorDb
            .from('realtors')
            .select('MemberMlsId')
            .eq('MemberEmail', 'zen@zenwilson.com')
            .single()

        if (realtorError || !realtorData?.MemberMlsId) {
            return NextResponse.json(
                { error: 'Realtor profile or MLS ID not found' },
                { status: 404 },
            )
        }

        const memberMlsId = realtorData.MemberMlsId
        const folderPath = `${campaignId}/${memberMlsId}`

        // 2. List files from Supabase Storage bucket 'campaigns'
        const { data: files, error: listError } = await realtorDb.storage
            .from('campaigns')
            .list(folderPath)

        if (listError) {
            console.error('Failed to list campaign files:', listError)
            return NextResponse.json(
                { error: 'Failed to retrieve files' },
                { status: 500 },
            )
        }

        // 3. Format files and generate public URLs
        const formattedFiles = files
            .filter((file) => file.name !== '.emptyFolderPlaceholder')
            .map((file) => {
                const storagePath = `${folderPath}/${file.name}`
                const { data: publicUrlData } = realtorDb.storage
                    .from('campaigns')
                    .getPublicUrl(storagePath)

                const isImage = file.metadata?.mimetype?.startsWith('image/')

                return {
                    id: `${campaignId}_${memberMlsId}_${file.name}`,
                    name: file.name,
                    type: isImage ? 'Image' : 'Document',
                    size: formatBytes(file.metadata?.size || 0),
                    url: publicUrlData.publicUrl,
                }
            })

        return NextResponse.json({ success: true, files: formattedFiles })
    } catch (error) {
        console.error('Fetch campaign docs error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: campaignId } = await params
        const body = await request.json()
        const { fileName, memberMlsId } = body

        if (!fileName || !memberMlsId) {
            return NextResponse.json(
                { error: 'Missing file name or MLS ID' },
                { status: 400 },
            )
        }

        const filePath = `${campaignId}/${memberMlsId}/${fileName}`

        const { data, error } = await realtorDb.storage
            .from('campaigns')
            .remove([filePath])

        if (error) {
            console.error('Supabase delete error:', error)
            return NextResponse.json(
                { error: 'Failed to delete file from storage' },
                { status: 500 },
            )
        }

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
        console.error('Delete campaign route error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { user } = await validateRequest()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: campaignId } = await params
        const formData = await request.formData()
        const file = formData.get('file')
        const customName = formData.get('customName') as string | null

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 },
            )
        }

        // Find the realtor
        const { data: realtorData, error: realtorError } = await realtorDb
            .from('realtors')
            .select('MemberMlsId, MemberFullName')
            .eq('MemberEmail', 'zen@zenwilson.com')
            .single()

        if (realtorError || !realtorData?.MemberMlsId) {
            return NextResponse.json(
                { error: 'Realtor profile or MLS ID not found' },
                { status: 404 },
            )
        }

        const memberMlsId = realtorData.MemberMlsId

        const targetFileName =
            customName && customName.trim() !== '' ? customName : file.name
        const safeFileName = targetFileName.replace(/[^a-zA-Z0-9._-]/g, '_')

        const storagePath = `${campaignId}/${memberMlsId}/${safeFileName}`
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await realtorDb.storage
            .from('campaigns')
            .upload(storagePath, buffer, {
                contentType: file.type || 'application/octet-stream',
                upsert: true,
            })

        if (uploadError) {
            console.error('Campaign document upload failed:', uploadError)
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 },
            )
        }

        const { data: publicUrlData } = realtorDb.storage
            .from('campaigns')
            .getPublicUrl(storagePath)

        return NextResponse.json({
            success: true,
            file: {
                id: `${campaignId}_${memberMlsId}_${safeFileName}`,
                name: safeFileName,
                type: file.type.startsWith('image/') ? 'Image' : 'Document',
                size: file.size,
                sizeFormatted: formatBytes(file.size),
                url: publicUrlData.publicUrl,
                path: storagePath,
                memberMlsId,
            },
        })
    } catch (error) {
        console.error('Campaign document upload error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}
