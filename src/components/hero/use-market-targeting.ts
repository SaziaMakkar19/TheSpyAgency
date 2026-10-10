'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export type GeoState = 'asking' | 'granted' | 'denied' | 'unavailable';

/**
 * Owns the hero's market-targeting flow: asks the browser for the visitor's
 * location, pins a radar-pulse marker, flies the map camera, and reverse-
 * geocodes the city name for the confirmation label.
 *
 * The map instance lives in the parent (Hero) and is passed in via `mapRef`.
 * The radar-marker CSS is injected by <BackgroundMap>, which is always
 * mounted alongside this hook.
 */
export function useMarketTargeting(mapRef: React.RefObject<mapboxgl.Map | null>) {
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    // Confirmation label, e.g. "Squamish" — null until granted
    const [marketLabel, setMarketLabel] = useState<string | null>(null);
    const [geoState, setGeoState] = useState<GeoState | null>(null);

    const targetMarket = useCallback(() => {
        const map = mapRef.current;
        if (!map || !('geolocation' in navigator)) {
            setGeoState('unavailable');
            return;
        }

        setGeoState('asking');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (mapRef.current !== map) return; // stale instance guard

                const lng = pos.coords.longitude;
                const lat = pos.coords.latitude;

                // Radar-pulse marker pinned at the visitor's position
                const el = document.createElement('div');
                el.className = 'radar-marker';
                el.innerHTML =
                    '<span class="radar-dot"></span>' +
                    '<span class="radar-ring"></span>' +
                    '<span class="radar-ring radar-ring-delay"></span>';
                markerRef.current?.remove();
                markerRef.current = new mapboxgl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .addTo(map);

                // Cinematic relocation over the visitor's city
                map.flyTo({
                    center: [lng, lat],
                    zoom: 11.5,
                    speed: 1.1,
                    curve: 1.5,
                    essential: true,
                });

                setGeoState('granted');

                // Name the market for the confirmation label (best effort)
                fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality&limit=1&access_token=${mapboxgl.accessToken}`
                )
                    .then((r) => (r.ok ? r.json() : null))
                    .then((data) => {
                        const place = data?.features?.[0]?.text;
                        setMarketLabel(place ?? 'your market');
                    })
                    .catch(() => setMarketLabel('your market'));
            },
            (err) => {
                setGeoState(err?.code === 1 ? 'denied' : 'unavailable');
            },
            { timeout: 10000, maximumAge: 300000 }
        );
    }, [mapRef]);

    // Remove the marker if the hero unmounts
    useEffect(() => {
        return () => {
            markerRef.current?.remove();
            markerRef.current = null;
        };
    }, []);

    return { marketLabel, geoState, targetMarket };
}
