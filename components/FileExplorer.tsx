import React, { useState, useMemo } from 'react';
import { GeneratedFile } from '../types';
import { ICONS } from '../constants';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  fileData?: GeneratedFile;
}

const getFileIcon = (filename: string) => {
    if (filename.endsWith('.tsx')) return <span className="text-cyan-400">{ICONS.fileTsx}</span>;
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return <span className="text-yellow-400">{ICONS.fileJs}</span>;
    if (filename.endsWith('.html')) return <span className="text-orange-500">{ICONS.fileHtml}</span>;
    if (filename.endsWith('.css')) return <span className="text-blue-500">{ICONS.fileCss}</span>;
    if (filename.endsWith('.json')) return <span className="text-yellow-600">{ICONS.fileJson}</span>;
    return <span className="text-light-fg-alt dark:text-dark-fg-alt">{ICONS.fileDefault}</span>;
};

const buildFileTree = (files: GeneratedFile[]): TreeNode[] => {
    const root: TreeNode = { name: 'root', path: '', type: 'folder', children: [] };
    
    const findOrCreateNode = (parent: TreeNode, part: string, currentPath: string): TreeNode => {
        let node = parent.children.find(child => child.name === part && child.type === 'folder');
        if (!node) {
            node = { name: part, path: currentPath, type: 'folder', children: [] };
            parent.children.push(node);
        }
        return node;
    };
    
    files.forEach(file => {
        let parent = root;
        const pathParts = file.name.split('/');
        
        pathParts.forEach((part, index) => {
            const currentPath = pathParts.slice(0, index + 1).join('/');
            if (index === pathParts.length - 1) { // It's a file
                parent.children.push({
                    name: part,
                    path: currentPath,
                    type: 'file',
                    children: [],
                    fileData: file
                });
            } else { // It's a folder
                parent = findOrCreateNode(parent, part, currentPath);
            }
        });
    });

    // Sort children: folders first, then alphabetically
    const sortChildren = (node: TreeNode) => {
        node.children.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
    };

    sortChildren(root);
    return root.children;
};

const FileTreeNode: React.FC<{
    node: TreeNode;
    level: number;
    activeFileId: string | null;
    onSelectFile: (id: string) => void;
    openFolders: Set<string>;
    toggleFolder: (path: string) => void;
}> = ({ node, level, activeFileId, onSelectFile, openFolders, toggleFolder }) => {
    const isFolder = node.type === 'folder';
    const isOpen = isFolder && openFolders.has(node.path);
    
    if (isFolder) {
        return (
            <div>
                <button
                    onClick={() => toggleFolder(node.path)}
                    className="w-full text-left px-2 py-1.5 text-sm flex items-center space-x-2 rounded-md hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover text-light-fg dark:text-dark-fg select-none transition-colors"
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                >
                    <span className={`transition-transform duration-150 text-light-fg-alt dark:text-dark-fg-alt ${isOpen ? 'rotate-90' : ''}`}>{ICONS.chevronRight}</span>
                    <span className="text-yellow-500">{isOpen ? ICONS.folderOpen : ICONS.folder}</span>
                    <span>{node.name}</span>
                </button>
                {isOpen && node.children?.map(child => (
                    <FileTreeNode 
                        key={child.path}
                        node={child}
                        level={level + 1}
                        activeFileId={activeFileId}
                        onSelectFile={onSelectFile}
                        openFolders={openFolders}
                        toggleFolder={toggleFolder}
                    />
                ))}
            </div>
        );
    }

    // It's a file
    const isActive = activeFileId === node.fileData?.id;
    return (
        <button
            onClick={() => node.fileData && onSelectFile(node.fileData.id)}
            className={`w-full text-left px-2 py-1.5 text-sm flex items-center space-x-2 rounded-md transition-colors select-none ${
                isActive
                    ? 'bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary font-medium'
                    : 'text-light-fg-alt dark:text-dark-fg-alt hover:bg-light-bg-hover dark:hover:bg-dark-bg-hover hover:text-light-fg dark:hover:text-dark-fg'
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
            <span className="w-4 h-4 flex-shrink-0"></span> {/* Spacer for chevron */}
            {getFileIcon(node.name)}
            <span>{node.name}</span>
        </button>
    );
};


const FileExplorer: React.FC<{
    files: GeneratedFile[];
    activeFileId: string | null;
    onSelectFile: (id: string) => void;
}> = ({ files, activeFileId, onSelectFile }) => {
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
    const fileTree = useMemo(() => buildFileTree(files), [files]);

    const toggleFolder = (path: string) => {
        setOpenFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };
    
    if (files.length === 0) {
        return <div className="p-4 text-sm text-center text-light-fg-alt dark:text-dark-fg-alt">No files yet.</div>;
    }

    return (
        <div className="p-2 space-y-0.5">
            {fileTree.map(node => (
                 <FileTreeNode 
                    key={node.path}
                    node={node}
                    level={0}
                    activeFileId={activeFileId}
                    onSelectFile={onSelectFile}
                    openFolders={openFolders}
                    toggleFolder={toggleFolder}
                />
            ))}
        </div>
    );
};

export default FileExplorer;