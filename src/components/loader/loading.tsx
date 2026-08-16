export function ListingsLoading() {
    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
                    <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse" />
                </div>
            </div>

            {/* Folders Grid Skeleton */}
            <div className="mb-8">
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="p-5 bg-white border border-slate-200 rounded-2xl h-32 flex flex-col justify-between animate-pulse"
                        >
                            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                            <div>
                                <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                                <div className="h-3 w-12 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Files Grid Skeleton */}
            <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="h-56 bg-slate-100 rounded-2xl border border-slate-200 animate-pulse flex flex-col justify-end p-4"
                        >
                            <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                            <div className="h-3 w-1/3 bg-slate-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
