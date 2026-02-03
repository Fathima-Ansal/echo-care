import { useState } from 'react';
import VoiceButton from '../components/VoiceButton';
import { Heart, Activity, Calendar } from 'lucide-react';

export default function ElderlyDashboard() {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("Good");

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        // Logic for speech-to-text would go here
        if (!isRecording) {
            setTimeout(() => {
                setIsRecording(false);
                // Mock processing
                alert("Recorded: 'I am feeling a bit tired today.'");
                setStatus("Monitoring");
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-md flex justify-between items-center mb-10 mt-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Hello, Fatima</h1>
                    <p className="text-gray-500 text-lg">How are you feeling today?</p>
                </div>
                <div className="bg-white p-3 rounded-full shadow-sm">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima"
                        alt="Profile"
                        className="w-12 h-12 rounded-full"
                    />
                </div>
            </header>

            {/* Main Action Area */}
            <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mb-12">
                <VoiceButton isRecording={isRecording} onClick={toggleRecording} />
            </main>

            {/* Status Cards */}
            <section className="w-full max-w-md grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
                    <Heart className="w-8 h-8 text-red-500" />
                    <span className="text-gray-600 font-medium">Heart Rate</span>
                    <span className="text-2xl font-bold text-gray-800">72 <span className="text-sm text-gray-400">bpm</span></span>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
                    <Activity className="w-8 h-8 text-blue-500" />
                    <span className="text-gray-600 font-medium">Status</span>
                    <span className="text-xl font-bold text-gray-800">{status}</span>
                </div>
            </section>

            {/* Date Display */}
            <div className="flex items-center gap-2 text-gray-400 font-medium">
                <Calendar className="w-5 h-5" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>
    );
}
