import { Mic } from 'lucide-react';

export default function VoiceButton({ isRecording, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
        relative flex items-center justify-center w-48 h-48 rounded-full border-4 transition-all duration-300 shadow-xl
        ${isRecording
                    ? 'bg-red-500 border-red-600 animate-pulse scale-105'
                    : 'bg-primary border-indigo-600 hover:scale-105 hover:bg-indigo-500'
                }
      `}
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
        >
            <Mic className={`w-24 h-24 ${isRecording ? 'text-white' : 'text-white'}`} />

            {/* Ripple effect text/hint */}
            <span className="absolute -bottom-16 text-xl font-medium text-gray-700">
                {isRecording ? "Listening..." : "Tap to Speak"}
            </span>
        </button>
    );
}
