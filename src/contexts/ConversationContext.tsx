import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from 'react';
import {
    conversationService,
    TranscriptMessage,
    AIResponse,
} from '../services/ConversationService';

type ConversationStatus = 'idle' | 'connecting' | 'active' | 'error';

interface ConversationContextType {
    status: ConversationStatus;
    transcripts: TranscriptMessage[];
    answers: AIResponse[];
    quickPoints: string[];  // Markdown talking points from Groq
    isLoadingAnswer: boolean;
    startConversation: () => Promise<void>;
    stopConversation: () => void;
    requestAnswer: () => Promise<void>;
    clearTranscripts: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
    undefined
);

interface ConversationProviderProps {
    children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({
    children,
}) => {
    const [status, setStatus] = useState<ConversationStatus>('idle');
    const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
    const [answers, setAnswers] = useState<AIResponse[]>([]);
    const [quickPoints, setQuickPoints] = useState<string[]>([]);
    const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

    // Subscribe to service events
    useEffect(() => {
        const unsubscribeTranscript = conversationService.onTranscript((message) => {
            setTranscripts((prev) => {
                // Update existing message if it's an update, or add new one
                const existingIndex = prev.findIndex(
                    (m) => m.role === message.role && !m.isFinal
                );

                if (!message.isFinal) {
                    // Interim result - update or add
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = message;
                        return updated;
                    }
                    return [...prev, message];
                } else {
                    // Final result - remove interim and add final
                    if (existingIndex >= 0) {
                        const updated = prev.filter((_, i) => i !== existingIndex);
                        return [...updated, message];
                    }
                    return [...prev, message];
                }
            });
        });

        const unsubscribeAnswer = conversationService.onAnswer((newAnswer) => {
            setAnswers((prev) => [...prev, newAnswer]);
        });

        const unsubscribeQuickPoints = conversationService.onQuickPoints((points) => {
            setQuickPoints((prev) => [...prev, points]);
        });

        const unsubscribeStatus = conversationService.onStatusChange((newStatus) => {
            setStatus(newStatus);
        });

        return () => {
            unsubscribeTranscript();
            unsubscribeAnswer();
            unsubscribeQuickPoints();
            unsubscribeStatus();
        };
    }, []);

    const startConversation = useCallback(async () => {
        setTranscripts([]);
        setAnswers([]);
        setQuickPoints([]);
        await conversationService.startConversation();
    }, []);

    const stopConversation = useCallback(() => {
        conversationService.stopConversation();
    }, []);

    const requestAnswer = useCallback(async () => {
        setIsLoadingAnswer(true);
        try {
            await conversationService.requestAnswer();
        } catch (error) {
            console.error('Failed to get answer:', error);
        } finally {
            setIsLoadingAnswer(false);
        }
    }, []);

    const clearTranscripts = useCallback(() => {
        setTranscripts([]);
        setAnswers([]);
        setQuickPoints([]);
    }, []);

    return (
        <ConversationContext.Provider
            value={{
                status,
                transcripts,
                answers,
                quickPoints,
                isLoadingAnswer,
                startConversation,
                stopConversation,
                requestAnswer,
                clearTranscripts,
            }}
        >
            {children}
        </ConversationContext.Provider>
    );
};

export function useConversation() {
    const context = useContext(ConversationContext);
    if (!context) {
        throw new Error(
            'useConversation must be used within a ConversationProvider'
        );
    }
    return context;
}
