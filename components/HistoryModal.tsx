
import React from 'react';
import { CloseIcon } from './icons';
import type { PromptSnapshot } from '../App';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: PromptSnapshot[];
    onSelect: (snapshot: PromptSnapshot) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                    <h2 id="history-modal-title" className="text-xl font-semibold text-zinc-100">Prompt History</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-green-400 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-4 flex-grow overflow-y-auto">
                    {history.length > 0 ? (
                        <ul className="space-y-3">
                            {history.map((snapshot) => (
                                <li key={snapshot.id}>
                                    <button
                                        onClick={() => onSelect(snapshot)}
                                        className="w-full text-left p-4 bg-zinc-900/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <p className="text-sm text-zinc-300 truncate font-mono">{snapshot.finalPrompt}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-zinc-500">{new Date(snapshot.timestamp).toLocaleString()}</p>
                                            {snapshot.wasEdited && <span className="text-xs font-semibold text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded-full">Edited</span>}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500 text-center py-8">Your prompt history is empty. Test a prompt to save it.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
