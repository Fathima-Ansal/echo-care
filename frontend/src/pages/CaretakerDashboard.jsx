import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Heart, Activity, AlertTriangle, Download, User, X, Bell, Info } from 'lucide-react';

export default function CaretakerDashboard() {
    const { token, logout, userEmail, userRole } = useContext(AuthContext);
    const [healthLogs, setHealthLogs] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [lastAlertId, setLastAlertId] = useState(null);

    // State for creating elderly account
    const [elderlyEmail, setElderlyEmail] = useState('');
    const [elderlyPassword, setElderlyPassword] = useState('');
    const [elderlyLanguage, setElderlyLanguage] = useState('ml-IN');
    const [createMsg, setCreateMsg] = useState({ text: '', type: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/logs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setHealthLogs(data);
                    
                    // Generate notifications for negative sentiments
                    const negativeLogs = data.filter(log => log.sentiment === 'Negative');
                    if (negativeLogs.length > 0) {
                        const newNotifications = negativeLogs.map(log => ({
                            id: log._id || log.id,
                            title: 'Negative Sentiment Detected',
                            message: `Elderly user expressed: "${log.text.substring(0, 50)}..."`,
                            time: log.timestamp || new Date().toISOString(),
                            priority: 'high'
                        }));
                        
                        // Only set if different from current to avoid loops
                        setNotifications(prev => {
                            const existingIds = new Set(prev.map(n => n.id));
                            const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
                            if (uniqueNew.length === 0) return prev;
                            return [...uniqueNew, ...prev].slice(0, 10);
                        });
                    }
                } else {
                    console.error("Backend error instead of logs:", data);
                    setHealthLogs([]);
                }
            })
            .catch(err => console.error("Error fetching logs:", err));
    }, [token]);

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

    const getCaregiverName = () => {
        if (!userEmail) return "Caregiver";
        return userEmail.split('@')[0];
    };

    const downloadPDF = () => {
        // Use the native browser print dialog which supports perfect PDF rendering 
        // with complex scripts and allows "Save as PDF".
        const originalTitle = document.title;
        document.title = `EchoCare_Logs_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#F9F9F6] font-sans text-[#41431B] print:bg-white print:p-0">
            {/* NAVIGATION HEADER */}
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#AEB784]/20 shadow-sm print:hidden">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo/Title Area */}
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-extrabold text-[#41431B] leading-none">EchoCare</h1>
                            <span className="text-xs font-bold text-[#AEB784] tracking-widest mt-1">CAREGIVER PORTAL</span>
                        </div>

                        {/* Actions Area */}
                        <div className="flex items-center gap-3 sm:gap-5">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#41431B] transition-all border border-gray-100 relative"
                                >
                                    <Bell className="w-5 h-5" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-4 z-[60] animate-in slide-in-from-top-2 duration-200">
                                        <div className="px-5 mb-3 flex justify-between items-center">
                                            <h3 className="font-bold text-[#41431B]">Notifications</h3>
                                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                {notifications.length} Alerts
                                            </span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto px-2">
                                            {notifications.length > 0 ? (
                                                notifications.map(n => (
                                                    <div key={n.id} className="p-3 mb-1 hover:bg-red-50/50 rounded-xl transition-colors border-l-4 border-red-500 bg-red-50/20">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#41431B]">{n.title}</p>
                                                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                                                                <p className="text-[10px] text-[#AEB784] mt-1 font-medium italic">
                                                                    {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center">
                                                    <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-xs text-gray-400 font-medium">No new alerts.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="hidden sm:flex flex-col items-end mr-1">
                                <p className="text-sm font-bold text-[#41431B] capitalize">{getCaregiverName()}</p>
                                <p className="text-[10px] font-bold text-[#AEB784]">Caregiver</p>
                            </div>
                            
                            {/* Profile Button */}
                            <button 
                                onClick={() => setShowProfile(true)}
                                className="p-2.5 rounded-xl bg-[#AEB784]/10 text-[#41431B] hover:bg-[#AEB784]/20 transition-all border border-[#AEB784]/20" 
                                title="Account Profile"
                            >
                                <div className="w-6 h-6 rounded-full bg-[#AEB784] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {getCaregiverName().charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 bg-white border-2 border-red-100 hover:border-red-200 hover:bg-red-50 text-red-600 px-5 py-2 rounded-full shadow-sm text-sm font-bold transition-all"
                            >
                                <span className="hidden sm:inline">Logout</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="w-full flex flex-col items-center p-4 md:p-8">

            <main className="w-full max-w-screen-2xl space-y-8 print:m-0 print:space-y-4">
                {/* Status Overview Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
                    {/* Risk Level Card */}
                    <div className={`p-6 rounded-2xl border flex flex-col items-start justify-between h-32 ${getStatusColor(currentStatus.riskLevel)}`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Risk Level</span>
                        </div>
                        <span className="text-3xl font-bold">{currentStatus.riskLevel}</span>
                    </div>

                    {/* Heart Rate Card */}
                    <div className="bg-white p-6 rounded-2xl border border-[#AEB784]/20 shadow-sm flex flex-col items-start justify-between h-32">
                        <div className="flex items-center gap-2 text-[#AEB784]">
                            <Heart className="w-5 h-5 fill-current" />
                            <span className="font-semibold text-[#41431B]">Heart Rate</span>
                        </div>
                        <span className="text-3xl font-bold text-[#41431B]">{currentStatus.heartRate} <span className="text-sm text-[#AEB784] font-normal">bpm</span></span>
                    </div>

                    {/* Last Activity Card */}
                    <div className="bg-white p-6 rounded-2xl border border-[#AEB784]/20 shadow-sm flex flex-col items-start justify-between h-32">
                        <div className="flex items-center gap-2 text-[#AEB784]">
                            <Activity className="w-5 h-5" />
                            <span className="font-semibold text-[#41431B]">Last Activity</span>
                        </div>
                        <span className="text-xl font-bold text-[#41431B]">{currentStatus.lastActivity}</span>
                    </div>
                </section>

                {/* --- Create Elderly Account Section --- */}
                <section className="bg-white p-6 rounded-2xl border border-[#AEB784]/20 shadow-sm print:hidden">
                    <h2 className="text-lg font-bold text-[#41431B] mb-2">Manage Elderly Accounts</h2>
                    <p className="text-sm text-[#AEB784] mb-4 font-medium">Create login credentials for the elderly users you care for.</p>

                    {createMsg.text && (
                        <div className={`p-3 rounded-lg mb-4 text-sm ${createMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {createMsg.text}
                        </div>
                    )}

                    <form
                        className="flex flex-col md:flex-row gap-4 items-start md:items-end"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setCreateMsg({ text: '', type: '' });
                            setIsCreating(true);

                            try {
                                const response = await fetch('http://localhost:5000/api/create-elderly', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ 
                                        email: elderlyEmail, 
                                        password: elderlyPassword,
                                        preferred_language: elderlyLanguage
                                    }),
                                });

                                const data = await response.json();

                                if (!response.ok) throw new Error(data.error || 'Failed to create account');

                                setCreateMsg({ text: 'Account created successfully!', type: 'success' });
                                setElderlyEmail('');
                                setElderlyPassword('');

                                setTimeout(() => setCreateMsg({ text: '', type: '' }), 5000);
                            } catch (err) {
                                setCreateMsg({ text: err.message, type: 'error' });
                            } finally {
                                setIsCreating(false);
                            }
                        }}
                    >
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-[#41431B] mb-1 opacity-80">Username / Email</label>
                            <input
                                type="text"
                                required
                                value={elderlyEmail}
                                onChange={(e) => setElderlyEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-[#AEB784]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEB784]/40 focus:border-[#AEB784] transition-colors bg-white text-[#41431B]"
                                placeholder="e.g. grandpa_joe"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-[#41431B] mb-1 opacity-80">Password</label>
                            <input
                                type="password"
                                required
                                value={elderlyPassword}
                                onChange={(e) => setElderlyPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-[#AEB784]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEB784]/40 focus:border-[#AEB784] transition-colors bg-white text-[#41431B]"
                                placeholder="Create a password"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-[#41431B] mb-1 opacity-80">Language</label>
                            <select
                                value={elderlyLanguage}
                                onChange={(e) => setElderlyLanguage(e.target.value)}
                                className="w-full px-4 py-2 border border-[#AEB784]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AEB784]/40 focus:border-[#AEB784] transition-colors bg-white text-[#41431B]"
                            >
                                <option value="ml-IN">Malayalam (മലയാളം)</option>
                                <option value="en-US">English (US)</option>
                                <option value="en-IN">English (India)</option>
                                <option value="hi-IN">Hindi (हिन्दी)</option>
                                <option value="ta-IN">Tamil (தமிழ்)</option>
                                <option value="te-IN">Telugu (తెలుగు)</option>
                                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                                <option value="mr-IN">Marathi (मराठी)</option>
                                <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                                <option value="bn-IN">Bengali (বাংলা)</option>
                                <option value="es-ES">Spanish (Español)</option>
                                <option value="fr-FR">French (Français)</option>
                                <option value="de-DE">German (Deutsch)</option>
                                <option value="it-IT">Italian (Italiano)</option>
                                <option value="pt-BR">Portuguese (Português)</option>
                                <option value="ru-RU">Russian (Русский)</option>
                                <option value="ar-SA">Arabic (العربية)</option>
                                <option value="zh-CN">Chinese (中文)</option>
                                <option value="ja-JP">Japanese (日本語)</option>
                                <option value="ko-KR">Korean (한국어)</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full md:w-auto px-6 py-2 bg-[#AEB784] hover:bg-[#8a9461] disabled:bg-[#c8d1a1] text-white rounded-lg font-bold shadow-sm transition-colors mt-4 md:mt-0 h-[42px]"
                        >
                            {isCreating ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>
                </section>

                {/* Detailed Status Message */}
                <section className="bg-white p-6 rounded-2xl border border-[#AEB784]/20 shadow-sm print:hidden">
                    <h2 className="text-lg font-bold text-[#41431B] mb-2">Current Condition</h2>
                    <p className="text-[#41431B] opacity-80 font-medium">{currentStatus.statusMessage}</p>
                </section>

                {/* Health Records Table */}
                <section className="bg-white p-6 rounded-2xl border border-[#AEB784]/20 shadow-sm print:border-none print:shadow-none print:p-0">
                    <div className="flex items-center justify-between mb-6 print:hidden">
                        <h2 className="text-lg font-bold text-[#41431B]">Health Records</h2>
                        <button 
                            onClick={downloadPDF}
                            className="flex items-center gap-1 text-sm bg-[#AEB784]/10 text-[#AEB784] hover:bg-[#AEB784]/20 px-3 py-1.5 rounded-lg font-bold transition-colors"
                        >
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>

                    <div id="health-records-table-container" className="overflow-x-auto p-4 bg-white">
                        {/* We add a title inside the container specifically for the PDF download */}
                        <div className="hidden print:block mb-4">
                            <h1 className="text-2xl font-bold text-[#41431B]">EchoCare Health Logs</h1>
                            <p className="text-sm text-[#AEB784]">Generated on: {new Date().toLocaleString()}</p>
                        </div>
                        
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm text-[#AEB784] border-b border-[#AEB784]/20">
                                    <th className="py-3 font-medium">Date</th>
                                    <th className="py-3 font-medium">Type</th>
                                    <th className="py-3 font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {healthLogs.length > 0 ? (
                                    healthLogs.map((log) => (
                                        <tr key={log._id} className="border-b border-[#AEB784]/10 last:border-0 hover:bg-[#F9F9F6] transition-colors">
                                            <td className="py-4 text-[#41431B] text-sm font-medium">
                                                {new Date(log.timestamp).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs text-[#AEB784]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="py-4 text-[#41431B] font-medium text-sm">
                                                <div className="flex flex-col gap-2 items-start">
                                                    <span className="px-2 py-1 rounded-full text-xs bg-[#AEB784]/20 text-[#6a7536] font-bold">
                                                        Voice Log
                                                    </span>
                                                    {log.sentiment && (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            log.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                                                            log.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-200 text-gray-700'
                                                        }`}>
                                                            {log.sentiment}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 text-[#41431B] opacity-80 text-sm max-w-xs truncate" title={log.text}>"{log.text}"</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-4 text-center text-[#AEB784] font-medium">No logs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Progress/Adherence Tracking Placeholder */}
                <section className="bg-white p-6 rounded-2xl border border-[#AEB784]/20 shadow-sm mb-8 print:hidden">
                    <h2 className="text-lg font-bold text-[#41431B] mb-4">Weekly Adherence</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-3 bg-[#F9F9F6] rounded-full overflow-hidden border border-[#AEB784]/20">
                            <div className="h-full bg-[#AEB784] w-3/4 rounded-full"></div>
                        </div>
                        <span className="text-[#41431B] font-bold">75%</span>
                    </div>
                    <p className="text-sm text-[#AEB784] font-medium mt-2">Medication and exercise adherence for this week.</p>
                </section>
            </main>
            </div>

            {/* PROFILE MODAL */}
            {showProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="relative p-8 flex flex-col items-center">
                            <button 
                                onClick={() => setShowProfile(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#AEB784] to-[#8a9461] p-1 shadow-lg mb-6">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <User className="w-12 h-12 text-[#AEB784]" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-extrabold text-[#41431B] mb-1">
                                {getCaregiverName()}
                            </h2>
                            <p className="text-[#AEB784] font-bold text-sm tracking-widest uppercase mb-8">
                                {userRole || 'Caregiver'} Account
                            </p>

                            <div className="w-full space-y-4 mb-8">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-[#AEB784] uppercase tracking-wider mb-1">Email Address</p>
                                    <p className="text-[#41431B] font-medium">{userEmail}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-[#AEB784] uppercase tracking-wider mb-1">Account Role</p>
                                    <p className="text-[#41431B] font-medium capitalize">{userRole || 'Caregiver'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowProfile(false)}
                                className="w-full py-4 bg-[#AEB784] hover:bg-[#8a9461] text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
