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

  // Cleanup function to close AudioContext when component unmounts
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

      // Create AudioContext
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      inputRef.current = audioContextRef.current.createMediaStreamSource(stream);

      // Create ScriptProcessor (deprecated but widely supported/easier for simple raw access without worklets setup)
      // Buffer size 4096, 1 input channel, 1 output channel
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      audioDataRef.current = [];

      processorRef.current.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        // Clone the data because the buffer is reused
        audioDataRef.current.push(new Float32Array(channelData));
      };

      inputRef.current.connect(processorRef.current);
      // Processor must be connected to destination for it to work (even if we don't listen to it)
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
      // Note: We don't necessarily close AudioContext here if we want to reuse it, 
      // but creating a new one each time is safer for state reset.

      // Flatten the array of Float32Arrays
      const totalLength = audioDataRef.current.reduce((acc, val) => acc + val.length, 0);
      const result = new Float32Array(totalLength);
      let offset = 0;
      for (const arr of audioDataRef.current) {
        result.set(arr, offset);
        offset += arr.length;
      }

      const sampleRate = audioContextRef.current.sampleRate;

      // Encode to WAV
      const wavData = encodeWAV(result, sampleRate);

      const audioBlob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);

      setIsRecording(false);

      // Send to backend
      sendToBackend(audioBlob);
    }
  };

  const sendToBackend = async (audioBlob) => {
    const formData = new FormData();
    // Filename ending in .wav is CRITICAL for backend to skip ffmpeg conversion
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
        setTranscription("Error during transcription: " + (data.error || "Unknown"));
      }
    } catch (error) {
      console.error("Network error:", error);
      setTranscription("Network error. Ensure backend is running.");
    }
  };

  return (
    <div className="p-4 border rounded shadow-md max-w-md mx-auto mt-10 bg-white">
      <h2 className="text-xl font-bold mb-4 text-center">Malayalam Voice Recorder</h2>

      <div className="flex justify-center mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full animate-pulse"
          >
            Stop Recording
          </button>
        )}
      </div>

      {audioURL && (
        <div className="mb-4">
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}

      <div className="mt-4">
        <h3 className="font-semibold text-gray-700">Transcription:</h3>
        <p className="p-3 bg-gray-100 rounded min-h-[50px] text-gray-800">
          {transcription || "Transcription will appear here..."}
        </p>
      </div>
    </div>
  );
};

export default VoiceRecorder;
