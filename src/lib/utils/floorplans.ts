import { listingDb } from './supabase-server'
export interface FloorPlanFile {
    url: string
    size: number // size in bytes
}

export const fetchFloorPlans = async (
    property: any,
    type: any,
): Promise<FloorPlanFile[]> => {
    let bucketName = ''
    let folderPath = ''
    let targetPrefix = ''

    const isDetachedOrLand = ['detached', 'multifamily', 'land'].some((t) =>
        type.includes(t),
    )
    const isStrata = type.includes('strata')

    const civicAddress = property.civic_address.replace(/-/g, ' ')
    const civic_address = civicAddress.split(' ')

    if (isDetachedOrLand) {
        if (!property.civic_address) return []
        bucketName = 'streetview'

        if (!isNaN(Number(civic_address[1]))) {
            civic_address[2] =
                civic_address[2][0].toUpperCase() +
                civic_address[2].slice(1).toLowerCase()
            folderPath = `${civic_address[2]}/fp`
            targetPrefix = `${civic_address[0]}-${civic_address[1]}-${civic_address[2]}`
        } else {
            civic_address[1] =
                civic_address[1][0].toUpperCase() +
                civic_address[1].slice(1).toLowerCase()
            folderPath = `${civic_address[1]}/fp`
            targetPrefix = `${civic_address[0]}-${civic_address[1]}`
        }
    } else if (isStrata) {
        bucketName = 'strata'
        if (!property.civic_address) return []

        folderPath = `${property.gis_id}/fp`
        civic_address[0] = civic_address[0].replace(/,/g, '')
        civic_address[2] =
            civic_address[2][0].toUpperCase() +
            civic_address[2].slice(1).toLowerCase()

        targetPrefix = `${civic_address[0]}-${civic_address[1]}-${civic_address[2]}-Floor-Plan`
    } else {
        return []
    }

    try {
        const searchPrefix = targetPrefix.trim()

        const { data: files, error } = await listingDb.storage
            .from(bucketName)
            .list(folderPath, {
                limit: 100,
                search: searchPrefix,
                sortBy: { column: 'name', order: 'asc' },
            })

        if (error || !files || files.length === 0) {
            return []
        }

        // Map files to include URL and original size in bytes from metadata
        const matchedFiles: FloorPlanFile[] = files
            .filter((file: any) => {
                const lowerName = file.name.toLowerCase()
                return lowerName.endsWith('.png') || lowerName.endsWith('.webp')
            })
            .map((file: any) => {
                const fullPath = `${process.env.NEXT_PUBLIC_LISTINGS_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${folderPath}/${file.name}`
                return {
                    url: encodeURI(fullPath),
                    size: file.metadata?.size || 0, // Captured directly from S3 metadata
                }
            })

        return matchedFiles
    } catch (err) {
        console.error(
            'Critical failure during floor plan recovery execution:',
            err,
        )
        return []
    }
}
