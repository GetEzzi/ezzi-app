/**
 * ConversationService - Manages real-time audio transcription via Python backend
 * 
 * New Architecture:
 * - Frontend sends START command to backend
 * - Backend captures Mic + System audio
 * - Backend streams to Deepgram
 * - Backend broadcasts transcripts to Frontend via WebSocket
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

export interface DualAIResponse {
    quick_points: string;  // Markdown talking points from Groq
    full_answer: AIResponse;  // Full response from OpenRouter
}

type TranscriptCallback = (message: TranscriptMessage) => void;
type AnswerCallback = (answer: AIResponse) => void;
type QuickPointsCallback = (points: string) => void;
type StatusCallback = (status: 'idle' | 'connecting' | 'active' | 'error') => void;

class ConversationService {
    private conversationId: string | null = null;
    private socket: WebSocket | null = null;

    // Callbacks
    private transcriptCallbacks: TranscriptCallback[] = [];
    private answerCallbacks: AnswerCallback[] = [];
    private quickPointsCallbacks: QuickPointsCallback[] = [];
    private statusCallbacks: StatusCallback[] = [];

    private messageIdCounter = 0;

    /**
     * Generate a unique conversation ID
     */
    private generateConversationId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Start a new conversation session
     */
    async startConversation(): Promise<void> {
        this.notifyStatus('connecting');
        this.conversationId = this.generateConversationId();

        try {
            // 1. Connect to Transcript WebSocket first
            await this.connectWebSocket();

            // 2. Trigger audio capture on backend
            const response = await fetch(`${BACKEND_API_URL}/api/conversation/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: this.conversationId,
                    // Optional: pass device indices if you have a settings UI
                    // mic_device_index: 1, 
                    // system_device_index: 2 
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to start conversation: ${response.statusText}`);
            }

            this.notifyStatus('active');
            console.log('Conversation started successfully');

        } catch (error) {
            console.error('Failed to start conversation:', error);
            this.notifyStatus('error');
            this.stopConversation();
            throw error;
        }
    }

    /**
     * Connect to the single transcript WebSocket
     */
    private async connectWebSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            const wsUrl = `${BACKEND_WS_URL}/ws/conversation/${this.conversationId}`;
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('🔌 Transcript WebSocket connected');
                resolve();
            };

            this.socket.onmessage = (event) => {
                this.handleTranscriptMessage(event.data);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Only reject if we haven't connected yet
                if (this.socket?.readyState !== WebSocket.OPEN) {
                    reject(error);
                }
            };

            this.socket.onclose = () => {
                console.log('🔌 Transcript WebSocket closed');
                if (this.conversationId) {
                    // unexpected close
                    this.notifyStatus('error');
                }
            };
        });
    }

    /**
     * Stop the current conversation session
     */
    async stopConversation(): Promise<void> {
        if (!this.conversationId) return;

        try {
            // 1. Tell backend to stop capture
            await fetch(`${BACKEND_API_URL}/api/conversation/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: this.conversationId
                })
            }).catch(e => console.warn("Failed to call stop API:", e));

        } finally {
            // 2. Close WebSocket
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }

            this.conversationId = null;
            this.notifyStatus('idle');
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
     * Request dual AI-generated answers (quick talking points + full answer)
     * Fires BOTH endpoints in parallel - quick points arrive first, full answer later
     */
    async requestAnswer(): Promise<void> {
        if (!this.conversationId) {
            throw new Error('No active conversation');
        }

        const requestBody = JSON.stringify({
            conversation_id: this.conversationId,
            context_window_minutes: 15,
        });

        // Fire both requests independently - don't await together
        // Quick points request (Groq - fast ~1-2s)
        const quickPromise = fetch(`${BACKEND_API_URL}/api/analyze-quick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(`Quick API error: ${response.status}`);
                const data = await response.json();
                console.log('[QUICK] Response received:', data.quick_points?.substring(0, 50));
                this.quickPointsCallbacks.forEach(cb => cb(data.quick_points));
            })
            .catch(error => {
                console.error('[QUICK] Failed to get quick points:', error);
            });

        // Full answer request (OpenRouter - slower ~5-10s)
        const fullPromise = fetch(`${BACKEND_API_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
        })
            .then(async (response) => {
                if (!response.ok) throw new Error(`Full API error: ${response.status}`);
                const data: AIResponse = await response.json();
                console.log('[FULL] Response received:', data.suggestion?.substring(0, 50));
                this.answerCallbacks.forEach(cb => cb(data));
            })
            .catch(error => {
                console.error('[FULL] Failed to get full answer:', error);
            });

        // Wait for both to complete (but they're already running independently)
        await Promise.all([quickPromise, fullPromise]);
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
     * Subscribe to quick points events
     */
    onQuickPoints(callback: QuickPointsCallback): () => void {
        this.quickPointsCallbacks.push(callback);
        return () => {
            this.quickPointsCallbacks = this.quickPointsCallbacks.filter(cb => cb !== callback);
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
