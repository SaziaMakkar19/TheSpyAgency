import { NextResponse, NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json()
        if (!url) {
            return NextResponse.json(
                { error: 'URL or handle is required' },
                { status: 400 },
            )
        }

        const targetUrl = url.startsWith('http') ? url : `https://${url}`

        // 1. Fetch clean markdown via Jina Reader to bypass bot blocks & rate limits
        const readerRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
            headers: {
                Accept: 'application/json',
            },
        })

        let pageContent = ''
        if (readerRes.ok) {
            const json = await readerRes.json()
            pageContent = json.data?.content || json.content || ''
        } else {
            pageContent = `Professional real estate profile for ${targetUrl}`
        }

        // 2. Instruct Gemini to look specifically for fonts, styling cues, typography hints, and brand attributes
        const prompt = `Analyze the following website content and markdown text extracted from ${targetUrl}:
        
        ${pageContent.slice(0, 12000)}

        Extract the professional's profile details, aesthetic style, and font/typography preferences. Look for CSS font families mentioned, design feels (e.g., modern sans-serif, classic serif, clean minimalist, bold editorial), and brand elements.
        
        Return ONLY a valid JSON object matching this exact structure, with no extra conversational text or markdown formatting:
        {
          "bio": "A professional summary or bio extracted from the text.",
          "writingStyle": "Tone descriptor (e.g. ultra-luxurious, friendly neighborhood expert, data-driven investor focus)",
          "colors": ["#HEX1", "#HEX2", "#HEX3"],
          "fontStyle": "Description of font or typography style (e.g. Clean Modern Sans-Serif, Elegant Serif, Bold Contemporary)",
          "fontFamilyHint": "Specific font name if detected (e.g. Inter, Playfair Display, Montserrat, Roboto) or 'sans-serif'/'serif'"
        }`

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        })

        const textResponse = response.text || '{}'
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
        const cleanJson = jsonMatch ? jsonMatch[0] : '{}'

        let data
        try {
            data = JSON.parse(cleanJson)
        } catch (parseError) {
            data = {
                bio: `Dedicated real estate professional linked via ${targetUrl}. Committed to delivering exceptional client service and market expertise.`,
                writingStyle: 'Friendly neighborhood expert',
                colors: ['#002A5C', '#DC2626', '#F3F4F6'],
                fontStyle: 'Clean Modern Sans-Serif',
                fontFamilyHint: 'Inter',
            }
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Scraping error:', error)
        return NextResponse.json(
            {
                error:
                    error?.message ||
                    'Failed to extract profile information from URL',
            },
            { status: 500 },
        )
    }
}
