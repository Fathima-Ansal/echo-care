import { useState } from 'react';
import VoiceButton from '../components/VoiceButton';
import { Heart, Activity, Calendar, Sun, Moon } from 'lucide-react';

export default function ElderlyDashboard() {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("Good");

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        if (!isRecording) {
            setTimeout(() => {
                setIsRecording(false);
                alert("Recorded: 'I am feeling a bit tired today.'");
                setStatus("Monitoring");
            }, 3000);
        }
    };

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 p-6 md:p-12 transition-all duration-500 ease-in-out">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

                {/* Header Section (Top on mobile, Left Col on Desktop) */}
                <header className="lg:col-span-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-white p-2 rounded-full shadow-md">
                            <Sun className="w-8 h-8 text-orange-400" />
                        </div>
                        <span className="text-xl text-gray-500 font-medium">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-gray-800 tracking-tight leading-tight mb-4">
                        {getTimeOfDay()}, <br /> <span className="text-rose-500">Fatima</span>
                    </h1>
                    <p className="text-2xl text-gray-500 font-light max-w-2xl">
                        I'm here to listen. How are you feeling right now?
                    </p>
                </header>

                {/* Profile & Navigation (Right Col Top) */}
                <div className="lg:col-span-4 flex flex-col items-end gap-4">
                    <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-white/50">
                        <div className="text-right hidden sm:block">
                            <p className="font-bold text-gray-800">Fatima Al-Zahra</p>
                            <p className="text-sm text-gray-500">EchoCare User</p>
                        </div>
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima"
                            alt="Profile"
                            className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                        />
                    </div>

                    <a href="/caretaker" className="group flex items-center gap-2 bg-white/80 hover:bg-white text-gray-600 px-6 py-3 rounded-full shadow-sm hover:shadow-md transition-all border border-gray-100 font-medium">
                        Caretaker View
                        <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs group-hover:bg-gray-800 group-hover:text-white transition-colors">→</span>
                    </a>
                </div>

                {/* Main Interaction Area (Center-Left) */}
                <main className="lg:col-span-8 flex flex-col items-center justify-center py-12 lg:py-0">
                    <div className="relative">
                        {/* Pulsing effect behind button */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-200 rounded-full blur-3xl opacity-30 animate-pulse ${isRecording ? 'bg-red-400 scale-125' : ''}`}></div>
                        <VoiceButton isRecording={isRecording} onClick={toggleRecording} />
                        <p className={`mt-8 text-center text-xl font-medium transition-colors ${isRecording ? 'text-rose-600 animate-pulse' : 'text-gray-400'}`}>
                            {isRecording ? "Listening..." : "Tap to Speak"}
                        </p>
                    </div>
                </main>

                {/* Status Cards (Right Column) */}
                <aside className="lg:col-span-4 flex flex-col gap-6 justify-center">
                    <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-red-50 p-4 rounded-2xl">
                                <Heart className="w-8 h-8 text-red-500" />
                            </div>
                            <span className="text-xl text-gray-600 font-medium">Heart Rate</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-bold text-gray-800">72</span>
                            <span className="text-xl text-gray-400 font-medium">bpm</span>
                        </div>
                        <p className="text-gray-400 mt-2">Normal rhythm</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-blue-50 p-4 rounded-2xl">
                                <Activity className="w-8 h-8 text-blue-500" />
                            </div>
                            <span className="text-xl text-gray-600 font-medium">Status</span>
                        </div>
                        <span className="text-4xl font-bold text-gray-800 block mb-2">{status}</span>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-full rounded-full"></div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
