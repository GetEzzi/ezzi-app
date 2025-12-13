import React from 'react';
import { AIResponse } from '../../services/ConversationService';
import { Loader2 } from 'lucide-react';

interface AnswerDisplayProps {
    answers: AIResponse[];
    isLoading: boolean;
    className?: string;
}

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({
    answers,
    isLoading,
    className = '',
}) => {
    // Helper to render a single answer
    const renderAnswer = (answer: AIResponse, isLatest: boolean, index: number) => {
        const baseColor = isLatest ? 'emerald' : 'gray';
        // Tailwind dynamic classes usually need full strings, but we can construct reasonably or use specific classes
        // Using explicit classes for safety
        const containerClasses = isLatest
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-white/5 border-white/10 text-gray-300';

        const labelColor = isLatest ? 'text-emerald-600' : 'text-gray-500';
        const textColor = isLatest ? 'text-emerald-900' : 'text-gray-300';

        return (
            <div key={index} className={`border rounded-lg p-4 mb-3 last:mb-0 ${containerClasses}`}>
                <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${labelColor}`}>
                    {isLatest ? 'Latest Suggestion' : 'Previous Suggestion'}
                </div>

                <div className={`text-sm leading-relaxed ${textColor}`}>
                    {answer.suggestion}
                </div>

                {answer.reasoning && (
                    <div className={`mt-3 pt-3 border-t ${isLatest ? 'border-emerald-200' : 'border-white/5'}`}>
                        <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${labelColor}`}>
                            Reasoning
                        </div>
                        <div className={`text-xs leading-relaxed opacity-80 ${textColor}`}>
                            {answer.reasoning}
                        </div>
                    </div>
                )}

                {answer.code_snippet && (
                    <div className={`mt-3 pt-3 border-t ${isLatest ? 'border-emerald-200' : 'border-white/5'}`}>
                        <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${labelColor}`}>
                            Code
                        </div>
                        <pre className="bg-[#1E1E1E] text-gray-200 text-xs p-3 rounded overflow-x-auto font-mono">
                            <code>{answer.code_snippet}</code>
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    if (answers.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Render previous answers */}
            {answers.slice(0, -1).map((ans, i) => renderAnswer(ans, false, i))}

            {/* Render latest answer */}
            {answers.length > 0 && renderAnswer(answers[answers.length - 1], true, answers.length - 1)}

            {/* Loading Indicator */}
            {isLoading && (
                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-lg p-4 mt-3">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-medium">Drafting response...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
