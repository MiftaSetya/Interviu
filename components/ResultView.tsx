import React, { useMemo, useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, Lightbulb, FileText, ArrowLeft, Download, Trophy, Star, TrendingUp } from "lucide-react";

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InterviewConfig } from '../types';

interface ResultViewProps {
  feedback: string;
  config?: InterviewConfig | null;
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

    if (summaryMatch) sections.summary = summaryMatch[1].trim().replace(/^Eksekutif\s*/i, '');

    const extractPoints = (raw: string) => {
      // Remove all asterisks and bold formatting
      const cleanRaw = raw.replace(/\*\*/g, '').replace(/\*/g, '').trim();

      return cleanRaw.split('\n')
        .map(line => line.trim())
        // Filter out empty lines
        .filter(line => line.length > 0)
        // Remove leading bullets, numbers, dots, hyphens, asterisks, slashes etc
        .map(line => line.replace(/^[\s\*\-\•\d\.:\/]+/, '').trim())
        .filter(line => line.length > 0);
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

export default function ResultView({ feedback, config, onRestart }: ResultViewProps) {
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
            <div className="relative bg-gradient-to-br from-blue-900/20 to-slate-900/60 border border-blue-500/20 p-6 rounded-3xl backdrop-blur-md overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-all"></div>

              <h3 className="relative z-10 text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-400" /> Ringkasan
              </h3>
              <p className="relative z-10 text-slate-300 text-sm leading-relaxed whitespace-pre-line">
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
                  {data.strengths.length > 0 ? data.strengths.map((point, idx) => {
                    // Filter out stray "Kandidat" label
                    if (point.trim().toLowerCase() === 'kandidat') return null;

                    const isHeader = ["komunikasi", "kompetensi"].some(key => point.toLowerCase().includes(key) && point.length < 60);

                    if (isHeader) {
                      return <h4 key={idx} className="text-emerald-400 font-bold mt-4 first:mt-0 mb-1">{point.replace(/[:]+$/, '').replace(/^Komunikasi$/i, 'Komunikasi Kandidat')}</h4>;
                    }

                    return (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle size={12} className="text-emerald-400" />
                        </div>
                        <p className="text-slate-300 text-sm">{point}</p>
                      </div>
                    );
                  }) : (<p className="text-slate-500 italic">Tidak ada data.</p>)}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="bg-gradient-to-br from-red-900/20 to-slate-900/60 border border-red-500/20 hover:border-red-500/40 p-6 rounded-3xl backdrop-blur-md transition-all group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-500/20 rounded-2xl text-red-400 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Kekurangan</h3>
                </div>
                <div className="space-y-4">
                  {data.weaknesses.length > 0 ? data.weaknesses.map((point, idx) => {
                    const isHeader = point.toLowerCase().includes("poin yang perlu diperbaiki") ||
                      point.toLowerCase().includes("kesalahan yang mungkin dilakukan") ||
                      point.toLowerCase().includes("area pengembangan");

                    if (isHeader) {
                      return <h4 key={idx} className="text-red-400 font-bold mt-4 first:mt-0 mb-1">{point.replace(/[:]+$/, '')}</h4>;
                    }

                    return (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="mt-1 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        </div>
                        <p className="text-slate-300 text-sm">{point}</p>
                      </div>
                    );
                  }) : (<p className="text-slate-500 italic">Tidak ada data.</p>)}
                </div>
              </div>

            </div>

            {/* Recommendations (Wide Card) */}
            <div className="bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-500/20 p-8 rounded-3xl backdrop-blur-md relative overflow-visible mb-8">
              <div className="absolute top-0 right-0 p-32 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 w-full">
                <Lightbulb className="text-violet-400 w-6 h-6" />
                Rekomendasi Strategis
              </h3>

              {/* Logic to handle Intro sentence vs Steps */}
              {(() => {
                const hasIntro = data.recommendations.length > 0 && (
                  data.recommendations[0].trim().endsWith(':') ||
                  data.recommendations[0].length < 100 && !data.recommendations[0].match(/^(Langkah|Step|Point)\s\d/) // Heuristic for intro
                );

                const introText = hasIntro ? data.recommendations[0] : null;
                const steps = hasIntro ? data.recommendations.slice(1) : data.recommendations;

                return (
                  <>
                    {introText && (
                      <div className="relative z-10 mb-8 p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                        <p className="text-slate-200 text-sm leading-relaxed">{introText}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      {steps.map((rec, idx) => (
                        <div key={idx} className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl hover:bg-slate-800/80 transition-colors shadow-sm">
                          <span className="text-violet-400 font-bold text-sm mb-2 block uppercase tracking-wider">
                            Langkah 0{idx + 1}
                          </span>
                          <p className="text-slate-200 text-sm leading-relaxed">{rec}</p>
                        </div>
                      ))}
                      {steps.length === 0 && !introText && <p className="text-slate-500">Tidak ada rekomendasi spesifik.</p>}
                    </div>
                  </>
                );
              })()}
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

          {/* <button className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-110 transition-all shadow-lg">
            <Trophy size={20} />
          </button> */}

          <button
            onClick={() => {
              const doc = new jsPDF();
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              const margin = 20;
              let y = 30;

              // --- TITLE & HEADER ---
              doc.setFontSize(26);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(0, 0, 0);
              doc.text("Laporan Wawancara", margin, y);

              y += 15;

              // Horizontal Divider
              doc.setDrawColor(220, 220, 220);
              doc.setLineWidth(0.5);
              doc.line(margin, y, pageWidth - margin, y);
              y += 15;

              // --- META INFO ---
              doc.setFontSize(10);
              doc.setTextColor(60, 60, 60);
              const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

              const addMetaRow = (label: string, value: string) => {
                doc.setFont("helvetica", "bold");
                doc.text(label, margin, y);
                doc.setFont("helvetica", "normal");
                doc.text(value, margin + 35, y);
                y += 6;
              };

              if (config) {
                addMetaRow("Posisi:", config.roleOrScholarshipName);
                addMetaRow("Perusahaan:", config.companyOrOrg);
              }
              addMetaRow("Tanggal:", dateStr);
              y += 10;

              // --- SCORE SECTION (Minimalist) ---
              // Light background strip
              doc.setFillColor(250, 250, 250);
              doc.rect(margin, y, pageWidth - margin * 2, 50, 'F');

              const scoreY = y + 33;

              // Big Score
              doc.setFontSize(42);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(0, 0, 0);
              const scoreText = `${data.score}`;
              const scoreWidth = doc.getTextWidth(scoreText);
              doc.text(scoreText, margin + 15, scoreY);

              // "/ 100"
              doc.setFontSize(14);
              doc.setTextColor(150, 150, 150);
              doc.setFont("helvetica", "normal");
              doc.text("/ 100", margin + 18 + scoreWidth, scoreY);

              // Grade & Label
              const grade = getGrade(data.score);
              doc.setFontSize(12);
              doc.setTextColor(80, 80, 80);
              doc.text("Skor Keseluruhan", margin + 18 + scoreWidth + 45, scoreY - 10);

              doc.setFontSize(16);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(0, 0, 0);
              doc.text(grade.label, margin + 18 + scoreWidth + 45, scoreY + 2);

              y += 70;

              // --- SECTIONS ---
              const addSectionTitle = (title: string) => {
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 0, 0);
                doc.text(title, margin, y);
                y += 10;
              };

              // SUMMARY
              addSectionTitle("Ringkasan");
              doc.setFontSize(11);
              doc.setTextColor(60, 60, 60);
              doc.setFont("helvetica", "normal");
              const summaryLines = doc.splitTextToSize(data.summary || "Tidak ada ringkasan.", pageWidth - margin * 2);
              doc.text(summaryLines, margin, y);
              y += summaryLines.length * 6 + 15;

              // LIST STYLES
              const listStyles = {
                fontSize: 10,
                cellPadding: { top: 2, bottom: 2, left: 0, right: 0 },
                textColor: 60,
                valign: 'top',
                overflow: 'linebreak'
              };

              // STRENGTHS
              if (data.strengths.length > 0) {
                if (y > pageHeight - 60) { doc.addPage(); y = 30; }
                addSectionTitle("Kelebihan");

                const strengthBody = data.strengths
                  .filter(s => s.trim().toLowerCase() !== 'kandidat')
                  .map(s => ["•  " + s]);

                // @ts-ignore
                autoTable(doc, {
                  startY: y,
                  head: [],
                  body: strengthBody,
                  theme: 'plain',
                  styles: listStyles,
                  margin: { left: margin + 2 },
                  didDrawPage: (d) => { y = d.cursor.y + 10; }
                });
                // @ts-ignore
                y = doc.lastAutoTable.finalY + 15;
              }

              // WEAKNESSES
              if (data.weaknesses.length > 0) {
                if (y > pageHeight - 60) { doc.addPage(); y = 30; }
                addSectionTitle("Kekurangan");

                const weaknessBody = data.weaknesses.map(w => ["•  " + w]);

                // @ts-ignore
                autoTable(doc, {
                  startY: y,
                  head: [],
                  body: weaknessBody,
                  theme: 'plain',
                  styles: listStyles,
                  margin: { left: margin + 2 },
                });
                // @ts-ignore
                y = doc.lastAutoTable.finalY + 15;
              }

              // RECOMMENDATIONS
              if (data.recommendations.length > 0) {
                if (y > pageHeight - 60) { doc.addPage(); y = 30; }

                addSectionTitle("Rekomendasi");

                const recBody = data.recommendations.map((rec, i) => [`${i + 1}.`, rec]);

                // @ts-ignore
                autoTable(doc, {
                  startY: y,
                  head: [],
                  body: recBody,
                  theme: 'plain',
                  styles: { ...listStyles, cellPadding: { ...listStyles.cellPadding, bottom: 6 } },
                  columnStyles: { 0: { cellWidth: 10, fontStyle: 'bold', textColor: 0 } },
                  margin: { left: margin },
                });
              }

              doc.save(`Laporan_Wawancara_${config?.roleOrScholarshipName || 'Result'}.pdf`);
            }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-110 transition-all shadow-lg"
            title="Download PDF"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}
