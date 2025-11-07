import { GeneratedFile } from '../types';

export const parseFileCommands = (responseText: string): { newFiles: GeneratedFile[], chatResponse: string } => {
  const files: GeneratedFile[] = [];
  let chatContent = responseText;

  // Regex to find [WriteFile:"filename","content"] or WriteFile:"filename","content" commands
  const commandRegex = /\[?WriteFile:"([^"]+?)","((?:[^"\\]|\\.)*?)"\]?/gs;

  let match;
  while ((match = commandRegex.exec(responseText)) !== null) {
    const filePath = match[1];
    let fileContent = match[2];

    // Unescape characters
    fileContent = fileContent.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
    
    const language = filePath.split('.').pop() || 'plaintext';

    files.push({
      id: filePath, // Using path as a unique ID
      name: filePath,
      content: fileContent,
      language: language,
    });

    // Remove the matched command from the chat content
    chatContent = chatContent.replace(match[0], '').trim();
  }

  return { newFiles: files, chatResponse: chatContent };
};