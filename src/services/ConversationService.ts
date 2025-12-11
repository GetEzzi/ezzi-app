/**
 * ConversationService - Manages dual WebSocket connections for real-time audio transcription
 * 
 * Connects to backend via:
 * - ws://localhost:8000/ws/audio/mic/{conversation_id}
 * - ws://localhost:8000/ws/audio/system/{conversation_id}
 */

const BACKEND_WS_URL = 'ws://localhost:8000';
const BACKEND_API_URL = 'http://localhost:8000';

export interface TranscriptMessage {
    id: string;
    role: 'me' | 'interviewer';
    text: string;
    timestamp: number;
    isFinal: boolean;
}

export interface AIResponse {
    suggestion: string;
    reasoning?: string;
    code_snippet?: string;
}

type TranscriptCallback = (message: TranscriptMessage) => void;
type AnswerCallback = (answer: AIResponse) => void;
type StatusCallback = (status: 'idle' | 'connecting' | 'active' | 'error') => void;

class ConversationService {
    private conversationId: string | null = null;
    private micSocket: WebSocket | null = null;
    private systemSocket: WebSocket | null = null;

    private micAudioContext: AudioContext | null = null;
    private micProcessor: ScriptProcessorNode | null = null;
    private micStream: MediaStream | null = null;

    private systemAudioContext: AudioContext | null = null;
    private systemProcessor: ScriptProcessorNode | null = null;
    private systemStream: MediaStream | null = null;

    private transcriptCallbacks: TranscriptCallback[] = [];
    private answerCallbacks: AnswerCallback[] = [];
    private statusCallbacks: StatusCallback[] = [];

    private messageIdCounter = 0;

