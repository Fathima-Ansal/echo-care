import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import VoiceButton from '../components/VoiceButton';
import { Activity, Sun, Moon } from 'lucide-react';
import { encodeWAV } from '../utils/wavEncoder';

export default function ElderlyDashboard() {
    const { logout, userEmail, token } = useContext(AuthContext);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [healthLogs, setHealthLogs] = useState([]);
    const [audioURL, setAudioURL] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Audio Refs
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const inputRef = useRef(null);
    const audioDataRef = useRef([]);
    const stopRecordingRef = useRef(null);

    // Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Health Logs
    const fetchLogs = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/logs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setHealthLogs(data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [transcription]); // Refetch when a new transcription is added

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
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setTranscription(data.text);

                // If AI Companion replied with audio, play it automatically
                if (data.audio_b64) {
                    const audioSrc = "data:audio/mp3;base64," + data.audio_b64;
                    const audioObj = new Audio(audioSrc);
                    audioObj.play().catch(e => console.error("Auto-play blocked:", e));
                }
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

    // Ensure stopRecordingRef is always up to date with the latest closure
    stopRecordingRef.current = stopRecording;

    const handleSOS = async () => {
        // Start automatic 30-second emergency recording without blocking the UI
        if (!isRecording) {
            startRecording().then(() => {
                setTranscription("🆘 EMERGENCY ALERT SENT! Recording surroundings for 30 seconds...");
            });

            // Trigger the SOS call to Caretaker
            try {
                const response = await fetch('http://127.0.0.1:5000/api/sos', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setTranscription("🆘 EMERGENCY ALERT SENT! Calling your caretaker now...");
                } else {
                    const data = await response.json();
                    console.error("SOS Call failed:", data.error);
                    // Append err to status
                    setTranscription(prev => prev + " (Call failed: " + (data.error || "Unknown") + ")");
                }
            } catch (error) {
                console.error("Error triggering SOS call:", error);
                setTranscription(prev => prev + " (Network error on call)");
            }

            setTimeout(() => {
                if (stopRecordingRef.current) {
                    console.log("SOS 30-second timeout reached. Stopping recording.");
                    stopRecordingRef.current();
                }
            }, 30000); // Stop automatically after 30 seconds
        } else {
            setTranscription("🆘 EMERGENCY ALERT SENT! Already recording...");
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return "Good Morning";
        if (hour >= 12 && hour < 17) return "Good Afternoon";
        if (hour >= 17 && hour < 22) return "Good Evening";
        return "Good Night";
    };

    // Helper to extract name from email
    const getUserName = () => {
        if (!userEmail) return "Guest";
        return userEmail.split('@')[0];
    };

    return (
        <div className="min-h-screen bg-[#F4F5F0]  font-sans text-[#41431B]  transition-colors duration-300">

            {/* Background Animations changed to subtle greens */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#AEB784] to-transparent"></div>
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#AEB784] rounded-full blur-3xl opacity-40"></div>
                <div className="absolute top-40 -left-20 w-72 h-72 bg-[#AEB784] rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 pb-32">

                {/* HEADER */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 md:mb-14 gap-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#41431B]  leading-tight">
                            {getGreeting()}, <span className="capitalize">{getUserName()}</span>
                        </h1>
                        <p className="text-[#AEB784]  text-lg md:text-xl mt-3 font-semibold">
                            Ready for a great day?
                        </p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-full bg-white border-2 border-[#AEB784]/60  text-gray-500  hover:bg-gray-100  transition-all shadow-sm"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={logout}
                            className="bg-white  border-2 border-[#AEB784]  hover:bg-[#AEB784]  hover:text-white  text-[#41431B] px-6 py-2 rounded-full shadow-sm font-semibold transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                <main className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
                    {/* VOICE CARD */}
                    <div className="bg-white/95  backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl  drop-shadow-xl border-4 border-white  flex flex-col items-center justify-center min-h-[450px] md:min-h-[500px] transition-colors duration-300">

                        <VoiceButton
                            isRecording={isRecording}
                            onClick={toggleRecording}
                        />

                        <div className="mt-8 text-center">
                            {transcription ? (
                                <p className="text-2xl font-medium">
                                    "{transcription}"
                                </p>
                            ) : (
                                <p className="text-slate-400 text-xl">
                                    Tap microphone to speak
                                </p>
                            )}

                            {audioURL && (
                                <audio
                                    src={audioURL}
                                    controls
                                    className="mt-4"
                                />
                            )}
                        </div>
                    </div>

                    {/* RECENT HEALTH LOGS */}
                    <section className="bg-white/95  backdrop-blur-md rounded-3xl p-8 shadow-sm border border-[#AEB784]/20  transition-colors duration-300">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-[#41431B] ">
                            <Activity className="w-6 h-6 text-[#AEB784]" />
                            Recent Health Logs
                        </h2>

                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {healthLogs.length > 0 ? (
                                healthLogs.slice(0, 5).map((log) => (
                                    <div
                                        key={log._id}
                                        className="p-4 bg-[#AEB784]/10 rounded-xl"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <p className="font-medium text-[#41431B]">
                                                <span className="font-bold opacity-75">You:</span> "{log.text}"
                                            </p>
                                            {log.sentiment && (
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${log.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                                                        log.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-200 text-gray-700'
                                                    }`}>
                                                    {log.sentiment === 'Positive' ? '😊 Positive' :
                                                        log.sentiment === 'Negative' ? '🚨 Critical' :
                                                            '😐 Neutral'}
                                                </span>
                                            )}
                                        </div>
                                        {log.reply && (
                                            <div className="font-medium text-[#41431B] mt-2 bg-white/50 p-3 rounded-lg border border-[#AEB784]/20 shadow-sm flex items-start justify-between gap-4">
                                                <p>
                                                    <span className="font-bold text-blue-800">Companion:</span> {log.reply}
                                                </p>
                                                {log.audio_b64 && (
                                                    <button
                                                        onClick={() => {
                                                            console.log("Playing base64 audio manually");
                                                            const audioObj = new Audio("data:audio/mp3;base64," + log.audio_b64);
                                                            audioObj.play().catch(e => console.error("Manual play error:", e));
                                                        }}
                                                        className="p-3 bg-blue-100/80 hover:bg-blue-200 rounded-full flex-shrink-0 shadow-sm transition-all"
                                                        title="Play audio out loud"
                                                    >
                                                        🔊
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-sm text-[#AEB784] mt-2 font-medium">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[#AEB784] text-center font-medium">
                                    No recent logs found.
                                </p>
                            )}
                        </div>
                    </section>
                </main>

                {/* SOS BUTTON */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg">
                    <button
                        onClick={handleSOS}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-3xl shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        EMERGENCY SOS
                    </button>
                </div>

            </div>
        </div>
    );
}
