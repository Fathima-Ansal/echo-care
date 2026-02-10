import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VoiceButton from '../components/VoiceButton';
import MedicationItem from '../components/MedicationItem';
import { Heart, Activity, AlertCircle, Phone, Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { encodeWAV } from '../utils/wavEncoder';

export default function ElderlyDashboard() {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("Good");
    const [transcription, setTranscription] = useState('');
    const [audioURL, setAudioURL] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [medications, setMedications] = useState([
        { id: 1, name: "Morning Pill", time: "8:00 AM", taken: false },
        { id: 2, name: "Vitamin D", time: "10:00 AM", taken: false },
        { id: 3, name: "Heart Meds", time: "2:00 PM", taken: false },
    ]);

    // Audio Refs
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const inputRef = useRef(null);
    const audioDataRef = useRef([]);

    // Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Cleanup Audio Context
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            inputRef.current = audioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            audioDataRef.current = [];

            processorRef.current.onaudioprocess = (e) => {
                const channelData = e.inputBuffer.getChannelData(0);
                audioDataRef.current.push(new Float32Array(channelData));
            };

            inputRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            setIsRecording(true);
            setTranscription('');
            setAudioURL('');
        } catch (error) {
            console.error("Error accessing microphone:", error);
            setTranscription("Error accessing microphone: " + error.message);
        }
    };

    const stopRecording = async () => {
        if (isRecording) {
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current.onaudioprocess = null;
            }
            if (inputRef.current) {
                inputRef.current.disconnect();
            }

            const totalLength = audioDataRef.current.reduce((acc, val) => acc + val.length, 0);
            const result = new Float32Array(totalLength);
            let offset = 0;
            for (const arr of audioDataRef.current) {
                result.set(arr, offset);
                offset += arr.length;
            }

            const sampleRate = audioContextRef.current.sampleRate;
            const wavData = encodeWAV(result, sampleRate);

            const audioBlob = new Blob([wavData], { type: 'audio/wav' });
            const url = URL.createObjectURL(audioBlob);
            setAudioURL(url);

            setIsRecording(false);
            sendToBackend(audioBlob);
        }
    };

    const sendToBackend = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        setTranscription("Thinking...");

        try {
            const response = await fetch('http://127.0.0.1:5000/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setTranscription(data.text);
                setStatus("Monitoring");
            } else {
                console.error("Transcription error:", data.error);
                setTranscription("Error: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Network error:", error);
            setTranscription("Network error. check connection.");
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const toggleMedication = (id) => {
        setMedications(medications.map(med =>
            med.id === id ? { ...med, taken: !med.taken } : med
        ));
    };

    const handleSOS = () => {
        // In a real app, this would trigger a call/SMS API
        alert("🆘 EMERGENCY ALERT SENT TO CAREGIVERS & DR. SMITH");
    };

    const handleCall = (name) => {
        // In a real app, use tel: protocol or specific API
        const confirmCall = window.confirm(`Call ${name}?`);
        if (confirmCall) {
            window.location.href = "tel:555-123-4567";
        }
    };

    // Helper for greeting
    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100 to-transparent"></div>
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:px-8 pb-32">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#222222] tracking-tight">{getGreeting()}, Fatima</h1>
                        <p className="text-slate-500 text-xl mt-3 font-medium">Ready for a great day?</p>
                    </div>

                    {/* Time & Weather Widget */}
                    <div className="flex items-center gap-8 bg-white/60 backdrop-blur-lg p-5 px-8 rounded-[2rem] shadow-sm border border-white/50">
                        <div className="text-right">
                            <div className="text-3xl font-bold text-slate-700 leading-none">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-wider">
                                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                        <div className="h-12 w-px bg-slate-200 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <Sun className="w-9 h-9 text-amber-500 mb-1" />
                            <span className="text-lg font-bold text-slate-700">24°C</span>
                        </div>
                        <div className="hidden md:block pl-2">
                            <div className="w-16 h-16 rounded-full p-1 bg-white border-2 border-slate-100 shadow-sm">
                                <img
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima"
                                    alt="Profile"
                                    className="w-full h-full rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">

                    {/* Left Column: Voice & Status (Main Focus) */}
                    <div className="xl:col-span-7 flex flex-col gap-8">

                        {/* Voice Interaction Card */}
                        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-10 md:p-14 shadow-lg border border-white flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">

                            {/* Hint Text */}
                            <div className="absolute top-10 left-0 w-full text-center">
                                <span className="inline-block px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold tracking-wide uppercase">
                                    AI Assistant
                                </span>
                            </div>

                            <div className="my-auto">
                                <VoiceButton isRecording={isRecording} onClick={toggleRecording} />
                            </div>

                            {/* Feedback Area */}
                            <div className="mt-8 w-full max-w-lg text-center min-h-[100px] flex flex-col justify-end pb-4">
                                {transcription ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <p className="text-2xl font-medium text-slate-700 leading-relaxed">"{transcription}"</p>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-xl font-medium">Tap microphone to speak</p>
                                )}

                                {audioURL && (
                                    <div className="mt-6 flex justify-center">
                                        <audio src={audioURL} controls className="h-8 rounded-full shadow-sm opacity-80" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Medications (Moved Here) */}
                        <section className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-sm p-8">
                            <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
                                <span className="bg-orange-100 text-orange-600 p-2 rounded-xl"><Sun className="w-6 h-6" /></span>
                                Medications
                            </h2>
                            <div className="space-y-4">
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

                    </div>

                    {/* Right Column: Quick Call & Vitals */}
                    <div className="xl:col-span-5 flex flex-col gap-8">

                        {/* Quick Call / Family */}
                        <section className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                                    <Phone className="w-6 h-6 text-blue-500" />
                                    Quick Call
                                </h2>
                                <button className="text-blue-600 text-sm font-semibold hover:underline bg-blue-50 px-3 py-1 rounded-full">View All</button>
                            </div>
                            <div className="flex gap-6 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide">
                                {[
                                    { name: "Sonia", role: "Daughter", color: "bg-rose-100 text-rose-600" },
                                    { name: "Dr. Smith", role: "Doctor", color: "bg-blue-100 text-blue-600" },
                                    { name: "Alex", role: "Nurse", color: "bg-emerald-100 text-emerald-600" }
                                ].map((contact, i) => (
                                    <button key={i} className="flex flex-col items-center min-w-[90px] group" onClick={() => handleCall(contact.name)}>
                                        <div className={`
                                            w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold
                                            bg-white p-1 shadow-sm group-hover:shadow-md transition-all border-4 border-transparent group-hover:border-blue-300 relative
                                            ${contact.color}
                                        `}>
                                            {contact.name.charAt(0)}
                                            {/* Status Dot */}
                                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <span className="text-lg font-bold text-slate-700 mt-3">{contact.name}</span>
                                        <span className="text-sm text-slate-400 font-medium">{contact.role}</span>
                                    </button>
                                ))}
                                <button className="flex flex-col items-center min-w-[90px] group">
                                    <div className="w-20 h-20 rounded-full bg-slate-100/50 flex items-center justify-center shadow-inner group-hover:bg-slate-200 transition-colors border-2 border-dashed border-slate-300">
                                        <span className="text-3xl text-slate-400 mb-1">+</span>
                                    </div>
                                    <span className="text-lg font-bold text-slate-400 mt-3">Add</span>
                                </button>
                            </div>
                        </section>

                        {/* Vital Stats Cards (Stacked Vertically) */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between min-h-40 relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Heart className="w-32 h-32 text-red-500" /></div>
                                <div className="flex items-center gap-4 z-10">
                                    <div className="p-4 bg-red-50 rounded-2xl"><Heart className="w-8 h-8 text-red-500 fill-current" /></div>
                                    <div>
                                        <span className="font-bold text-sm uppercase tracking-wider text-red-600 block mb-1">Heart Rate</span>
                                        <span className="text-5xl font-extrabold text-slate-800">72</span>
                                        <span className="text-lg text-slate-400 font-medium ml-2">bpm</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between min-h-40 relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-32 h-32 text-emerald-500" /></div>
                                <div className="flex items-center gap-4 z-10">
                                    <div className="p-4 bg-emerald-50 rounded-2xl"><Activity className="w-8 h-8 text-emerald-500" /></div>
                                    <div>
                                        <span className="font-bold text-sm uppercase tracking-wider text-emerald-600 block mb-1">Status</span>
                                        <span className={`text-4xl font-bold ${status === 'Unwell' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {status}
                                        </span>
                                        <span className="text-lg text-slate-400 font-medium ml-2">Overall</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>

                {/* Switch View Button (Floating) */}
                <Link to="/caretaker" className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold hover:bg-slate-900 transition-all z-40 flex items-center gap-2">
                    <span>Caregiver Mode</span>
                </Link>

                {/* SOS Button - Always visible at bottom on mobile, fixed on desktop */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
                    <button
                        onClick={handleSOS}
                        className="w-full relative group overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-3 border-4 border-white/30"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <AlertCircle className="w-7 h-7 animate-pulse" />
                        <span className="text-xl tracking-widest">EMERGENCY SOS</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