    /**
     * Generate a unique conversation ID
     */
    private generateConversationId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Convert Float32 audio data to 16-bit PCM
     */
    private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output.buffer;
    }

    /**
     * Start a new conversation session
     */
    async startConversation(): Promise<void> {
        this.notifyStatus('connecting');
        this.conversationId = this.generateConversationId();

        try {
            // Start both audio streams concurrently
            await Promise.all([
                this.startMicAudio(),
                this.startSystemAudio(),
            ]);

            this.notifyStatus('active');
        } catch (error) {
            console.error('Failed to start conversation:', error);
            this.notifyStatus('error');
            this.stopConversation();
            throw error;
        }
    }

    /**
     * Stop the current conversation session
     */
    stopConversation(): void {
        // Close WebSockets
        if (this.micSocket) {
            this.micSocket.close();
            this.micSocket = null;
        }
        if (this.systemSocket) {
            this.systemSocket.close();
            this.systemSocket = null;
        }

        // Cleanup mic audio
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        if (this.micProcessor) {
            this.micProcessor.disconnect();
            this.micProcessor = null;
        }
        if (this.micAudioContext) {
            this.micAudioContext.close();
            this.micAudioContext = null;
        }

        // Cleanup system audio
        if (this.systemStream) {
            this.systemStream.getTracks().forEach(track => track.stop());
            this.systemStream = null;
        }
        if (this.systemProcessor) {
            this.systemProcessor.disconnect();
            this.systemProcessor = null;
        }
        if (this.systemAudioContext) {
            this.systemAudioContext.close();
            this.systemAudioContext = null;
        }

        this.conversationId = null;
        this.notifyStatus('idle');
    }

    /**
     * Start microphone audio capture and streaming
     */
    private async startMicAudio(): Promise<void> {
        // Get microphone stream
        this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000,
            },
        });

        // Create WebSocket connection
        const wsUrl = `${BACKEND_WS_URL}/ws/audio/mic/${this.conversationId}`;
        this.micSocket = new WebSocket(wsUrl);

        this.micSocket.onopen = () => {
            console.log('🎤 Mic WebSocket connected');
            this.setupAudioProcessor(
                this.micStream!,
                this.micSocket!,
                'mic'
            );
        };

        this.micSocket.onmessage = (event) => {
            this.handleTranscriptMessage(event.data);
        };

        this.micSocket.onerror = (error) => {
            console.error('Mic WebSocket error:', error);
        };

        this.micSocket.onclose = () => {
            console.log('🎤 Mic WebSocket closed');
        };

        // Wait for connection to open
        await new Promise<void>((resolve, reject) => {
            if (!this.micSocket) return reject(new Error('No mic socket'));
            this.micSocket.onopen = () => {
                this.setupAudioProcessor(this.micStream!, this.micSocket!, 'mic');
                resolve();
            };
            this.micSocket.onerror = () => reject(new Error('Mic WebSocket connection failed'));
        });
    }

    /**
     * Start system audio capture and streaming
     * Uses Electron's desktopCapturer to capture system audio
     */
    private async startSystemAudio(): Promise<void> {
        try {
            // Request screen share with audio - this captures system audio on Windows
            this.systemStream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: 1, height: 1 }, // Minimal video (required but we don't use it)
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                } as MediaTrackConstraints,
            });

            // Stop video track immediately - we only need audio
            this.systemStream.getVideoTracks().forEach(track => track.stop());

            // Check if we got audio
            const audioTracks = this.systemStream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.warn('⚠️ No system audio track available. Continuing with mic only.');
                return;
            }

            // Create WebSocket connection
            const wsUrl = `${BACKEND_WS_URL}/ws/audio/system/${this.conversationId}`;
            this.systemSocket = new WebSocket(wsUrl);

            // Wait for connection to open
            await new Promise<void>((resolve, reject) => {
                if (!this.systemSocket) return reject(new Error('No system socket'));
                this.systemSocket.onopen = () => {
                    console.log('🔊 System WebSocket connected');
                    this.setupAudioProcessor(this.systemStream!, this.systemSocket!, 'system');
                    resolve();
                };
                this.systemSocket.onerror = () => {
                    console.warn('System WebSocket connection failed - continuing without system audio');
                    resolve(); // Don't fail the whole conversation
                };
            });

            this.systemSocket.onmessage = (event) => {
                this.handleTranscriptMessage(event.data);
            };

            this.systemSocket.onclose = () => {
                console.log('🔊 System WebSocket closed');
            };
        } catch (error) {
            // System audio is optional - user may deny permission
            console.warn('⚠️ System audio capture not available:', error);
        }
    }

    /**
     * Setup audio processor for a given stream
     */
    private setupAudioProcessor(
        stream: MediaStream,
        socket: WebSocket,
        source: 'mic' | 'system'
    ): void {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const sourceNode = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
            if (socket.readyState === WebSocket.OPEN) {
                const inputData = event.inputBuffer.getChannelData(0);
                const pcmData = this.floatTo16BitPCM(inputData);
                socket.send(pcmData);
            }
        };

        sourceNode.connect(processor);
        processor.connect(audioContext.destination);

        if (source === 'mic') {
            this.micAudioContext = audioContext;
            this.micProcessor = processor;
        } else {
            this.systemAudioContext = audioContext;
            this.systemProcessor = processor;
        }
    }

    /**
     * Handle incoming transcript messages from WebSocket
     */
    private handleTranscriptMessage(data: string): void {
        try {
            const message = JSON.parse(data);

            if (message.type === 'transcript') {
                const transcript: TranscriptMessage = {
                    id: `msg_${++this.messageIdCounter}`,
                    role: message.role as 'me' | 'interviewer',
                    text: message.text,
                    timestamp: Date.now(),
                    isFinal: message.is_final ?? true,
                };

                this.transcriptCallbacks.forEach(cb => cb(transcript));
            }
        } catch (error) {
            console.error('Failed to parse transcript message:', error);
        }
    }

    /**
     * Request an AI-generated answer based on current conversation context
     */
    async requestAnswer(): Promise<AIResponse> {
        if (!this.conversationId) {
            throw new Error('No active conversation');
        }

        const response = await fetch(`${BACKEND_API_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversation_id: this.conversationId,
                context_window_minutes: 15,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const answer: AIResponse = await response.json();
        this.answerCallbacks.forEach(cb => cb(answer));
        return answer;
    }

    /**
     * Subscribe to transcript messages
     */
    onTranscript(callback: TranscriptCallback): () => void {
        this.transcriptCallbacks.push(callback);
        return () => {
            this.transcriptCallbacks = this.transcriptCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * Subscribe to answer events
     */
    onAnswer(callback: AnswerCallback): () => void {
        this.answerCallbacks.push(callback);
        return () => {
            this.answerCallbacks = this.answerCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(callback: StatusCallback): () => void {
        this.statusCallbacks.push(callback);
        return () => {
            this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
        };
    }

    private notifyStatus(status: 'idle' | 'connecting' | 'active' | 'error'): void {
        this.statusCallbacks.forEach(cb => cb(status));
    }

    /**
     * Get current conversation ID
     */
    getConversationId(): string | null {
        return this.conversationId;
    }
}

// Export singleton instance
export const conversationService = new ConversationService();
