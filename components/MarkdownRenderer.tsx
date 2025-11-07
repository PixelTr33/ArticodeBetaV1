import React from 'react';

const processLineFormatting = (line: string): string => {
    return line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-light-bg-hover dark:bg-dark-bg px-1.5 py-0.5 rounded-sm font-mono text-sm">$1</code>');
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const blocks = content.split(/(```[\s\S]*?```)/g);

    const renderedBlocks = blocks.map((block, index) => {
        if (block.startsWith('```')) {
            const code = block.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
            return (
                <pre key={index} className="bg-light-bg-alt dark:bg-dark-bg p-3 rounded-md my-2 overflow-x-auto border border-light-border dark:border-dark-border">
                    <code className="font-mono text-sm">{code}</code>
                </pre>
            );
        }

        const paragraphs = block.trim().split('\n\n').map((para, paraIndex) => {
            const lines = para.split('\n');
            const isList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));

            if (isList && lines.length > 0 && lines[0].trim() !== '') {
                return (
                    <ul key={paraIndex} className="list-disc list-inside space-y-1 my-2">
                        {lines.map((line, lineIndex) => (
                            <li key={lineIndex} dangerouslySetInnerHTML={{ __html: processLineFormatting(line.trim().substring(2)) }} />
                        ))}
                    </ul>
                );
            }

            return (
                <p key={paraIndex} dangerouslySetInnerHTML={{ __html: processLineFormatting(para) }} className="my-2" />
            );
        });

        return <div key={index}>{paragraphs}</div>;
    });

    return <div>{renderedBlocks}</div>;
};

export default MarkdownRenderer;