import { BackgroundMap } from '@/components/hero/background-map';

export function Hero() {
    return (
        <div className="relative w-full min-h-[60vh] lg:min-h-[540px] flex items-center justify-center font-geist overflow-hidden bg-slate-950 pt-24 pb-10 lg:py-12">
            
            {/* 1. Immersive Background Map Canvas */}
            <div className="absolute inset-0 z-0">
                <BackgroundMap />
                
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