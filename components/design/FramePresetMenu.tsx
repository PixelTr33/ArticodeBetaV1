import React, { useEffect, useRef } from 'react';

interface FramePresetMenuProps {
    x: number;
    y: number;
    onSelect: (width: number, height: number, name: string) => void;
    onClose: () => void;
}

const PRESETS = [
    { name: 'iPhone 15 Pro', width: 393, height: 852 },
    { name: 'Google Pixel 8', width: 412, height: 915 },
    { name: 'Standard Android', width: 360, height: 640 },
    { name: 'Tablet (Portrait)', width: 768, height: 1024 },
    { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
    { name: 'Desktop (1366x768)', width: 1366, height: 768 },
];

const FramePresetMenu: React.FC<FramePresetMenuProps> = ({ x, y, onSelect, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

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
        transform: 'translate(10px, 10px)', // Offset from cursor
    };

    return (
        <div 
            ref={menuRef}
            style={menuStyle}
            className={`w-56 rounded-lg shadow-2xl border backdrop-blur-xl z-50 overflow-hidden ${theme === 'light' ? 'bg-white/80 border-black/10' : 'bg-black/70 border-white/10'}`}
        >
            <ul className="py-1">
                <li className={`px-3 py-1.5 text-xs font-semibold ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>
                    Resize Frame
                </li>
                {PRESETS.map(preset => (
                    <li key={preset.name}>
                        <button 
                            onClick={() => onSelect(preset.width, preset.height, preset.name)}
                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${theme === 'light' ? 'text-light-fg hover:bg-black/5' : 'text-dark-fg hover:bg-white/10'}`}
                        >
                            {preset.name} <span className="text-xs text-gray-500">({preset.width}x{preset.height})</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FramePresetMenu;
