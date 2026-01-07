import React, { useEffect, useRef } from 'react';
import { MessageCircle, Square, Loader2, RotateCcw } from 'lucide-react';
import { useConversation } from '../../contexts/ConversationContext';
import { TranscriptDisplay } from './TranscriptDisplay';
import { AnswerDisplay } from './AnswerDisplay';
import { TalkingPointsDisplay } from './TalkingPointsDisplay';

interface ConversationModeProps {
    extraActions?: React.ReactNode;
}

export const ConversationMode: React.FC<ConversationModeProps> = ({ extraActions }) => {
    const {
        status,
        transcripts,
        answers,
        quickPoints,
        isLoadingAnswer,
        startConversation,
        stopConversation,
        requestAnswer,
        clearTranscripts,
    } = useConversation();

    const isActive = status === 'active';
    const isConnecting = status === 'connecting';
    const hasContent = transcripts.length > 0 || answers.length > 0 || quickPoints.length > 0;

    // Auto-scroll refs
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const answerEndRef = useRef<HTMLDivElement>(null);
    const quickPointsEndRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (quickPoints.length > 0 || isLoadingAnswer) {
            quickPointsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [quickPoints, isLoadingAnswer]);

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

    // Expanded / Active View (3-Column Layout matching wireframe)
    return (
        <div className="bg-[#1a1d24] p-4 rounded-xl border border-white/10 w-full">
            <div className="flex gap-4 w-full h-[520px]">
                {/* Column 1: Controls + Transcript (Stacked) */}
                <div className="flex flex-col gap-3 w-[220px] flex-shrink-0 h-full">
                    {/* Controls Section */}
                    <div className="flex flex-col gap-2 bg-[#1E2530]/50 p-3 rounded-lg border border-white/5">
                        {/* Top row: Stop + Generate buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleConversationToggle}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex-1 ${isActive
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
                                    }`}
                            >
                                {isActive ? (
                                    <>
                                        <Square size={10} fill="currentColor" />
                                        <span>STOP</span>
                                    </>
                                ) : (
                                    <span>{isConnecting ? '...' : 'Start'}</span>
                                )}
                            </button>

                            {isActive && (
                                <button
                                    onClick={handleAnswerClick}
                                    disabled={isLoadingAnswer}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex-1 ${isLoadingAnswer
                                        ? 'bg-gray-500/10 text-gray-500 border border-gray-500/30 cursor-not-allowed'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                        }`}
                                    title="Shortcut: Ctrl + Q"
                                >
                                    {isLoadingAnswer ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <span>Generate</span>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Reload/Clear button */}
                        <button
                            onClick={clearTranscripts}
                            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors w-auto self-start border border-white/10"
                        >
                            <RotateCcw size={10} />
                            <span>Reload</span>
                        </button>
                    </div>

                    {/* Transcript Section (takes remaining space) */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 overflow-y-auto relative min-h-0">
                        <div className="text-[10px] uppercase text-gray-500 font-semibold mb-2 sticky top-0 bg-[#131416]/90 p-1 backdrop-blur-md z-10 border-b border-white/5">Transcript</div>
                        <TranscriptDisplay
                            transcripts={transcripts}
                            className="mb-2"
                        />
                        <div ref={transcriptEndRef} />
                    </div>

                    {/* Tools Section at bottom */}
                    {extraActions && (
                        <div className="bg-[#1E2530]/50 p-3 rounded-lg border border-white/5">
                            <div className="text-[10px] uppercase text-gray-500 font-semibold mb-2">Tools</div>
                            <div className="flex flex-col gap-2">
                                {extraActions}
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Full Answer (Middle) */}
                <div className="flex-1 min-w-[280px] h-full">
                    <div className="h-full bg-white/5 border border-white/10 rounded-lg p-3 overflow-y-auto relative">
                        <div className="text-[10px] uppercase text-emerald-600/70 font-semibold mb-2 sticky top-0 bg-[#131416]/90 p-1 backdrop-blur-md z-10 border-b border-white/5">Full Answer</div>
                        <AnswerDisplay
                            answers={answers}
                            isLoading={isLoadingAnswer}
                        />
                        <div ref={answerEndRef} />
                    </div>
                </div>

                {/* Column 3: Quick Talking Points (Right) */}
                <div className="flex-1 min-w-[280px] h-full">
                    <div className="h-full bg-white/5 border border-cyan-500/30 rounded-lg p-3 overflow-y-auto relative">
                        <div className="text-[10px] uppercase text-cyan-500/70 font-semibold mb-2 sticky top-0 bg-[#131416]/90 p-1 backdrop-blur-md z-10 border-b border-cyan-500/20">Quick Talking Points</div>
                        <TalkingPointsDisplay
                            quickPoints={quickPoints}
                            isLoading={isLoadingAnswer}
                        />
                        <div ref={quickPointsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};
