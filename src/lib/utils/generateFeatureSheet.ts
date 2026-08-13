import PDFDocument from 'pdfkit'

export interface ListingData {
    mls_number?: string | null
    market_status?: string | null
    civic_address?: string | null
    asking_price?: number | null
    sub_area?: string | null
    lot_size?: number | null
    bedrooms?: number | null
    half_baths?: number | null
    full_baths?: number | null
    year_built?: number | null
    virtual_tour?: string | null
    features?: string[] | string | null
    dwell_type?: string | null
    parking?: string[] | string | null
    amenities?: string[] | string | null
    total_floor_area?: number | null
    listing_office?: string | null
    listing_remarks?: string | null
    property_category?: string | null
    gis_id?: string | null
    member_full_name?: string | null // Added from realtorData
}

/**
 * Safely parse JSONB fields from Postgres
 */
function parseJsonArray(field: unknown): string[] {
    if (Array.isArray(field)) return field
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field)
            return Array.isArray(parsed) ? parsed : [field]
        } catch {
            return [field]
        }
    }
    return []
}

/**
 * Helper to draw elegant key-value rows with bottom borders
 */
function drawSpecRow(
    doc: typeof PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
): number {
    const labelWidth = 100
    const valueWidth = width - labelWidth

    // Label
    doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(label, x, y)

    // Value
    doc.fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(value, x + labelWidth, y, { width: valueWidth, align: 'right' })

    const rowHeight = Math.max(
        doc.heightOfString(label, { width: labelWidth }),
        doc.heightOfString(value, { width: valueWidth }),
    )

    // Subtle divider line
    const lineY = y + rowHeight + 6
    doc.moveTo(x, lineY)
        .lineTo(x + width, lineY)
        .strokeColor('#f1f5f9')
        .lineWidth(1)
        .stroke()

    return rowHeight + 16 // Return offset for next row
}

/**
 * Generates a modern, premium MLS-style Feature Sheet PDF (Data Only)
 */
