import { useState } from 'react';
import VoiceButton from '../components/VoiceButton';
import MedicationItem from '../components/MedicationItem';
import { Heart, Activity, Calendar, AlertCircle } from 'lucide-react';

export default function ElderlyDashboard() {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("Good");
    const [medications, setMedications] = useState([
        { id: 1, name: "Morning Pill", time: "8:00 AM", taken: false },
        { id: 2, name: "Vitamin D", time: "10:00 AM", taken: false }
    ]);

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

    const toggleMedication = (id: number) => {
        setMedications(medications.map(med =>
            med.id === id ? { ...med, taken: !med.taken } : med
        ));
    };

    const handleSOS = () => {
        alert("🆘 Calling Caregiver... Emergency Alert Sent!");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-md flex justify-between items-center mb-8 mt-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Hello, Fatima</h1>
                    <p className="text-gray-600 text-lg mt-1">Ready for the day?</p>
                </div>
                <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima"
                        alt="Profile"
                        className="w-14 h-14 rounded-full"
                    />
                </div>
            </header>

            {/* Quick Mood Selector */}
            <section className="w-full max-w-md mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 ml-1">How do you feel?</h2>
                <div className="flex justify-between gap-4">
                    {['😊', '😐', '😔'].map((emoji, idx) => (
                        <button
                            key={idx}
                            className="flex-1 bg-white border border-gray-200 rounded-2xl h-24 text-4xl shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all active:scale-95"
                            onClick={() => setStatus(idx === 0 ? "Great" : idx === 1 ? "Okay" : "Unwell")}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </section>

            {/* Main Action Area */}
            <main className="flex flex-col items-center justify-center w-full max-w-md mb-10">
                <VoiceButton isRecording={isRecording} onClick={toggleRecording} />
                <p className="text-gray-400 mt-6 text-sm font-medium uppercase tracking-wide">Tap microphone to speak</p>
            </main>

            {/* Medication List */}
            <section className="w-full max-w-md mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 ml-1">Daily Medicines</h2>
                <div className="flex flex-col gap-0">
                    {medications.map(med => (
                        <MedicationItem
                            key={med.id}
                            name={med.name}
                            time={med.time}
                            taken={med.taken}
                            onToggle={() => toggleMedication(med.id)}
                        />
                    ))}
                </div>
            </section>

            {/* Vital Stats */}
            <section className="w-full max-w-md grid grid-cols-2 gap-4 mb-20">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2">
                    <Heart className="w-8 h-8 text-red-500 mb-1" />
                    <span className="text-gray-500 font-medium text-sm">Heart Rate</span>
                    <span className="text-2xl font-bold text-gray-800">72 <span className="text-sm text-gray-400 font-normal">bpm</span></span>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2">
                    <Activity className="w-8 h-8 text-blue-500 mb-1" />
                    <span className="text-gray-500 font-medium text-sm">Status</span>
                    <span className={`text-xl font-bold ${status === 'Unwell' ? 'text-red-500' : 'text-green-600'}`}>
                        {status}
                    </span>
                </div>
            </section>

            {/* SOS Button - Fixed at Bottom */}
            <div className="fixed bottom-6 w-full max-w-md px-4">
                <button
                    onClick={handleSOS}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-colors"
                >
                    <AlertCircle className="w-6 h-6" />
                    <span className="text-xl">EMERGENCY SOS</span>
                </button>
            </div>

        </div>
    );
}
