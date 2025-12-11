import React from 'react';
import { MessageCircle, Square, Loader2, RotateCcw } from 'lucide-react';
import { useConversation } from '../../contexts/ConversationContext';
import { TranscriptDisplay } from './TranscriptDisplay';
import { AnswerDisplay } from './AnswerDisplay';

export const ConversationMode: React.FC = () => {
    const {
        status,
        transcripts,
        answer,
        isLoadingAnswer,
        startConversation,
        stopConversation,
        requestAnswer,
        clearTranscripts,
    } = useConversation();

    const isActive = status === 'active';
    const isConnecting = status === 'connecting';
    const hasContent = transcripts.length > 0 || answer;

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
        await requestAnswer();
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
                {/* Conversation Toggle Button */}
                <button
                    onClick={handleConversationToggle}
                    disabled={isConnecting}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${isActive
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                            : isConnecting
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 cursor-wait'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
                        }`}
                >
                    {isActive ? (
                        <>
                            <Square size={12} fill="currentColor" />
                            <span>Stop</span>
                        </>
                    ) : isConnecting ? (
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

                {/* Answer Button - Only show when active */}
                {isActive && (
                    <button
                        onClick={handleAnswerClick}
                        disabled={isLoadingAnswer || transcripts.length === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${isLoadingAnswer || transcripts.length === 0
                                ? 'bg-gray-500/10 text-gray-500 border border-gray-500/30 cursor-not-allowed'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            }`}
                    >
                        {isLoadingAnswer ? (
                            <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Thinking...</span>
                            </>
                        ) : (
                            <span>Answer</span>
                        )}
                    </button>
                )}

                {/* Clear Button - Only show when there's content */}
                {hasContent && !isActive && (
                    <button
                        onClick={clearTranscripts}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
                    >
                        <RotateCcw size={11} />
                        <span>Clear</span>
                    </button>
                )}
            </div>

            {/* Content Area - Only show when conversation has started */}
            {hasContent && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-w-[380px] max-w-[420px]">
                    {/* Transcript Section */}
                    <TranscriptDisplay
                        transcripts={transcripts}
                        className="mb-3"
                    />

                    {/* Divider */}
                    {(answer || isLoadingAnswer) && (
                        <div className="border-t border-white/10 my-3" />
                    )}

                    {/* Answer Section */}
                    <AnswerDisplay
                        answer={answer}
                        isLoading={isLoadingAnswer}
                    />
                </div>
            )}
        </div>
    );
};
