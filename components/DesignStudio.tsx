import React, { useState, useCallback, useContext, useEffect } from 'react';
import { CanvasElement, CanvasElementType } from '../types';
import LeftPanel from './design/ComponentLibrary';
import DesignCanvas, { SnapLine } from './design/DesignCanvas';
import PropertiesPanel from './design/PropertiesPanel';
import FramePresetMenu from './design/FramePresetMenu';
import { ThemeContext } from '../contexts/ThemeContext';
import { ICONS } from '../constants';
import ZoomControls from './design/ZoomControls';
import ContextMenu, { ContextMenuItem } from './design/ContextMenu';

interface DesignStudioProps {
    onSendToAi: (elements: CanvasElement[]) => void;
}

const DEFAULTS: Record<CanvasElementType, Partial<CanvasElement>> = {
    button: { width: 120, height: 40, props: { text: 'Button' }, style: { backgroundColor: '#3a7cfd', textColor: '#ffffff', borderWidth: 0, borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: 'Poppins' } },
    input: { width: 200, height: 40, props: { placeholder: 'Placeholder' }, style: { backgroundColor: '#ffffff', textColor: '#000000', borderColor: '#dce1e7', borderWidth: 1, borderRadius: 8, fontSize: 14, fontFamily: 'Poppins' } },
    card: { width: 250, height: 180, props: {}, style: { backgroundColor: '#ffffff', borderColor: '#e8ebef', borderWidth: 1, borderRadius: 16 } },
    image: { width: 150, height: 150, props: {}, style: { backgroundColor: '#f1f3f6', borderColor: '#dce1e7', borderWidth: 1, borderRadius: 8 } },
    text: { width: 200, height: 50, props: { text: 'Type something...' }, style: { backgroundColor: 'transparent', textColor: '#202429', fontSize: 16, textAlign: 'left', fontFamily: 'Poppins' } },
    frame: { width: 393, height: 852, props: { text: 'iPhone 15 Pro' }, style: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#dce1e7', borderWidth: 1, borderRadius: 12 } },
    slider: { width: 180, height: 8, props: { progress: 50 }, style: { backgroundColor: '#e8ebef', borderRadius: 4 } },
    rectangle: { width: 100, height: 100, props: {}, style: { backgroundColor: '#dce1e7', borderWidth: 0, borderRadius: 0 } },
    circle: { width: 80, height: 80, props: {}, style: { backgroundColor: '#dce1e7', borderWidth: 0, borderRadius: 40 } },
    triangle: { width: 80, height: 80, props: {}, style: { borderColor: '#dce1e7' } }, // Note: backgroundColor is not used for triangle
    textarea: { width: 240, height: 120, props: { placeholder: 'Enter text...' }, style: { backgroundColor: '#ffffff', textColor: '#000000', borderColor: '#dce1e7', borderWidth: 1, borderRadius: 8, fontSize: 14, fontFamily: 'Poppins' } },
    checkbox: { width: 120, height: 24, props: { checked: false, label: 'Checkbox' }, style: { backgroundColor: '#ffffff', textColor: '#202429', borderColor: '#dce1e7', borderWidth: 2, borderRadius: 6, fontSize: 14, fontFamily: 'Poppins' } },
    radio: { width: 120, height: 24, props: { checked: false, label: 'Radio' }, style: { backgroundColor: '#ffffff', textColor: '#202429', borderColor: '#dce1e7', borderWidth: 2, borderRadius: 12, fontSize: 14, fontFamily: 'Poppins' } },
    toggle: { width: 100, height: 28, props: { checked: false, label: 'Toggle' }, style: { backgroundColor: '#dce1e7', textColor: '#202429', borderRadius: 14, fontSize: 14, fontFamily: 'Poppins' } },
    dropdown: { width: 180, height: 40, props: { text: 'Select an option' }, style: { backgroundColor: '#ffffff', textColor: '#000000', borderColor: '#dce1e7', borderWidth: 1, borderRadius: 8, fontFamily: 'Poppins' } },
    avatar: { width: 64, height: 64, props: {}, style: { backgroundColor: '#dce1e7', borderRadius: 32 } },
    progressbar: { width: 200, height: 12, props: { progress: 50 }, style: { backgroundColor: '#e8ebef', borderRadius: 6 } },
    divider: { width: 250, height: 2, props: {}, style: { backgroundColor: '#dce1e7' } },
};


const DesignStudio: React.FC<DesignStudioProps> = ({ onSendToAi }) => {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [editingElementId, setEditingElementId] = useState<string | null>(null);
    const [drawingTool, setDrawingTool] = useState<CanvasElementType | null>(null);
    const [frameMenu, setFrameMenu] = useState<{ x: number, y: number, elementId: string } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, elementId: string, items: ContextMenuItem[] } | null>(null);

    const { theme } = useContext(ThemeContext);

    const addElement = useCallback((newElementData: Omit<CanvasElement, 'id'>) => {
        const newElement: CanvasElement = {
            id: `el_${Date.now()}`,
            ...newElementData
        };
        setElements(prev => [...prev, newElement]);
        setSelectedElementId(newElement.id);
    }, []);

    const updateElement = useCallback((id: string, updates: Partial<Omit<CanvasElement, 'style' | 'props'>>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    }, []);

    const updateElementStyle = useCallback((id: string, styleUpdates: Partial<CanvasElement['style']>) => {
        setElements(prev => prev.map(el => {
            if (el.id === id) {
                return { ...el, style: { ...el.style, ...styleUpdates }};
            }
            return el;
        }));
    }, []);
    
    const updateElementProps = useCallback((id: string, propsUpdates: Partial<CanvasElement['props']>) => {
        setElements(prev => prev.map(el => {
            if (el.id === id) {
                return { ...el, props: { ...el.props, ...propsUpdates }};
            }
            return el;
        }));
    }, []);

    const deleteElement = (id: string) => {
        setElements(prev => prev.filter(el => el.id !== id));
        if (selectedElementId === id) {
            setSelectedElementId(null);
        }
    };
    
    const duplicateElement = (id: string) => {
        const original = elements.find(el => el.id === id);
        if (original) {
            addElement({
                ...original,
                x: original.x + 20,
                y: original.y + 20,
            });
        }
    };

    const reorderElement = (elementId: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
        const index = elements.findIndex(el => el.id === elementId);
        if (index === -1) return;

        const newElements = [...elements];
        const [element] = newElements.splice(index, 1);
        
        switch (direction) {
            case 'front': newElements.push(element); break;
            case 'back': newElements.unshift(element); break;
            case 'forward': if (index < newElements.length) newElements.splice(index + 1, 0, element); else newElements.push(element); break;
            case 'backward': if (index > 0) newElements.splice(index - 1, 0, element); else newElements.unshift(element); break;
        }
        setElements(newElements);
    };

    const reorderLayerByDrag = (dragId: string, dropId: string) => {
        const dragIndex = elements.findIndex(e => e.id === dragId);
        const dropIndex = elements.findIndex(e => e.id === dropId);
        if (dragIndex === -1 || dropIndex === -1) return;
        
        const newElements = [...elements];
        const [draggedItem] = newElements.splice(dragIndex, 1);
        newElements.splice(dropIndex, 0, draggedItem);
        setElements(newElements);
    };

    // Keyboard and mouse events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isPanning) {
                e.preventDefault();
                setIsPanning(true);
                document.body.style.cursor = 'grab';
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
                const activeEl = document.activeElement;
                if (activeEl?.tagName !== 'INPUT' && activeEl?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    deleteElement(selectedElementId);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsPanning(false);
                document.body.style.cursor = 'default';
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isPanning) {
                setPanOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setZoom(prev => Math.min(Math.max(0.1, prev - e.deltaY * 0.001), 4));
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        const canvasEl = document.querySelector('.design-canvas-container'); // Need a stable selector
        canvasEl?.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            canvasEl?.removeEventListener('wheel', handleWheel);
        };
    }, [isPanning, selectedElementId]);


    const clearCanvas = () => {
        if(elements.length > 0 && window.confirm("Are you sure you want to clear the canvas? This action cannot be undone.")) {
            setElements([]);
            setSelectedElementId(null);
            setDrawingTool(null);
            setFrameMenu(null);
        }
    }
    
    const handleSend = () => {
        if (elements.length > 0) {
            onSendToAi(elements);
        } else {
            alert("The canvas is empty. Add some elements before sending to the AI.");
        }
    }

    const handleOpenFrameMenu = (id: string, x: number, y: number) => {
        setFrameMenu({ elementId: id, x, y });
    };

    const handleToolSelect = (tool: CanvasElementType) => {
        setDrawingTool(tool);
        setSelectedElementId(null);
    };

    const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            elementId,
            items: [
                { label: 'Bring Forward', icon: ICONS.bringForward, action: () => reorderElement(elementId, 'forward') },
                { label: 'Bring to Front', icon: ICONS.bringToFront, action: () => reorderElement(elementId, 'front') },
                { label: 'Send Backward', icon: ICONS.sendBackward, action: () => reorderElement(elementId, 'backward') },
                { label: 'Send to Back', icon: ICONS.sendToBack, action: () => reorderElement(elementId, 'back') },
                { type: 'divider' },
                { label: 'Duplicate', icon: ICONS.duplicate, action: () => duplicateElement(elementId) },
                { label: 'Delete', icon: ICONS.trash, action: () => deleteElement(elementId), className: 'text-red-500' },
            ],
        });
    };

    const WelcomeOverlay = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-20 pointer-events-none">
            <span className={`text-6xl mb-6 ${theme === 'light' ? 'text-light-primary' : 'text-dark-primary'}`}>
                {ICONS.design}
            </span>
            <h2 className={`text-3xl font-bold ${theme === 'light' ? 'text-light-fg' : 'text-dark-fg'}`}>
                Design Studio
            </h2>
            <p className={`mb-10 max-w-lg mt-2 text-base ${theme === 'light' ? 'text-light-fg-alt' : 'text-dark-fg-alt'}`}>
                Drag components from the left panel or select a shape to start designing your UI.
            </p>
        </div>
    );

    const selectedElement = elements.find(el => el.id === selectedElementId);

    return (
        <div className={`w-full h-full flex relative overflow-hidden ${theme === 'light' ? 'bg-light-bg-alt' : 'bg-dark-bg'}`}>
            <LeftPanel 
                elements={elements}
                selectedElementId={selectedElementId}
                onToolSelect={handleToolSelect} 
                onSelectElement={setSelectedElementId}
                onReorder={reorderLayerByDrag}
                onSend={handleSend}
                onClear={clearCanvas}
                onDelete={deleteElement}
                onDuplicate={duplicateElement}
            />
            <div className="flex-1 flex flex-col relative design-canvas-container">
                {elements.length === 0 && <WelcomeOverlay />}
                <DesignCanvas
                    elements={elements}
                    addElement={addElement}
                    updateElement={updateElement}
                    selectedElementId={selectedElementId}
                    setSelectedElementId={setSelectedElementId}
                    editingElementId={editingElementId}
                    setEditingElementId={setEditingElementId}
                    updateElementProps={updateElementProps}
                    drawingTool={drawingTool}
                    setDrawingTool={setDrawingTool}
                    elementDefaults={DEFAULTS}
                    onOpenFrameMenu={handleOpenFrameMenu}
                    zoom={zoom}
                    panOffset={panOffset}
                    snapLines={snapLines}
                    setSnapLines={setSnapLines}
                    onContextMenu={handleContextMenu}
                />
            </div>
            {selectedElement && (
                <PropertiesPanel 
                    key={selectedElement.id}
                    element={selectedElement}
                    updateStyle={updateElementStyle}
                    updateProps={updateElementProps}
                    onClose={() => setSelectedElementId(null)}
                />
            )}
            {frameMenu && (
                <FramePresetMenu
                    x={frameMenu.x}
                    y={frameMenu.y}
                    onSelect={(width, height, name) => {
                        updateElement(frameMenu.elementId, { width, height });
                        updateElementProps(frameMenu.elementId, { text: name });
                        setFrameMenu(null);
                    }}
                    onClose={() => setFrameMenu(null)}
                />
            )}
            <ZoomControls zoom={zoom} setZoom={setZoom} />
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenu.items}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

export default DesignStudio;