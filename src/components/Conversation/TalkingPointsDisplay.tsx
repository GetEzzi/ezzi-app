import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Zap } from 'lucide-react';

interface TalkingPointsDisplayProps {
    quickPoints: string[];
    isLoading: boolean;
    className?: string;
}

export const TalkingPointsDisplay: React.FC<TalkingPointsDisplayProps> = ({
    quickPoints,
    isLoading,
    className = '',
}) => {
    // Helper to render a single set of quick points
    const renderQuickPoints = (points: string, isLatest: boolean, index: number) => {
        const containerClasses = isLatest
            ? 'bg-cyan-50 border-cyan-200 text-cyan-900'
            : 'bg-white/5 border-white/10 text-gray-300';

        const labelColor = isLatest ? 'text-cyan-600' : 'text-gray-500';

        return (
            <div key={index} className={`border rounded-lg p-4 mb-3 last:mb-0 ${containerClasses}`}>
                <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide mb-3 ${labelColor}`}>
                    <Zap size={12} />
                    {isLatest ? 'Quick Talking Points' : 'Previous Points'}
                </div>

                <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${isLatest ? 'prose-cyan' : 'prose-invert'}`}>
                    <ReactMarkdown
                        components={{
                            // Style bullet points
                            ul: ({ children }: { children?: React.ReactNode }) => (
                                <ul className="space-y-2 list-none pl-0 m-0">{children}</ul>
                            ),
                            li: ({ children }: { children?: React.ReactNode }) => (
                                <li className="flex items-start gap-2">
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLatest ? 'bg-cyan-500' : 'bg-gray-500'}`}></span>
                                    <span>{children}</span>
                                </li>
                            ),
                            // Bold text styling
                            strong: ({ children }: { children?: React.ReactNode }) => (
                                <strong className={`font-bold ${isLatest ? 'text-cyan-700' : 'text-white'}`}>
                                    {children}
                                </strong>
                            ),
                            // Paragraph styling
                            p: ({ children }: { children?: React.ReactNode }) => (
                                <p className="m-0">{children}</p>
                            ),
                        }}
                    >
                        {points}
                    </ReactMarkdown>
                </div>
            </div>
        );
    };

    if (quickPoints.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Render previous quick points */}
            {quickPoints.slice(0, -1).map((pts, i) => renderQuickPoints(pts, false, i))}

            {/* Render latest quick points */}
            {quickPoints.length > 0 && renderQuickPoints(quickPoints[quickPoints.length - 1], true, quickPoints.length - 1)}

            {/* Loading Indicator */}
            {isLoading && (
                <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-lg p-4 mt-3">
                    <div className="flex items-center gap-3 text-cyan-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-medium">Fetching quick points...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
