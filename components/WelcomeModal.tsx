import React, { useContext } from 'react';
import { ICONS } from '../constants';
import { ThemeContext } from '../contexts/ThemeContext';

interface WelcomeModalProps {
    onClose: () => void;
}

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => {
    const { theme } = useContext(ThemeContext);
    return (
        <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-light-primary/10 text-light-primary' : 'bg-dark-primary/20 text-dark-primary'}`}>
                {icon}
            </div>
            <div>
                <h4 className={`font-semibold ${theme === 'light' ? 'text-light-fg' : 'text-white'}`}>{title}</h4>
                <p className={`text-sm ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>{description}</p>
            </div>
        </div>
    );
};

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    const { theme } = useContext(ThemeContext);

    const modalClasses = theme === 'light'
        ? 'bg-white/80 border-black/10 text-light-fg'
        : 'bg-zinc-800/70 border-white/10 text-white';

    const features = [
        { icon: ICONS.design, title: "Visual UI Builder", description: "Drag & drop components or draw shapes directly onto the canvas to craft your UI." },
        { icon: ICONS.layers, title: "Advanced Layer Control", description: "Manage elements with a dedicated layers panel, context menus, and keyboard shortcuts." },
        { icon: ICONS.settings, title: "Dynamic Properties Panel", description: "Modify colors, fonts, borders, and more with a context-aware inspector." },
        { icon: ICONS.send, title: "Seamless AI Handoff", description: "Convert your visual designs into a detailed prompt for the AI to generate code instantly." },
    ];

    const buttonClasses = theme === 'light'
        ? 'bg-white/50 border border-black/10 hover:bg-white/80'
        : 'bg-white/10 border border-white/20 hover:bg-white/20';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div 
                className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl border ${modalClasses}`} 
                onClick={e => e.stopPropagation()}
                style={{ animation: 'slide-up 0.3s ease-out' }}
            >
                <div className="h-48 w-full relative gradient-welcome-art flex flex-col items-center justify-center p-4">
                    {ICONS.articodeLogoWhite}
                    <h1 className="text-3xl font-bold text-white mt-2 drop-shadow-md">Articode</h1>
                </div>

                <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-center tracking-tight">Welcome to Articode Beta</h2>
                    <p className={`text-center mt-2 mb-10 ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-300'}`}>
                        We've supercharged your workflow with a powerful, Figma-like canvas to bring your ideas to life visually.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {features.map(feature => <FeatureItem key={feature.title} {...feature} />)}
                    </div>

                    <div className="mt-10 text-center">
                        <button 
                            onClick={onClose} 
                            className={`w-full py-3 text-base font-semibold rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-lg ${buttonClasses}`}
                        >
                            Start Designing
                        </button>
                         <p className="text-xs text-red-500/80 mt-4 font-semibold">
                            This is a test beta, this must not be distributed.
                        </p>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                @keyframes slide-up { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default WelcomeModal;