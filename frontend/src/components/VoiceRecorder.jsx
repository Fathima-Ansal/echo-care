import React, { useState, useRef, useEffect } from 'react';
import { encodeWAV } from '../utils/wavEncoder';

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [audioURL, setAudioURL] = useState('');

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
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setTranscription(data.text);
      } else {
        console.error("Transcription error:", data.error);
        setTranscription("Error: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Network error:", error);
      setTranscription("Network error. Please check your connection.");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
      <h2 className="text-3xl font-bold mb-8 text-center text-slate-700 tracking-tight">
        Malayalam Voice Diary
      </h2>

      <div className="flex flex-col items-center justify-center mb-8">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`
            relative group flex items-center justify-center
            w-32 h-32 rounded-full transition-all duration-300 ease-in-out
            shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95
            ${isRecording
              ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-200'
              : 'bg-indigo-500 hover:bg-indigo-600 ring-4 ring-indigo-200'}
          `}
          aria-label={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {/* Ping animation effect when recording */}
          {isRecording && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
          )}

          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-12 h-12 text-white z-10"
          >
            {isRecording ? (
              // Stop Icon (Square)
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            ) : (
              // Mic Icon
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>

        <p className="mt-6 text-xl font-medium text-slate-600">
          {isRecording ? "Listening..." : "Tap to Speak"}
        </p>
      </div>

      {audioURL && (
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <audio src={audioURL} controls className="w-full h-10 accent-indigo-500" />
        </div>
      )}

      <div className="mt-8">
        <label className="block text-lg font-semibold text-slate-700 mb-3 ml-1">
          Your Note:
        </label>
        <div className="
            min-h-[160px] p-6 
            bg-slate-50 rounded-2xl 
            border-2 border-slate-100 
            text-lg text-slate-800 leading-relaxed
            shadow-inner
        ">
          {transcription ? (
            transcription
          ) : (
            <span className="text-slate-400 italic">
              Recorded text will appear here...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
