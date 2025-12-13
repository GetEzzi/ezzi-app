import React, { useEffect, useRef } from 'react';
import { MessageCircle, Square, Loader2, RotateCcw } from 'lucide-react';
import { useConversation } from '../../contexts/ConversationContext';
import { TranscriptDisplay } from './TranscriptDisplay';
import { AnswerDisplay } from './AnswerDisplay';

interface ConversationModeProps {
    extraActions?: React.ReactNode;
}

export const ConversationMode: React.FC<ConversationModeProps> = ({ extraActions }) => {
    const {
        status,
        transcripts,
        answers,
        isLoadingAnswer,
        startConversation,
        stopConversation,
        requestAnswer,
        clearTranscripts,
    } = useConversation();

    const isActive = status === 'active';
    const isConnecting = status === 'connecting';
    const hasContent = transcripts.length > 0 || answers.length > 0;

    // Auto-scroll refs
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const answerEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when content changes
    useEffect(() => {
        if (transcripts.length > 0) {
            transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [transcripts]);

    useEffect(() => {
        if (answers.length > 0 || isLoadingAnswer) {
            answerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [answers, isLoadingAnswer]);

    const handleConversationToggle = async () => {
        if (isActive) {
            stopConversation();
        } else {
            try {
                await startConversation();
            } catch (error) {
                console.error('Failed to start conversation:', error);
            }
        }
    };

    const handleAnswerClick = async () => {
        if (!isActive || isLoadingAnswer) return;
        requestAnswer();
    };

    // Keyboard Shortcut: Ctrl+Space to Answer
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyQ' || e.key.toLowerCase() === 'q')) {
                e.preventDefault();
                handleAnswerClick();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, isLoadingAnswer]);


    // Compact View (Inactive)
    if (!isActive && !hasContent) {
        return (
            <button
                onClick={handleConversationToggle}
                disabled={isConnecting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${isConnecting
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 cursor-wait'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
                    }`}
            >
                {isConnecting ? (
                    <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Connecting...</span>
                    </>
                ) : (
                    <>
                        <MessageCircle size={12} />
                        <span>Conversation</span>
                    </>
                )}
            </button>
        );
    }

    // Expanded / Active View (3-Column Layout)
    return (
        <div className="flex gap-4 w-full h-[500px]">
            {/* Column 1: Controls (Left) */}
            <div className="flex flex-col gap-4 w-[200px] flex-shrink-0">
                {/* Main Controls */}
                <div className="flex flex-col gap-2 bg-[#1E2530]/50 p-3 rounded-lg border border-white/5">
                    <button
                        onClick={handleConversationToggle}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 w-full ${isActive
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
                            }`}
                    >
                        {isActive ? (
                            <>
                                <Square size={12} fill="currentColor" />
                                <span>Stop Conversation</span>
                            </>
                        ) : (
                            <>
                                <Loader2 size={12} className={isConnecting ? "animate-spin" : "hidden"} />
                                <span>{isConnecting ? 'Connecting...' : 'Resume Conversation'}</span>
                            </>
                        )}
                    </button>

                    {isActive && (
                        <button
                            onClick={handleAnswerClick}
                            disabled={isLoadingAnswer}
                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 w-full ${isLoadingAnswer
                                ? 'bg-gray-500/10 text-gray-500 border border-gray-500/30 cursor-not-allowed'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                }`}
                            title="Shortcut: Ctrl + Q"
                        >
                            {isLoadingAnswer ? (
                                <>
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Thinking...</span>
                                </>
                            ) : (
                                <span>Generate Answer (Ctrl+Q)</span>
                            )}
                        </button>
                    )}

                    <button
                        onClick={clearTranscripts}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors w-full border border-transparent hover:border-white/10"
                    >
                        <RotateCcw size={11} />
                        <span>Clear History</span>
                    </button>
                </div>

                {/* Extra Actions */}
                {extraActions && (
                    <div className="bg-[#1E2530]/50 p-3 rounded-lg border border-white/5 mt-auto">
                        <div className="text-[10px] uppercase text-gray-500 font-semibold mb-2">Tools</div>
                        <div className="flex flex-col gap-2">
                            {extraActions}
                        </div>
                    </div>
                )}
            </div>

            {/* Column 2: Transcript (Middle) */}
            <div className="flex-1 min-w-[300px] h-full">
                <div className="h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 overflow-y-auto relative">
                    <div className="text-[10px] uppercase text-gray-500 font-semibold mb-2 sticky top-0 bg-[#131416]/90 p-1 backdrop-blur-md z-10 border-b border-white/5">Transcript</div>
                    <TranscriptDisplay
                        transcripts={transcripts}
                        className="mb-2"
                    />
                    <div ref={transcriptEndRef} />
                </div>
            </div>

            {/* Column 3: Suggestions (Right) */}
            <div className="flex-1 min-w-[350px] h-full">
                <div className="h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 overflow-y-auto relative">
                    <div className="text-[10px] uppercase text-emerald-600/70 font-semibold mb-2 sticky top-0 bg-[#131416]/90 p-1 backdrop-blur-md z-10 border-b border-white/5">AI Suggestions</div>
                    <AnswerDisplay
                        answers={answers}
                        isLoading={isLoadingAnswer}
                    />
                    <div ref={answerEndRef} />
                </div>
            </div>
        </div>
    );
};
