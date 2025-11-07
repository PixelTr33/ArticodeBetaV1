

import React, { useRef, useEffect, useState } from 'react';
import { GeneratedFile, ChatMessage, AIModel, ChatSession, Theme, Collaborator, ProjectLanguage } from '../types';
import PreviewPanel from './PreviewPanel';
import { ICONS } from '../constants';
import AIAvatar from './AIAvatar';
import ChatHistorySidebar from './ChatHistorySidebar';
import { useSettings } from '../contexts/SettingsContext';
import MarkdownRenderer from './MarkdownRenderer';
import { User } from '@supabase/supabase-js';

const ThinkingIndicator: React.FC<{ thinking: string; theme: Theme }> = ({ thinking, theme }) => {
    const [isOpen, setIsOpen] = useState(true);
    if (!thinking) return null;
    return (
        <details open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)} className="w-full">
            <summary className={`list-none cursor-pointer flex items-center justify-between p-2 rounded-t-lg ${theme === 'light' ? 'bg-light-bg-hover hover:bg-light-bg-alt' : 'bg-white/5 hover:bg-white/10'}`}>
                <span className={`text-xs font-semibold ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>Thinking...</span>
                <span className={`transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>{ICONS.chevronDown}</span>
            </summary>
            <div className={`p-3 text-xs whitespace-pre-wrap font-mono rounded-b-lg overflow-x-auto ${theme === 'light' ? 'bg-light-bg-hover' : 'bg-white/5'}`}>
                {thinking}
            </div>
        </details>
    );
};


const FileManifest: React.FC<{ files: string[], theme: Theme }> = ({ files, theme }) => (
    <div className={`mt-3 pt-3 border-t ${theme === 'light' ? 'border-black/10' : 'border-white/10'}`}>
      <p className={`text-xs mb-2 font-medium ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>File Changes:</p>
      <div className="flex flex-wrap gap-2">
        {files.map(file => (
          <div key={file} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs backdrop-blur-sm ${theme === 'light' ? 'bg-light-bg-hover text-light-fg border border-light-border' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
            <span className={theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}>{ICONS.edit}</span>
            <span className="break-words">{file}</span>
          </div>
        ))}
      </div>
    </div>
);


const AgentMessageBubble: React.FC<{ message: ChatMessage; theme: Theme }> = ({ message, theme }) => {
    const isUser = message.role === 'user';

    const bubbleStyles = isUser
        ? (theme === 'light' ? 'bg-blue-500 text-white' : 'dark:bg-zinc-900 text-white dark:text-gray-100 border border-transparent dark:border-zinc-700')
        // eslint-disable-next-line max-len
        : (theme === 'light' ? 'bg-white text-light-fg border border-light-border' : 'dark:bg-white/5 backdrop-blur-md text-white border border-white/10 shadow-[0_0_20px_rgba(180,180,180,0.1)]');

    // Don't render empty AI bubbles (placeholders for thinking)
    if (message.role === 'ai' && !message.content) {
        return null;
    }
    
    return (
        <div className={`flex w-full items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-10 h-10 flex-shrink-0 mt-1">
                {isUser ? (
                    // eslint-disable-next-line max-len
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-light-bg-alt text-light-fg' : 'bg-gradient-to-br from-gray-600 to-gray-800 text-white'}`}>
                        {ICONS.userAvatar}
                    </div>
                ) : (
                    <AIAvatar isThinking={false} theme={theme} />
                )}
            </div>
            <div className={`max-w-xl rounded-2xl px-5 py-3 shadow-lg ${bubbleStyles}`}>
                <div className="text-sm prose-p:my-2 prose-ul:my-2 break-words">
                    <MarkdownRenderer content={message.content} />
                </div>
                {message.modifiedFiles && message.modifiedFiles.length > 0 && (
                  <FileManifest files={message.modifiedFiles} theme={theme} />
                )}
            </div>
        </div>
    );
};

