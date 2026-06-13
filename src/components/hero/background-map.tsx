'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import React from 'react'

// Set access token once outside
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

interface MapboxMapProps {
    center?: [number, number]
    zoom?: number
    style?: string
}

export const BackgroundMap = ({
    center = [-123.05, 49.258], // Default center: Vancouver, Canada
    zoom = 11,
    style = 'mapbox://styles/nmandiveyi/cm0o3g86n003u01pqf4ykcpc1',
}: MapboxMapProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)

    // 1. INITIALIZE MAP (Runs exactly once on mount)
    useEffect(() => {
        if (!mapContainerRef.current) return

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: style,
            center: center,
            zoom: zoom,
            bearing: 0,
            pitch: 0,
            cooperativeGestures: true,
        })

        // Clean up on component unmount
        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty array ensures this only runs once

    // 2. DYNAMIC UPDATES (Handles prop changes without destroying the container)
    useEffect(() => {
        if (!mapRef.current) return

        // Smoothly pan/zoom to the new coordinates if they change
        mapRef.current.flyTo({
            center: center,
            zoom: zoom,
            essential: true, // This animation is considered essential with respect to prefers-reduced-motion
        })
    }, [center, zoom])

    // 3. STYLE UPDATES (Handles style changes seamlessly)
    useEffect(() => {
        if (!mapRef.current) return

        mapRef.current.setStyle(style)
    }, [style])

    return <div ref={mapContainerRef} className="w-full h-full" />
}
