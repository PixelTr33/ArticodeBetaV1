import React from 'react';
import { ICONS } from '../constants';

const MainMenu: React.FC<{ onUpload: () => void; onDownload: () => void; }> = ({ onUpload, onDownload }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

     React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const menuItems = [
        { label: 'Upload Project', icon: ICONS.upload, action: onUpload },
        { label: 'Download Project', icon: ICONS.download, action: onDownload },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 rounded-lg text-light-fg-alt dAnnie J., Age 16, North Carolina, USAark:text-dark-fg-alt hover:bg-black/5 dark:hover:bg-white/10 hover:text-light-fg dark:hover:text-dark-fg transition-colors" 
                aria-label="Main Menu"
            >
                {ICONS.kebab}
            </button>
            {isOpen && (
                 <div className="absolute top-full right-0 mt-2 w-56 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                    <ul className="py-1">
                        {menuItems.map(item => (
                            <li key={item.label}>
                                <button onClick={() => { item.action(); setIsOpen(false); }} className="w-full flex items-center space-x-3 text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-light-fg dark:text-dark-fg transition-colors">
                                    <span className="flex-shrink-0 w-5 h-5 text-light-fg-alt dark:text-dark-fg-alt">{item.icon}</span>
                                    <span>{item.label}</span>
                                 </button>
                            </li>
                        ))}
                    </ul>
                 </div>
            )}
        </div>
    );
}

const Header: React.FC<{
    onDownload: () => void;
    onUpload: () => void;
}> = ({ onDownload, onUpload }) => {
    return (
        <header className="relative z-10 flex-shrink-0 h-14 flex items-center justify-between px-4 bg-white/60 dark:bg-black/30 backdrop-blur-xl border-b border-black/10 dark:border-white/10">
            <div className="flex items-center space-x-3">
                <span className="text-light-primary dark:text-dark-primary">{ICONS.gemini}</span>
                <div className="w-px h-6 bg-black/10 dark:bg-white/10"></div>
                <h1 className="text-lg font-semibold text-light-fg dark:text-dark-fg">Articode (Beta)</h1>
            </div>
            <div className="flex items-center space-x-2">
                <MainMenu onUpload={onUpload} onDownload={onDownload} />
            </div>
        </header>
    );
};

export default Header;