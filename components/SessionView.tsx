import React, { useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Settings2 } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { InterviewConfig } from '../types';
import AudioVisualizer from './AudioVisualizer';

interface SessionViewProps {
  config: InterviewConfig;
  onEnd: () => void;
}

const SessionView: React.FC<SessionViewProps> = ({ config, onEnd }) => {
  const {
    connect,
    disconnect,
    isConnected,
    isMicOn,
    toggleMic,
    volumeLevel,
  } = useGeminiLive({
    config,
    onDisconnect: () => {
        // Optional: Auto-close on remote disconnect
    },
    onError: (e) => {
        alert(e.message);
        onEnd();
    }
  });

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-4xl mx-auto p-6">
      
      {/* Header Info */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Interviewing for {config.roleOrScholarshipName}
        </h2>
        <p className="text-slate-400">
          at {config.companyOrOrg} • <span className="text-primary font-medium">{isConnected ? 'Live' : 'Connecting...'}</span>
        </p>
      </div>

      {/* Visualizer Area */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 flex items-center justify-center">
        {isConnected ? (
             <AudioVisualizer 
                volume={volumeLevel} 
                isActive={isConnected} 
                color={isMicOn ? '#4F46E5' : '#EF4444'} 
             />
        ) : (
             <div className="animate-pulse flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 border-4 border-slate-600 border-t-primary rounded-full animate-spin mb-4"></div>
                <p>Establishing secure connection...</p>
             </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 z-10">
        <button
          onClick={toggleMic}
          disabled={!isConnected}
          className={`p-6 rounded-full shadow-lg transition-all transform hover:scale-110 ${
            isMicOn
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-red-500 text-white hover:bg-red-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicOn ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
        </button>

        <button
          onClick={() => {
            disconnect();
            onEnd();
          }}
          className="p-6 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all transform hover:scale-110"
          title="End Interview"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>

      <div className="mt-8 text-slate-500 text-sm">
        {isMicOn ? "Listening... Speak naturally." : "Microphone muted."}
      </div>
    </div>
  );
};

export default SessionView;
