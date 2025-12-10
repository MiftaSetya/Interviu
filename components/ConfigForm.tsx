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
    <div className="w-full px-28 mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch content-stretch">

      <div className="h-full rounded-2xl flex flex-col">
        <div className="w-full h-full bg-black rounded-xl overflow-hidden border border-slate-700">
          <UserCam ref={camRef} />
        </div>
      </div>

      <div className="h-full bg-surface p-8 rounded-2xl shadow-xl border border-slate-700">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Setup Wawancara
        </h2>
        <p className="text-slate-400 mb-6">Konfigurasi partner latihan anda</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tipe Wawancara</label>
            <input
              required
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Contoh: Pekerjaan, Beasiswa"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Posisi / Jabatan / Nama Beasiswa</label>
            <input
              required
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Frontend Developer, Beasiswa Unggulan"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Perusahaan / Organisasi / Universitas</label>
            <input
              required
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Contoh: Google, Universitas Indonesia"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tingkat Pengalaman / Latar Belakang Akademik</label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Contoh: Fresh Graduate, S1 Teknik Informatika"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">Area Fokus (Opsional)</label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Contoh: Behavioral, Leadership, Technical"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
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
