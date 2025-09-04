
import React, { useState, useMemo } from 'react';
import { CloseIcon } from './icons';

export interface Template {
    name: string;
    description: string;
    value: string;
}

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    templates: Template[];
    onSelect: (value: string) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, title, templates, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTemplates = useMemo(() => {
        if (!searchTerm) return templates;
        return templates.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, templates]);

    if (!isOpen) return null;

    const handleSelect = (value: string) => {
        onSelect(value);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="template-modal-title">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                    <h2 id="template-modal-title" className="text-xl font-semibold text-zinc-100">{title}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-green-400 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-4 border-b border-zinc-700">
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 text-zinc-300 placeholder-zinc-500 rounded-md p-3 border border-zinc-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow duration-200 text-sm"
                        aria-label="Search templates"
                    />
                </div>
                <div className="p-4 flex-grow overflow-y-auto">
                    {filteredTemplates.length > 0 ? (
                        <ul className="space-y-3">
                            {filteredTemplates.map((template, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => handleSelect(template.value)}
                                        className="w-full text-left p-4 bg-zinc-900/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <h3 className="font-bold text-green-400">{template.name}</h3>
                                        <p className="text-sm text-zinc-400 mt-1">{template.description}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500 text-center py-8">No templates found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
