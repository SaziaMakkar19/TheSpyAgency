// import Dashboard from '@/components/dashboard'

// export default function LoginPage() {
//     return <Dashboard />
// }

// app/listings/page.tsx
import Dashboard from '@/components/dashboard'
import { realtorDb, listingDb } from '@/lib/utils/supabase-server'
import { Folder, DocumentFile } from '@/components/dashboard/folderView'
import { validateRequest } from '@/lib/utils/auth'
import { fetchFloorPlans } from '@/lib/utils/floorplans'
import {
    generateMLSFeatureSheetBuffer,
    ListingData,
} from '@/lib/utils/generateFeatureSheet'

// Helper to format bytes
function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export default async function ListingsPage() {
    // 1. Get the current operative's email (Assuming you have a session helper)
    const { user } = await validateRequest()
    const userEmail = 'zen@zenwilson.com'

    console.log('userEmail:', userEmail)

    if (!userEmail) {
        return <div>Unauthorized access.</div>
    }

    // 2. Fetch the Realtor and their processed listing IDs in a single query via a Join
    const { data: realtorData, error: realtorError } = await realtorDb
        .from('realtors')
        .select(
            `
      MemberMlsId,
      MemberFullName,
      realtor_outreach_state (
        processed_listing_ids
      )
    `,
        )
        .eq('MemberEmail', userEmail)
        .single()

    if (realtorError || !realtorData) {
        console.error('Failed to locate operative profile:', realtorError)
        return <div>Error loading profile.</div>
    }

    // Handle cases where the outreach state might not exist yet
    // 1. Bypass TypeScript's strict array assumption for this specific join
    const outreachData = realtorData.realtor_outreach_state as any

    // 2. Safely extract the IDs whether Supabase returns an array or an object
    const listingIds = Array.isArray(outreachData)
        ? outreachData[0]?.processed_listing_ids || []
        : outreachData?.processed_listing_ids || []
    console.log('listingIds:', listingIds)

    // 3. Fetch civic addresses from DB2, ONLY if we have listing IDs
    let listingFolders: Folder[] = []

    if (listingIds.length > 0) {
        const { data: listingsData, error: listingsError } = await listingDb
            .from('all_listings')
            .select(
                `mls_number, market_status, civic_address, asking_price, sub_area, lot_size, 
                bedrooms, half_baths, full_baths, year_built, virtual_tour, features, dwell_type, parking, amenities, total_floor_area, listing_office, listing_remarks, property_category, gis_id, photos`,
            ) // Adjust column names based on DB2 schema
            .in('mls_number', listingIds)

        if (listingsError || !listingsData) {
            console.error(
                'Failed to fetch listing details from DB2:',
                listingsError,
            )
        } else if (listingsData) {
            listingFolders = await Promise.all(
                listingsData.map(async (listing: any) => {
                    console.log('listing:', listing)
                    const floorPlanUrls = await fetchFloorPlans(
                        listing,
                        listing.property_category,
                    )
                    console.log('floorPlanUrls:', floorPlanUrls)

                    const pdfFileName = `Feature_Sheet_${listing.mls_number}.pdf`
                    const bucketPath = `feature_sheets/${pdfFileName}`
                    let featureSheetFile = null // Initialize as null in case of failure

                    try {
                        console.log(
                            `Generating PDF Buffer for ${listing.mls_number}...`,
                        )

                        const pdfListingData: ListingData = {
                            ...listing,
                            member_full_name:
                                realtorData?.MemberFullName || 'Unknown Agent',
                        }

                        // 1. Generate the PDF into memory (using our non-AI Buffer function)
                        const pdfBuffer =
                            await generateMLSFeatureSheetBuffer(pdfListingData)

                        // 2. Upload directly to Supabase Storage
                        const { data: uploadData, error: uploadError } =
                            await realtorDb.storage
                                .from('feature_sheets')
                                .upload(bucketPath, pdfBuffer, {
                                    contentType: 'application/pdf',
                                    upsert: true, // Overwrites the file if it already exists
                                })

                        if (uploadError) throw uploadError

                        // 3. Get the live public URL for the newly uploaded PDF
                        const {
                            data: { publicUrl },
                        } = realtorDb.storage
                            .from('feature_sheets')
                            .getPublicUrl(bucketPath)

                        console.log(
                            `Successfully generated and uploaded PDF for ${listing.mls_number}`,
                        )

                        // --- B. CREATE DOCUMENT FILE OBJECT ---
                        featureSheetFile = {
                            id: `fs_${listing.mls_number}`,
                            name: pdfFileName,
                            type: 'Document',
                            size: 'Auto-generated',
                            url: publicUrl, // Now pointing to the live Supabase URL!
                        }
                    } catch (pdfError) {
                        console.error(
                            `Failed to generate/upload PDF for ${listing.mls_number}:`,
                            pdfError,
                        )
                    }

                    // Transform URLs into DocumentFile objects
                    const floorPlanFiles: DocumentFile[] = floorPlanUrls.map(
                        (fp, index) => ({
                            id: `fp_${listing.mls_number}_${index + 1}`,
                            name: `Floor_Plan_${index + 1}.${fp.url.split('.').pop() || 'png'}`,
                            type: 'Document',
                            size: formatBytes(fp.size),
                            url: fp.url,
                        }),
                    )

                    const photoList: string[] = listing.photos || []
                    const photoFiles: DocumentFile[] = photoList.map(
                        (photoUrl, index) => {
                            const ext =
                                photoUrl.split('?')[0].split('.').pop() || 'jpg'
                            return {
                                id: `photo_${listing.mls_number}_${index + 1}`,
                                name: `Photo_${index + 1}.${ext}`,
                                type: 'Image',
                                size: '', // Size isn't provided by raw URL arrays
                                url: photoUrl,
                            }
                        },
                    )

                    // Only create the Floor Plans sub-folder if files were actually found
                    const childrenFolders: Folder[] = []

                    if (floorPlanFiles.length > 0) {
                        childrenFolders.push({
                            id: `folder_fp_${listing.mls_number}`,
                            title: 'Floor Plans',
                            description: 'Architectural layout',
                            files: floorPlanFiles,
                            children: [],
                        })
                    }

                    if (photoFiles.length > 0) {
                        childrenFolders.push({
                            id: `folder_photos_${listing.mls_number}`,
                            title: 'Photos',
                            description: 'Property images',
                            files: photoFiles,
                            children: [],
                        })
                    }

                    // 2. Return the main listing folder with the sub-folder nested inside children
                    return {
                        id: listing.mls_number,
                        title: listing.civic_address || 'Unknown Address',
                        description: `Listing ID: ${listing.mls_number}`,
                        files: [featureSheetFile].filter(
                            Boolean,
                        ) as DocumentFile[], // Keep root files empty
                        children: childrenFolders, // Nest the Floor Plan folder here
                    }
                }),
            )
        }
    }

    // 5. Construct the final Master Root Node
    const rootNode: Folder = {
        id: 'root',
        title: 'Listings Directory',
        description: 'Master index of all property intelligence.',
        files: [],
        children: listingFolders,
    }

    // console.log('rootNode:', rootNode)

    // Pass the assembled data graph to the Client Component
    return <Dashboard initialTreeData={rootNode} />
}
