interface Analytics {
    storageUsed: number
    storageTotal: number
    monthlyActiveCampaigns: number
    accountStatus: string
}
const MOCK_ANALYTICS: Analytics = {
    storageUsed: 34.5,
    storageTotal: 100,
    monthlyActiveCampaigns: 4,
    accountStatus: 'Member',
}

const Icons = {
    Profile: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            ></path>
        </svg>
    ),
    Chart: () => (
        <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
        </svg>
    ),
}
export const Analytics = () => {
    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-8">
                Dashboard Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Storage Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">
                            Storage Usage
                        </h3>
                        <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                            <Icons.Chart />
                        </div>
                    </div>
                    <div className="relative pt-1">
                        <div className="flex mb-3 items-center justify-between">
                            <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-emerald-700 bg-emerald-500/20">
                                {(
                                    (MOCK_ANALYTICS.storageUsed /
                                        MOCK_ANALYTICS.storageTotal) *
                                    100
                                ).toFixed(1)}
                                % Used
                            </span>
                            <span className="text-sm font-semibold text-slate-600">
                                {MOCK_ANALYTICS.storageUsed} GB{' '}
                                <span className="text-slate-400 font-normal">
                                    / {MOCK_ANALYTICS.storageTotal} GB
                                </span>
                            </span>
                        </div>
                        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
                            <div
                                style={{
                                    width: `${(MOCK_ANALYTICS.storageUsed / MOCK_ANALYTICS.storageTotal) * 100}%`,
                                }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Account Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">
                            Account Overview
                        </h3>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Icons.Profile />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">
                                Status
                            </span>
                            <span className="font-bold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                                {MOCK_ANALYTICS.accountStatus}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pb-1">
                            <span className="text-slate-500 font-medium text-sm">
                                Active Campaigns
                            </span>
                            <span className="font-bold text-emerald-500 bg-emerald-500/20 px-3 py-1 rounded-lg text-sm">
                                {MOCK_ANALYTICS.monthlyActiveCampaigns}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
