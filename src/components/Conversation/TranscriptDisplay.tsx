import React, { useRef, useEffect } from 'react';
import { TranscriptMessage } from '../../services/ConversationService';

interface TranscriptDisplayProps {
    transcripts: TranscriptMessage[];
    className?: string;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
    transcripts,
    className = '',
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcripts]);

    if (transcripts.length === 0) {
        return (
            <div className={`flex items-center justify-center text-gray-400 text-sm py-8 ${className}`}>
                Waiting for conversation...
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            className={`overflow-y-auto space-y-1.5 pr-2 ${className}`}
            style={{ maxHeight: '280px' }}
        >
            {transcripts.map((message) => (
                <div
                    key={message.id}
                    className={`px-3 py-2 rounded-lg text-xs ${message.role === 'interviewer'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : 'bg-pink-100 text-pink-900 border border-pink-200'
                        } ${!message.isFinal ? 'opacity-60' : ''}`}
                >
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-medium text-[10px] uppercase tracking-wide opacity-70">
                            {message.role === 'interviewer' ? 'Interviewer' : 'You'}
                        </span>
                        {!message.isFinal && (
                            <span className="text-[10px] opacity-50">(typing...)</span>
                        )}
                    </div>
                    <p className="leading-snug">{message.text}</p>
                </div>
            ))}
        </div>
    );
};
