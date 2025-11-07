import React, { useContext } from 'react';
import { CanvasElement, CanvasElementType } from '../../types';
import { ThemeContext } from '../../contexts/ThemeContext';
import { ICONS } from '../../constants';

interface PropertiesPanelProps {
    element: CanvasElement;
    updateStyle: (id: string, styleUpdates: Partial<CanvasElement['style']>) => void;
    updateProps: (id: string, propsUpdates: Partial<CanvasElement['props']>) => void;
    onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-b border-black/5 dark:border-white/5 last:border-b-0">
        <h4 className="px-3 pt-3 pb-2 text-xs font-semibold text-light-fg-alt dark:text-gray-400">{title}</h4>
        <div className="p-3 pt-0 space-y-3">{children}</div>
    </div>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between text-xs">
        <label>{label}</label>
        <div className="flex items-center gap-2">
            <input 
                type="color" 
                value={value || '#ffffff'} 
                onChange={e => onChange(e.target.value)} 
                className="w-5 h-5 p-0 border-none rounded cursor-pointer bg-transparent"
            />
            <span className="font-mono">{value || 'N/A'}</span>
        </div>
    </div>
);

const NumberInput: React.FC<{ label: string; value: number; onChange: (val: number) => void; min?: number; max?: number; step?: number; unit?: string }> = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = 'px' }) => (
     <div className="flex items-center justify-between text-xs">
        <label>{label}</label>
        <div className="flex items-center gap-2">
            <input 
                type="number" 
                value={value || 0}
                min={min}
                max={max}
                step={step}
                onChange={e => onChange(Number(e.target.value))}
                className="w-12 bg-black/5 dark:bg-white/5 text-center rounded-md border border-transparent focus:border-light-primary dark:focus:border-dark-primary outline-none"
            />
            <span>{unit}</span>
        </div>
    </div>
);

const AlignmentInput: React.FC<{ value: 'left' | 'center' | 'right'; onChange: (val: 'left' | 'center' | 'right') => void }> = ({ value, onChange }) => (
    <div className="flex items-center justify-between text-xs">
        <label>Align</label>
        <div className="flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-md">
            {(['left', 'center', 'right'] as const).map(align => (
                 <button 
                    key={align} 
                    onClick={() => onChange(align)}
                    className={`p-1.5 rounded ${value === align ? 'bg-white dark:bg-black/50 shadow-sm' : 'text-light-fg-alt dark:text-dark-fg-alt'}`}
                 >
                    {ICONS[align === 'left' ? 'alignLeft' : align === 'center' ? 'alignCenter' : 'alignRight']}
                 </button>
            ))}
        </div>
    </div>
);

const CheckboxInput: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between text-xs">
        <label>{label}</label>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
    </div>
);

