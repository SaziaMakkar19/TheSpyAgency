import { NextResponse } from 'next/server'
import { realtorDb, listingDb } from '@/lib/utils/supabase-server'
import { validateRequest } from '@/lib/utils/auth'
import {
    generateMLSFeatureSheetBuffer,
    ListingData,
} from '@/lib/utils/generateFeatureSheet'

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const mlsNumber = url.searchParams.get('mls')

        if (!mlsNumber) {
            return NextResponse.json(
                { error: 'MLS number is required' },
                { status: 400 },
            )
        }

        // 1. Authenticate user session using Lucia
        const { user } = await validateRequest()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const pdfFileName = `Feature_Sheet_${mlsNumber}.pdf`
        const bucketPath = `feature_sheets/${pdfFileName}`

        // 2. Check if the file already exists in Supabase Storage
        const { data: existingFiles } = await realtorDb.storage
            .from('feature_sheets')
            .list('feature_sheets', {
                limit: 1,
                search: pdfFileName,
            })

        const fileExists = existingFiles && existingFiles.length > 0

        if (fileExists) {
            // If it exists, grab the public URL and redirect the browser straight to the PDF
            const { data } = realtorDb.storage
                .from('feature_sheets')
                .getPublicUrl(bucketPath)
            return NextResponse.redirect(data.publicUrl)
        }

        // 3. If missing, fetch the listing details on the fly
        const { data: listing, error: listingError } = await listingDb
            .from('all_listings')
            .select('*')
            .eq('mls_number', mlsNumber)
            .single()

        if (listingError || !listing) {
            return NextResponse.json(
                { error: 'Listing not found' },
                { status: 404 },
            )
        }

        const { data: realtorData } = await realtorDb
            .from('realtors')
            .select('MemberFullName')
            .eq('MemberEmail', user.email)
            .single()

        const pdfListingData: ListingData = {
            ...listing,
            member_full_name: realtorData?.MemberFullName || 'Unknown Agent',
        }

        // 4. Generate the PDF buffer in memory and upload to storage
        const pdfBuffer = await generateMLSFeatureSheetBuffer(pdfListingData)

        const { error: uploadError } = await realtorDb.storage
            .from('feature_sheets')
            .upload(bucketPath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true,
            })

        if (uploadError) {
            throw uploadError
        }

        // 5. Get the live public URL and redirect the user
        const { data: publicUrlData } = realtorDb.storage
            .from('feature_sheets')
            .getPublicUrl(bucketPath)

        return NextResponse.redirect(publicUrlData.publicUrl)
    } catch (error) {
        console.error('Failed to serve/generate feature sheet:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        )
    }
}
