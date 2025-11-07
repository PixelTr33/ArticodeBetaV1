

import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Project, Theme, Collaborator, ProjectInvite } from '../types';
import { useSupabase } from '../contexts/SupabaseContext';
import { User } from '@supabase/supabase-js';

const CollaborationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    project: Project | null;
    onProjectCreated: () => void;
    collaborators: Collaborator[];
    sessionUser: User;
}> = ({ isOpen, onClose, theme, project, onProjectCreated, collaborators, sessionUser }) => {
    
    if (!isOpen) return null;
    
    const modalClasses = theme === 'light' ? 'bg-white/80 border-light-border text-light-fg' : 'bg-black/50 border-white/10 text-white';
   
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border ${modalClasses}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-inherit">
                    <h2 className="text-lg font-bold">Collaboration Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">{ICONS.close}</button>
                </div>
                
                <div className="p-8 text-center">
                    <div className="text-light-primary dark:text-dark-primary mb-4 inline-block">
                        {React.cloneElement(ICONS.collaborate, { className: "h-16 w-16" })}
                    </div>
                    <h3 className="font-bold text-lg text-light-fg dark:text-dark-fg mb-2">Feature Unavailable</h3>
                    <p className="text-sm text-light-fg-alt dark:text-dark-fg-alt">
                        We're hard at work building a seamless real-time collaboration experience. This feature is currently in development.
                    </p>
                    <p className="text-sm mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-md font-semibold text-light-fg dark:text-dark-fg">
                        Scheduled for release in 2026.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CollaborationModal;