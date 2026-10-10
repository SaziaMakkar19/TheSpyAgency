'use client';

import { useCallback, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { BackgroundMap } from '@/components/hero/background-map';
import { useMarketTargeting } from '@/components/hero/use-market-targeting';

export function Hero() {
    // Shared map handle: BackgroundMap writes it, the targeting hook reads it
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const { marketLabel, geoState, targetMarket } = useMarketTargeting(mapRef);

    // Auto-ask for location as soon as the map is ready (no click needed).
    // Fires once per page load; if permission was already granted the browser
    // resolves silently, otherwise the native prompt appears over the hero.
    const handleMapReady = useCallback(() => {
        targetMarket();
    }, [targetMarket]);

    return (
        <div className="relative w-full min-h-[60vh] lg:min-h-[540px] flex items-center justify-center font-geist overflow-hidden bg-slate-950 pt-24 pb-10 lg:py-12">

            {/* 1. Immersive Background Map Canvas */}
            <div className="absolute inset-0 z-0">
                <BackgroundMap
                    mapRef={mapRef}
                    onReady={handleMapReady}
                />

                {/* Asymmetric gradient layers for seamless text contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent lg:block hidden" />
                <div className="absolute inset-0 bg-slate-950/70 lg:hidden block" />
            </div>

            {/* 2. Content Container Layout */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* Left Strategic Copy Column */}
                    <div className="lg:col-span-6 space-y-4 text-white">
                        {/* UPDATED: Clearer, higher-converting context */}
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-widest uppercase shadow-sm shadow-emerald-500/5">
                           Digital Market Dominance
                        </span>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight max-w-md">
                            Viral Social Media Campaigns For Realtors
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed max-w-sm">
                            A coordinated media network that completely blankets your local market.
                        </p>

                        {/* Market targeting: auto-asked on load; this pill is the
                            persistent manual trigger + status. Lives inline in the
                            copy column so it can never overlap the video. */}
                        {geoState !== 'granted' ? (
                            <div className="pt-1 space-y-1.5">
                                <button
                                    onClick={targetMarket}
                                    disabled={geoState === 'asking'}
                                    className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/70 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-slate-900/90 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-70"
                                >
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
                                    </span>
                                    <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300 group-hover:text-emerald-200 transition-colors">
                                        {geoState === 'asking' ? 'Locating your market…' : 'Target my market'}
                                    </span>
                                </button>
                                <p className="text-[10px] text-slate-500">
                                    {geoState === 'denied'
                                        ? 'Location is blocked in your browser settings — re-allow it for this site to auto-target your market.'
                                        : 'One click aims the campaign map at your farm area.'}
                                </p>
                            </div>
                        ) : (
                            <div className="pt-1 flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-300">
                                    Targeting {marketLabel ?? 'your market'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Premium Miniature Video Terminal */}
                    <div className="lg:col-span-6 relative w-full max-w-md mx-auto lg:ml-auto">

                        {/* Ambient Neon Backlight Aura */}
                        <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/15 to-cyan-500/5 rounded-2xl blur-2xl opacity-70 pointer-events-none" />

                        {/* Video Interface Card */}
                        <div className="relative group space-y-2">

                            {/* UPDATED: Clean, conversion-focused title framework */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center space-x-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] tracking-wider text-slate-300 font-semibold uppercase">
                                       Campaign Blueprint
                                    </span>
                                </div>
                                <div className="flex items-center text-[9px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/60 shadow-inner">
                                    <span>LIVE_DEMO</span>
                                </div>
                            </div>

                            {/* Framed Cinematic Player */}
                            <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-800/80 bg-slate-950/90 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:border-slate-700/60">
                                <iframe
                                    className="w-full h-full opacity-95 transition-opacity duration-300 group-hover:opacity-100"
                                    src="https://www.youtube.com/embed/wrjAJHypVRE?si=Uk8rAYxk74gwCMiS"
                                    title="The Spy Agency – MAX POST"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                            </div>


                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
}
