import React, { useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Settings2 } from 'lucide-react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { InterviewConfig } from '../types';
import AudioVisualizer from './AudioVisualizer';
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
      Berikut adalah transcript wawancara kandidat:

      ${transcript.join("\n")}

      Buatkan penilaian lengkap dengan format:

      ## Ringkasan
      (isi ringkas)

      ## Kelebihan
      - poin

      ## Kekurangan
      - poin

      ## Rekomendasi Perbaikan
      - poin

      Gunakan bahasa Indonesia profesional dan jelas.
          `;

        const result = await model.generateContent(prompt);
        const text = await result.response.text();
        onResult(text);
      } catch (err) {
        onResult("Gagal menghasilkan hasil wawancara.");
      }
    };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-4xl mx-auto p-6">

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
      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 flex items-center justify-center">
        {isConnected ? (
          <AudioVisualizer
            volume={volumeLevel}
            isActive={isConnected}
            color={isMicOn ? '#06B6D4' : '#EF4444'}
          />
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
          onClick={async () => {
            disconnect();
            await generateResult();
            onEnd();
          }}
          className="p-6 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all transform hover:scale-110"
          title="Akhiri Wawancara"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>

      <div className="mt-8 text-slate-500 text-sm">
        {isMicOn ? "Mendengarkan... Silakan berbicara dengan natural." : "Mikrofon dimatikan."}
      </div>
    </div>
  );
};

export default SessionView;
