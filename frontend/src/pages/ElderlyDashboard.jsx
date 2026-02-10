import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VoiceButton from '../components/VoiceButton';
import MedicationItem from '../components/MedicationItem';
import { Heart, Activity, Calendar, AlertCircle } from 'lucide-react';
import { encodeWAV } from '../utils/wavEncoder';

export default function ElderlyDashboard() {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("Good");
    const [transcription, setTranscription] = useState('');
    const [audioURL, setAudioURL] = useState('');
    const [medications, setMedications] = useState([
        { id: 1, name: "Morning Pill", time: "8:00 AM", taken: false },
        { id: 2, name: "Vitamin D", time: "10:00 AM", taken: false }
    ]);

    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const inputRef = useRef(null);
    const audioDataRef = useRef([]);

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

        setTranscription("Transcribing...");

        try {
            const response = await fetch('http://127.0.0.1:5000/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setTranscription(data.text);
                setStatus("Monitoring"); // Update status after successful recording
            } else {
                console.error("Transcription error:", data.error);
                setTranscription("Error: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Network error:", error);
            setTranscription("Network error. Please check your connection.");
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
        alert("🆘 Calling Caregiver... Emergency Alert Sent!");
    };

    return (
        <div className="min-h-screen bg-[#F4F6F8] p-4 pb-24 flex flex-col items-center">
            {/* Navigation Switch */}
            <Link to="/caretaker" className="fixed bottom-4 right-4 bg-[#1976D2] text-white px-4 py-2 rounded-full shadow-lg text-sm hover:bg-[#1565C0] transition-colors z-50">
                Switch to Caretaker View
            </Link>

            {/* Header */}
            <header className="w-full max-w-md flex justify-between items-center mb-8 mt-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#222222]">Hello, Fatima</h1>
                    <p className="text-[#222222] text-lg mt-1">Ready for the day?</p>
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
                <h2 className="text-lg font-semibold text-[#222222] mb-4 ml-1">How do you feel?</h2>
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
                <p className="text-gray-400 mt-6 text-sm font-medium uppercase tracking-wide">
                    {isRecording ? "Listening..." : "Tap microphone to speak"}
                </p>

                {audioURL && (
                    <div className="mt-4 w-full">
                        <audio src={audioURL} controls className="w-full h-10 accent-indigo-500" />
                    </div>
                )}

                {transcription && (
                    <div className="mt-4 w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-gray-700 italic">"{transcription}"</p>
                    </div>
                )}
            </main>

            {/* Medication List */}
            <section className="w-full max-w-md mb-8">
                <h2 className="text-lg font-semibold text-[#222222] mb-4 ml-1">Daily Medicines</h2>
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
                    <span className={`text-xl font-bold ${status === 'Unwell' ? 'text-[#D32F2F]' : 'text-[#388E3C]'}`}>
                        {status}
                    </span>
                </div>
            </section>

            {/* SOS Button - Fixed at Bottom */}
            <div className="fixed bottom-6 w-full max-w-md px-4">
                <button
                    onClick={handleSOS}
                    className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-colors"
                >
                    <AlertCircle className="w-6 h-6" />
                    <span className="text-xl">EMERGENCY SOS</span>
                </button>
            </div>

        </div>
    );
}