export async function generateMLSFeatureSheetBuffer(
    listing: ListingData,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            // Standard Letter Size (612 x 792)
            const doc = new PDFDocument({ margin: 0, size: 'LETTER' })
            const buffers: Buffer[] = []

            doc.on('data', buffers.push.bind(buffers))
            doc.on('end', () => resolve(Buffer.concat(buffers)))
            doc.on('error', reject)

            // Modern Color Palette
            const slate900 = '#0f172a' // Deep Header Background
            const slate500 = '#64748b' // Muted Text
            const slate300 = '#cbd5e1' // Light Lines
            const accentText = '#38bdf8' // Soft Blue Accent

            const marginX = 50
            const contentWidth = 512 // 612 - (50 * 2)

            // ==========================================
            // 1. DARK PREMIUM HEADER (Y: 0 to 160)
            // ==========================================
            doc.rect(0, 0, 612, 150).fill(slate900)

            let currentY = 40

            // Agent & Status Ribbon
            doc.fillColor(accentText).font('Helvetica-Bold').fontSize(9)
            const agentName = listing.member_full_name
                ? `LISTED BY: ${listing.member_full_name.toUpperCase()}`
                : 'EXCLUSIVE LISTING'
            doc.text(agentName, marginX, currentY)

            const status = listing.market_status?.toUpperCase() || 'ACTIVE'
            doc.fillColor('#ffffff').text(
                `STATUS: ${status}`,
                marginX,
                currentY,
                { width: contentWidth, align: 'right' },
            )

            currentY += 25

            // Address & Price
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
            doc.text(
                listing.civic_address || 'Address Unavailable',
                marginX,
                currentY,
                { width: 350 },
            )

            const formattedPrice = listing.asking_price
                ? `$${listing.asking_price.toLocaleString()}`
                : 'Price on Request'
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
            doc.text(formattedPrice, marginX, currentY, {
                width: contentWidth,
                align: 'right',
            })

            currentY += 30

            // MLS & Category info under address
            doc.fillColor(slate300).font('Helvetica').fontSize(10)
            doc.text(
                `MLS® #: ${listing.mls_number || 'N/A'}`,
                marginX,
                currentY,
            )
            doc.text(
                `Category: ${listing.property_category || 'Detached'}`,
                marginX,
                currentY,
                { width: contentWidth, align: 'right' },
            )

            // ==========================================
            // 2. QUICK STATS RIBBON
            // ==========================================
            currentY = 180
            const statWidth = contentWidth / 4

            const stats = [
                {
                    label: 'BEDROOMS',
                    value: listing.bedrooms?.toString() || '0',
                },
                {
                    label: 'BATHROOMS',
                    value: `${listing.full_baths || 0} Full / ${listing.half_baths || 0} Half`,
                },
                {
                    label: 'SQUARE FEET',
                    value: listing.total_floor_area
                        ? listing.total_floor_area.toLocaleString()
                        : 'N/A',
                },
                {
                    label: 'YEAR BUILT',
                    value: listing.year_built?.toString() || 'N/A',
                },
            ]

            stats.forEach((stat, index) => {
                const x = marginX + index * statWidth
                doc.fillColor(slate500)
                    .font('Helvetica-Bold')
                    .fontSize(8)
                    .text(stat.label, x, currentY)
                doc.fillColor(slate900)
                    .font('Helvetica-Bold')
                    .fontSize(16)
                    .text(stat.value, x, currentY + 12)

                // Vertical divider lines
                if (index < 3) {
                    doc.moveTo(x + statWidth - 15, currentY)
                        .lineTo(x + statWidth - 15, currentY + 25)
                        .strokeColor('#f1f5f9')
                        .lineWidth(1)
                        .stroke()
                }
            })

            // Horizontal Line
            currentY += 50
            doc.moveTo(marginX, currentY)
                .lineTo(marginX + contentWidth, currentY)
                .strokeColor('#e2e8f0')
                .stroke()

            // ==========================================
            // 3. TWO-COLUMN DETAILS GRID
            // ==========================================
            currentY += 30
            doc.fillColor(slate900)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('PROPERTY SPECIFICATIONS', marginX, currentY)

            currentY += 25
            const colWidth = contentWidth / 2 - 15
            const rightColX = marginX + colWidth + 30

            let leftY = currentY
            let rightY = currentY

            const parseAndFormat = (val: unknown) => {
                const arr = parseJsonArray(val)
                return arr.length > 0 ? arr.join(', ') : 'None'
            }

            // Left Column Data
            leftY += drawSpecRow(
                doc,
                'Dwelling Type',
                listing.dwell_type || 'N/A',
                marginX,
                leftY,
                colWidth,
            )
            leftY += drawSpecRow(
                doc,
                'Sub-Area',
                listing.sub_area || 'N/A',
                marginX,
                leftY,
                colWidth,
            )
            leftY += drawSpecRow(
                doc,
                'Lot Size',
                listing.lot_size
                    ? `${listing.lot_size.toLocaleString()} sqft`
                    : 'N/A',
                marginX,
                leftY,
                colWidth,
            )
            leftY += drawSpecRow(
                doc,
                'GIS / PID',
                listing.gis_id || 'N/A',
                marginX,
                leftY,
                colWidth,
            )

            // Right Column Data
            rightY += drawSpecRow(
                doc,
                'Parking',
                parseAndFormat(listing.parking),
                rightColX,
                rightY,
                colWidth,
            )
            rightY += drawSpecRow(
                doc,
                'Amenities',
                parseAndFormat(listing.amenities),
                rightColX,
                rightY,
                colWidth,
            )
            rightY += drawSpecRow(
                doc,
                'Features',
                parseAndFormat(listing.features),
                rightColX,
                rightY,
                colWidth,
            )
            rightY += drawSpecRow(
                doc,
                'Virtual Tour',
                listing.virtual_tour ? 'Available' : 'N/A',
                rightColX,
                rightY,
                colWidth,
            )

            // ==========================================
            // 4. OVERVIEW / REMARKS
            // ==========================================
            currentY = Math.max(leftY, rightY) + 30

            doc.fillColor(slate900)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('PROPERTY OVERVIEW', marginX, currentY)
            currentY += 20

            const remarksText =
                listing.listing_remarks ||
                'No public remarks available for this property.'

            doc.fillColor(slate500)
                .font('Helvetica')
                .fontSize(10)
                .text(remarksText, marginX, currentY, {
                    width: contentWidth,
                    align: 'justify',
                    lineGap: 6, // Elegant line height
                })

            // ==========================================
            // 5. FOOTER
            // ==========================================
            const footerY = 730
            doc.moveTo(marginX, footerY - 15)
                .lineTo(marginX + contentWidth, footerY - 15)
                .strokeColor('#e2e8f0')
                .stroke()

            doc.fillColor(slate900).font('Helvetica-Bold').fontSize(8)
            doc.text(
                `LISTING OFFICE: ${listing.listing_office?.toUpperCase() || 'N/A'}`,
                marginX,
                footerY,
            )

            doc.fillColor(slate500).font('Helvetica').fontSize(8)
            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}
