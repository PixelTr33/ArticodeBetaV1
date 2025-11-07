import React, { useRef, MouseEvent, useEffect } from 'react';
import { CanvasElement } from '../../types';
import { ICONS } from '../../constants';
import { SnapLine } from './DesignCanvas';

interface CanvasElementProps {
    element: CanvasElement;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    updateElementProps: (id: string, propsUpdates: Partial<CanvasElement['props']>) => void;
    isSelected: boolean;
    onSelect: () => void;
    isEditing: boolean;
    onStartEditing: (id: string) => void;
    onStopEditing: () => void;
    onOpenFrameMenu: (id: string, x: number, y: number) => void;
    otherElements: CanvasElement[];
    setSnapLines: (lines: SnapLine[]) => void;
    zoom: number;
    onContextMenu: (e: React.MouseEvent, elementId: string) => void;
}

const RESIZE_HANDLE_SIZE = 8;
const MIN_SIZE = 20;
const SNAP_THRESHOLD = 5;

const CanvasElementComponent: React.FC<CanvasElementProps> = (props) => {
    const { 
        element, updateElement, updateElementProps, isSelected, onSelect, 
        isEditing, onStartEditing, onStopEditing, onOpenFrameMenu, 
        otherElements, setSnapLines, zoom, onContextMenu
    } = props;
    
    const dragStartPos = useRef({ x: 0, y: 0, elementX: 0, elementY: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isTextEditable = ['button', 'text', 'input', 'textarea', 'dropdown', 'checkbox', 'radio', 'toggle', 'frame'].includes(element.type);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);
    
    const getSnapPoints = (el: CanvasElement) => ({
        v: [el.x, el.x + el.width / 2, el.x + el.width], // left, center, right
        h: [el.y, el.y + el.height / 2, el.y + el.height], // top, center, bottom
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only for left click
        e.stopPropagation();
        onSelect();
        
        dragStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            elementX: element.x,
            elementY: element.y
        };
        
        const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            if (isEditing) return;
            const dx = (moveEvent.clientX - dragStartPos.current.x) / zoom;
            const dy = (moveEvent.clientY - dragStartPos.current.y) / zoom;
            
            let newX = dragStartPos.current.elementX + dx;
            let newY = dragStartPos.current.elementY + dy;
            
            const currentSnapPoints = getSnapPoints({ ...element, x: newX, y: newY });
            const newSnapLines: SnapLine[] = [];

            otherElements.forEach(otherEl => {
                const otherSnapPoints = getSnapPoints(otherEl);
                
                // Vertical snapping
                for (const v of currentSnapPoints.v) {
                    for (const ov of otherSnapPoints.v) {
                        if (Math.abs(v - ov) < SNAP_THRESHOLD) {
                            newX += ov - v;
                            newSnapLines.push({
                                type: 'vertical',
                                x: ov,
                                start: Math.min(newY, otherEl.y),
                                end: Math.max(newY + element.height, otherEl.y + otherEl.height)
                            });
                        }
                    }
                }
                
                // Horizontal snapping
                for (const h of currentSnapPoints.h) {
                    for (const oh of otherSnapPoints.h) {
                        if (Math.abs(h - oh) < SNAP_THRESHOLD) {
                            newY += oh - h;
                            newSnapLines.push({
                                type: 'horizontal',
                                y: oh,
                                start: Math.min(newX, otherEl.x),
                                end: Math.max(newX + element.width, otherEl.x + otherEl.width)
                            });
                        }
                    }
                }
            });
            
            setSnapLines(newSnapLines);
            updateElement(element.id, { x: newX, y: newY });
        };
        
        const handleMouseUp = () => {
            setSnapLines([]);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeMouseDown = (e: MouseEvent, corner: string) => {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const { x, y, width, height } = element;

        const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            const dx = (moveEvent.clientX - startX) / zoom;
            const dy = (moveEvent.clientY - startY) / zoom;
            
            let newX = x, newY = y, newWidth = width, newHeight = height;

            if (corner.includes('bottom')) newHeight = Math.max(MIN_SIZE, height + dy);
            if (corner.includes('right')) newWidth = Math.max(MIN_SIZE, width + dx);
            if (corner.includes('top')) {
                newHeight = Math.max(MIN_SIZE, height - dy);
                if (newHeight > MIN_SIZE) newY = y + dy;
            }
            if (corner.includes('left')) {
                newWidth = Math.max(MIN_SIZE, width - dx);
                if (newWidth > MIN_SIZE) newX = x + dx;
            }
            
            updateElement(element.id, { x: newX, y: newY, width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleDoubleClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (element.type === 'frame') {
            onOpenFrameMenu(element.id, e.clientX, e.clientY);
        } else if (isTextEditable) {
            onStartEditing(element.id);
        }
    };
    
    const getTextProp = () => {
        switch(element.type) {
            case 'checkbox':
            case 'radio':
            case 'toggle':
                return element.props.label || '';
            default:
                return element.props.text || '';
        }
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        switch(element.type) {
            case 'checkbox':
            case 'radio':
            case 'toggle':
                updateElementProps(element.id, { label: newText });
                break;
            default:
                updateElementProps(element.id, { text: newText });
        }
    };

    const renderElement = () => {
        const baseClasses = "w-full h-full pointer-events-none select-none flex items-center justify-center overflow-hidden";
        
        const styles: React.CSSProperties = {
            backgroundColor: element.style.backgroundColor,
            color: element.style.textColor,
            borderColor: element.style.borderColor,
            borderWidth: element.style.borderWidth,
            borderRadius: element.style.borderRadius,
            fontSize: element.style.fontSize,
            fontWeight: element.style.fontWeight,
            textAlign: element.style.textAlign,
            opacity: element.style.opacity,
            borderStyle: 'solid',
            fontFamily: element.style.fontFamily || 'Poppins, sans-serif'
        };
        
        if (isEditing) {
            return (
                <textarea
                    ref={textareaRef}
                    value={getTextProp()}
                    onChange={handleTextChange}
                    onBlur={onStopEditing}
                    onKeyDown={(e) => e.key === 'Escape' && onStopEditing()}
                    className="absolute inset-0 w-full h-full bg-blue-100/80 text-black resize-none outline-none p-1 z-20"
                    style={{
                        fontSize: element.style.fontSize,
                        fontWeight: element.style.fontWeight,
                        textAlign: element.style.textAlign,
                        fontFamily: element.style.fontFamily || 'Poppins, sans-serif'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            );
        }

        switch (element.type) {
            case 'button':
            case 'dropdown':
                return <button style={styles} className={`${baseClasses} px-2`}>{element.props.text}</button>;
            case 'input':
                return <input type="text" placeholder={element.props.placeholder} style={styles} className={`${baseClasses} px-2`} readOnly />;
            case 'textarea':
                return <textarea placeholder={element.props.placeholder} style={styles} className={`${baseClasses} p-2`} readOnly />;
            case 'card':
            case 'rectangle':
                 return <div style={styles} className={`${baseClasses}`} />;
            case 'frame':
                 return <div style={styles} className={`${baseClasses} relative`}><span className="absolute top-1 left-2 text-xs text-gray-400">{element.props.text}</span></div>;
            case 'image':
                return <div style={styles} className={`${baseClasses}`}>{ICONS.image}</div>;
            case 'avatar':
                return <div style={{ ...styles, borderRadius: '50%' }} className={`${baseClasses}`}>{ICONS.userAvatar}</div>;
            case 'text':
                return <p style={styles} className={`${baseClasses} p-1`}>{element.props.text}</p>;
            case 'slider':
                return <input type="range" style={styles} className={`${baseClasses} w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer`} />;
            case 'circle':
                 return <div style={{ ...styles, borderRadius: '50%' }} className={`${baseClasses}`} />;
            case 'triangle':
                return <div style={{
                    width: 0, height: 0, backgroundColor: 'transparent',
                    borderLeft: `${element.width / 2}px solid transparent`,
                    borderRight: `${element.width / 2}px solid transparent`,
                    borderBottom: `${element.height}px solid ${element.style.borderColor}`,
                }} className={baseClasses} />;
            case 'checkbox':
            case 'radio':
                const isRadio = element.type === 'radio';
                return (
                    <div className="flex items-center gap-2 pointer-events-none p-2 w-full h-full">
                        <div style={{
                            width: 20, height: 20, minWidth: 20,
                            backgroundColor: styles.backgroundColor, borderColor: styles.borderColor,
                            borderWidth: styles.borderWidth, borderRadius: isRadio ? '50%' : styles.borderRadius
                        }} className="flex items-center justify-center">
                            {element.props.checked && (
                                isRadio 
                                ? <div style={{width: '50%', height: '50%', backgroundColor: '#3a7cfd', borderRadius: '50%'}} />
                                : <svg viewBox="0 0 16 16" fill="#3a7cfd" className="w-4 h-4"><path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/></svg>
                            )}
                        </div>
                        {/* FIX: Use styles.color instead of styles.textColor */}
                        <span style={{color: styles.color, fontSize: styles.fontSize, fontFamily: styles.fontFamily}} className="truncate">{element.props.label}</span>
                    </div>
                );
            case 'toggle':
                return (
                    <div className="flex items-center gap-2 pointer-events-none p-2 w-full h-full">
                        <div style={{...styles, backgroundColor: element.props.checked ? '#3a7cfd' : styles.backgroundColor }} className="w-12 h-7 rounded-full flex-shrink-0 relative transition-colors">
                           <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${element.props.checked ? 'translate-x-5' : ''}`} />
                        </div>
                         {/* FIX: Use styles.color instead of styles.textColor */}
                         <span style={{color: styles.color, fontSize: styles.fontSize, fontFamily: styles.fontFamily}} className="truncate">{element.props.label}</span>
                    </div>
                );
            case 'progressbar':
                return (
                    <div style={styles} className={`${baseClasses} overflow-hidden`}>
                        <div style={{ width: `${element.props.progress || 0}%`, height: '100%', backgroundColor: '#3a7cfd', borderRadius: element.style.borderRadius }} />
                    </div>
                );
            case 'divider':
                return <div style={{...styles, height: element.style.borderWidth}} className="w-full" />;
            default:
                return null;
        }
    };
    
    const resizeHandles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const handleClass = "absolute bg-white border-2 border-[#3a7cfd] z-20";

    return (
        <div
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                cursor: 'grab',
                outline: isSelected ? '2px solid #3a7cfd' : 'none',
                outlineOffset: '2px',
                zIndex: isSelected ? 10 : 1,
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, element.id)}
        >
            {renderElement()}
            {isSelected && !isEditing && (
                <>
                    {resizeHandles.map(corner => {
                        const style: React.CSSProperties = {
                            width: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE,
                            [corner.includes('top') ? 'top' : 'bottom']: -RESIZE_HANDLE_SIZE / 2,
                            [corner.includes('left') ? 'left' : 'right']: -RESIZE_HANDLE_SIZE / 2,
                        };
                        if (corner === 'top-left') style.cursor = 'nwse-resize';
                        if (corner === 'top-right') style.cursor = 'nesw-resize';
                        if (corner === 'bottom-left') style.cursor = 'nesw-resize';
                        if (corner === 'bottom-right') style.cursor = 'nwse-resize';

                        return (
                            <div
                                key={corner}
                                className={handleClass}
                                style={style}
                                onMouseDown={(e) => handleResizeMouseDown(e, corner)}
                            />
                        );
                    })}
                </>
            )}
        </div>
    );
};

export default CanvasElementComponent;
