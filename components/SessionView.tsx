import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Settings2 } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { InterviewConfig } from '../types';
import AudioVisualizer from './AudioVisualizer';
import InterviewRoom from './InterviewRoom';
import type { UserCamHandle } from './UserCam';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SessionViewProps {
  config: InterviewConfig;
  onEnd: () => void;
  onResult: (summary: string) => void;
}

const SessionView: React.FC<SessionViewProps> = ({ config, onEnd, onResult }) => {
  const {
    connect,
    disconnect,
    isConnected,
    isMicOn,
    toggleMic,
    volumeLevel,
    transcript
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

  const [isFinishing, setIsFinishing] = useState(false);
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
        try { openingAudioRef.current.pause(); openingAudioRef.current.currentTime = 0; } catch (e) { }
      }
    };
  }, [isConnected]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  // PATCH: Generate interview evaluation after session
  const generateResult = async () => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
      Berikut adalah transcript wawancara kandidat (Mungkin terpotong atau belum selesai):

      ${transcript.length > 0 ? transcript.join("\n") : "(Tidak ada percakapan terekam)"}

      Buatkan penilaian lengkap dengan format:

      ## Ringkasan
      (isi ringkas tentang apa yang dibahas sejauh ini)

      ## Kelebihan
      - poin (berdasarkan data yang ada)

      ## Kekurangan
      - poin (berdasarkan data yang ada)

      ## Rekomendasi Perbaikan
      - poin

      Jika data sangat sedikit, berikan penilaian berdasarkan impresi awal atau saran umum.
      Gunakan bahasa Indonesia profesional dan jelas.
          `;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      onResult(text);
    } catch (err) {
      console.error("Summary Generation Error:", err);

      // Fallback: If AI fails (quota/network), show the transcript so user still gets value
      const fallbackText = `
## Hasil Wawancara (Mode Offline/Fallback)

Maaf, AI sedang sibuk atau kuota habis sehingga tidak bisa membuat ringkasan otomatis saat ini. 
Namun, berikut adalah rekam jejak percakapan Anda:

### Transkrip Pecakapan:
${transcript.length > 0 ? transcript.join("\n") : "(Tidak ada data percakapan yang terekam)"}

_Anda dapat mencoba lagi nanti untuk mendapatkan analisis AI yang lebih mendalam._
        `;
      onResult(fallbackText);
    }
  };

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
          disabled={!isConnected || isFinishing}
          className={`p-6 rounded-full shadow-lg transition-all transform hover:scale-110 ${isMicOn
            ? 'bg-slate-700 text-white hover:bg-slate-600'
            : 'bg-red-500 text-white hover:bg-red-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isMicOn ? "Matikan Mikrofon" : "Nyalakan Mikrofon"}
        >
          {isMicOn ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
        </button>

        <button
          onClick={async () => {
            if (isFinishing) return;
            setIsFinishing(true);
            disconnect();
            await generateResult();
            onEnd();
          }}
          className={`p-6 rounded-full shadow-lg transition-all transform hover:scale-110 ${isFinishing ? 'bg-gray-600 cursor-wait' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          title="Akhiri Wawancara"
          disabled={isFinishing}
        >
          <PhoneOff className={`w-8 h-8 ${isFinishing ? 'animate-pulse' : ''}`} />
        </button>
      </div>


    </div>
  );
};

export default SessionView;
