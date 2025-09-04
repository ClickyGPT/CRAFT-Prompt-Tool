
import React from 'react';

interface InputCardProps {
    icon: React.ReactNode;
    title: string;
    placeholder: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    headerAccessory?: React.ReactNode;
    children?: React.ReactNode;
}

export const InputCard: React.FC<InputCardProps> = ({ icon, title, placeholder, value, onChange, onFocus, onBlur, headerAccessory, children }) => {
    return (
        <div className="relative bg-zinc-800 border border-zinc-700 rounded-xl shadow-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                 <div className="flex items-center gap-3">
                    <span className="text-green-400">{icon}</span>
                    <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
                 </div>
                {headerAccessory}
            </div>
            <div className="p-4 flex-grow">
                <textarea
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className="w-full h-32 bg-zinc-900 text-zinc-300 placeholder-zinc-500 rounded-md p-3 resize-none border border-zinc-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow duration-200 text-sm"
                    aria-label={`${title} input`}
                />
            </div>
            {children}
        </div>
    );
};
