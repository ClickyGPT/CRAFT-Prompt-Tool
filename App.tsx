
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InputCard } from './components/InputCard';
import { OutputCard } from './components/OutputCard';
import { LinterCard, LinterResult, LinterIssue } from './components/LinterCard';
import { TemplateModal, Template } from './components/TemplateModal';
import { HistoryModal } from './components/HistoryModal';
import { ToggleSwitch } from './components/ToggleSwitch';
import { runPrompt } from './services/geminiService';
import { ContextIcon, RoleIcon, ActionIcon, FormatIcon, TargetIcon, CopyIcon, SparklesIcon, CheckIcon, DownloadIcon, TemplateIcon, WandIcon, LearnIcon, HistoryIcon } from './components/icons';

// --- Data for new features ---

const ALL_CONTEXT_SUGGESTIONS: string[] = [
    "Drafting a project proposal for a new mobile app.",
    "Creating a marketing plan for a product launch.",
    "Writing an educational article about climate change.",
    "Generating a script for a short promotional video.",
    "Brainstorming ideas for a fantasy novel.",
    "Developing a lesson plan for a high school history class.",
    "Summarizing a complex scientific research paper.",
    "Composing a professional email to a potential client.",
];

const ROLE_TEMPLATES: Template[] = [
    { name: 'Expert Technical Writer', description: 'Creates clear, concise, and accurate technical documentation.', value: 'an expert technical writer' },
    { name: 'Creative Storyteller', description: 'Weaves engaging narratives and compelling stories.', value: 'a creative storyteller' },
    { name: 'Data Analyst Guru', description: 'Interprets data and presents insights in an understandable way.', value: 'a data analyst guru' },
    { name: 'Professional Copywriter', description: 'Writes persuasive marketing and promotional content.', value: 'a professional copywriter' },
    { name: 'Academic Researcher', description: 'Provides well-researched, evidence-based information and analysis.', value: 'an academic researcher' },
    { name: 'Friendly Conversationalist', description: 'Engages in a casual, approachable, and helpful manner.', value: 'a friendly and helpful conversational AI' },
    { name: 'Senior Software Engineer', description: 'Provides expert-level code, architectural advice, and debugging help.', value: 'a senior software engineer' },
    { name: 'Meticulous Editor', description: 'Refines text for grammatical perfection, clarity, and style.', value: 'a meticulous editor' },
    { name: 'Social Media Strategist', description: 'Crafts viral-worthy content and engagement strategies for social platforms.', value: 'a savvy social media strategist' },
    { name: 'Socratic Tutor', description: 'Asks probing questions to help users discover answers for themselves.', value: 'a Socratic tutor who guides through questioning' },
    { name: 'Devil\'s Advocate', description: 'Challenges assumptions and identifies potential flaws in an argument or plan.', value: 'a devil\'s advocate who critically examines ideas' },
    { name: 'UX Designer', description: 'Focuses on user-centric design, creating intuitive and accessible interfaces.', value: 'a UX designer focused on creating a seamless and user-friendly experience' },
    { name: 'Legal Advisor', description: 'Analyzes legal documents and provides advice in a clear, understandable manner.', value: 'a cautious legal advisor who can explain complex legal terms simply' },
    { name: 'Personal Fitness Coach', description: 'Creates personalized workout plans and provides motivational fitness advice.', value: 'an encouraging personal fitness coach' },
    { name: 'Stand-up Comedian', description: 'Generates witty observations, jokes, and humorous takes on various topics.', value: 'a stand-up comedian with a dry, observational sense of humor' },
    { name: 'Gourmet Chef', description: 'Designs creative recipes and provides step-by-step cooking instructions.', value: 'a gourmet chef creating an innovative recipe' },
];

const ACTION_TEMPLATES: Template[] = [
    { name: 'Summarize', description: 'Condense the provided text into key points.', value: 'summarize the key points, provide examples, and organize information into distinct sections' },
    { name: 'Generate', description: 'Create new content based on the context.', value: 'generate a detailed 500-word article based on the provided context' },
    { name: 'Edit', description: 'Review and improve the provided text for clarity and grammar.', value: 'review the following text for grammar, clarity, and tone, and provide a revised version' },
    { name: 'Explain', description: 'Break down a complex topic into simple terms.', value: 'explain the core concepts of the topic in a way that is easy for a beginner to understand' },
    { name: 'Brainstorm', description: 'Generate a list of creative ideas related to the topic.', value: 'brainstorm a list of at least 10 creative ideas related to the context' },
];

