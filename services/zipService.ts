import JSZip from 'jszip';
import saveAs from 'file-saver';
import { GeneratedFile } from '../types';

export const downloadProjectAsZip = async (files: GeneratedFile[], projectName: string = 'gemini-genesis-project') => {
  const zip = new JSZip();

  files.forEach(file => {
    // Handle nested directories
    const pathParts = file.name.split('/').filter(p => p);
    let currentFolder: JSZip | null = zip;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
        currentFolder = currentFolder.folder(pathParts[i]);
    }
    
    if (currentFolder) {
        currentFolder.file(pathParts[pathParts.length - 1], file.content);
    } else {
        zip.file(file.name, file.content);
    }
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${projectName}.zip`);
};

// You'll need to add these libraries to your project:
// npm install jszip file-saver
// npm install @types/file-saver --save-dev