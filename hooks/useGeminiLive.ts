import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { InterviewConfig } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';

// Model configuration
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
  const [volumeLevel, setVolumeLevel] = useState(0); // For visualizer (0-100)

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Analyser for visualizer
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop all scheduled audio
    scheduledSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    scheduledSourcesRef.current.clear();

    // Close audio contexts
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    // Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close session
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        if (session.close) session.close();
      }).catch(() => { });
    }

    setIsConnected(false);
    nextStartTimeRef.current = 0;
    setVolumeLevel(0);
    onDisconnect?.();
  }, [onDisconnect]);

  const connect = useCallback(async () => {
    if (!config) return;

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY not found in environment");

      const ai = new GoogleGenAI({ apiKey });

      // Audio Contexts
      // Input: 16kHz for Gemini
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz for playback quality
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Setup Visualizer Analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Construct System Instruction based on Config
      let systemInstruction = `Kamu adalah seorang pewawancara profesional yang sedang melakukan wawancara ${config.type}. 
      Kandidat sedang melamar untuk: ${config.roleOrScholarshipName} di ${config.companyOrOrg}. 
      ${config.experienceLevel ? `Tingkat pengalaman: ${config.experienceLevel}.` : ''}
      ${config.focusArea ? `Fokus pada: ${config.focusArea}.` : ''}
      
      Tujuanmu adalah menciptakan suasana wawancara yang realistis, profesional, namun tetap mendukung kandidat. 
      1. Mulai dengan menyambut kandidat dan minta mereka untuk memperkenalkan diri dalam bahasa Indonesia.
      2. Ajukan SATU pertanyaan dalam satu waktu. Tunggu jawaban kandidat.
      3. Dengarkan dengan aktif. Jika jawabannya singkat, ajukan pertanyaan lanjutan. Jika jawabannya bagus, berikan apresiasi singkat lalu lanjut ke pertanyaan berikutnya.
      4. Buat responmu ringkas dan natural seperti percakapan sehari-hari dalam bahasa Indonesia. Hindari monolog panjang.
      5. Jika kandidat meminta feedback, berikan feedback yang konstruktif dan singkat dalam bahasa Indonesia, lalu kembali ke alur wawancara.
      6. Gunakan bahasa Indonesia yang baik dan benar, tapi tetap santai dan natural.
      7. Jangan gunakan bahasa Inggris sama sekali, kecuali untuk istilah teknis yang memang tidak ada padanan bahasa Indonesianya.
      `;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            onConnect?.();

            // Start Audio Streaming
            if (!inputAudioContextRef.current || !streamRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;

            // ScriptProcessor for raw PCM access
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (!isMicOn) return; // Mute logic

              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              // Update cursor
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                audioContextRef.current.currentTime
              );

              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(base64Audio),
                audioContextRef.current,
                24000,
                1
              );

              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;

              // Connect to Analyser (for visualization) and Destination (for hearing)
              if (analyserRef.current) {
                source.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
              } else {
                source.connect(audioContextRef.current.destination);
              }

              source.onended = () => {
                scheduledSourcesRef.current.delete(source);
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              scheduledSourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              scheduledSourcesRef.current.forEach(src => {
                try { src.stop(); } catch (e) { }
              });
              scheduledSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            cleanup();
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            onError?.(new Error("Connection error occurred."));
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: systemInstruction,
        }
      });

      sessionPromiseRef.current = sessionPromise;

      // Start Visualization Loop
      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolumeLevel(average); // 0 - 255

        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

    } catch (err) {
      console.error(err);
      onError?.(err instanceof Error ? err : new Error("Failed to start session"));
      cleanup();
    }
  }, [config, isMicOn, onConnect, onError, cleanup]);

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
    volumeLevel
  };
};
