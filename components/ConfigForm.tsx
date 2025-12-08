import React, { useState } from 'react';
import { InterviewConfig, InterviewType } from '../types';
import { Briefcase, GraduationCap, ArrowRight } from 'lucide-react';

interface ConfigFormProps {
  onStart: (config: InterviewConfig) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onStart }) => {
  const [type, setType] = useState<InterviewType>(InterviewType.JOB);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('');
  const [focus, setFocus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      type,
      roleOrScholarshipName: role,
      companyOrOrg: company,
      experienceLevel: experience,
      focusArea: focus,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-surface p-8 rounded-2xl shadow-xl border border-slate-700">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Setup Wawancara
        </h2>
        <p className="text-slate-400">Konfigurasi partner latihan AI Anda</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setType(InterviewType.JOB)}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${type === InterviewType.JOB
              ? 'border-primary bg-primary/10 text-white'
              : 'border-slate-700 hover:border-slate-600 text-slate-400'
            }`}
        >
          <Briefcase className="w-6 h-6 mb-2" />
          <span className="font-semibold">Pekerjaan</span>
        </button>
        <button
          type="button"
          onClick={() => setType(InterviewType.SCHOLARSHIP)}
          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${type === InterviewType.SCHOLARSHIP
              ? 'border-secondary bg-secondary/10 text-white'
              : 'border-slate-700 hover:border-slate-600 text-slate-400'
            }`}
        >
          <GraduationCap className="w-6 h-6 mb-2" />
          <span className="font-semibold">Beasiswa</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {type === InterviewType.JOB ? 'Posisi / Jabatan' : 'Nama Beasiswa'}
          </label>
          <input
            required
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={type === InterviewType.JOB ? "contoh: Senior Frontend Engineer" : "contoh: Beasiswa LPDP"}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {type === InterviewType.JOB ? 'Perusahaan / Organisasi' : 'Universitas / Negara Tujuan'}
          </label>
          <input
            required
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={type === InterviewType.JOB ? "contoh: Google" : "contoh: University of Oxford"}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            {type === InterviewType.JOB ? 'Tingkat Pengalaman (Opsional)' : 'Latar Belakang Akademik (Opsional)'}
          </label>
          <input
            type="text"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder={type === InterviewType.JOB ? "contoh: 5 tahun, Lead" : "contoh: S1 Hukum"}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Area Fokus (Opsional)
          </label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="contoh: Pertanyaan behavioral, Technical deep dive, Leadership"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          Mulai Sesi
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ConfigForm;
