import React from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <header className="mb-8 overflow-hidden text-center">
        <h1 className="text-4xl font-bold text-blue-600">EchoCare</h1>
        <p className="text-gray-600 mt-2">Voice-based Health Diary</p>
      </header>
      <main className="w-full max-w-4xl p-4">
        <VoiceRecorder />
      </main>
    </div>
  );
}

export default App;
