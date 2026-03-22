import { Mic } from 'lucide-react';

export default function VoiceButton({ isRecording, onClick }) {
    return (
        <div className="relative flex items-center justify-center">
            {/* Pulsing rings when recording */}
            {isRecording && (
                <>
                    <div className="absolute w-48 h-48 sm:w-64 sm:h-64 bg-red-500/20 rounded-full animate-ping" />
                    <div className="absolute w-40 h-40 sm:w-56 sm:h-56 bg-red-500/30 rounded-full animate-pulse" />
                </>
            )}

            <button
                onClick={onClick}
                className={`
                    relative flex items-center justify-center w-36 h-36 sm:w-48 sm:h-48 rounded-full 
                    backdrop-blur-md border-[6px] transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.15)]
                    ${isRecording
                        ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-400 rotate-180 scale-110'
                        : 'bg-gradient-to-br from-[#AEB784] to-[#8a9461] border-[#AEB784]/50 hover:scale-105 hover:-translate-y-2'
                    }
                `}
                aria-label={isRecording ? "Stop Recording" : "Start Recording"}
            >
                <div className={`transition-transform duration-500 ${isRecording ? 'rotate-180' : ''}`}>
                    <Mic className={`w-14 h-14 sm:w-20 sm:h-20 text-white drop-shadow-md`} strokeWidth={1.5} />
                </div>
            </button>


            {/* Status Label - Now part of flow to prevent overlap */}
            <div className={`
                mt-8 px-8 py-3 rounded-full backdrop-blur-md transition-all duration-500
                ${isRecording ? 'bg-red-100/80 text-red-600' : 'bg-white/60 text-slate-600 shadow-sm border border-white/50'}
            `}>
                <span className="text-xl font-bold tracking-wide">
                    {isRecording ? "Listening..." : "Tap to Speak"}
                </span>
            </div>
        </div >
    );
}
