import React from "react";

interface ResultViewProps {
  feedback: string;
  onRestart: () => void;
}

export default function ResultView({ feedback, onRestart }: ResultViewProps) {
  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Hasil Wawancara Kamu
      </h1>

      {feedback.length === 0 ? (
        <p className="text-center text-slate-400">Tidak ada data wawancara.</p>
      ) : (
        <div className="bg-slate-800/40 p-6 rounded-2xl backdrop-blur">
          <pre className="whitespace-pre-wrap text-slate-200 leading-relaxed">
            {feedback}
          </pre>
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-8 w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/80 transition"
      >
        Mulai Wawancara Baru
      </button>
    </div>
  );
}
