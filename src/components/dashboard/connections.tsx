interface Connection {
    id: string
    name: string
    role: string
    status: 'Online' | 'Offline' | 'In a Campaign'
}

const MOCK_CONNECTIONS: Connection[] = [
    {
        id: 'c1',
        name: 'Agent Smith',
        role: 'Campaign Strategist',
        status: 'Online',
    },
    {
        id: 'c2',
        name: 'Jane Doe',
        role: 'Listing Specialist',
        status: 'In a Campaign',
    },
    { id: 'c3', name: 'Alex Vance', role: 'Copywriter', status: 'Offline' },
    { id: 'c4', name: 'Marcus Cole', role: 'Media Producer', status: 'Online' },
]
export const Connections = () => {
    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <div className="mb-8">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Agency Network
                </h2>
                <p className="text-slate-500 mt-2 text-md">
                    Fellow operatives collaborating on Viral Campaigns.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_CONNECTIONS.map((connection) => (
                    <div
                        key={connection.id}
                        className="bg-white flex items-center p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                    >
                        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-500 to-black flex items-center justify-center text-white font-bold text-xl mr-4 shadow-sm">
                            {connection.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-md font-bold text-slate-900">
                                {connection.name}
                            </h3>
                            <p className="text-sm font-medium text-slate-500">
                                {connection.role}
                            </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <span className="flex h-3 w-3 relative">
                                {connection.status === 'Online' && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span
                                    className={`relative inline-flex rounded-full h-3 w-3 ${
                                        connection.status === 'Online'
                                            ? 'bg-emerald-500'
                                            : connection.status ===
                                                'In a Campaign'
                                              ? 'bg-amber-500'
                                              : 'bg-slate-300'
                                    }`}
                                ></span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
