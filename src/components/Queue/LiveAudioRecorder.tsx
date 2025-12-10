import React, { useState, useRef } from 'react';
import { Square, Radio, Loader2 } from 'lucide-react';
import { useSolutionContext } from '../../contexts/SolutionContext';
import { useToast } from '../../contexts/toast';

export const LiveAudioRecorder: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live'>('idle');

  const [transcript, setTranscript] = useState('');
  
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { setSolution } = useSolutionContext();
  const { showToast } = useToast();

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setStatus('idle');
    setTranscript(''); // Clear transcript on cleanup
  };

  const startLiveSession = async () => {
    try {
      setStatus('connecting');
      setTranscript(''); // Clear previous transcript
      
      // 1. Initialize WebSocket (Ensure port matches backend)
      const ws = new WebSocket('ws://localhost:3000/ws/live-interview');
      socketRef.current = ws;

      ws.onopen = async () => {
        console.log("WS Connected");
        setStatus('live');
        await startMicrophone();
        showToast("Live Mode", "Listening to interview...", "success");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'live_transcript') {
            // Append incoming text chunks to our transcript state
            setTranscript(prev => prev + message.text);
          } 

          
          if (message.type === 'solution') {
            console.log("Received Solution:", message.data);
            
            // Map the API response to your app's expected format
            // Ensure the backend sends 'code', 'thoughts' etc.
            setSolution(message.data);
            
            // // Notify Electron to switch view if needed (optional)
            // if (window.electronAPI && window.electronAPI.onSolutionSuccess()) {
            //    // This might be handled by the context change, 
            //    // but explicit view switching can happen here if needed.
            // }
          } else if (message.type === 'partial') {
            console.log("Partial (Conversational):", message.text);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WS Error", e);
        showToast("Error", "Connection failed. Is backend running?", "error");
        cleanup();
      };

      ws.onclose = () => {
        console.log("WS Closed");
        cleanup();
      };

    } catch (err) {
      console.error("Setup failed", err);
      showToast("Error", "Failed to start live session", "error");
      cleanup();
    }
  };

  const startMicrophone = async () => {
    try {
      // 2. Get Audio Stream
      // Tip: To record the interviewer, use speakers (not headphones),
      // or use a Virtual Audio Cable to route system audio to mic.
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true, // Helps prevent self-echo
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;

      // 3. Initialize Audio Context at 16kHz (Gemini Requirement)
      // Browsers often default to 44.1k or 48k, so we force sampleRate here
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // 4. Create Processor
      // bufferSize 4096 gives ~0.25s latency chunking
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16 PCM
          const pcmData = floatTo16BitPCM(inputData);
          socketRef.current.send(pcmData);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination); 

    } catch (err) {
      console.error("Mic Error", err);
      showToast("Error", "Microphone access denied", "error");
      cleanup();
    }
  };

  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  };

  return (
    // --- WRAP THE BUTTON AND THE NEW DISPLAY ---
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={status === 'idle' ? startLiveSession : cleanup}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all duration-300 ${
          status === 'live' 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
            : status === 'connecting'
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
            : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-transparent'
        }`}
      >
        {status === 'live' ? (
          <><Square size={14} fill="currentColor" /><span className="text-xs font-medium">LIVE</span></>
        ) : status === 'connecting' ? (
          <><Loader2 size={14} className="animate-spin" /><span className="text-xs">Connecting...</span></>
        ) : (
          <><Radio size={14} /><span className="text-xs font-medium">Go Live</span></>
        )}
      </button>
      
      {/* --- NEW DISPLAY AREA --- */}
      {transcript && (
        <div className="w-full max-w-md p-3 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-300 font-mono">
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
      {/* --- END NEW DISPLAY AREA --- */}
    </div>
  );
};