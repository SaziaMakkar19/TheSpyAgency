'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React from 'react';

// Set access token once outside
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Hoisted so the default prop keeps a STABLE reference across renders.
// (A fresh array literal per render made the update effect re-fire on every
// state change — flying the camera back to Vancouver after relocation.)
const DEFAULT_CENTER: [number, number] = [-123.050, 49.258]; // Vancouver
const DEFAULT_ZOOM = 11;
const DEFAULT_STYLE = "mapbox://styles/nmandiveyi/cm0o3g86n003u01pqf4ykcpc1";

interface MapboxMapProps {
    /** Shared map instance handle — owned by the parent (Hero). */
    mapRef: React.RefObject<mapboxgl.Map | null>;
    /** Fired once the map style has loaded (safe moment to fly the camera). */
    onReady?: (map: mapboxgl.Map) => void;
    center?: [number, number];
    zoom?: number;
    style?: string;
}

export const BackgroundMap = ({
    mapRef,
    onReady,
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    style = DEFAULT_STYLE
}: MapboxMapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. INITIALIZE MAP (Runs exactly once on mount)
    useEffect(() => {
        if (!containerRef.current) return;

        // Graceful fallback: if no token is configured, render the hero
        // gradient backdrop instead of crashing the component tree.
        if (!mapboxgl.accessToken) return;

        let map: mapboxgl.Map;
        try {
            map = new mapboxgl.Map({
                container: containerRef.current,
                style: style,
                center: center,
                zoom: zoom,
                bearing: 0,
                pitch: 0,
                cooperativeGestures: true,
            });
            mapRef.current = map;
        } catch (err) {
            console.warn('Mapbox map failed to initialize:', err);
            return;
        }

        if (map.loaded()) {
            onReady?.(map);
        } else {
            map.once('load', () => onReady?.(map));
        }

        // Clean up on component unmount
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array ensures this only runs once

    // 2. DYNAMIC UPDATES (Handles prop changes without destroying the container)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Skip when the camera already matches (avoids fighting geo relocation)
        const c = map.getCenter();
        if (
            Math.abs(c.lng - center[0]) < 1e-9 &&
            Math.abs(c.lat - center[1]) < 1e-9 &&
            map.getZoom() === zoom
        ) return;

        // Smoothly pan/zoom to the new coordinates if they change
        map.flyTo({
            center: center,
            zoom: zoom,
            essential: true // This animation is considered essential with respect to prefers-reduced-motion
        });
    }, [mapRef, center, zoom]);

    // 3. STYLE UPDATES (Handles style changes seamlessly)
    useEffect(() => {
        if (!mapRef.current) return;

        mapRef.current.setStyle(style);
    }, [mapRef, style]);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            {/* Radar-pulse marker + HUD styles (scoped to this component) */}
            <style>{`
                .radar-marker { position: relative; width: 12px; height: 12px; }
                .radar-dot {
                    position: absolute; inset: 0; border-radius: 9999px;
                    background: #34d399;
                    box-shadow: 0 0 12px 2px rgba(52, 211, 153, 0.8);
                }
                .radar-ring {
                    position: absolute; inset: 0; border-radius: 9999px;
                    border: 2px solid rgba(52, 211, 153, 0.9);
                    animation: radar-ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .radar-ring-delay { animation-delay: 1.2s; }
                @keyframes radar-ping {
                    0%   { transform: scale(0.5); opacity: 0.9; }
                    80%, 100% { transform: scale(4.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
