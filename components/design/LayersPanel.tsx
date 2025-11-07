import React, { useState } from 'react';
import { CanvasElement } from '../../types';
import { ICONS } from '../../constants';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

interface LayersPanelProps {
    elements: CanvasElement[];
    selectedElementId: string | null;
    onSelectElement: (id: string) => void;
    onReorder: (dragId: string, dropId: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
}

const getElementIcon = (type: string) => {
    switch(type) {
        case 'frame': return ICONS.frame;
        case 'rectangle': return ICONS.rectangle;
        case 'text': return ICONS.text;
        case 'button': return ICONS.button;
        case 'input': return ICONS.input;
        case 'image': return ICONS.image;
        default: return ICONS.box;
    }
}

const LayerItem: React.FC<{
    element: CanvasElement;
    isSelected: boolean;
    onSelect: () => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    onContextMenu: (e: React.MouseEvent, id: string) => void;
}> = ({ element, isSelected, onSelect, onDragStart, onDragOver, onDrop, onContextMenu }) => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const textProp = element.props.text || element.props.label || element.type;
    
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, element.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, element.id)}
            onContextMenu={e => onContextMenu(e, element.id)}
            onClick={onSelect}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                isSelected 
                ? (theme === 'light' ? 'bg-light-primary/10' : 'bg-white/10')
                : (theme === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/5')
            }`}
        >
            <div className="flex items-center gap-2 truncate">
                <span className="text-sm text-light-fg-alt dark:text-gray-400">{getElementIcon(element.type)}</span>
                <span className="text-sm truncate">{textProp}</span>
            </div>
        </div>
    );
};

const LayersPanel: React.FC<LayersPanelProps> = ({ elements, selectedElementId, onSelectElement, onReorder, onDelete, onDuplicate }) => {
    const [dragId, setDragId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, elementId: string } | null>(null);
    
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDragId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    const handleDrop = (e: React.DragEvent, dropId: string) => {
        e.preventDefault();
        if (dragId && dragId !== dropId) {
            onReorder(dragId, dropId);
        }
        setDragId(null);
    };

    const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, elementId });
    };

    const contextMenuItems: ContextMenuItem[] = [
        { label: 'Duplicate', icon: ICONS.duplicate, action: () => onDuplicate(contextMenu!.elementId) },
        { label: 'Delete', icon: ICONS.trash, action: () => onDelete(contextMenu!.elementId), className: 'text-red-500' },
    ];
    
    // The rendered list should be in reverse order to match z-index (top layer on top of list)
    const reversedElements = [...elements].reverse();

    return (
        <div className="space-y-1">
            {reversedElements.map(el => (
                <LayerItem 
                    key={el.id} 
                    element={el}
                    isSelected={selectedElementId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onContextMenu={handleContextMenu}
                />
            ))}
             {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenuItems}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

export default LayersPanel;
