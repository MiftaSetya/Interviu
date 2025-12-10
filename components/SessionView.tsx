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

// console.log('API Key:', process.env.API_KEY);



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
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key tidak ditemukan. Pastikan konfigurasi .env benar.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      // Reverting to gemini-2.0-flash-exp as requested
      const model = genAI.getGenerativeModel({ model: "	gemini-2.5-flash-lite" });

      const conversationText = transcript.length > 0
        ? transcript.join("\n")
        : "(Tidak ada percakapan terekam. Mungkin sesi terlalu singkat atau audio tidak terdeteksi.)";

      const prompt = `
      Berikut adalah transkrip wawancara antara Pewawancara (AI) dan Kandidat (User):

      ${conversationText}

      --------------------------------------------------
      Berdasarkan percakapan di atas, berikan evaluasi lengkap untuk kandidat dengan struktur berikut:

      ## Skor
      (Berikan skor angka bulat 0-100 berdasarkan performa keseluruhan)

      ## Ringkasan Eksekutif
      (Jelaskan secara singkat apa yang dibahas dan kesan umum terhadap kandidat)

      ## Kelebihan Kandidat
      - Komunikasi Kandidat: (analisis gaya bicara)
      - Kompetensi: (analisis keahlian teknis/soft skill yang muncul)
      - Poin positif lainnya

      ## Kekurangan / Area Pengembangan
      - Poin yang perlu diperbaiki
      - Kesalahan yang mungkin dilakukan saat menjawab

      ## Rekomendasi
      (Saran konkrit untuk kandidat agar lebih sukses di wawancara berikutnya)

      Gunakan Bahasa Indonesia yang profesional, objektif, dan konstruktif. Hindari kalimat yang berulang-ulang.
      Jika data percakapan sangat sedikit, berikan feedback berdasarkan seberapa responsif kandidat diawal sesi.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      onResult(text);
    } catch (err) {
      console.error("Summary Generation Error:", err);

      // Fallback message with debug info
      let errorMessage = "Maaf, gagal membuat ringkasan otomatis.";
      let errorDetail = "";

      if (err instanceof Error) {
        errorDetail = err.message;
        if (err.message.includes("API Key")) errorMessage += " (API Key bermasalah)";
        else if (err.message.includes("404")) errorMessage += " (Model AI tidak tersedia atau salah nama model)";
        else if (err.message.includes("429")) errorMessage += " (Quota habis/Rate limit)";
      } else {
        errorDetail = String(err);
      }

      const fallbackText = `
### ${errorMessage}
> *Debug Error: ${errorDetail}*

### Transkrip Sesi:
${transcript.length > 0 ? transcript.join("\n") : "(Tidak ada data percakapan)"}

_Silakan cek koneksi internet atau konfigurasi API Key Anda._
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
            <p>Menanalisis wawancara</p>
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
