import { Mic } from 'lucide-react';

export default function VoiceButton({ isRecording, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
        relative flex items-center justify-center w-48 h-48 rounded-full border-4 transition-all duration-300 shadow-xl
        ${isRecording
                    ? 'bg-[#D32F2F] border-[#B71C1C] animate-pulse scale-105'
                    : 'bg-[#1976D2] border-[#1565C0] hover:scale-105 hover:bg-[#1565C0]'
                }
      `}
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
        >
            <Mic className={`w-24 h-24 ${isRecording ? 'text-white' : 'text-white'}`} />

            {/* Ripple effect text/hint */}
            <span className="absolute -bottom-16 text-xl font-medium text-[#222222]">
                {isRecording ? "Listening..." : "Tap to Speak"}
            </span>
        </button>
    );
}
