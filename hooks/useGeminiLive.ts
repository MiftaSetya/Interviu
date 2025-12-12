import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { InterviewConfig } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { getGeminiKeys } from '@/lib/getGeminiKey';

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
  const audioQueueRef = useRef<Promise<void>>(Promise.resolve());
  const processingIdRef = useRef<number>(0);

  // Analyser for visualizer
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Transcript storage
  const [transcript, setTranscript] = useState<string[]>([]);

  // Speech Recognition for User Transcript
  useEffect(() => {
    if (!isConnected || !isMicOn) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'id-ID';

    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript;
        if (text.trim()) {
          setTranscript(prev => [...prev, `Kandidat: ${text}`]);
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Silently handle errors
      console.warn('Speech recognition error:', event.error);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }

    return () => {
      recognition.stop();
    };
  }, [isConnected, isMicOn]);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    processingIdRef.current += 1;

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

    // Disconnect and clean up ScriptProcessor (CRITICAL for performance/stutter)
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Disconnect and clean up Source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
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

    const keys = getGeminiKeys();
    let ai: GoogleGenAI | null = null;
    let lastError: any = null

    for(const key of keys) {
      try {
        ai = new GoogleGenAI({ apiKey: key });
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!ai) {
      throw lastError || new Error("All Gemini API keys failed.");  
    }

    try {
      // Audio Contexts
      // Input: 16kHz for Gemini
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz for playback quality
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Setup Visualizer Analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Get Mic Stream with advanced processing for better voice isolation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Ensure audio context is running
      await audioContextRef.current.resume();

      // Construct System Instruction based on Config
      let systemInstruction = `
      Kamu adalah pewawancara profesional yang melakukan wawancara ${config.type}.
      Kandidat melamar posisi: ${config.roleOrScholarshipName} di ${config.companyOrOrg}.
      ${config.experienceLevel ? `Tingkat pengalaman kandidat: ${config.experienceLevel}.` : ''}
      ${config.focusArea ? `Fokus wawancara pada: ${config.focusArea}.` : ''}

      === PERILAKU UTAMA ===
      1. Mulai dengan salam singkat dan minta kandidat memperkenalkan diri.
      2. Ajukan satu pertanyaan pada satu waktu.
      3. Respon secara natural, ringkas, dan berorientasi percakapan — bukan paragraf panjang.
      4. Jika jawaban terlalu singkat: beri pertanyaan lanjutan.
      5. Jika jawabannya baik: beri apresiasi singkat lalu lanjutkan.
      6. Jawab dalam Bahasa Indonesia yang jelas, santai, dan profesional. Hindari bahasa Inggris kecuali istilah teknis.

      === HINDARI INI ===
      - Jangan mengulang kata atau frasa dari kalimat sebelumnya.
      - Jangan mengulang ucapan seperti “baik baik”, “bagus bagus”, atau “terima kasih terima kasih”.
      - Jangan membuat paragraf panjang seperti artikel.
      - Jangan menjawab sendiri pertanyaan yang kamu ajukan ke kandidat.
      - Jangan memberikan lebih dari satu pertanyaan sekaligus.

      === GAYA KOMUNIKASI ===
      - Pendek, to the point, dan seperti pewawancara manusia.
      - Ramah tapi tetap profesional.
      - Variasikan cara bertanya agar tidak terdengar robotik.

      ===
      Jika kandidat meminta feedback, berikan feedback singkat dan spesifik, lalu kembali ke alur wawancara.
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
              if (!isMicOn || !sessionPromiseRef.current) return; // Mute logic or session closed

              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then(session => {
                try {
                  session.sendRealtimeInput({ media: pcmBlob });
                } catch (e) {
                  // Session might be closed
                }
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Capture text output from AI
            const textOutput = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (textOutput) {
              setTranscript(prev => [...prev, `AI: ${textOutput}`]);
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const currentId = processingIdRef.current;
              audioQueueRef.current = audioQueueRef.current.then(async () => {
                if (currentId !== processingIdRef.current || !audioContextRef.current) return;

                try {
                  const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(base64Audio),
                    audioContextRef.current,
                    24000,
                    1
                  );

                  // Double check validity after async decode
                  if (currentId !== processingIdRef.current || !audioContextRef.current) return;

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

                  const currentTime = audioContextRef.current.currentTime;

                  // Ultra-responsive buffering for instant AI response
                  if (nextStartTimeRef.current < currentTime) {
                    const gap = currentTime - nextStartTimeRef.current;

                    if (gap > 0.5) {
                      // Large gap (new turn/AI starts speaking) - MINIMAL buffer for instant response
                      nextStartTimeRef.current = currentTime + 0.01;
                    } else if (gap > 0.1) {
                      // Medium gap (network hiccup) - moderate buffer to prevent re-stutter
                      nextStartTimeRef.current = currentTime + 0.15;
                    } else {
                      // Small gap (minor jitter) - tiny buffer to stay responsive
                      nextStartTimeRef.current = currentTime + 0.02;
                    }
                  }

                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  scheduledSourcesRef.current.add(source);
                } catch (e) {
                  console.error("Error processing audio chunk", e);
                }
              });
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              processingIdRef.current += 1;
              scheduledSourcesRef.current.forEach(src => {
                try { src.stop(); } catch (e) { }
              });
              scheduledSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: (event) => {
            console.log("Gemini Session Closed:", event);
            // Don't treat normal close as error
            cleanup();
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            // Only trigger error if we were supposed to be connected
            if (isConnected) {
              onError?.(new Error("Connection disrupted."));
            }
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
    volumeLevel,
    transcript
  };
};
