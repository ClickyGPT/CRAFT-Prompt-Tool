
import React from 'react';

interface OutputCardProps {
    title: string;
    children: React.ReactNode;
    actionButton?: React.ReactNode;
}

export const OutputCard: React.FC<OutputCardProps> = ({ title, children, actionButton }) => {
    return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg flex flex-col h-full">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
                {actionButton}
            </div>
            <div className="p-4 flex-grow min-h-[150px]">
                {children}
            </div>
        </div>
    );
};