const FONT_FACES = ['Poppins', 'Arial', 'Verdana', 'Times New Roman', 'Courier New'];
const FONT_WEIGHTS = [
    { label: 'Thin', value: 100 }, { label: 'Light', value: 300 },
    { label: 'Regular', value: 400 }, { label: 'Medium', value: 500 },
    { label: 'Semibold', value: 600 }, { label: 'Bold', value: 700 },
    { label: 'Black', value: 900 }
];


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, updateStyle, updateProps, onClose }) => {
    const { theme } = useContext(ThemeContext);
    
    const TEXT_ELEMENTS: CanvasElementType[] = ['button', 'input', 'text', 'textarea', 'dropdown', 'checkbox', 'radio', 'toggle', 'frame'];
    const FILL_ELEMENTS: CanvasElementType[] = ['button', 'input', 'card', 'frame', 'rectangle', 'circle', 'avatar', 'checkbox', 'radio', 'toggle', 'dropdown', 'progressbar'];
    const CORNER_ELEMENTS: CanvasElementType[] = ['rectangle', 'circle', 'button', 'input', 'toggle', 'image', 'frame', 'dropdown', 'progressbar', 'card', 'checkbox'];
    const STROKE_ELEMENTS: CanvasElementType[] = ['button', 'input', 'card', 'image', 'frame', 'rectangle', 'circle', 'textarea', 'checkbox', 'radio', 'dropdown', 'avatar'];

    const showPropsSection = ['checkbox', 'radio', 'toggle', 'progressbar'].includes(element.type);

    return (
        <aside className={`absolute top-4 right-4 w-64 h-[calc(100%-2rem)] flex-shrink-0 backdrop-blur-xl z-30 rounded-lg border flex flex-col ${
            theme === 'light'
            ? 'bg-white/60 border-black/10'
            : 'bg-black/30 border-white/10'
        }`}>
            <div className="flex items-center justify-between p-3 border-b border-black/5 dark:border-white/5">
                <h3 className="font-semibold text-sm capitalize">{element.type} Properties</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    {ICONS.close}
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {showPropsSection && (
                     <Section title="Props">
                        {(element.type === 'checkbox' || element.type === 'radio' || element.type === 'toggle') && (
                            <CheckboxInput label="Checked" checked={element.props.checked || false} onChange={val => updateProps(element.id, { checked: val })} />
                        )}
                        {element.type === 'progressbar' && (
                             <NumberInput label="Progress" value={element.props.progress || 0} onChange={val => updateProps(element.id, { progress: val })} unit="%" />
                        )}
                    </Section>
                 )}

                {FILL_ELEMENTS.includes(element.type) && (
                    <Section title="Fill">
                        <ColorInput label="Color" value={element.style.backgroundColor || ''} onChange={val => updateStyle(element.id, { backgroundColor: val })} />
                    </Section>
                )}
                
                {TEXT_ELEMENTS.includes(element.type) && (
                    <>
                        <Section title="Text">
                            <ColorInput label="Color" value={element.style.textColor || ''} onChange={val => updateStyle(element.id, { textColor: val })} />
                            <NumberInput label="Size" value={element.style.fontSize || 14} onChange={val => updateStyle(element.id, { fontSize: val })} max={72} />
                            <AlignmentInput value={element.style.textAlign || 'center'} onChange={val => updateStyle(element.id, { textAlign: val })} />
                        </Section>
                        <Section title="Font">
                             <div className="flex items-center justify-between text-xs">
                                <label>Face</label>
                                <select value={element.style.fontFamily || 'Poppins'} onChange={e => updateStyle(element.id, { fontFamily: e.target.value })} className="w-32 bg-black/5 dark:bg-white/5 text-right rounded-md border border-transparent focus:border-light-primary dark:focus:border-dark-primary outline-none p-1">
                                    {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
                                </select>
                             </div>
                              <div className="flex items-center justify-between text-xs">
                                <label>Weight</label>
                                <select value={element.style.fontWeight || 400} onChange={e => updateStyle(element.id, { fontWeight: Number(e.target.value) })} className="w-32 bg-black/5 dark:bg-white/5 text-right rounded-md border border-transparent focus:border-light-primary dark:focus:border-dark-primary outline-none p-1">
                                    {FONT_WEIGHTS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                                </select>
                             </div>
                        </Section>
                    </>
                )}

                {STROKE_ELEMENTS.includes(element.type) && (
                    <Section title="Stroke">
                        <ColorInput label="Color" value={element.style.borderColor || ''} onChange={val => updateStyle(element.id, { borderColor: val })} />
                        <NumberInput label="Width" value={element.style.borderWidth || 0} onChange={val => updateStyle(element.id, { borderWidth: val })} max={20}/>
                    </Section>
                )}
                
                {CORNER_ELEMENTS.includes(element.type) && (
                     <Section title="Corners">
                        <NumberInput label="Radius" value={element.style.borderRadius || 0} onChange={val => updateStyle(element.id, { borderRadius: val })} max={Math.min(element.width, element.height) / 2}/>
                    </Section>
                )}
            </div>
        </aside>
    );
};

export default PropertiesPanel;