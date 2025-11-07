import React, { useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

export interface ContextMenuItem {
    label?: string;
    icon?: React.ReactNode;
    action?: () => void;
    className?: string;
    type?: 'divider';
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const menuStyle: React.CSSProperties = {
        position: 'fixed',
        top: y,
        left: x,
    };
    
    return (
        <div 
            ref={menuRef}
            style={menuStyle}
            className={`w-40 rounded-lg shadow-2xl border backdrop-blur-xl z-50 overflow-hidden ${theme === 'light' ? 'bg-white/80 border-black/10' : 'bg-black/70 border-white/10'}`}
        >
            <ul className="py-1">
                {items.map((item, index) => {
                    if (item.type === 'divider') {
                        return <li key={index} className={`my-1 border-t ${theme === 'light' ? 'border-black/5' : 'border-white/5'}`} />;
                    }
                    return (
                        <li key={item.label || index}>
                            <button 
                                onClick={() => { item.action?.(); onClose(); }}
                                className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs transition-colors ${item.className || ''} ${theme === 'light' ? 'text-light-fg hover:bg-black/5' : 'text-dark-fg hover:bg-white/10'}`}
                            >
                                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                                <span>{item.label}</span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
};

export default ContextMenu;
