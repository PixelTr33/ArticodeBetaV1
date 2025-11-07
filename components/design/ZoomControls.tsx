import React, { useContext } from 'react';
import { ICONS } from '../../constants';
import { ThemeContext } from '../../contexts/ThemeContext';

interface ZoomControlsProps {
    zoom: number;
    setZoom: (zoom: number | ((prevZoom: number) => number)) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, setZoom }) => {
    const { theme } = useContext(ThemeContext);
    const themeClasses = theme === 'light' 
        ? 'bg-white/60 border-black/10 text-light-fg' 
        : 'bg-black/30 border-white/10 text-dark-fg';

    const buttonClasses = `p-2 rounded-md transition-colors ${theme === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/10'}`;

    return (
        <div className={`absolute bottom-4 right-4 z-20 flex items-center gap-1 p-1 rounded-lg backdrop-blur-md border ${themeClasses}`}>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className={buttonClasses}>
                {ICONS.zoomOut}
            </button>
            <button onClick={() => setZoom(1)} className={`w-16 text-xs font-semibold rounded-md py-2 transition-colors ${theme === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}>
                {Math.round(zoom * 100)}%
            </button>
            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className={buttonClasses}>
                {ICONS.zoomIn}
            </button>
        </div>
    );
};

export default ZoomControls;
