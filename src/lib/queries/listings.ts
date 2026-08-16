import { realtorDb, listingDb } from '@/lib/utils/supabase-server'
import { fetchFloorPlans } from '@/lib/utils/floorplans'
import { formatBytes } from '@/lib/utils/helper'

export interface ListingRecord {
    mls_number: string
    market_status: string | null
    civic_address: string | null
    asking_price: number | null
    sub_area: string | null
    lot_size: number | null
    bedrooms: number | null
    half_baths: number | null
    full_baths: number | null
    year_built: number | null
    virtual_tour: string | null
    features: any
    dwell_type: string | null
    parking: any
    amenities: any
    total_floor_area: number | null
    listing_office: string | null
    listing_remarks: string | null
    property_category: string | null
    gis_id: string | null
    photos: string[] | null
}

export interface ListingAsset {
    id: string
    name: string
    type: string
    size: string
    url?: string
}

export interface ListingFolder {
    id: string
    title: string
    description: string
    files: ListingAsset[]
    children: ListingFolder[]
}

export interface ListingsTree {
    id: 'root'
    title: string
    description: string
    files: ListingAsset[]
    children: ListingFolder[]
}

export async function fetchListingsTree(
    userEmail: string,
): Promise<ListingsTree> {
    /*
     * STEP 1
     * Get the realtor and their processed listing IDs.
     */

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
        throw new Error('Failed to locate operative profile.')
    }

    const outreachData = realtorData.realtor_outreach_state as any

    const listingIds = Array.isArray(outreachData)
        ? outreachData[0]?.processed_listing_ids || []
        : outreachData?.processed_listing_ids || []

    /*
     * No listings.
     */

    if (!listingIds.length) {
        return {
            id: 'root',
            title: 'Listings Directory',
            description: 'Master index of all property intelligence.',
            files: [],
            children: [],
        }
    }

    /*
     * STEP 2
     * Get listing information.
     */

    const { data: listingsData, error: listingsError } = await listingDb
        .from('all_listings')
        .select(
            `
                mls_number,
                market_status,
                civic_address,
                asking_price,
                sub_area,
                lot_size,
                bedrooms,
                half_baths,
                full_baths,
                year_built,
                virtual_tour,
                features,
                dwell_type,
                parking,
                amenities,
                total_floor_area,
                listing_office,
                listing_remarks,
                property_category,
                gis_id,
                photos
                `,
        )
        .in('mls_number', listingIds)

    if (listingsError || !listingsData) {
        throw new Error('Failed to fetch listing details.')
    }

    /*
     * STEP 3
     *
     * Build the folder tree.
     *
     * NOTE:
     *
     * For now I am keeping fetchFloorPlans()
     * here so your existing functionality continues
     * to work.
     */

    const listingFolders = await Promise.all(
        listingsData.map(async (listing: ListingRecord) => {
            const floorPlanUrls = await fetchFloorPlans(
                listing,
                listing.property_category,
            )

            /*
             * Feature Sheet
             */

            const featureSheetFile: ListingAsset = {
                id: `fs_${listing.mls_number}`,
                name: `Feature_Sheet_${listing.mls_number}.pdf`,
                type: 'Document',
                size: 'Cached',
                url: `/api/feature-sheet?mls=${listing.mls_number}`,
            }

            /*
             * Floor Plans
             */

            const floorPlanFiles: ListingAsset[] = floorPlanUrls.map(
                (fp, index) => ({
                    id: `fp_${listing.mls_number}_${index + 1}`,

                    name:
                        `Floor_Plan_${index + 1}.` +
                        (fp.url.split('.').pop() || 'png'),

                    type: 'Document',

                    size: formatBytes(fp.size),

                    url: fp.url,
                }),
            )

            /*
             * Photos
             */

            const photoList = listing.photos || []

            const photoFiles: ListingAsset[] = photoList.map(
                (photoUrl, index) => {
                    const ext = photoUrl.split('?')[0].split('.').pop() || 'jpg'

                    return {
                        id: `photo_${listing.mls_number}_${index + 1}`,

                        name: `Photo_${index + 1}.${ext}`,

                        type: 'Image',

                        size: '',

                        url: photoUrl,
                    }
                },
            )

            /*
             * Children
             */

            const children: ListingFolder[] = []

            if (floorPlanFiles.length > 0) {
                children.push({
                    id: `folder_fp_${listing.mls_number}`,

                    title: 'Floor Plans',

                    description: 'Architectural layout',

                    files: floorPlanFiles,

                    children: [],
                })
            }

            if (photoFiles.length > 0) {
                children.push({
                    id: `folder_photos_${listing.mls_number}`,

                    title: 'Photos',

                    description: 'Property images',

                    files: photoFiles,

                    children: [],
                })
            }

            return {
                id: listing.mls_number,

                title: listing.civic_address || 'Unknown Address',

                description: `Listing ID: ${listing.mls_number}`,

                files: [featureSheetFile],

                children,
            }
        }),
    )

    return {
        id: 'root',
        title: 'Listings Directory',
        description: 'Master index of all property intelligence.',
        files: [],
        children: listingFolders,
    }
}
