import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { InterviewConfig, InterviewType } from '../types';
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

    // Close session (we can't explicitly close the promise-based session easily without the object, 
    // but the connection drops when context/callbacks are destroyed usually, or we just reset state)
    // The library examples show using `session.close()` if we had the session object stored. 
    // Since we only have the promise, we rely on the `onclose` callback logic mostly.
    
    // Ideally we should store the session object if possible, but the prompt uses sessionPromise.
    // We will attempt to close if we have the session resolution.
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => {
             // Try to close if method exists
             if(session.close) session.close();
        }).catch(() => {});
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
      
      // Connect Analyser to Destination (so we can see what the AI says)
      // Note: We'll connect the sources to this analyser later

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Construct System Instruction based on Config
      let systemInstruction = `You are an expert interviewer conducting a ${config.type === InterviewType.JOB ? 'Job' : 'Scholarship'} interview. 
      The user is applying for: ${config.roleOrScholarshipName} at ${config.companyOrOrg}. 
      ${config.experienceLevel ? `Experience Level: ${config.experienceLevel}.` : ''}
      ${config.focusArea ? `Focus on: ${config.focusArea}.` : ''}
      
      Your goal is to simulate a realistic, professional, yet supportive interview environment. 
      1. Start by welcoming the candidate and asking them to introduce themselves.
      2. Ask ONE question at a time. Wait for the user's response.
      3. Listen actively. If the answer is short, ask a follow-up. If it's good, acknowledge it briefly and move to the next relevant question.
      4. Keep your responses concise and conversational (spoken style). Avoid long monologues. 
      5. If the user asks for feedback, provide constructive, brief feedback, then return to the interview flow.
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
              
              // Calculate volume for visualizer (Input side)
              // We want to visualize WHO is talking. 
              // Simple approach: Root Mean Square (RMS) of input buffer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              // Update state only if it's significant to reduce renders? 
              // Better: Update a ref or use the AnimationFrame loop to read the Analyser.
              // Since this is input data, we can just push it to the live session.
              // For visualization, we'll rely on the analyser attached to output for AI, 
              // and maybe a separate analyser for input if we want dual viz. 
              // For now, let's just push data.
              
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
                  try { src.stop(); } catch(e){}
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
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } // 'Puck' is often good for professional male, 'Kore' female.
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
        
        // Calculate average volume from frequency data
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
  }, [config, isMicOn, onError, cleanup]); // Dependencies

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => !prev);
    // Note: This only stops *sending* data in the process callback.
    // The stream remains active.
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
