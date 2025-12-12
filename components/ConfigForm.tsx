import React, { useState, useRef, useEffect } from 'react';
import AOS from 'aos';
import { InterviewConfig } from '../types';
import { ArrowRight, Mic, MicOff, Video, VideoOff, AlertCircle, X, ChevronLeft } from 'lucide-react';
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
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showError, setShowError] = useState(false);

  // Audio analysis refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // refresh AOS on mount and when modal visibility changes
    AOS.refresh();
    // Start or stop mic audio analysis
    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(data);
          // compute RMS
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          setIsSpeaking(rms > 0.03); // threshold - tweak if needed
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.warn('Microphone access denied or unavailable', e);
        setMicOn(false);
      }
    };

    const stopMic = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        analyserRef.current = null;
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      } catch (e) {}
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      setIsSpeaking(false);
    };

    if (micOn) startMic(); else stopMic();

    return () => stopMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn]);

  useEffect(() => {
    AOS.refresh();
  }, [showError, cameraOn, micOn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!micOn || !cameraOn) {
      // Show custom error modal instead of alert
      setShowError(true);
      return;
    }

    onStart({
      type,
      roleOrScholarshipName: role,
      companyOrOrg: company,
      experienceLevel: experience,
      focusArea: focus,
    });
  };

  return (
    <div className=''>
      {/* Error Modal */}
      {showError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => setShowError(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white text-center mb-3">
              Perangkat Tidak Siap
            </h3>

            {/* Description */}
            <p className="text-slate-300 text-center mb-6 text-sm">
              Silakan nyalakan <span className="font-semibold text-white">mikrofon</span> dan <span className="font-semibold text-white">kamera</span> untuk memulai sesi wawancara.
            </p>

            {/* Status indicators */}
            <div className="bg-black/30 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${micOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${micOn ? 'text-green-400' : 'text-red-400'}`}>
                  {micOn ? 'Mikrofon aktif' : 'Mikrofon mati'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${cameraOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${cameraOn ? 'text-green-400' : 'text-red-400'}`}>
                  {cameraOn ? 'Kamera aktif' : 'Kamera mati'}
                </span>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={() => setShowError(false)}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-2.5 px-4 rounded-lg transition-all"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
    <div className='px-4 md:px-20 flex flex-col justify-center'>
        <button
          onClick={() => window.location.reload()}
          className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 hover:text-white transition-all duration-300 w-fit"
          title="Kembali ke halaman sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">
          Kembali
          </span>
        </button>
    <div className=" mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">

      

        <div className={`w-full h-full relative bg-gradient-to-br from-secondary/10 to-primary/10
          ${isSpeaking ? 'border-2 border-primary' : 'border border-primary/30'} rounded-2xl shadow-2xl overflow-hidden
          backdrop-blur-md flex items-center justify-center col-span-1 md:col-span-3`}>
        <div className="w-full h-full rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
          {cameraOn ? (
            <UserCam key={cameraOn ? 'on' : 'off'} ref={camRef as any} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <VideoOff className="w-12 h-12 opacity-70" />
            </div>
          )}
        </div>

        {/* Top-left label */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 rounded-lg text-white text-sm">
          Anda
        </div>

        {/* Controls overlay bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button
            onClick={() => setMicOn(prev => !prev)}
            title={micOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon'}
            className={`p-5 border rounded-full shadow-lg transition-all transform hover:scale-110 ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* <div className="px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
          </div> */}

          <button
            onClick={() => {
              // toggle camera by remounting UserCam (key change) and calling stopCamera when turning off
              if (cameraOn) {
                try { camRef.current?.stopCamera(); } catch (e) {}
                setCameraOn(false);
              } else {
                setCameraOn(true);
              }
            }}
            title={cameraOn ? 'Matikan kamera' : 'Nyalakan kamera'}
            className={`p-5 border rounded-full shadow-lg transition-all transform hover:scale-110 ${cameraOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div data-aos="fade-up" data-aos-delay="50" className="w-full bg-surface/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-slate-700/50 col-span-1 md:col-span-2">

        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">

          Setup Wawancara

        </h2>

        <p className="text-slate-400 mb-6 text-sm md:text-base">Konfigurasi partner latihan anda</p>



        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">

          <div>

            <label className="block text-sm font-medium text-slate-300 mb-1">Tipe Wawancara</label>

            <input

              required

              type="text"

              value={type}

              onChange={(e) => setType(e.target.value)}

              placeholder="Contoh: Pekerjaan, Beasiswa"

              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"

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

              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"

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

              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"

            />

          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>

              <label className="block text-sm font-medium text-slate-300 mb-1">Pengalaman (Opsional)</label>

              <input

                type="text"

                value={experience}

                onChange={(e) => setExperience(e.target.value)}

                placeholder="Contoh: Fresh Grad"

                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"

              />

            </div>



            <div>

              <label className="block text-sm font-medium text-slate-300 mb-1">Area Fokus (Opsional)</label>

              <input

                type="text"

                value={focus}

                onChange={(e) => setFocus(e.target.value)}

                placeholder="Contoh: Leadership"

                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"

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
    </div>
    </div>
  );
};

export default ConfigForm;
