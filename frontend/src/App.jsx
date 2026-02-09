import React from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
          EchoCare
        </h1>
        <p className="text-xl text-slate-500 mt-3 font-light">
          Your Personal Voice Health Companion
        </p>
      </header>
      <main className="w-full">
        <VoiceRecorder />
      </main>
      <footer className="mt-12 text-slate-400 text-sm">
        Designed for You ❤️
      </footer>
    </div>
  );
}

export default App;
