import React from 'react';
import { ICONS } from '../constants';
import { MobileView } from './Layout';

interface MobileNavProps {
    activeView: MobileView;
    setActiveView: (view: MobileView) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, setActiveView }) => {
    const navItems: { id: MobileView; icon: React.ReactNode; label: string }[] = [
        { id: 'sidebar', icon: ICONS.files, label: 'Files' },
        { id: 'editor', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>, label: 'Editor' },
        { id: 'chat', icon: ICONS.aiAvatar, label: 'Chat' },
        { id: 'terminal', icon: ICONS.terminal, label: 'Terminal' },
    ];

    return (
        <nav className="w-full h-16 bg-light-bg-alt dark:bg-dark-bg-alt border-t border-light-border dark:border-dark-border flex items-center justify-around">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${
                        activeView === item.id 
                        ? 'text-light-primary dark:text-dark-primary' 
                        : 'text-light-fg-alt dark:text-dark-fg-alt hover:text-light-fg dark:hover:text-dark-fg'
                    }`}
                >
                    {item.icon}
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default MobileNav;
