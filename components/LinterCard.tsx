
import React from 'react';
import { LinterIcon } from './icons';

// --- Types ---
export interface LinterIssue {
    id: string;
    component: 'Context' | 'Role' | 'Action' | 'Format' | 'Target';
    message: string;
    fix?: {
        label: string;
        apply: () => void;
    };
}

export interface LinterResult {
    totalScore: number;
    breakdown: {
        context: number;
        role: number;
        action: number;
        format: number;
        target: number;
    };
    issues: LinterIssue[];
}

interface LinterCardProps extends LinterResult {
    onApplyFix: (fix: () => void) => void;
}

// --- Sub-components ---

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const scoreColorClass = score < 40 ? 'text-red-400' : score < 75 ? 'text-yellow-400' : 'text-green-400';
    
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute -rotate-90" width={size} height={size}>
                <circle
                    className="text-zinc-700"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${scoreColorClass} transition-all duration-500 ease-in-out`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={`text-2xl font-bold ${scoreColorClass}`}>{score}</span>
        </div>
    );
};

const BreakdownItem: React.FC<{ label: string, score: number, maxScore: number }> = ({ label, score, maxScore }) => {
    const percentage = (score / maxScore) * 100;
    const barColorClass = percentage < 40 ? 'bg-red-500' : percentage < 75 ? 'bg-yellow-500' : 'bg-green-500';
    return (
        <div className="flex items-center gap-4">
            <span className="w-16 text-sm font-medium text-zinc-400">{label}</span>
            <div className="flex-1 bg-zinc-700 rounded-full h-2.5">
                <div className={`${barColorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="w-10 text-right text-sm font-semibold text-zinc-200">{score}/{maxScore}</span>
        </div>
    );
};

// --- Main Component ---

export const LinterCard: React.FC<LinterCardProps> = ({ totalScore, breakdown, issues, onApplyFix }) => {
    return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-zinc-700">
                <span className="text-green-400"><LinterIcon /></span>
                <h2 className="text-lg font-semibold text-zinc-100">CRAFT Linter</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-400">Total Score</h3>
                    <ScoreCircle score={totalScore} />
                </div>
                <div className="flex flex-col justify-center gap-2">
                     <BreakdownItem label="Context" score={breakdown.context} maxScore={20} />
                     <BreakdownItem label="Role" score={breakdown.role} maxScore={20} />
                     <BreakdownItem label="Action" score={breakdown.action} maxScore={20} />
                     <BreakdownItem label="Format" score={breakdown.format} maxScore={20} />
                     <BreakdownItem label="Target" score={breakdown.target} maxScore={20} />
                </div>
            </div>
            {issues.length > 0 && (
                <div className="p-4 border-t border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-100 mb-3">Suggestions</h3>
                    <ul className="space-y-3">
                        {issues.map((issue) => (
                            <li key={issue.id} className="flex items-center justify-between gap-2 p-3 bg-zinc-900/50 rounded-lg">
                               <div className="flex-1">
                                 <p className="text-xs font-bold text-yellow-400 uppercase">{issue.component}</p>
                                 <p className="text-sm text-zinc-300">{issue.message}</p>
                               </div>
                                {issue.fix && (
                                    <button
                                        onClick={() => onApplyFix(issue.fix.apply)}
                                        className="px-3 py-1 text-xs font-semibold rounded-md border border-green-400 text-green-400 transition-colors hover:bg-green-400 hover:text-zinc-900 flex-shrink-0"
                                    >
                                        {issue.fix.label}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
