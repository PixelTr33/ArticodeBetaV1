

import React from 'react';
import { Theme } from '../types';

const AIAvatar: React.FC<{ isThinking: boolean, size?: 'small' | 'large', theme: Theme }> = ({ isThinking, size = 'small', theme }) => {
    const sizeClasses = size === 'large' 
        ? 'w-24 h-24' 
        : 'w-full h-full';
    
    const animationClass = isThinking ? 'animate-pulse-fast' : 'animate-pulse-slow';
    
    const darkGradient = 'from-gray-700 via-black to-gray-800';
    const lightGradient = 'from-gray-200 via-white to-gray-300';
    const darkInnerGradient = 'from-gray-500 to-gray-800';
    const lightInnerGradient = 'from-gray-100 to-gray-300';

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${theme === 'dark' ? darkGradient : lightGradient} p-0.5 shadow-lg`}>
                <div className={`w-full h-full rounded-full flex items-center justify-center relative ${theme === 'light' ? 'bg-white/50' : 'bg-black/50'}`}>
                    <div className={`absolute w-full h-full rounded-full blur-md ${animationClass} ${theme === 'dark' ? 'bg-gray-500 opacity-50' : 'bg-gray-400 opacity-60'}`}></div>
                    <div className={`w-4/5 h-4/5 rounded-full bg-gradient-to-br border ${theme === 'dark' ? `${darkInnerGradient} border-gray-600` : `${lightInnerGradient} border-gray-200`}`}></div>
                </div>
            </div>
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(0.9); opacity: ${theme === 'dark' ? 0.4 : 0.6}; }
                    50% { transform: scale(1.0); opacity: ${theme === 'dark' ? 0.6 : 0.8}; }
                }
                @keyframes pulse-fast {
                     0%, 100% { transform: scale(0.95); opacity: ${theme === 'dark' ? 0.6 : 0.8}; }
                    50% { transform: scale(1.1); opacity: ${theme === 'dark' ? 0.8 : 1.0}; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .animate-pulse-fast {
                    animation: pulse-fast 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default AIAvatar;