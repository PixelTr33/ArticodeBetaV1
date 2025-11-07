import React, { useState, useRef, useContext } from 'react';
import { CanvasElement, CanvasElementType } from '../../types';
import CanvasElementComponent from './CanvasElementComponent';
import { ThemeContext } from '../../contexts/ThemeContext';

interface DesignCanvasProps {
    elements: CanvasElement[];
    addElement: (elementData: Omit<CanvasElement, 'id'>) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    selectedElementId: string | null;
    setSelectedElementId: (id: string | null) => void;
    editingElementId: string | null;
    setEditingElementId: (id: string | null) => void;
    updateElementProps: (id: string, propsUpdates: Partial<CanvasElement['props']>) => void;
    drawingTool: CanvasElementType | null;
    setDrawingTool: (tool: CanvasElementType | null) => void;
    elementDefaults: Record<CanvasElementType, Partial<CanvasElement>>;
    onOpenFrameMenu: (id: string, x: number, y: number) => void;
    zoom: number;
    panOffset: { x: number, y: number };
    setSnapLines: (lines: SnapLine[]) => void;
    snapLines: SnapLine[];
    onContextMenu: (e: React.MouseEvent, elementId: string) => void;
}

export interface SnapLine {
    type: 'vertical' | 'horizontal';
    x?: number;
    y?: number;
    start: number;
    end: number;
}

const DesignCanvas: React.FC<DesignCanvasProps> = (props) => {
    const { 
        elements, addElement, updateElement, selectedElementId, setSelectedElementId, 
        editingElementId, setEditingElementId, updateElementProps, drawingTool, setDrawingTool, 
        elementDefaults, onOpenFrameMenu, zoom, panOffset, setSnapLines, snapLines, onContextMenu
    } = props;

    const [drawingStart, setDrawingStart] = useState<{ x: number, y: number } | null>(null);
    const [drawingGhost, setDrawingGhost] = useState<Omit<CanvasElement, 'id' | 'props' | 'style'> | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const { theme } = useContext(ThemeContext);
    
    const getCanvasRelativeCoords = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / zoom;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        return { x, y };
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/component-type') as CanvasElementType;
        if (type) {
            const { x, y } = getCanvasRelativeCoords(e);
            const defaults = elementDefaults[type];
            addElement({
                type,
                x: x - (defaults.width! / 2),
                y: y - (defaults.height! / 2),
                width: defaults.width!,
                height: defaults.height!,
                props: defaults.props || {},
                style: defaults.style || {},
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (drawingTool) {
            e.preventDefault();
            const { x, y } = getCanvasRelativeCoords(e);
            setDrawingStart({ x, y });
            setDrawingGhost({
                type: drawingTool,
                x,
                y,
                width: 0,
                height: 0,
            });
        } else {
             if (e.target === e.currentTarget) {
                setSelectedElementId(null);
             }
             if (editingElementId) setEditingElementId(null);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (drawingStart && drawingTool) {
            const { x, y } = getCanvasRelativeCoords(e);
            const newWidth = Math.abs(x - drawingStart.x);
            const newHeight = Math.abs(y - drawingStart.y);
            const newX = Math.min(x, drawingStart.x);
            const newY = Math.min(y, drawingStart.y);
            setDrawingGhost({
                type: drawingTool,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
            });
        }
    };
    
    const handleMouseUp = () => {
        if (drawingStart && drawingTool && drawingGhost && (drawingGhost.width > 5 || drawingGhost.height > 5)) {
            const defaults = elementDefaults[drawingTool];
            addElement({
                type: drawingTool,
                x: drawingGhost.x,
                y: drawingGhost.y,
                width: drawingGhost.width,
                height: drawingGhost.height,
                props: defaults.props || {},
                style: { ...defaults.style, fontFamily: 'Poppins', fontWeight: 400 },
            });
        }
        setDrawingStart(null);
        setDrawingGhost(null);
        setDrawingTool(null);
    };
    
    const bgStyle = {
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)',
      backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
      backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
    };
    const darkBgStyle = {
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
      backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
      backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
    };

    return (
        <div 
            ref={canvasRef}
            className={`flex-1 w-full h-full relative custom-scrollbar overflow-hidden ${drawingTool ? 'cursor-crosshair' : ''} ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg-alt'}`}
            style={theme === 'dark' ? darkBgStyle : bgStyle}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div 
                className="absolute top-0 left-0"
                style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: 'top left' }}
            >
                {elements.map(el => (
                    <CanvasElementComponent
                        key={el.id}
                        element={el}
                        updateElement={updateElement}
                        updateElementProps={updateElementProps}
                        isSelected={selectedElementId === el.id}
                        onSelect={() => {
                            if (editingElementId) setEditingElementId(null);
                            setSelectedElementId(el.id);
                        }}
                        isEditing={editingElementId === el.id}
                        onStartEditing={setEditingElementId}
                        onStopEditing={() => setEditingElementId(null)}
                        onOpenFrameMenu={onOpenFrameMenu}
                        otherElements={elements.filter(other => other.id !== el.id)}
                        setSnapLines={setSnapLines}
                        zoom={zoom}
                        onContextMenu={onContextMenu}
                    />
                ))}
                {drawingGhost && (
                    <div
                        className="absolute bg-blue-500/30 border-2 border-blue-500 pointer-events-none"
                        style={{
                            left: drawingGhost.x,
                            top: drawingGhost.y,
                            width: drawingGhost.width,
                            height: drawingGhost.height,
                            borderRadius: drawingGhost.type === 'circle' ? '50%' : '2px',
                        }}
                    />
                )}
            </div>
            {/* Snap Lines */}
            {snapLines.map((line, index) => (
                <div key={index} className="absolute bg-pink-500 pointer-events-none" style={{
                    ...(line.type === 'vertical' ? {
                        left: line.x! * zoom + panOffset.x,
                        top: line.start * zoom + panOffset.y,
                        width: '1px',
                        height: (line.end - line.start) * zoom,
                    } : {
                        left: line.start * zoom + panOffset.x,
                        top: line.y! * zoom + panOffset.y,
                        width: (line.end - line.start) * zoom,
                        height: '1px',
                    })
                }} />
            ))}
        </div>
    );
};

export default DesignCanvas;