import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SettingsContextType {
    fontSize: number;
    setFontSize: (size: number) => void;
    showThinking: boolean;
    setShowThinking: (show: boolean) => void;
    extendedThinking: boolean;
    setExtendedThinking: (extended: boolean) => void;
    showSuggestions: boolean;
    setShowSuggestions: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };
    return [storedValue, setValue];
};


export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [fontSize, setFontSize] = useLocalStorage<number>('editor_font_size', 14);
    const [showThinking, setShowThinking] = useLocalStorage<boolean>('show_thinking', true);
    const [extendedThinking, setExtendedThinking] = useLocalStorage<boolean>('extended_thinking', true);
    const [showSuggestions, setShowSuggestions] = useLocalStorage<boolean>('show_suggestions', true);


    return (
        <SettingsContext.Provider value={{ 
            fontSize, setFontSize,
            showThinking, setShowThinking,
            extendedThinking, setExtendedThinking,
            showSuggestions, setShowSuggestions
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};