const SURPRISE_ME_VERBS = ['Generate', 'Summarize', 'Critique', 'Transform', 'Explain', 'Reimagine', 'Draft', 'Outline'];
const SURPRISE_ME_SUBJECTS = ['a 3-part story', 'a marketing slogan', 'a project plan', 'a recipe for disaster', 'the key concepts', 'a formal complaint', 'a love letter', 'a movie script'];
const SURPRISE_ME_MODIFIERS = ['in the style of a pirate', 'as a haiku', 'for a 5-year-old child', 'with extreme sarcasm', 'in a formal academic tone', 'as a Shakespearean sonnet', 'like a 1940s radio announcer', 'using only emojis'];

export interface PromptSnapshot {
    id: string;
    timestamp: number;
    context: string;
    role: string;
    action: string;
    format: string;
    target: string;
    wasEdited: boolean;
    finalPrompt: string;
}

const App: React.FC = () => {
    // --- State Management ---
    const [context, setContext] = useState('');
    const [role, setRole] = useState('');
    const [action, setAction] = useState('');
    const [format, setFormat] = useState('');
    const [target, setTarget] = useState('');

    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [geminiResponse, setGeminiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyText, setCopyText] = useState('Copy');
    const [geminiCopyText, setGeminiCopyText] = useState('Copy');

    // State for new features
    const [showContextSuggestions, setShowContextSuggestions] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateModalConfig, setTemplateModalConfig] = useState<{title: string, templates: Template[], onSelect: (value: string) => void} | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [contextSuggestionsPool, setContextSuggestionsPool] = useState<string[]>(ALL_CONTEXT_SUGGESTIONS);
    const [promptHistory, setPromptHistory] = useState<PromptSnapshot[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [linterResult, setLinterResult] = useState<LinterResult>({
        totalScore: 0,
        breakdown: { context: 0, role: 0, action: 0, format: 0, target: 0 },
        issues: []
    });
    
    // --- Prompt Generation Effect ---
    useEffect(() => {
        const sections = [
            { title: 'Context', value: context },
            { title: 'Role', value: role },
            { title: 'Action', value: action },
            { title: 'Format', value: format },
            { title: 'Target', value: target },
        ];

        const prompt = sections
            .filter(section => section.value.trim() !== '')
            .map(section => `**${section.title}:**\n${section.value}`)
            .join('\n\n');
        
        setGeneratedPrompt(prompt);
        if (!isEditMode) {
            setEditedPrompt(prompt);
        }

    }, [context, role, action, format, target, isEditMode]);

    // --- Linter Analysis Effect ---
    useEffect(() => {
        const analyzePrompt = () => {
            let breakdown: LinterResult['breakdown'] = { context: 0, role: 0, action: 0, format: 0, target: 0 };
            let issues: LinterIssue[] = [];
            const maxScorePerComponent = 20;

            // Context Analysis
            const contextTrimmed = context.trim();
            if (contextTrimmed.length > 10) breakdown.context += 10;
            if (contextTrimmed.length > 40) breakdown.context += 10;
            if (contextTrimmed.length === 0) {
                issues.push({ id: 'ctx-missing', component: 'Context', message: 'Providing context is crucial for quality responses.' });
            } else if (contextTrimmed.length < 20) {
                 issues.push({ id: 'ctx-short', component: 'Context', message: 'Context is very short. Consider adding more detail.' });
            }

            // Role Analysis
            const roleTrimmed = role.trim();
            if (roleTrimmed.length > 0) breakdown.role += 10;
            if (/(expert|professional|senior|guru|creative|savvy)/i.test(roleTrimmed)) breakdown.role += 10;
            if (roleTrimmed.length === 0) {
                issues.push({ id: 'role-missing', component: 'Role', message: 'Role is not defined.', fix: { label: `Set to 'an expert'`, apply: () => setRole('an expert on the topic') } });
            }

            // Action Analysis
            const actionTrimmed = action.trim();
            const actionVerbs = ['generate', 'summarize', 'explain', 'create', 'write', 'draft', 'outline', 'list', 'compare', 'critique', 'transform'];
            const startsWithVerb = actionVerbs.some(verb => actionTrimmed.toLowerCase().startsWith(verb));
            if (actionTrimmed.length > 0) breakdown.action += 5;
            if (startsWithVerb) breakdown.action += 10;
            if (/\d+/.test(actionTrimmed) || /(detailed|comprehensive|brief|step-by-step)/i.test(actionTrimmed)) breakdown.action += 5;
            if (actionTrimmed.length > 0 && !startsWithVerb) {
                issues.push({ id: 'action-verb', component: 'Action', message: 'Action should start with a clear verb (e.g., Generate, Summarize).', fix: { label: `Prepend "Generate..."`, apply: () => setAction(a => `Generate a response that ${a.charAt(0).toLowerCase() + a.slice(1)}`) } });
            } else if (actionTrimmed.length === 0) {
                issues.push({ id: 'action-missing', component: 'Action', message: 'A clear action is required.' });
            }

            // Format Analysis
            const formatTrimmed = format.trim();
            if (formatTrimmed.length > 0) breakdown.format += 10;
            if (/(json|markdown|bullet|list|table|html|yaml|xml|code)/i.test(formatTrimmed)) breakdown.format += 10;
            if (formatTrimmed.length === 0) {
                issues.push({ id: 'format-missing', component: 'Format', message: 'Specify the desired output format.', fix: { label: 'Use Markdown', apply: () => setFormat('A well-structured Markdown document.') } });
            }

            // Target Analysis
            const targetTrimmed = target.trim();
            if (targetTrimmed.length > 0) breakdown.target += 10;
            if (/(non-technical|beginner|expert|manager|developer|student|child)/i.test(targetTrimmed)) breakdown.target += 10;
            if (targetTrimmed.length === 0) {
                issues.push({ id: 'target-missing', component: 'Target', message: 'Define the target audience.', fix: { label: 'Set general audience', apply: () => setTarget('A project manager with some technical knowledge.') } });
            }

            // Clamp scores
            Object.keys(breakdown).forEach(key => {
                const k = key as keyof LinterResult['breakdown'];
                if (breakdown[k] > maxScorePerComponent) breakdown[k] = maxScorePerComponent;
            });

            const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
            setLinterResult({ totalScore, breakdown, issues });
        };

        analyzePrompt();
    }, [context, role, action, format, target]);


    // --- Feature Logic ---

    const contextSuggestions = useMemo(() => {
        if (!context) return [];
        return contextSuggestionsPool.filter(s => 
            s.toLowerCase().includes(context.toLowerCase()) && s.toLowerCase() !== context.toLowerCase()
        ).slice(0, 5);
    }, [context, contextSuggestionsPool]);

    const handleContextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContext(event.target.value);
        setShowContextSuggestions(true);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setContext(suggestion);
        setShowContextSuggestions(false);
    };

    const openTemplateModal = useCallback((type: 'role' | 'action') => {
        if (type === 'role') {
            setTemplateModalConfig({
                title: 'Role Templates',
                templates: ROLE_TEMPLATES,
                onSelect: setRole
            });
        } else {
            setTemplateModalConfig({
                title: 'Action Templates',
                templates: ACTION_TEMPLATES,
                onSelect: setAction
            });
        }
        setIsTemplateModalOpen(true);
    }, []);

    const promptForDisplay = isEditMode ? editedPrompt : generatedPrompt;

    // --- Handlers ---

    const handleApplyFix = (fix: () => void) => {
        fix();
    };

    const handleLearnContext = () => {
        const trimmedContext = context.trim();
        if (trimmedContext && !contextSuggestionsPool.some(s => s.toLowerCase() === trimmedContext.toLowerCase())) {
            setContextSuggestionsPool(prev => [trimmedContext, ...prev]);
        }
    };

    const handleSurpriseRole = () => {
        const randomRole = ROLE_TEMPLATES[Math.floor(Math.random() * ROLE_TEMPLATES.length)];
        setRole(randomRole.value);
    };

    const handleSurpriseAction = () => {
        const verb = SURPRISE_ME_VERBS[Math.floor(Math.random() * SURPRISE_ME_VERBS.length)];
        const subject = SURPRISE_ME_SUBJECTS[Math.floor(Math.random() * SURPRISE_ME_SUBJECTS.length)];
        const modifier = SURPRISE_ME_MODIFIERS[Math.floor(Math.random() * SURPRISE_ME_MODIFIERS.length)];
        
        const surpriseAction = `${verb} ${subject} ${modifier}.`;
        setAction(surpriseAction);
    };

     const handleSelectFromHistory = (snapshot: PromptSnapshot) => {
        setContext(snapshot.context);
        setRole(snapshot.role);
        setAction(snapshot.action);
        setFormat(snapshot.format);
        setTarget(snapshot.target);
        if (snapshot.wasEdited) {
            setEditedPrompt(snapshot.finalPrompt);
            setIsEditMode(true);
        } else {
            setIsEditMode(false);
        }
        setIsHistoryModalOpen(false);
    };

    const handleDownload = useCallback((content: string, filename: string) => {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    const handleCopy = useCallback(() => {
        if (promptForDisplay) {
            navigator.clipboard.writeText(promptForDisplay);
            setCopyText('Copied!');
            setTimeout(() => setCopyText('Copy'), 2000);
        }
    }, [promptForDisplay]);

    const handleGeminiCopy = useCallback(() => {
        if (geminiResponse) {
            navigator.clipboard.writeText(geminiResponse);
            setGeminiCopyText('Copied!');
            setTimeout(() => setGeminiCopyText('Copy'), 2000);
        }
    }, [geminiResponse]);

    const handleTestPrompt = useCallback(async () => {
        const promptToTest = isEditMode ? editedPrompt : generatedPrompt;
        if (!promptToTest) {
            setError("Please fill out at least one field to generate a prompt.");
            return;
        }

        const newSnapshot: PromptSnapshot = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            context, role, action, format, target,
            wasEdited: isEditMode,
            finalPrompt: promptToTest,
        };

        setPromptHistory(prev => {
            if (prev.length > 0 && prev[0].finalPrompt === newSnapshot.finalPrompt) {
                return prev;
            }
            return [newSnapshot, ...prev].slice(0, 50);
        });

        setIsLoading(true);
        setError(null);
        setGeminiResponse('');
        try {
            const response = await runPrompt(promptToTest);
            setGeminiResponse(response);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to get response from Gemini. ${errorMessage}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [generatedPrompt, editedPrompt, isEditMode, context, role, action, format, target]);

    const placeholderPrompt = "Fill out the fields on the left to build your prompt. Your generated prompt will appear here...";
    const placeholderResponse = "Your Gemini response will appear here.";

    return (
        <div className="min-h-screen bg-zinc-900 text-zinc-300 font-sans p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-green-400">CRAFT Prompt Builder</h1>
                <p className="text-zinc-400 mt-2 text-lg">Design and test powerful prompts for Gemini using the CRAFT framework.</p>
            </header>

            <main className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Inputs */}
                <div className="flex flex-col gap-8">
                    <LinterCard {...linterResult} onApplyFix={handleApplyFix} />
                     <InputCard 
                        icon={<ContextIcon />} 
                        title="Context" 
                        placeholder="e.g., Drafting a project proposal for a new mobile app." 
                        value={context} 
                        onChange={handleContextChange}
                        onFocus={() => setShowContextSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowContextSuggestions(false), 200)} // Timeout to allow click on suggestion
                        headerAccessory={
                            <button onClick={handleLearnContext} className="flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md border border-zinc-600 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!context.trim()}>
                                <LearnIcon />
                                Learn from Input
                            </button>
                        }
                    >
                        {showContextSuggestions && contextSuggestions.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 overflow-hidden">
                                {contextSuggestions.map((suggestion, index) => (
                                    <li key={index}>
                                        <button 
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-green-500/10 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </InputCard>
                    <InputCard 
                        icon={<RoleIcon />} 
                        title="Role" 
                        placeholder="e.g., an expert technical writer." 
                        value={role} 
                        onChange={e => setRole(e.target.value)} 
                        headerAccessory={
                             <div className="flex items-center gap-2">
                                 <button onClick={handleSurpriseRole} className="flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md border border-zinc-600 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200">
                                    <WandIcon />
                                    Surprise Me
                                </button>
                                <button onClick={() => openTemplateModal('role')} className="flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md border border-zinc-600 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200">
                                    <TemplateIcon />
                                    Templates
                                </button>
                             </div>
                        }
                    />
                    <InputCard 
                        icon={<ActionIcon />} 
                        title="Action" 
                        placeholder="e.g., summarize the key points, provide examples, and organize information into distinct sections." 
                        value={action} 
                        onChange={e => setAction(e.target.value)}
                        headerAccessory={
                            <div className="flex items-center gap-2">
                                <button onClick={handleSurpriseAction} className="flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md border border-zinc-600 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200">
                                    <WandIcon />
                                    Surprise Me
                                </button>
                                <button onClick={() => openTemplateModal('action')} className="flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md border border-zinc-600 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200">
                                    <TemplateIcon />
                                    Templates
                                </button>
                            </div>
                        }
                    />
                    <InputCard icon={<FormatIcon />} title="Format" placeholder="e.g., a bulleted list inside a JSON object." value={format} onChange={e => setFormat(e.target.value)} />
                    <InputCard icon={<TargetIcon />} title="Target" placeholder="e.g., a non-technical project manager." value={target} onChange={e => setTarget(e.target.value)} />
                </div>

                {/* Right Column: Outputs */}
                <div className="flex flex-col gap-8">
                    <OutputCard 
                        title="Generated Prompt"
                        actionButton={
                            <div className="flex items-center gap-4">
                               <ToggleSwitch checked={isEditMode} onChange={setIsEditMode} label="Edit Mode" />
                               <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsHistoryModalOpen(true)}
                                    disabled={promptHistory.length === 0}
                                    className="flex items-center justify-center p-2 rounded-md border border-green-400 text-green-400 transition-colors hover:bg-green-400 hover:text-zinc-900 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                    aria-label="View prompt history"
                                >
                                    <HistoryIcon />
                                </button>
                                <button
                                    onClick={() => handleDownload(promptForDisplay, 'prompt.md')}
                                    disabled={!promptForDisplay}
                                    className="flex items-center justify-center p-2 rounded-md border border-green-400 text-green-400 transition-colors hover:bg-green-400 hover:text-zinc-900 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                    aria-label="Download prompt as Markdown file"
                                >
                                    <DownloadIcon />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={!promptForDisplay || copyText === 'Copied!'}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md border border-green-400 text-green-400 transition-colors hover:bg-green-400 hover:text-zinc-900 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                >
                                    {copyText === 'Copied!' ? <CheckIcon /> : <CopyIcon />}
                                    {copyText}
                                </button>
                               </div>
                            </div>
                        }
                    >
                         {isEditMode ? (
                             <textarea
                                value={editedPrompt}
                                onChange={e => setEditedPrompt(e.target.value)}
                                className="w-full h-full bg-zinc-900 text-zinc-300 placeholder-zinc-500 rounded-md p-3 resize-none border border-zinc-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow duration-200 font-sans text-sm"
                                placeholder={placeholderPrompt}
                             />
                         ) : (
                            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300">
                                {generatedPrompt || <span className="text-zinc-500">{placeholderPrompt}</span>}
                            </pre>
                         )}
                    </OutputCard>
                    
                    <div className="flex justify-end">
                        <button
                           onClick={handleTestPrompt}
                           disabled={isLoading || !promptForDisplay}
                           className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-bold text-zinc-900 bg-green-400 rounded-md hover:bg-green-500 disabled:bg-green-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                            <SparklesIcon />
                            {isLoading ? 'Testing...' : 'Test Prompt'}
                        </button>
                    </div>

                    <OutputCard 
                        title="Gemini Response"
                        actionButton={
                            <div className="flex items-center gap-2">
                                 <button
                                    onClick={() => handleDownload(geminiResponse, 'response.md')}
                                    disabled={!geminiResponse}
                                    className="flex items-center justify-center p-2 rounded-md border border-green-400 text-green-400 transition-colors hover:bg-green-400 hover:text-zinc-900 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                    aria-label="Download response as Markdown file"
                                >
                                    <DownloadIcon />
                                </button>
                                <button
                                    onClick={handleGeminiCopy}
                                    disabled={!geminiResponse || geminiCopyText === 'Copied!'}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md border border-green-400 text-green-400 transition-colors hover:bg-green-400 hover:text-zinc-900 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                >
                                    {geminiCopyText === 'Copied!' ? <CheckIcon /> : <CopyIcon />}
                                    {geminiCopyText}
                                </button>
                            </div>
                        }
                    >
                        {isLoading && (
                             <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                             </div>
                        )}
                        {error && (
                            <div className="text-red-400 bg-red-900/20 p-4 rounded-md">
                                <p className="font-bold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {geminiResponse && (
                           <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300">
                               {geminiResponse}
                           </pre>
                        )}
                        {!isLoading && !error && !geminiResponse && (
                             <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                               {placeholderResponse}
                            </div>
                        )}
                    </OutputCard>
                </div>
            </main>
            
             <HistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                history={promptHistory}
                onSelect={handleSelectFromHistory}
            />
            <TemplateModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                title={templateModalConfig?.title || ''}
                templates={templateModalConfig?.templates || []}
                onSelect={templateModalConfig?.onSelect || (() => {})}
            />
        </div>
    );
};

export default App;
