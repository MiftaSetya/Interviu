import React, { useMemo, useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, Lightbulb, FileText, ArrowLeft, Download, Trophy, Star, TrendingUp } from "lucide-react";

interface ResultViewProps {
  feedback: string;
  onRestart: () => void;
}

// Utility to parse the specific AI markdown format
const parseFeedback = (text: string) => {
  const sections = {
    score: 0,
    summary: "",
    strengths: [] as string[],
    weaknesses: [] as string[],
    recommendations: [] as string[]
  };

  try {
    const scoreMatch = text.match(/## (?:Skor)([\s\S]*?)(?=##|$)/i);
    const summaryMatch = text.match(/## (?:Ringkasan|Ringkasan Eksekutif)([\s\S]*?)(?=##|$)/i);
    const strengthsMatch = text.match(/## (?:Kelebihan|Kelebihan Kandidat)([\s\S]*?)(?=##|$)/i);
    const weaknessesMatch = text.match(/## (?:Kekurangan|Kekurangan \/ Area Pengembangan)([\s\S]*?)(?=##|$)/i);
    const recoMatch = text.match(/## (?:Rekomendasi|Rekomendasi Perbaikan)([\s\S]*?)(?=##|$)/i);

    // Parse Score
    if (scoreMatch) {
      const scoreText = scoreMatch[1].trim();
      const extractedScore = parseInt(scoreText.match(/\d+/)?.[0] || "0", 10);
      sections.score = isNaN(extractedScore) ? 0 : Math.min(100, Math.max(0, extractedScore));
    }

    if (summaryMatch) sections.summary = summaryMatch[1].trim();

    const extractPoints = (raw: string) => {
      return raw.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))
        .map(line => line.replace(/^[-•\d+\.]\s*/, '').trim());
    };

    if (strengthsMatch) sections.strengths = extractPoints(strengthsMatch[1]);
    if (weaknessesMatch) sections.weaknesses = extractPoints(weaknessesMatch[1]);
    if (recoMatch) sections.recommendations = extractPoints(recoMatch[1]);

  } catch (e) {
    console.error("Error parsing feedback", e);
    // Fallback if parsing fails massively
    sections.summary = text;
  }

  return sections;
};

// Animated Counter Component
const AnimatedScore = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue}</>;
};

export default function ResultView({ feedback, onRestart }: ResultViewProps) {
  const data = useMemo(() => parseFeedback(feedback), [feedback]);
  const isRaw = !data.summary && !data.strengths.length;

  // Determine Grade based on score
  const getGrade = (s: number) => {
    if (s >= 90) return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (s >= 80) return { label: "Very Good", color: "text-cyan-400", bg: "bg-cyan-500/20" };
    if (s >= 70) return { label: "Good", color: "text-blue-400", bg: "bg-blue-500/20" };
    if (s >= 50) return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    return { label: "Needs Improvement", color: "text-red-400", bg: "bg-red-500/20" };
  };

  const grade = getGrade(data.score);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 pb-48 animate-fade-in text-white/90">

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]"></div>
      </div>

      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Laporan Wawancara
          </h1>
          <p className="text-slate-500">Evaluasi berbasis AI</p>
        </div>
        {!isRaw && (
          <div className={`px-4 py-1.5 rounded-full border border-white/10 ${grade.bg} ${grade.color} font-medium text-sm flex items-center gap-2`}>
            <TrendingUp size={16} />
            {grade.label}
          </div>
        )}
      </header>

      {isRaw ? (
        <div className="bg-surface border border-slate-700/50 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" /> Parse Error / Raw Output
          </h3>
          <pre className="whitespace-pre-wrap text-slate-300 font-mono text-sm leading-relaxed overflow-x-auto">
            {feedback}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COL: SCORE & SUMMARY */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Score Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center min-h-[300px] group hover:border-primary/30 transition-all duration-500">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]"></div>

              <div className="relative w-40 h-40 mb-6">
                {/* Circular Progress SVG */}
                <svg className="w-full h-full -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-700/30" />
                  <circle
                    cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * data.score) / 100}
                    className={`text-primary transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    <AnimatedScore value={data.score} />
                  </span>
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-1">Skor</span>
                </div>
              </div>

              <p className="text-center text-slate-300 px-4">
                Skor ini merefleksikan performa teknis, kejelasan komunikasi, dan relevansi jawaban Anda.
              </p>
            </div>

            {/* Summary Minimal Card */}
            <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-3xl backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <FileText size={20} className="text-blue-400" /> Ringkasan
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {data.summary || "Tidak ada ringkasan tersedia."}
              </p>
            </div>

          </div>

          {/* MIDDLE/RIGHT COL: DETAILED FEEDBACK */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Bento Grid for Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">

              {/* Strengths */}
              <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/40 p-6 rounded-3xl backdrop-blur-md transition-all group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Kelebihan</h3>
                </div>
                <div className="space-y-4">
                  {data.strengths.length > 0 ? data.strengths.map((point, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle size={12} className="text-emerald-400" />
                      </div>
                      <p className="text-slate-300 text-sm">{point}</p>
                    </div>
                  )) : (<p className="text-slate-500 italic">Tidak ada data.</p>)}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="bg-gradient-to-br from-red-900/20 to-slate-900/60 border border-red-500/20 hover:border-red-500/40 p-6 rounded-3xl backdrop-blur-md transition-all group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-500/20 rounded-2xl text-red-400 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Area Fokus</h3>
                </div>
                <div className="space-y-4">
                  {data.weaknesses.length > 0 ? data.weaknesses.map((point, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="mt-1 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                      </div>
                      <p className="text-slate-300 text-sm">{point}</p>
                    </div>
                  )) : (<p className="text-slate-500 italic">Tidak ada data.</p>)}
                </div>
              </div>

            </div>

            {/* Recommendations (Wide Card) */}
            <div className="bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-500/20 p-8 rounded-3xl backdrop-blur-md relative overflow-visible mb-8">
              <div className="absolute top-0 right-0 p-32 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                <Lightbulb className="text-violet-400 w-6 h-6" />
                Rekomendasi Strategis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl hover:bg-slate-800/80 transition-colors shadow-sm">
                    <span className="text-violet-400 font-bold text-sm mb-2 block uppercase tracking-wider">Langkah 0{idx + 1}</span>
                    <p className="text-slate-200 text-sm leading-relaxed">{rec}</p>
                  </div>
                ))}
                {data.recommendations.length === 0 && <p className="text-slate-500">Tidak ada rekomendasi spesifik.</p>}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Footer / Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-dark via-dark/95 to-transparent p-6 pb-8 z-50 flex justify-center gap-4 pointer-events-none">
        <div className="pointer-events-auto flex gap-4">
          <button
            onClick={onRestart}
            className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white text-dark font-bold hover:bg-slate-200 hover:scale-105 transition-all shadow-xl shadow-white/10"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Wawancara Lagi
          </button>

          <button className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-110 transition-all shadow-lg">
            <Trophy size={20} />
          </button>

          <button className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-110 transition-all shadow-lg">
            <Download size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}
