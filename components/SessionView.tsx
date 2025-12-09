import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Settings2 } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { InterviewConfig } from '../types';
import AudioVisualizer from './AudioVisualizer';
import InterviewRoom from './InterviewRoom';
import type { UserCamHandle } from './UserCam';

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

  const userCamRef = useRef<UserCamHandle | null>(null);

  // Play opening sound once when connection is established
  const openingAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!isConnected) return;
    try {
      if (!openingAudioRef.current) {
        openingAudioRef.current = new Audio('/assets/opening.mp3');
        openingAudioRef.current.preload = 'auto';
      }
      const playPromise = openingAudioRef.current.play();
      if (playPromise instanceof Promise) {
        playPromise.catch(() => {
          // autoplay might be blocked by browser; ignore
        });
      }
    } catch (e) {
      // ignore errors
    }
    return () => {
      // optional: pause/rewind when disconnected
      if (!isConnected && openingAudioRef.current) {
        try { openingAudioRef.current.pause(); openingAudioRef.current.currentTime = 0; } catch (e) {}
      }
    };
  }, [isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  return (
    <div className="flex flex-col items-center justify-start md:justify-center min-h-[60vh] w-full max-w-4xl mx-auto p-6">

      {/* Header Info */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Wawancara untuk {config.roleOrScholarshipName}
        </h2>
        <p className="text-slate-400">
          di {config.companyOrOrg} • <span className="text-primary font-medium">{isConnected ? 'Terhubung' : 'Menghubungkan...'}</span>
        </p>
      </div>

      {/* Visualizer Area */}
      <div className="relative w-full h-full md:w-full md:h-80 mb-12 flex items-center justify-center">
        {isConnected ? (
            <InterviewRoom volume={volumeLevel} isActive={isMicOn} userCamRef={userCamRef} />
          ) : (
          <div className="animate-pulse flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 border-4 border-slate-600 border-t-primary rounded-full animate-spin mb-4"></div>
            <p>Membangun koneksi aman...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 z-10">
        <button
          onClick={toggleMic}
          disabled={!isConnected}
          className={`p-6 rounded-full shadow-lg transition-all transform hover:scale-110 ${isMicOn
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-red-500 text-white hover:bg-red-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMicOn ? "Matikan Mikrofon" : "Nyalakan Mikrofon"}
        >
          {isMicOn ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
        </button>

        <button
          onClick={() => {
            // stop the user's camera via ref (preferred)
            try {
              userCamRef.current?.stopCamera();
            } catch (e) {}

            disconnect();
            onEnd();
          }}
          className="p-6 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all transform hover:scale-110"
          title="Akhiri Wawancara"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>


    </div>
  );
};

export default SessionView;
