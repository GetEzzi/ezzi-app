import React from 'react';
import { AIResponse } from '../../services/ConversationService';
import { Loader2 } from 'lucide-react';

interface AnswerDisplayProps {
    answer: AIResponse | null;
    isLoading: boolean;
    className?: string;
}

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({
    answer,
    isLoading,
    className = '',
}) => {
    if (isLoading) {
        return (
            <div className={`bg-emerald-50 border border-emerald-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center gap-3 text-emerald-700">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">Generating answer...</span>
                </div>
            </div>
        );
    }

    if (!answer) {
        return null;
    }

    return (
        <div className={`bg-emerald-50 border border-emerald-200 rounded-lg p-4 ${className}`}>
            <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-2">
                AI Suggestion
            </div>

            <div className="text-emerald-900 text-sm leading-relaxed">
                {answer.suggestion}
            </div>

            {answer.reasoning && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                    <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
                        Reasoning
                    </div>
                    <div className="text-emerald-800 text-xs leading-relaxed opacity-80">
                        {answer.reasoning}
                    </div>
                </div>
            )}

            {answer.code_snippet && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                    <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
                        Code
                    </div>
                    <pre className="bg-emerald-900 text-emerald-100 text-xs p-3 rounded overflow-x-auto">
                        <code>{answer.code_snippet}</code>
                    </pre>
                </div>
            )}
        </div>
    );
};
