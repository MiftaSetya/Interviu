import React, { useState, useRef } from 'react';
import { InterviewConfig } from '../types';
import { ArrowRight } from 'lucide-react';
import UserCam, { UserCamHandle } from '../components/UserCam';

interface ConfigFormProps {
  onStart: (config: InterviewConfig) => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onStart }) => {
  const [type, setType] = useState("");
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('');
  const [focus, setFocus] = useState('');

  const camRef = useRef<UserCamHandle>(null);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-stretch items-start mb-12">

      <div className="w-full lg:h-full min-h-[300px] aspect-video lg:aspect-auto rounded-2xl flex flex-col order-1 lg:order-none">
        <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative">
          <UserCam ref={camRef} />
          {/* Decorative gradients for camera container */}
          <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-inset ring-white/10"></div>
        </div>
      </div>

      <div className="h-full bg-surface/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-slate-700/50 order-2 lg:order-none">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Setup Wawancara
        </h2>
        <p className="text-slate-400 mb-6 text-sm md:text-base">Konfigurasi partner latihan anda</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipe Wawancara</label>
            <input
              required
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Contoh: Pekerjaan, Beasiswa"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Posisi / Jabatan / Nama Beasiswa</label>
            <input
              required
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Frontend Developer, Beasiswa Unggulan"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Perusahaan / Organisasi / Universitas</label>
            <input
              required
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Contoh: Google, Universitas Indonesia"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Pengalaman (Opsional)</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Contoh: Fresh Grad"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Area Fokus (Opsional)</label>
              <input
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Contoh: Leadership"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98]"
            >
              Mulai Sesi
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ConfigForm;
