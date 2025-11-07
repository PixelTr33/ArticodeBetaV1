import React, { useState, useMemo } from 'react';
import { GeneratedFile, ProjectTemplate } from '../types';
import { ICONS } from '../constants';
import PreviewPanel from './PreviewPanel';

const CodeEditor: React.FC<{
    file: GeneratedFile;
    onChange: (content: string) => void;
    fontSize: number;
}> = ({ file, onChange, fontSize }) => {
    return (
        <textarea
            value={file.content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full bg-white/80 dark:bg-black/50 text-light-fg dark:text-dark-fg resize-none outline-none font-mono text-sm p-4 leading-relaxed"
            spellCheck="false"
            style={{ fontSize: `${fontSize}px` }}
        />
    );
};

const TemplateCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full p-6 bg-white/40 dark:bg-white/5 backdrop-blur-lg border border-black/10 dark:border-white/10 rounded-lg text-left hover:border-black/20 dark:hover:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-200 hover:-translate-y-1"
    >
        <div className="flex items-center space-x-4 mb-3">
            {icon}
            <h3 className="font-semibold text-light-fg dark:text-dark-fg text-lg">{title}</h3>
        </div>
        <p className="text-sm text-light-fg-alt dark:text-gray-300">{description}</p>
    </button>
);


const EditorPanel: React.FC<{
    files: GeneratedFile[];
    activeFileId: string | null;
    onSelectFile: (id: string) => void;
    onFileContentChange: (fileId: string, newContent: string) => void;
    onTemplateSelect: (template: ProjectTemplate) => void;
    fontSize: number;
}> = ({ files, activeFileId, onSelectFile, onFileContentChange, onTemplateSelect, fontSize }) => {
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
    const activeFile = files.find(f => f.id === activeFileId);

    return (
        <div className="flex-1 flex flex-col bg-transparent min-h-0">
            {files.length > 0 && (
                 <div className="flex-shrink-0 flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/30 backdrop-blur-md">
                    <div className="flex items-center overflow-x-auto">
                        {files.map(file => (
                            <button
                                key={file.id}
                                onClick={() => onSelectFile(file.id)}
                                className={`relative flex-shrink-0 px-4 py-3 text-sm flex items-center space-x-2 border-r border-black/10 dark:border-white/10 transition-colors duration-150 ${
                                    activeFileId === file.id
                                        ? 'bg-transparent text-light-fg dark:text-dark-fg'
                                        : 'text-light-fg-alt dark:text-dark-fg-alt hover:bg-black/5 dark:hover:bg-white/10'
                                }`}
                            >
                                <span>{file.name.split('/').pop()}</span>
                                {activeFileId === file.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-light-primary dark:bg-dark-primary" />}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center px-4">
                         <div className="flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-md border border-black/10 dark:border-white/10">
                            <button onClick={() => setViewMode('editor')} className={`px-3 py-1 text-xs rounded-md ${viewMode === 'editor' ? 'bg-white/80 dark:bg-black/50 text-light-fg dark:text-dark-fg shadow-sm' : 'text-light-fg-alt dark:text-dark-fg-alt'}`}>Editor</button>
                            <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-xs rounded-md ${viewMode === 'preview' ? 'bg-white/80 dark:bg-black/50 text-light-fg dark:text-dark-fg shadow-sm' : 'text-light-fg-alt dark:text-dark-fg-alt'}`}>Preview</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex-1 relative">
                {files.length === 0 ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-light-fg-alt dark:text-dark-fg-alt p-8 overflow-y-auto bg-transparent">
                        <span className="text-6xl mb-6 text-light-primary dark:text-dark-primary">{ICONS.gemini}</span>
                        <h2 className="text-3xl font-bold text-light-fg dark:text-dark-fg">Welcome to Articode</h2>
                        <p className="mb-10 max-w-lg mt-2 text-base">
                           Start by selecting a template to generate a new project, or upload an existing one to begin editing.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                            <TemplateCard icon={ICONS.react} title="React SPA" description="A client-side app with a simple counter." onClick={() => onTemplateSelect(ProjectTemplate.REACT_SPA)} />
                            <TemplateCard icon={ICONS.vite} title="Vite + React" description="A lightning-fast React project." onClick={() => onTemplateSelect(ProjectTemplate.VITE_REACT)} />
                            <TemplateCard icon={ICONS.nextjs} title="Next.js Starter" description="A production-ready app with routing." onClick={() => onTemplateSelect(ProjectTemplate.NEXTJS_STARTER)} />
                        </div>
                    </div>
                ) : viewMode === 'editor' && activeFile ? (
                    <CodeEditor file={activeFile} onChange={(content) => onFileContentChange(activeFile.id, content)} fontSize={fontSize} />
                ) : viewMode === 'preview' ? (
                    <div className="w-full h-full bg-white">
                        <PreviewPanel files={files} />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-light-fg-alt dark:text-dark-fg-alt">Select a file to start editing.</div>
                )}
            </div>
        </div>
    );
};

export default EditorPanel;