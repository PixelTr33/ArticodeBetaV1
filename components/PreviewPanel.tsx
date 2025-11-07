import React, { useMemo } from 'react';
import { GeneratedFile } from '../types';
import { createPreviewHtml } from '../services/previewService';

const PreviewPanel: React.FC<{ files: GeneratedFile[] }> = ({ files }) => {
    const previewHtml = useMemo(() => {
        return createPreviewHtml(files);
    }, [files]);

    return (
        <iframe
            srcDoc={previewHtml}
            title="Project Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin"
        />
    );
};

export default PreviewPanel;
