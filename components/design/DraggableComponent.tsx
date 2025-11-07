import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { CanvasElementType } from '../../types';

interface ToolboxItemProps {
    type: CanvasElementType;
    icon: React.ReactNode;
    label: string;
    onToolSelect: (tool: CanvasElementType) => void;
    isShape?: boolean;
}

const ToolboxItem: React.FC<ToolboxItemProps> = ({ type, icon, label, onToolSelect, isShape }) => {
    const { theme } = useContext(ThemeContext);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/component-type', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleClick = () => {
        onToolSelect(type);
    };

    const commonClasses = `flex items-center gap-3 p-2.5 rounded-lg transition-colors w-full text-left ${
        theme === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/10'
    }`;

    if (isShape) {
        return (
             <button
                onClick={handleClick}
                className={`${commonClasses} cursor-pointer`}
            >
                <div className={theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}>{icon}</div>
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-light-fg' : 'text-gray-200'}`}>{label}</span>
            </button>
        )
    }

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={`${commonClasses} cursor-grab active:cursor-grabbing`}
        >
            <div className={theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}>{icon}</div>
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-light-fg' : 'text-gray-200'}`}>{label}</span>
        </div>
    );
};

export default ToolboxItem;
