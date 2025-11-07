import React, { createContext, useContext, ReactNode, useState } from 'react';
import { AppMode, ProjectLanguage } from '../types';

interface AppContextType {
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
    projectLanguage: ProjectLanguage;
    setProjectLanguage: (language: ProjectLanguage) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appMode, setAppMode] = useState<AppMode>('platform');
    const [projectLanguage, setProjectLanguage] = useState<ProjectLanguage>(ProjectLanguage.REACT);

    return (
        <AppContext.Provider value={{ appMode, setAppMode, projectLanguage, setProjectLanguage }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};