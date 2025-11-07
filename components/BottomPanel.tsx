import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { GeneratedFile } from '../types';
import { BottomPanelView } from './Layout';

export interface AppError {
    id: string;
    fileId: string;
    line: number;
    message: string;
}

interface TerminalHistoryItem {
    type: 'command' | 'output';
    content: string;
}

const Terminal: React.FC<{
    history: TerminalHistoryItem[];
    onCommand: (command: string) => void;
    isBusy: boolean;
}> = ({ history, onCommand, isBusy }) => {
    const [input, setInput] = useState('');
    const endOfHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isBusy) {
            onCommand(input);
            setInput('');
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col font-mono text-sm p-2" onClick={() => document.getElementById('terminal-input')?.focus()}>
            <div className="flex-1 overflow-y-auto pr-2">
                {history.map((item, index) => (
                    <div key={index} className="whitespace-pre-wrap break-words">
                        {item.type === 'command' && (
                            <div className="flex">
                                <span className="text-light-primary dark:text-dark-primary mr-2">&gt;</span>
                                <span className="flex-1">{item.content}</span>
                            </div>
                        )}
                        {item.type === 'output' && (
                            <div>{item.content}</div>
                        )}
                    </div>
                ))}
                {isBusy && (
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-light-primary dark:bg-dark-primary rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-light-primary dark:bg-dark-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-light-primary dark:bg-dark-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                )}
                <div ref={endOfHistoryRef}></div>
            </div>
            <form onSubmit={handleFormSubmit} className="flex-shrink-0 flex items-center pt-1">
                <span className="text-light-primary dark:text-dark-primary mr-2">&gt;</span>
                <input
                    id="terminal-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-transparent outline-none flex-1"
                    disabled={isBusy}
                    autoComplete="off"
                    spellCheck="false"
                />
            </form>
        </div>
    );
}


const BottomPanel: React.FC<{
    errors: AppError[];
    activeFile: GeneratedFile | undefined;
    onFixError: (fileId: string, errorId: string, content: string) => void;
    terminalHistory: TerminalHistoryItem[];
    isTerminalBusy: boolean;
    onTerminalCommand: (command: string) => void;
    activeTab: BottomPanelView;
    onTabChange: (tab: BottomPanelView) => void;
}> = ({ errors, activeFile, onFixError, terminalHistory, isTerminalBusy, onTerminalCommand, activeTab, onTabChange }) => {
    
    const tabs: {id: BottomPanelView, label: string}[] = [
        { id: 'problems', label: 'Problems' },
        { id: 'terminal', label: 'Terminal' },
    ];

    return (
        <div className="w-full h-full border-t border-black/10 dark:border-white/10 flex flex-col bg-white/60 dark:bg-black/30 backdrop-blur-xl text-light-fg dark:text-dark-fg">
            <div className="flex-shrink-0 h-10 flex items-center justify-between p-2 px-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`relative text-sm font-semibold uppercase tracking-wider transition-colors px-2 ${activeTab === tab.id ? 'text-light-fg dark:text-dark-fg' : 'text-light-fg-alt dark:text-dark-fg-alt hover:text-light-fg dark:hover:text-dark-fg'}`}>
                            {tab.label}
                            {tab.id === 'problems' && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-light-fg-alt dark:text-dark-fg-alt font-mono">{errors.length}</span>}
                            {activeTab === tab.id && <div className="absolute -bottom-2.5 left-0 w-full h-0.5 bg-light-primary dark:bg-dark-primary" />}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto text-sm">
                {activeTab === 'problems' && (
                    <div className="p-2">
                        {errors.length === 0 ? (
                            <div className="text-center text-light-fg-alt dark:text-dark-fg-alt pt-8">No problems have been detected.</div>
                        ) : (
                            <ul className="space-y-1">
                                {errors.map(error => (
                                    <li key={error.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10">
                                    <span className="text-dark-danger mt-0.5">{ICONS.danger}</span>
                                    <div className="flex-1">
                                        <p className="text-light-fg dark:text-dark-fg">{error.message}</p>
                                        <p className="text-xs text-light-fg-alt dark:text-dark-fg-alt">{error.fileId} (Line {error.line})</p>
                                    </div>
                                    <button className="text-xs bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary px-2 py-1 rounded-md hover:bg-light-primary/20 dark:hover:bg-dark-primary/20 transition-colors">
                                        Quick Fix
                                    </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
                {activeTab === 'terminal' && (
                    <Terminal history={terminalHistory} onCommand={onTerminalCommand} isBusy={isTerminalBusy} />
                )}
            </div>
        </div>
    );
};

export default BottomPanel;