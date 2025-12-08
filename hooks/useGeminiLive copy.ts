import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { InterviewConfig } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

interface UseGeminiLiveProps {
  config: InterviewConfig | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useGeminiLive = ({ config, onConnect, onDisconnect, onError }: UseGeminiLiveProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // New states for feedback
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Text capture buffer
  const transcriptRef = useRef<string>("");

  // Visualizer
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    scheduledSourcesRef.current.forEach(src => {
      try { src.stop(); } catch {}
    });
    scheduledSourcesRef.current.clear();

    audioContextRef.current?.close();
    audioContextRef.current = null;

    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    sessionPromiseRef.current?.then(s => s.close?.()).catch(() => {});
    sessionPromiseRef.current = null;

    setIsConnected(false);
    setVolumeLevel(0);
    nextStartTimeRef.current = 0;
    onDisconnect?.();
  }, [onDisconnect]);

  const connect = useCallback(async () => {
    if (!config) return;

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("Missing API_KEY");

      const ai = new GoogleGenAI({ apiKey });

      // Audio setup
      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Build system instruction
      const systemInstruction = `
      Kamu adalah seorang pewawancara profesional yang sedang melakukan wawancara ${config.type}.
      Kandidat melamar untuk: ${config.roleOrScholarshipName} di ${config.companyOrOrg}.
      ${config.experienceLevel ? `Tingkat pengalaman: ${config.experienceLevel}.` : ''}
      ${config.focusArea ? `Fokus pada: ${config.focusArea}.` : ''}

      Ikuti aturan:
      - Ajukan satu pertanyaan setiap kali.
      - Tanggapi alami dan singkat.
      - Semua dalam bahasa Indonesia.
      - Boleh beri apresiasi singkat.
      - Simpan konteks lengkap untuk nanti dianalisis.
      `;

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            onConnect?.();

            if (!inputAudioContextRef.current || !streamRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;

            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = e => {
              if (!isMicOn) return;

              const raw = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(raw);

              sessionPromise.then(s => {
                s.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },

          onmessage: async (msg: LiveServerMessage) => {
            // ----- HANDLE TEXT OUTPUT -----
            const textPart = msg.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
            if (textPart) {
              transcriptRef.current += textPart + "\n";
              setFeedbackText(textPart); // last response
            }

            // ----- HANDLE AUDIO OUTPUT -----
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);

              const buffer = await decodeAudioData(
                base64ToUint8Array(base64Audio),
                audioContextRef.current,
                24000,
                1
              );

              const src = audioContextRef.current.createBufferSource();
              src.buffer = buffer;

              if (analyserRef.current) {
                src.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
              } else {
                src.connect(audioContextRef.current.destination);
              }

              src.onended = () => scheduledSourcesRef.current.delete(src);

              src.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              scheduledSourcesRef.current.add(src);
            }

            // Interruption
            if (msg.serverContent?.interrupted) {
              scheduledSourcesRef.current.forEach(s => s.stop?.());
              scheduledSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },

          onclose: cleanup,
          onerror: err => {
            onError?.(new Error("Connection error"));
            cleanup();
          }
        },

        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT], // ENABLE TEXT
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction
        }
      });

      sessionPromiseRef.current = sessionPromise;

      // Visualizer loop
      const loop = () => {
        if (!analyserRef.current) return;
        const arr = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(arr);
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        setVolumeLevel(avg);
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      loop();

    } catch (e: any) {
      onError?.(e);
      cleanup();
    }

  }, [config, isMicOn, onConnect, onError, cleanup]);

  // ----- FEEDBACK REQUEST -----
  const requestFeedback = useCallback(async () => {
    if (!sessionPromiseRef.current) return;

    setIsGeneratingFeedback(true);
    setFeedbackText("");

    const feedbackPrompt = `
      Analisis seluruh percakapan wawancara yang telah terjadi.
      Berikan hasil dalam format berikut:

      === RINGKASAN WAWANCARA ===
      [ringkasan 3–5 kalimat]

      === KELEBIHAN ===
      - poin 1
      - poin 2

      === KEKURANGAN ===
      - poin 1
      - poin 2

      === SKOR WAWANCARA (0-100) ===
      beri angka

      === SARAN PERBAIKAN ===
      - poin 1
      - poin 2

      Semua dalam bahasa Indonesia.
    `;

    const session = await sessionPromiseRef.current;
    await session.send({ text: feedbackPrompt });

    // Text akan otomatis masuk lewat onmessage() → setFeedbackText()
    setIsGeneratingFeedback(false);
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => !prev);
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    connect,
    disconnect,
    isConnected,
    isMicOn,
    toggleMic,
    volumeLevel,

    // New
    requestFeedback,
    feedbackText,
    isGeneratingFeedback,
  };
};
