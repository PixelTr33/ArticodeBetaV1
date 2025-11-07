



import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Theme, Collaborator } from '../types';
import { ICONS } from '../constants';
import { User } from '@supabase/supabase-js';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSwitchSession: (id: string) => void;
    onNewSession: () => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newName: string) => void;
    onArchiveSession: (id: string) => void;
    theme: Theme;
    user: User;
    onSignOut: () => void;
    collaborators: Collaborator[];
    onOpenCollaborationModal: () => void;
}

const ChatItem: React.FC<{
    session: ChatSession;
    isActive: boolean;
    onSwitch: () => void;
    onDelete: () => void;
    onRename: (newName: string) => void;
    onArchive: () => void;
    theme: Theme;
}> = ({ session, isActive, onSwitch, onDelete, onRename, onArchive, theme }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(session.name);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleRenameSubmit = () => {
        if (renameValue.trim()) {
            onRename(renameValue);
        }
        setIsRenaming(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            setRenameValue(session.name);
            setIsRenaming(false);
        }
    };
    
    const menuItems = [
      { label: 'Rename', icon: ICONS.edit, action: () => { setIsRenaming(true); setMenuOpen(false); } },
      { label: 'Archive', icon: ICONS.box, action: () => { onArchive(); setMenuOpen(false); } },
      { label: 'Delete', icon: ICONS.trash, action: () => {
          if (window.confirm("Are you sure you want to delete this chat?")) {
              onDelete();
          }
          setMenuOpen(false);
      }, className: theme === 'light' ? 'text-light-danger' : 'text-red-400' },
    ];

    return (
        <div className="relative">
            <button 
                onClick={() => !isRenaming && onSwitch()}
                className={`w-full group text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                    isActive 
                    ? (theme === 'light' ? 'bg-light-primary/10 text-light-primary font-semibold' : 'bg-white/20 text-white font-semibold')
                    : (theme === 'light' ? 'text-light-fg-alt hover:bg-light-bg-hover hover:text-light-fg' : 'text-gray-300 hover:bg-white/10 hover:text-white')
                }`}
            >
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-transparent outline-none ring-1 rounded-sm px-1 ${theme === 'light' ? 'text-light-fg ring-light-primary/50' : 'text-white ring-white/30'}`}
                    />
                ) : (
                    <span className="truncate pr-2">{session.name}</span>
                )}
                
                {!isRenaming && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }} 
                        className={`p-1 -mr-1 opacity-0 group-hover:opacity-100 rounded-md transition-opacity ${theme === 'light' ? 'text-light-fg-alt hover:text-light-fg hover:bg-black/5' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {ICONS.kebab}
                    </button>
                )}
            </button>

            {menuOpen && (
                <div ref={menuRef} className={`absolute top-full right-0 mt-1 w-32 backdrop-blur-xl border rounded-lg shadow-2xl z-10 overflow-hidden ${theme === 'light' ? 'bg-white/90 border-light-border text-light-fg' : 'bg-black/80 border-white/10 text-white'}`}>
                     <ul className="py-1">
                        {menuItems.map(item => (
                            <li key={item.label}>
                                <button onClick={item.action} className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs transition-colors ${item.className || ''} ${theme === 'light' ? 'hover:bg-light-bg-hover' : 'hover:bg-white/10'}`}>
                                    {item.icon} {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

const AccountMenu: React.FC<{ onSignOut: () => void; onOpenCollaborationModal: () => void; theme: Theme }> = ({ onSignOut, onOpenCollaborationModal, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const closeMenu = () => setIsOpen(false);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'text-light-fg-alt hover:bg-black/5' : 'text-gray-400 hover:bg-white/10'}`}>
                {ICONS.kebab}
            </button>
            {isOpen && (
                <div className={`absolute bottom-full right-0 mb-2 w-48 backdrop-blur-xl border rounded-lg shadow-2xl z-10 overflow-hidden ${theme === 'light' ? 'bg-white/90 border-light-border text-light-fg' : 'bg-black/80 border-white/10 text-white'}`}>
                    <ul className="py-1">
                        <li>
                            <button 
                                onClick={() => { /* onOpenCollaborationModal(); closeMenu(); */ }} 
                                disabled
                                title="Collaboration features are in development. Coming in 2026!"
                                className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs transition-colors opacity-50 cursor-not-allowed`}
                            >
                                {ICONS.collaborate} Collaboration Settings
                            </button>
                        </li>
                         <div className={`my-1 border-t ${theme === 'light' ? 'border-light-border' : 'border-white/10'}`}></div>
                        <li>
                            <button onClick={onSignOut} className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs transition-colors ${theme === 'light' ? 'hover:bg-light-bg-hover text-light-danger' : 'hover:bg-white/10 text-red-400'}`}>
                                {ICONS.logout} Sign Out
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({ isOpen, onToggle, sessions, activeSessionId, onSwitchSession, onNewSession, onDeleteSession, onRenameSession, onArchiveSession, theme, user, onSignOut, collaborators, onOpenCollaborationModal }) => {
    
    const activeSessions = sessions.filter(s => s.status !== 'archived');
    
    const sidebarContent = (
        <div className={`w-[85vw] md:w-72 h-full backdrop-blur-xl border-r flex flex-col ${theme === 'light' ? 'bg-white/70 border-light-border' : 'bg-black/50 border-white/10'}`}>
            <div className={`h-16 flex-shrink-0 flex items-center justify-between p-3 pl-16 md:pl-3 border-b ${theme === 'light' ? 'border-light-border' : 'border-white/10'}`}>
                <div className={`flex items-center space-x-2 ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>
                    <span className="text-light-primary dark:text-dark-primary">{ICONS.gemini}</span>
                    <h1 className="text-base font-semibold">Articode</h1>
                </div>
                 <button 
                    onClick={onNewSession}
                    title="New Chat"
                    className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${theme === 'light' ? 'text-light-fg-alt hover:bg-black/5' : 'text-gray-300 hover:bg-white/10'}`}
                >
                    {ICONS.plus}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {activeSessions.map(session => (
                    <ChatItem
                        key={session.id}
                        session={session}
                        isActive={activeSessionId === session.id}
                        onSwitch={() => onSwitchSession(session.id)}
                        onDelete={() => onDeleteSession(session.id)}
                        onRename={(newName) => onRenameSession(session.id, newName)}
                        onArchive={() => onArchiveSession(session.id)}
                        theme={theme}
                    />
                ))}
            </div>
            
            <div className={`flex-shrink-0 p-3 border-t ${theme === 'light' ? 'border-light-border' : 'border-white/10'}`}>
                {/* Collaboration Section */}
                <div className="mb-3">
                    <p className={`text-xs font-semibold ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>COLLABORATORS</p>
                    <div className="text-xs text-center p-2 rounded-lg bg-black/5 dark:bg-white/5 text-light-fg-alt dark:text-dark-fg-alt mt-1">
                        Unavailable (In Development)
                    </div>
                </div>


                {/* Account Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img src={`https://i.pravatar.cc/32?u=${user.id}`} alt="User Avatar" className="h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="truncate">
                            <p className={`text-sm font-semibold truncate ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>{user.user_metadata.full_name || user.email}</p>
                            <p className={`text-xs ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>Online</p>
                        </div>
                    </div>
                    <AccountMenu onSignOut={onSignOut} onOpenCollaborationModal={onOpenCollaborationModal} theme={theme} />
                </div>
            </div>
        </div>
    );
    
    return (
        <>
            {/* Desktop Sidebar */}
            <div className={`hidden md:block flex-shrink-0 h-full transition-all duration-300 ease-in-out z-40 ${isOpen ? 'w-72' : 'w-0'}`}>
                {isOpen && sidebarContent}
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                 <div className="md:hidden fixed inset-0 bg-black/60 z-50" onClick={onToggle}>
                    <div className="absolute inset-y-0 left-0" onClick={e => e.stopPropagation()}>
                         {sidebarContent}
                    </div>
                 </div>
            )}
            
             {/* Toggle Button */}
             <button
                onClick={onToggle}
                className={`fixed top-4 left-4 z-50 p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${isOpen && 'md:-translate-x-[200%]'
                } ${theme === 'light' ? 'bg-white/50 border-black/10 text-light-fg' : 'bg-black/30 text-white border-white/10'}`}
            >
                {ICONS.sidebar}
            </button>
        </>
    );
};

export default ChatHistorySidebar;