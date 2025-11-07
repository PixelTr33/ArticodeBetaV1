



import React, { useState, useContext, useEffect } from 'react';
import FileExplorer from './FileExplorer';
import { GeneratedFile, Project, Collaborator, AIModel } from '../types';
import { ICONS } from '../constants';
import { useSupabase } from '../contexts/SupabaseContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';


type ActiveView = 'files' | 'collaborate' | 'settings';

const ActivityBar: React.FC<{ activeView: ActiveView; setActiveView: (view: ActiveView) => void; }> = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'files', icon: ICONS.files, label: 'Files' },
        { id: 'collaborate', icon: ICONS.collaborate, label: 'Team' },
    ] as const;

    return (
        <nav className="w-16 flex-shrink-0 bg-transparent border-r border-black/10 dark:border-white/10 flex flex-col items-center justify-between py-4">
            <div>
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        title={item.label}
                        className={`p-3 w-12 h-12 flex items-center justify-center relative rounded-lg transition-colors duration-200 ${activeView === item.id 
                            ? 'text-light-primary dark:text-dark-primary bg-light-primary/10 dark:bg-dark-primary/10' 
                            : 'text-light-fg-alt dark:text-dark-fg-alt hover:bg-black/5 dark:hover:bg-white/10'}`}
                    >
                        {item.icon}
                        {activeView === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-light-primary dark:bg-dark-primary rounded-r-full" />}
                    </button>
                ))}
            </div>
             <button
                onClick={() => setActiveView('settings')}
                title="Settings"
                className={`p-3 w-12 h-12 flex items-center justify-center relative rounded-lg transition-colors duration-200 ${activeView === 'settings' 
                    ? 'text-light-primary dark:text-dark-primary bg-light-primary/10 dark:bg-dark-primary/10' 
                    : 'text-light-fg-alt dark:text-dark-fg-alt hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
                {ICONS.settings}
                 {activeView === 'settings' && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-light-primary dark:bg-dark-primary rounded-r-full" />}
            </button>
        </nav>
    );
}

const Sidebar: React.FC<{
    files: GeneratedFile[];
    activeFileId: string | null;
    onSelectFile: (id: string) => void;
    project: Project | null;
    onProjectCreated: () => void;
    collaborators: Collaborator[];
    aiModel: AIModel;
    setAiModel: (model: AIModel) => void;
    onClearProject: () => void;
}> = ({ files, activeFileId, onSelectFile, project, onProjectCreated, collaborators, aiModel, setAiModel, onClearProject }) => {
    const [activeView, setActiveView] = useState<ActiveView>('files');

    return (
        <aside className="w-full h-full bg-white/60 dark:bg-black/30 backdrop-blur-xl flex">
            <ActivityBar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-12 flex-shrink-0 flex items-center px-4 border-b border-black/10 dark:border-white/10">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-light-fg dark:text-dark-fg">
                        {activeView === 'files' ? 'Explorer' : activeView === 'collaborate' ? 'Team Collaboration' : 'Settings'}
                    </h2>
                </div>
                 <div className="flex-1 overflow-y-auto">
                    {activeView === 'files' && (
                        <FileExplorer files={files} activeFileId={activeFileId} onSelectFile={onSelectFile} />
                    )}
                    {activeView === 'collaborate' && <CollaborationPanel project={project} onProjectCreated={onProjectCreated} collaborators={collaborators} />}
                    {activeView === 'settings' && <SettingsPanel aiModel={aiModel} setAiModel={setAiModel} onClearProject={onClearProject} />}
                </div>
            </div>
        </aside>
    );
};

const CollaborationPanel: React.FC<{
    project: Project | null;
    onProjectCreated: () => void;
    collaborators: Collaborator[];
}> = ({ project, onProjectCreated, collaborators }) => {
    return (
        <div className="p-4 text-sm text-center text-light-fg-alt dark:text-dark-fg-alt flex flex-col items-center justify-center h-full">
            <div className="text-light-primary dark:text-dark-primary mb-4">
                {React.cloneElement(ICONS.collaborate, { className: "h-12 w-12" })}
            </div>
            <h3 className="font-bold text-base text-light-fg dark:text-dark-fg mb-2">Collaboration Unavailable</h3>
            <p className="text-xs">
                Real-time collaboration is currently in development.
            </p>
            <p className="text-xs mt-2 p-2 bg-black/5 dark:bg-white/5 rounded-md font-semibold">
                Scheduled for release in 2026.
            </p>
        </div>
    );
};

const SettingsPanel: React.FC<{
    aiModel: AIModel;
    setAiModel: (model: AIModel) => void;
    onClearProject: () => void;
}> = ({ aiModel, setAiModel, onClearProject }) => {
    const { theme, setTheme } = useContext(ThemeContext);
    const { fontSize, setFontSize } = useSettings();
    
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
    const modelSelectorRef = React.useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
                setIsModelSelectorOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const modelNames = {
        [AIModel.GEMINI]: 'Gemini 2.5 Pro',
        [AIModel.FLASH]: 'Gemini 2.5 Flash',
        [AIModel.GPT4]: 'GPT-4 Omni',
        [AIModel.CLAUDE3]: 'Claude 3 Opus',
    };
    
    const ThemeToggle = () => (
      <div className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="sr-only peer" />
          <div className="w-11 h-6 bg-light-border peer-focus:outline-none rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-dark-primary"></div>
      </div>
    );

    const SettingsSection: React.FC<{ title: string; children: React.ReactNode; rightContent?: React.ReactNode; description?: string; }> = ({ title, children, rightContent, description }) => (
        <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-base tracking-wide text-light-fg dark:text-dark-fg">{title}</h3>
                {rightContent}
            </div>
            {description && <p className="text-xs text-light-fg-alt dark:text-dark-fg-alt mb-4">{description}</p>}
            <div className="space-y-4">{children}</div>
        </div>
    );

    return (
        <div className="p-4 text-sm space-y-6 text-light-fg dark:text-dark-fg">
            <SettingsSection title="Appearance">
                <div className="flex items-center justify-between">
                    <label>Theme</label>
                    <ThemeToggle />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="font-size">Editor Font Size</label>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm w-8 text-center text-light-fg-alt dark:text-dark-fg-alt">{fontSize}px</span>
                        <input type="range" id="font-size" min="10" max="20" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-28 accent-light-primary dark:accent-dark-primary" />
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="AI">
                 <div className="flex items-center justify-between">
                    <label>Model</label>
                     <div className="relative" ref={modelSelectorRef}>
                        <button onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)} className="flex items-center justify-between w-48 space-x-2 px-3 py-2 bg-transparent border border-black/10 dark:border-white/10 rounded-md text-sm">
                            <span>{modelNames[aiModel]}</span>
                            <span className={`text-light-fg-alt dark:text-dark-fg-alt transform transition-transform ${isModelSelectorOpen ? 'rotate-180' : ''}`}>{ICONS.chevronDown}</span>
                        </button>
                        {isModelSelectorOpen && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-md shadow-lg z-20">
                                {Object.values(AIModel).map(model => (
                                    <button key={model} onClick={() => { setAiModel(model); setIsModelSelectorOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                                        {modelNames[model]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>
            </SettingsSection>
            
            <SettingsSection title="Database" description="This app is pre-configured with a shared Supabase instance for demo purposes.">
                <p className="text-xs text-center text-light-fg-alt dark:text-dark-fg-alt p-2 bg-black/5 dark:bg-white/5 rounded-md">
                    Connected to shared database.
                </p>
            </SettingsSection>

            <SettingsSection title="Danger Zone">
                <button onClick={onClearProject} className="w-full flex items-center justify-center space-x-2 bg-dark-danger/10 text-dark-danger text-sm font-semibold py-2 px-4 rounded-md hover:bg-dark-danger/20 transition-colors">
                    <span>Clear Local Project</span>
                </button>
                <p className="text-xs text-light-fg-alt dark:text-dark-fg-alt mt-1 text-center">This removes all files and chat history from this session.</p>
            </SettingsSection>
        </div>
    );
};

export default Sidebar;