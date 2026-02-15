import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, AlertTriangle } from 'lucide-react';

export default function CaretakerDashboard() {
    // Mock data for health records
    // State for health logs
    const [healthLogs, setHealthLogs] = useState([]);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/logs')
            .then(res => res.json())
            .then(data => setHealthLogs(data))
            .catch(err => console.error("Error fetching logs:", err));
    }, []);

    // Mock status data
    const currentStatus = {
        riskLevel: 'Medium', // Low, Medium, High
        heartRate: 72,
        lastActivity: '10 mins ago',
        statusMessage: 'Heart rate slightly elevated during morning walk.'
    };

    const getStatusColor = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            {/* Navigation for Demo */}
            <Link to="/" className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm hover:bg-blue-700 transition-colors z-50">
                Switch to Elderly View
            </Link>

            {/* Header */}
            <header className="w-full max-w-4xl flex justify-between items-center mb-8 mt-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Caretaker Dashboard</h1>
                    <p className="text-gray-500 text-lg">Monitoring: <span className="font-semibold text-gray-700">Fatima</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Last updated: Just now</span>
                </div>
            </header>

            <main className="w-full max-w-4xl space-y-6">
                {/* Status Overview Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Risk Level Card */}
                    <div className={`p-6 rounded-2xl border flex flex-col items-start justify-between h-32 ${getStatusColor(currentStatus.riskLevel)}`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Risk Level</span>
                        </div>
                        <span className="text-3xl font-bold">{currentStatus.riskLevel}</span>
                    </div>

                    {/* Heart Rate Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-start justify-between h-32">
                        <div className="flex items-center gap-2 text-red-500">
                            <Heart className="w-5 h-5" />
                            <span className="font-medium text-gray-600">Heart Rate</span>
                        </div>
                        <span className="text-3xl font-bold text-gray-800">{currentStatus.heartRate} <span className="text-sm text-gray-400 font-normal">bpm</span></span>
                    </div>

                    {/* Last Activity Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-start justify-between h-32">
                        <div className="flex items-center gap-2 text-blue-500">
                            <Activity className="w-5 h-5" />
                            <span className="font-medium text-gray-600">Last Activity</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">{currentStatus.lastActivity}</span>
                    </div>
                </section>

                {/* Detailed Status Message */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Condition</h2>
                    <p className="text-gray-600">{currentStatus.statusMessage}</p>
                </section>

                {/* Health Records Table */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800">Health Records</h2>
                        <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm text-gray-400 border-b border-gray-100">
                                    <th className="py-3 font-medium">Date</th>
                                    <th className="py-3 font-medium">Type</th>
                                    <th className="py-3 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {healthLogs.length > 0 ? (
                                    healthLogs.map((log) => (
                                        <tr key={log._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 text-gray-600 text-sm">
                                                {new Date(log.timestamp).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="py-4 text-gray-800 font-medium text-sm">
                                                <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">
                                                    Voice Log
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm max-w-xs truncate" title={log.text}>"{log.text}"</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 text-center text-gray-400">No logs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Progress/Adherence Tracking Placeholder */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Weekly Adherence</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                        </div>
                        <span className="text-gray-600 font-medium">75%</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Medication and exercise adherence for this week.</p>
                </section>
            </main>
        </div>
    );
}
