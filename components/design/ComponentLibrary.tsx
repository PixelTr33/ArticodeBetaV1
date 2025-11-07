import React, { useContext, useState } from 'react';
import { ICONS } from '../../constants';
import { ThemeContext } from '../../contexts/ThemeContext';
import ToolboxItem from './DraggableComponent';
import LayersPanel from './LayersPanel';
import { CanvasElement, CanvasElementType } from '../../types';

interface LeftPanelProps {
    elements: CanvasElement[];
    selectedElementId: string | null;
    onToolSelect: (tool: CanvasElementType) => void;
    onSelectElement: (id: string) => void;
    onReorder: (dragId: string, dropId: string) => void;
    onSend: () => void;
    onClear: () => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
}

// FIX: Add a specific type for component definitions to ensure correct type inference for 'type'.
interface ComponentDef {
    type: CanvasElementType;
    label: string;
    icon: React.ReactNode;
}

type PanelView = 'components' | 'layers';

const LeftPanel: React.FC<LeftPanelProps> = (props) => {
    const { onToolSelect, onSend, onClear } = props;
    const { theme } = useContext(ThemeContext);
    const [view, setView] = useState<PanelView>('components');

    const mainComponents: ComponentDef[] = [
        { type: 'frame', label: 'Frame', icon: ICONS.frame },
        { type: 'text', label: 'Text Block', icon: ICONS.text },
        { type: 'image', label: 'Image', icon: ICONS.image },
        { type: 'card', label: 'Card', icon: ICONS.card },
        { type: 'avatar', label: 'Avatar', icon: ICONS.avatar },
    ];

    const formComponents: ComponentDef[] = [
        { type: 'button', label: 'Button', icon: ICONS.button },
        { type: 'input', label: 'Input Field', icon: ICONS.input },
        { type: 'textarea', label: 'Text Area', icon: ICONS.textarea },
        { type: 'checkbox', label: 'Checkbox', icon: ICONS.checkbox },
        { type: 'radio', label: 'Radio Button', icon: ICONS.radio },
        { type: 'toggle', label: 'Toggle Switch', icon: ICONS.toggle },
        { type: 'dropdown', label: 'Dropdown', icon: ICONS.dropdown },
    ];
    
    const feedbackComponents: ComponentDef[] = [
        { type: 'slider', label: 'Slider', icon: ICONS.slider },
        { type: 'progressbar', label: 'Progress Bar', icon: ICONS.progressbar },
    ];
    
    const layoutComponents: ComponentDef[] = [
        { type: 'divider', label: 'Divider', icon: ICONS.divider },
    ];

    const shapeComponents: ComponentDef[] = [
        { type: 'rectangle', label: 'Rectangle', icon: ICONS.rectangle },
        { type: 'circle', label: 'Circle', icon: ICONS.circle },
        { type: 'triangle', label: 'Triangle', icon: ICONS.triangle },
    ];

    const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div>
            <h3 className={`px-2 py-1 mt-4 first:mt-0 text-sm font-semibold tracking-wider uppercase ${theme === 'light' ? 'text-light-fg-alt' : 'text-gray-400'}`}>
                {title}
            </h3>
            <div className="mt-2 space-y-1">
                {children}
            </div>
        </div>
    );
    
    const viewClasses = (isActive: boolean) => {
        return `w-full py-2 text-sm font-semibold transition-colors ${
            isActive 
            ? (theme === 'light' ? 'text-light-primary border-light-primary' : 'text-dark-primary border-dark-primary')
            : (theme === 'light' ? 'text-light-fg-alt border-transparent hover:text-light-fg' : 'text-gray-400 border-transparent hover:text-white')
        } border-b-2`;
    };

    return (
        <aside className={`w-72 h-full flex-shrink-0 border-r backdrop-blur-xl z-10 flex flex-col ${
            theme === 'light'
            ? 'bg-white/60 border-black/10'
            : 'bg-black/30 border-white/10'
        }`}>
            <div className="flex items-center gap-2 p-3 border-b border-inherit">
                <span className="text-light-primary dark:text-dark-primary">{ICONS.gemini}</span>
                <h2 className={`text-lg font-semibold ${theme === 'light' ? 'text-light-fg' : 'text-dark-fg'}`}>Articode</h2>
            </div>
            
            <div className="border-b border-inherit">
                <div className="flex items-center">
                    <button onClick={() => setView('components')} className={viewClasses(view === 'components')}>Components</button>
                    <button onClick={() => setView('layers')} className={viewClasses(view === 'layers')}>Layers</button>
                </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                {view === 'components' ? (
                    <>
                        <Section title="Main">
                            {mainComponents.map(comp => <ToolboxItem key={comp.type} {...comp} onToolSelect={onToolSelect} />)}
                        </Section>
                        <Section title="Forms">
                            {formComponents.map(comp => <ToolboxItem key={comp.type} {...comp} onToolSelect={onToolSelect} />)}
                        </Section>
                        <Section title="Feedback">
                            {feedbackComponents.map(comp => <ToolboxItem key={comp.type} {...comp} onToolSelect={onToolSelect} />)}
                        </Section>
                        <Section title="Layout">
                            {layoutComponents.map(comp => <ToolboxItem key={comp.type} {...comp} onToolSelect={onToolSelect} />)}
                        </Section>
                        <Section title="Shapes">
                            {shapeComponents.map(comp => <ToolboxItem key={comp.type} {...comp} onToolSelect={onToolSelect} isShape />)}
                        </Section>
                    </>
                ) : (
                   <LayersPanel {...props} />
                )}
            </div>

            <div className={`p-3 border-t border-inherit space-y-2`}>
                 <button onClick={onSend} className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${theme === 'light' ? 'bg-light-primary text-white hover:bg-light-primary-hover' : 'bg-dark-primary text-white hover:bg-dark-primary-hover'}`}>
                    <span >{ICONS.send}</span>
                    <span>Send to AI</span>
                </button>
                 <button onClick={onClear} className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${theme === 'light' ? 'text-light-danger/10 text-light-danger hover:bg-light-danger/20' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'}`}>
                    <span>{ICONS.trash}</span>
                    <span>Clear Canvas</span>
                </button>
            </div>
        </aside>
    );
};

export default LeftPanel;