const PromptSuggestions: React.FC<{ suggestions: string[], onSelect: (prompt: string) => void, theme: Theme }> = ({ suggestions, onSelect, theme }) => {
    const { showSuggestions } = useSettings();
    if (suggestions.length === 0 || !showSuggestions) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4">
            {suggestions.map((s, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(s)}
                    // eslint-disable-next-line max-len
                    className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 text-xs font-medium rounded-full backdrop-blur-md transition-all duration-200 transform hover:scale-105
                        ${theme === 'light' 
                            ? 'bg-white/50 text-light-fg-alt border border-black/10 hover:bg-white/80 hover:text-light-fg' 
                            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                >
                    <span className={theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}>{ICONS.sparkles}</span>
                    {s}
                </button>
            ))}
        </div>
    );
};

const SettingsPopover: React.FC<{
  aiModel: AIModel;
  setAiModel: (model: AIModel) => void;
  projectLanguage: ProjectLanguage;
  setProjectLanguage: (language: ProjectLanguage) => void;
  onClearChat: () => void;
  onClose: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}> = ({ aiModel, setAiModel, projectLanguage, setProjectLanguage, onClearChat, onClose, theme, setTheme }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { showThinking, setShowThinking, extendedThinking, setExtendedThinking, showSuggestions, setShowSuggestions } = useSettings();
    const modelNames: Record<AIModel, string> = {
        [AIModel.GEMINI]: '2.5 Pro',
        [AIModel.FLASH]: '2.5 Flash',
        [AIModel.GPT4]: 'GPT-4o',
        [AIModel.CLAUDE3]: 'Claude 3',
    };
    const languageNames: Record<ProjectLanguage, string> = {
        [ProjectLanguage.REACT]: 'React',
        [ProjectLanguage.HTML_CSS_JS]: 'HTML, CSS, JS',
        [ProjectLanguage.REACT_NATIVE_EXPO]: 'React Native (Expo)',
        [ProjectLanguage.XAMARIN]: 'Xamarin',
        [ProjectLanguage.CSHARP]: 'C# Desktop',
    };

    const languageGroups = {
        'Web': [ProjectLanguage.REACT, ProjectLanguage.HTML_CSS_JS],
        'Mobile': [ProjectLanguage.REACT_NATIVE_EXPO, ProjectLanguage.XAMARIN],
        'Desktop': [ProjectLanguage.CSHARP],
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);
    
    // eslint-disable-next-line max-len
    const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
        <div className="flex items-center justify-between w-full px-2 py-1.5 text-xs">
            <span className={theme === 'light' ? 'text-light-fg' : 'text-gray-300'}>{label}</span>
            <button onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-dark-primary' : (theme === 'light' ? 'bg-light-border' : 'bg-white/20')}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    const popoverClasses = theme === 'light'
        ? 'bg-white/90 border-black/10 text-light-fg'
        : 'bg-zinc-800/90 border-white/15 text-white';

    return (
        <div ref={ref} className={`absolute bottom-full left-0 mb-2 w-56 backdrop-blur-xl rounded-lg shadow-2xl z-20 overflow-hidden border ${popoverClasses}`}>
             <div className="p-2">
                <p className={`px-2 py-1 text-xs font-semibold ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>Model</p>
                 {Object.values(AIModel).map(model => (
                    <button key={model} onClick={() => setAiModel(model)} className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${aiModel === model 
                        ? (theme === 'light' ? 'bg-light-primary/20 text-light-primary' : 'bg-white/20 text-white') 
                        : (theme === 'light' ? 'hover:bg-light-bg-hover' : 'text-gray-300 hover:bg-white/10')}`
                    }>
                        {modelNames[model]}
                    </button>
                ))}
             </div>
             <div className={`border-t p-2 ${theme === 'light' ? 'border-light-border' : 'border-white/10'}`}>
                <p className={`px-2 py-1 text-xs font-semibold ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>Framework</p>
                {Object.entries(languageGroups).map(([groupName, languages]) => (
                    <div key={groupName}>
                        <p className={`px-2 pt-1 pb-0.5 text-xs font-medium ${theme === 'light' ? 'text-light-fg-alt/80' : 'text-gray-500'}`}>{groupName}</p>
                        {languages.map(lang => (
                            <button key={lang} onClick={() => setProjectLanguage(lang)} className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${projectLanguage === lang
                                ? (theme === 'light' ? 'bg-light-primary/20 text-light-primary' : 'bg-white/20 text-white') 
                                : (theme === 'light' ? 'hover:bg-light-bg-hover' : 'text-gray-300 hover:bg-white/10')}`
                            }>
                                {languageNames[lang]}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
             <div className={`border-t p-2 ${theme === 'light' ? 'border-light-border' : 'border-white/10'}`}>
                <p className={`px-2 py-1 text-xs font-semibold ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>Features</p>
                <ToggleSwitch label="Show Thinking" checked={showThinking} onChange={setShowThinking} />
                <ToggleSwitch label="Extended Thinking" checked={extendedThinking} onChange={setExtendedThinking} />
                <ToggleSwitch label="Suggestions" checked={showSuggestions} onChange={setShowSuggestions} />
            </div>
              <div className={`border-t p-2 ${theme === 'light' ? 'border-light-border' : 'border-white/10'}`}>
                <p className={`px-2 py-1 text-xs font-semibold ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>Theme</p>
                <div className={`flex items-center gap-1 p-1 rounded-md ${theme === 'light' ? 'bg-light-bg-hover' : 'bg-white/10'}`}>
                    <button onClick={() => setTheme('light')} className={`w-full text-center px-2 py-1 text-xs rounded transition-colors ${theme === 'light' ? 'bg-white text-black shadow-sm' : ''}`}>
                    Light
                    </button>
                    <button onClick={() => setTheme('dark')} className={`w-full text-center px-2 py-1 text-xs rounded transition-colors ${theme === 'dark' ? 'bg-black text-white' : ''}`}>
                    Dark
                    </button>
                </div>
             </div>
             <div className={`border-t p-2 ${theme === 'light' ? 'border-light-border' : 'border-white/10'}`}>
                 <button onClick={onClearChat} className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded-md transition-colors ${theme === 'light' ? 'text-light-danger hover:bg-light-danger/10' : 'text-red-400 hover:bg-red-500/20'}`}>
                     {ICONS.trash} Clear Chat
                 </button>
             </div>
        </div>
    );
};

const InitialScreen: React.FC<{ onPromptSelect: (prompt: string) => void; theme: Theme }> = ({ onPromptSelect, theme }) => {
    
    const QuickActionCard: React.FC<{
        icon: React.ReactNode;
        title: string;
        description: string;
        onClick: () => void;
    }> = ({ icon, title, description, onClick }) => (
        <button
            onClick={onClick}
            className={`w-full h-full p-4 rounded-xl border backdrop-blur-md transition-all duration-200 hover:-translate-y-1
                ${theme === 'light'
                    ? 'bg-white/50 border-black/10 hover:bg-white/80'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
        >
            <div className={`mb-3 text-2xl ${theme === 'light' ? 'text-light-primary' : 'text-dark-primary'}`}>{icon}</div>
            <h3 className={`text-left font-semibold text-sm ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>{title}</h3>
            <p className={`text-left text-xs mt-1 ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>{description}</p>
        </button>
    );

    const TemplateCard: React.FC<{
        icon: React.ReactNode;
        title: string;
        description: string;
        tags: string[];
        onClick: () => void;
    }> = ({ icon, title, description, tags, onClick }) => (
        <button
            onClick={onClick}
            className={`w-full h-full p-4 rounded-xl border backdrop-blur-md transition-all duration-200 hover:-translate-y-1 flex flex-col
                ${theme === 'light'
                    ? 'bg-white/50 border-black/10 hover:bg-white/80'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
        >
            <div className={`mb-3 text-3xl ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>{icon}</div>
            <h3 className={`text-left font-semibold text-base ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>{title}</h3>
            <p className={`text-left text-sm mt-1 flex-1 ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>{description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
                {tags.map(tag => (
                    <span key={tag} className={`text-xs px-2.5 py-1 rounded-full ${theme === 'light' ? 'bg-black/5 text-light-fg-alt' : 'bg-white/10 text-gray-300'}`}>
                        {tag}
                    </span>
                ))}
            </div>
        </button>
    );
    
    const quickActions = [
      { icon: ICONS.codeReview, title: "Review My Code", description: "Analyze code for bugs and quality.", prompt: "Act as an expert code reviewer. Analyze the current project files for bugs, performance issues, and adherence to best practices. Provide a summary of your findings." },
      { icon: ICONS.lightbulb, title: "Suggest Features", description: "Brainstorm new ideas for my app.", prompt: "Brainstorm three innovative new features for this application. For each feature, describe what it does and why it would be valuable." },
    ];

    const templates = [
      { icon: ICONS.portfolio, title: "Portfolio Website", description: "A sleek, personal portfolio to showcase your work.", tags: ['React', 'UI/UX', 'Responsive'], prompt: "Create a modern, single-page portfolio website for a software developer. Include a hero section, an 'About Me' section, a project gallery, and a contact form." },
      { icon: ICONS.kanban, title: "Kanban Board", description: "A drag-and-drop task management board.", tags: ['React', 'State Mgmt', 'DnD'], prompt: "Create a Kanban board application. It should have columns for 'To Do', 'In Progress', and 'Done'. Users should be able to add new tasks and drag and drop tasks between columns." },
      { icon: ICONS.dashboard, title: "Admin Dashboard", description: "A data visualization and management interface.", tags: ['React', 'Charts', 'API'], prompt: "Generate an admin dashboard layout. Include a sidebar navigation, a main content area with cards for stats (e.g., 'Users', 'Sales'), and a placeholder for a data table." },
      { icon: ICONS.todo, title: "To-Do List App", description: "A classic productivity tool to track tasks.", tags: ['React', 'CRUD', 'Local State'], prompt: "Build a to-do list application. Users should be able to add tasks, mark tasks as complete, and delete tasks. The list should be clear and easy to interact with." },
      { icon: ICONS.weather, title: "Weather App", description: "A simple app to check the weather forecast.", tags: ['React', 'API', 'Async'], prompt: "Create a weather app. It should have a search bar for a city, and display the current temperature, weather conditions (e.g., 'Sunny'), and a 5-day forecast." },
      { icon: ICONS.cart, title: "E-commerce Page", description: "A product detail page for an online store.", tags: ['React', 'UI/UX', 'Components'], prompt: "Generate an e-commerce product page for a pair of headphones. It should have a large product image, a title, price, quantity selector, an 'Add to Cart' button, and a product description section." },
    ];

    return (
        <div className="flex-1 w-full flex flex-col items-center pt-8 md:pt-16 pb-44 px-4 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-5xl mx-auto space-y-12">
                <section>
                    <h2 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {quickActions.map(action => (
                            <QuickActionCard key={action.title} {...action} onClick={() => onPromptSelect(action.prompt)} />
                        ))}
                         <div className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center
                            ${theme === 'light' ? 'bg-white/30 border-black/10' : 'bg-white/5 border-white/10'
                        }`}>
                            <h3 className={`font-semibold text-sm ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>More Coming Soon</h3>
                            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>We're always adding new capabilities.</p>
                        </div>
                    </div>
                </section>
                
                <section>
                    <h2 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>Start from a Template</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {templates.map(template => (
                            <TemplateCard key={template.title} {...template} onClick={() => onPromptSelect(template.prompt)} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};


const AgentView: React.FC<{
    files: GeneratedFile[];
    activeChat: ChatSession;
    chatSessions: ChatSession[];
    onSwitchChat: (id: string) => void;
    onNewChat: () => void;
    onDeleteChat: (id: string) => void;
    onRenameChat: (id: string, newName: string) => void;
    onArchiveChat: (id: string) => void;
    onSendMessage: (message: string) => void;
    onRegenerate: () => void;
    isGenerating: boolean;
    chatInput: string;
    onChatInputChange: (value: string) => void;
    onSetModel: (model: AIModel) => void;
    projectLanguage: ProjectLanguage;
    onSetProjectLanguage: (language: ProjectLanguage) => void;
    suggestions: string[];
    onClearChat: (chatId: string) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    user: User;
    onSignOut: () => void;
    collaborators: Collaborator[];
    onOpenCollaborationModal: () => void;
}> = ({ files, activeChat, chatSessions, onSwitchChat, onNewChat, onDeleteChat, onRenameChat, onArchiveChat, onSendMessage, onRegenerate, isGenerating, chatInput, onChatInputChange, onSetModel, projectLanguage, onSetProjectLanguage, suggestions, onClearChat, theme, setTheme, user, onSignOut, collaborators, onOpenCollaborationModal }) => {
    const { showThinking } = useSettings();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [previewWidth, setPreviewWidth] = useState(window.innerWidth * 0.5);
    const [isPreviewOpen, setIsPreviewOpen] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const isResizing = useRef(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat.messages, isGenerating]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 192)}px`;
        }
    }, [chatInput]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && !isGenerating) {
            onSendMessage(chatInput.trim());
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) { // md breakpoint
                setIsSidebarOpen(false);
                setIsPreviewOpen(false);
            } else {
                setIsSidebarOpen(true);
                setIsPreviewOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing.current) {
                const newWidth = window.innerWidth - e.clientX;
                const MIN_CHAT_WIDTH = 450;
                setPreviewWidth(Math.max(320, Math.min(newWidth, window.innerWidth - MIN_CHAT_WIDTH)));
            }
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const commandBarClasses = theme === 'light'
        ? 'bg-white/60 text-light-fg placeholder-light-fg-alt border-black/10 focus-within:border-light-primary'
        : 'bg-black/30 text-white placeholder-gray-400 border-white/10 focus-within:border-white/30';

    const lastMessage = activeChat.messages[activeChat.messages.length - 1];
    const showThinkingIndicator = isGenerating && showThinking && lastMessage?.role === 'ai' && typeof lastMessage.thinking === 'string';

    const hasStartedTyping = chatInput.length > 0;
    const showInitialScreen = activeChat.messages.length === 0 && !hasStartedTyping;

    return (
        <div className="w-full h-full flex overflow-hidden relative">
            <ChatHistorySidebar 
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                sessions={chatSessions}
                activeSessionId={activeChat.id}
                onSwitchSession={onSwitchChat}
                onNewSession={onNewChat}
                onDeleteSession={onDeleteChat}
                onRenameSession={onRenameChat}
                onArchiveSession={onArchiveChat}
                theme={theme}
                user={user}
                onSignOut={onSignOut}
                collaborators={collaborators}
                onOpenCollaborationModal={onOpenCollaborationModal}
            />
            {/* Chat Interface */}
            <div className="flex-1 flex flex-col items-center h-full relative p-0 min-h-0">
                <div className="flex-1 w-full max-w-5xl flex flex-col min-h-0">
                    {showInitialScreen ? (
                        <InitialScreen onPromptSelect={onChatInputChange} theme={theme} />
                    ) : (
                        <div className="overflow-y-auto custom-scrollbar px-4 md:px-2 lg:px-0 pt-16 pb-48 w-full">
                            <div className="space-y-8 max-w-4xl mx-auto">
                                {activeChat.messages.map((msg, index) => {
                                    const showRegenerate = msg.role === 'ai' && !isGenerating && index === activeChat.messages.length - 1 && msg.content;
                                    
                                    return (
                                        <div key={msg.id} className={`group flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <AgentMessageBubble message={msg} theme={theme} />
                                            {showRegenerate && (
                                                <button
                                                    onClick={onRegenerate}
                                                    title="Regenerate response"
                                                    className={`mb-2 p-1.5 rounded-full backdrop-blur-md border transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 ${
                                                        theme === 'light' ? 'bg-white/50 border-black/10 text-light-fg-alt' : 'bg-black/30 text-white border-white/10'
                                                    }`}
                                                >
                                                    {ICONS.regenerate}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                                {showThinkingIndicator && (
                                    <div className="flex w-full items-start gap-4">
                                        <div className="w-10 h-10 flex-shrink-0 mt-1"><AIAvatar isThinking={true} theme={theme} /></div>
                                        <div className="max-w-xl w-full">
                                            <ThinkingIndicator thinking={lastMessage.thinking!} theme={theme} />
                                        </div>
                                    </div>
                                )}
                                {!showThinkingIndicator && isGenerating && (
                                    <div className="flex w-full items-start gap-4">
                                         <div className="w-10 h-10 flex-shrink-0 mt-1"><AIAvatar isThinking={true} theme={theme} /></div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 w-full z-30">
                    <div className="w-full max-w-4xl mx-auto p-4 space-y-3">
                        {!isGenerating && <PromptSuggestions suggestions={suggestions} onSelect={(p) => onChatInputChange(p)} theme={theme} />}
                        <div className={`relative w-full text-sm rounded-2xl border backdrop-blur-2xl transition-all shadow-2xl flex items-end p-2 gap-2 ${commandBarClasses}`}>
                            <div className="relative">
                                <button onClick={() => setIsSettingsOpen(prev => !prev)} className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${theme === 'light' ? 'text-light-fg-alt hover:bg-black/5' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                                    <span className="h-5 w-5">{ICONS.plus}</span>
                                </button>
                                {isSettingsOpen && (
                                    <SettingsPopover 
                                        aiModel={activeChat.model}
                                        setAiModel={onSetModel}
                                        projectLanguage={projectLanguage}
                                        setProjectLanguage={onSetProjectLanguage}
                                        onClearChat={() => {
                                            onClearChat(activeChat.id);
                                            setIsSettingsOpen(false);
                                        }}
                                        onClose={() => setIsSettingsOpen(false)}
                                        theme={theme}
                                        setTheme={setTheme}
                                    />
                                )}
                            </div>
                            {files.length > 0 && (
                                <button onClick={() => setIsPreviewOpen(p => !p)} className={`md:hidden flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${isPreviewOpen && (theme === 'light' ? 'bg-black/5' : 'bg-white/10')} ${theme === 'light' ? 'text-light-fg-alt hover:bg-black/5' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                                    <span className="h-5 w-5">{ICONS.eye}</span>
                                </button>
                            )}
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={chatInput}
                                onChange={(e) => onChatInputChange(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                                placeholder={isGenerating ? "Thinking..." : `Describe what you want to build...`}
                                className="flex-1 bg-transparent py-2.5 resize-none outline-none overflow-y-auto custom-scrollbar"
                                disabled={isGenerating}
                            />
                            <button onClick={handleSubmit} className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg disabled:opacity-50 transition-transform hover:scale-105 active:scale-95 ${theme === 'light' ? 'bg-light-primary text-white' : 'bg-white text-black'}`} disabled={isGenerating || !chatInput.trim()}>
                                {ICONS.send}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Panel (Desktop) */}
            {files.length > 0 && isPreviewOpen && (
                 <div className="hidden md:flex items-center h-full">
                    <div onMouseDown={handleMouseDown} className="w-1.5 h-full cursor-col-resize group flex-shrink-0 bg-transparent flex items-center justify-center">
                       <div className={`w-px h-full transition-colors ${theme === 'light' ? 'bg-black/10 group-hover:bg-light-primary/50' : 'bg-white/10 group-hover:bg-white/30'}`} />
                    </div>
                    <div style={{ width: `${previewWidth}px`}} className="flex-shrink-0 h-full p-2 rounded-l-2xl shadow-2xl">
                         <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                             <PreviewPanel files={files} />
                         </div>
                    </div>
                 </div>
            )}
            
            {/* Preview Panel (Mobile) */}
             {files.length > 0 && isPreviewOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex flex-col">
                    <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-2xl flex-1">
                        <PreviewPanel files={files} />
                    </div>
                    <button onClick={() => setIsPreviewOpen(false)} className="mt-4 w-full bg-white/80 text-black font-semibold py-3 rounded-lg backdrop-blur-md">
                        Close Preview
                    </button>
                </div>
             )}
        </div>
    );
};

export default AgentView;