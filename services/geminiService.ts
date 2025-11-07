import { GoogleGenAI } from '@google/genai';
import { AIModel, ChatMessage, GeneratedFile, ProjectLanguage } from '../types';
import { parseFileCommands } from './fileParser';

// IMPORTANT: This key is managed externally. Do not hardcode or allow user input.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd have better error handling.
  // For this demo, we'll log a warning and the app will show an error state.
  console.warn("Gemini API key not found in environment variables.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const getFileContext = (files: GeneratedFile[], activeFileId: string | null): string => {
    if (files.length === 0) return "The project is currently empty.";

    let context = "Here is the current file structure and content of the active file:\n\n";
    context += "File Structure:\n";
    files.forEach(f => {
        context += `- ${f.name}\n`;
    });

    const activeFile = files.find(f => f.id === activeFileId);
    if (activeFile) {
        context += `\nContent of active file (${activeFile.name}):\n---\n${activeFile.content}\n---`;
    }

    return context;
};

const getLanguageInstruction = (language: ProjectLanguage): string => {
    switch (language) {
        case ProjectLanguage.REACT:
            return "You must use TypeScript, React, and Tailwind CSS for all coding tasks.\n- All React source code (TSX, CSS files) MUST be placed in a `src/` directory.\n- Every project MUST have an `index.html` file in the root directory. This is the entry point for the web application preview.\n- The `index.html` must include a `<div id=\"root\"></div>` and a `<script type=\"module\" src=\"/src/main.tsx\"></script>` to load the main JavaScript file.\n- For clarity, always use full import paths including the file extension (e.g., `import App from './App.tsx'`). This is important for the preview to work correctly.";
        case ProjectLanguage.HTML_CSS_JS:
            return "You must use plain HTML, CSS, and vanilla JavaScript. Do not use any frameworks or libraries like React or Vue. The entry point must be `index.html`. Do not use any build tools or package managers like npm. File paths in tags like `<script src=\"...\">` or `<link href=\"...\">` must be relative and correct.";
        case ProjectLanguage.REACT_NATIVE_EXPO:
            return "You are generating code for React Native (Expo), which does not run in a web browser. The primary entry file MUST be named `App.tsx`. DO NOT generate `index.html`, CSS files, or any other web-specific files. Styling MUST be done using React Native's `StyleSheet.create` API.";
        case ProjectLanguage.XAMARIN:
            return "You must generate code for a Xamarin.Forms application using C# and XAML. Provide both the `.xaml` and `.xaml.cs` files. Remember, this code is not for a web browser. Ensure file names are appropriate for a Xamarin project (e.g., `MainPage.xaml`, `MainPage.xaml.cs`).";
        case ProjectLanguage.CSHARP:
            return "You must generate code for a C# desktop application. Use WinForms or WPF as the framework. Specify which you are using. Remember, this code is not for a web browser. Provide file names appropriate for the chosen framework (e.g., `Form1.cs`, `MainWindow.xaml`).";
        default:
            return "You must use TypeScript, React, and Tailwind CSS for all coding tasks.";
    }
}

const getSystemInstructionForThinking = (isExtended: boolean, language: ProjectLanguage): string => {
    const extendedThinkingInstruction = isExtended 
        ? "You are in Extended Thinking mode. Your plan should be significantly more detailed. Break down components, consider state management, potential edge cases, and accessibility. Be thorough."
        : "Your plan should be a concise, step-by-step outline.";

    return `You are a helpful and brilliant AI programmer named Genesis. Your goal is to help users build applications.

**Analyze the user's request to determine their intent.**

**INTENT 1: The user wants to write or modify code.**
*   If the user's prompt is about creating, changing, adding, or fixing code, you MUST follow this structured format.
*   **Step 1: THINKING.** Provide your step-by-step plan inside a <thinking> tag. This is your internal monologue and **MUST NOT CONTAIN ANY CODE**. It is for planning and reasoning only. ${extendedThinkingInstruction}
*   **Step 2: CODING.** After the </thinking> tag, provide ONLY the necessary code changes using the [WriteFile:"path/to/filename.ext","...content..."] command.

*   **Example for a coding request (assuming React):**
    <thinking>
    The user wants a simple counter.
    1.  Create the main entry point \`index.html\`.
    2.  Create a new React component file named Counter.tsx in \`src/\`.
    3.  Import React and the useState hook.
    4.  Set up a state variable for the count.
    5.  Add two buttons to increment and decrement the count.
    6.  Display the current count.
    7.  Create \`src/main.tsx\` to render the Counter component into the DOM.
    </thinking>
    [WriteFile:"index.html","<!DOCTYPE html>...<script type=\\"module\\" src=\\"/src/main.tsx\\"></script>..."]
    [WriteFile:"src/Counter.tsx","import React, { useState } from 'react'; ..."]
    [WriteFile:"src/main.tsx","import React from 'react'; import ReactDOM from 'react-dom/client'; ..."]

**INTENT 2: The user is having a conversation.**
*   If the user is asking a general question, greeting you, or just chatting, respond naturally and conversationally.
*   In your conversational responses, you **MUST USE MARKDOWN** for formatting when it improves readability (e.g., for lists, emphasis, or code snippets). Supported formats are: **bold**, *italics*, bullet points (using - or *), and \`inline code\`.
*   **DO NOT** use the <thinking> tag or the [WriteFile] command for conversational replies.

*   **Example for a conversational request:**
    User Prompt: "Hi, what can you do?"
    Your Response: "Hello! I'm Genesis, an AI programmer. I can help you build entire applications from scratch. Here's what I can do:
    - **Generate** full projects in various languages.
    - **Modify** existing code based on your requests.
    - **Explain** complex code.
    Just describe what you want to build!"

**HARD RULES - YOU MUST FOLLOW THESE TO AVOID ERRORS:**
1.  **NEVER FORGET THE COMMAND:** Your primary purpose is to generate code. Always use the \`[WriteFile:"path/to/file.ext","...content..."]\` command for any and all code output. There are no exceptions.
2.  **FULL FILES ONLY:** You MUST provide the complete, unabridged content for every file. Do not use comments like "// ... rest of the code" or placeholders. The user's application preview will fail if files are incomplete.
3.  **NO CHITCHAT IN CODE MODE:** When generating code, your response MUST NOT contain any conversational text, explanations, or markdown outside of the \`<thinking>\` block. The response should only be the \`<thinking>\` block followed by one or more \`[WriteFile]\` commands.
4.  **STICK TO THE STACK:** The user has selected **${language}**. All code you write MUST be 100% compatible with this technology. Do not introduce other languages, frameworks, or libraries unless explicitly asked.
5.  **VERIFY FILE PATHS:** Before issuing a \`[WriteFile]\` command, mentally trace the project structure. Ensure all file paths (e.g., in \`import\` statements or \`<script>\` tags) are correct relative to the project root. For React projects, remember that source files belong in the \`src/\` directory.
6.  **SELF-CORRECTION CHECK:** Before finalizing your response, review these rules. Did you use \`[WriteFile]\` for all code? Is the file content complete? Are there any stray conversational sentences? Fix any mistakes.

**Key Rules:**
- Your current technology stack is: **${language}**.
- ${getLanguageInstruction(language)}
`;
};

const getSystemInstructionForNonStream = (language: ProjectLanguage): string => {
    return `You are an expert AI programmer. Your task is to generate and modify application code based on user prompts.

**YOUR RESPONSE MUST FOLLOW ONE OF THESE TWO FORMATS:**

**1. For Code Generation:**
You MUST use the \`[WriteFile]\` command. Your entire response should consist of one or more of these commands.
- **FORMAT:** \`[WriteFile:"path/to/filename.ext","...full file content..."]\`
- **CONTENT:** The content must be the complete, unabridged file. Do not use placeholders.
- **ESCAPING:** Inside the content string, double quotes must be escaped as \`\\"\`, and backslashes as \`\\\\\`.
- **NO EXTRA TEXT:** Do not include any conversational text, greetings, or explanations when you are providing code.

**2. For Conversation:**
If the user is not asking for code, you can respond with plain text.

**CRITICAL RULES:**
- Your technology stack is **${language}**.
- ${getLanguageInstruction(language)}
- When asked to change a file, provide the \`[WriteFile]\` command for that file with its **complete new content**, not just the changed lines.
- Create all necessary files for a complete, runnable application.`;
}


export async function* generateCode(prompt: string, files: GeneratedFile[], activeFileId: string | null, model: AIModel, isExtendedThinking: boolean, language: ProjectLanguage): AsyncGenerator<string> {
    if (!ai) throw new Error("Gemini client not initialized. Check API Key.");
    
    const fileContext = getFileContext(files, activeFileId);
    const fullPrompt = `${fileContext}\n\nUser Prompt: ${prompt}`;

    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: fullPrompt,
            config: {
                systemInstruction: getSystemInstructionForThinking(isExtendedThinking, language),
            }
        });
        
        for await (const chunk of response) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error generating code stream:", error);
        throw new Error("Failed to get streaming response from AI. Please check your API key and network connection.");
    }
}

export const generateCodeNonStream = async (prompt: string, files: GeneratedFile[], activeFileId: string | null, model: AIModel, language: ProjectLanguage) => {
    if (!ai) throw new Error("Gemini client not initialized. Check API Key.");
    
    const fileContext = getFileContext(files, activeFileId);
    const fullPrompt = `${fileContext}\n\nUser Prompt: ${prompt}`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: fullPrompt,
            config: {
                systemInstruction: getSystemInstructionForNonStream(language),
            }
        });
        
        const textResponse = response.text;
        const { newFiles, chatResponse } = parseFileCommands(textResponse);
        const modifiedFileNames = newFiles.map(f => f.name);
        
        return { newFiles, chatResponse, modifiedFileNames };
    } catch (error) {
        console.error("Error generating code:", error);
        throw new Error("Failed to get response from AI. Please check your API key and network connection.");
    }
};

export const fixCodeError = async (code: string, error: string, model: AIModel) => {
    if (!ai) throw new Error("Gemini client not initialized.");
    
    const prompt = `The following code has an error: "${error}". Please provide the corrected version of the code inside a [WriteFile] command.
    
Original Code:
\`\`\`
${code}
\`\`\`
`;

    try {
         const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: getSystemInstructionForNonStream(ProjectLanguage.REACT), // Defaulting to React for now
            }
        });
        const textResponse = response.text;
        const { newFiles } = parseFileCommands(textResponse);
        return newFiles.length > 0 ? newFiles[0].content : code;
    } catch (error) {
        console.error("Error fixing code:", error);
        throw new Error("Failed to get fix from AI.");
    }
};

export const generateChatName = async (firstPrompt: string): Promise<string> => {
    if (!ai) return "New Chat";

    const prompt = `Based on the user's first prompt, create a very short, concise, and descriptive title for this chat session (max 4-5 words).
    
    User's Prompt: "${firstPrompt}"
    
    Respond only with the title text.`;
    
    try {
        const response = await ai.models.generateContent({
            model: AIModel.FLASH, // Use a fast model for naming
            contents: prompt,
        });
        return response.text.trim().replace(/"/g, ''); // Clean up response
    } catch (error) {
        console.error("Error generating chat name:", error);
        return "New Chat";
    }
};

export const generateSuggestions = async (files: GeneratedFile[], chatHistory: ChatMessage[]): Promise<string[]> => {
    if (!ai) return [];

    const fileContext = files.length > 0
        ? "Current file structure:\n" + files.map(f => `- ${f.name}`).join('\n')
        : "The project is empty.";
    
    const historyContext = chatHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');

    const fullPrompt = `Based on the following project context and recent conversation, generate 4 concise and creative next-step suggestions for the user to type as a prompt.
    
    ${fileContext}

    Recent Conversation:
    ${historyContext}

    Respond ONLY with a JSON array of strings. Do not include markdown backticks or the word 'json'. Example: ["Add a hover effect to the buttons", "Create a separate component for the header", "Implement a dark mode toggle", "Fetch real data from an API"]`;

    try {
        const response = await ai.models.generateContent({
            model: AIModel.FLASH, // Use a faster model for suggestions
            contents: fullPrompt,
        });

        const text = response.text.trim();
        const jsonString = text.replace(/^```json\n?/, '').replace(/```$/, '');
        const suggestions = JSON.parse(jsonString);
        
        if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            return suggestions;
        }
        return [];

    } catch (error) {
        console.error("Error generating suggestions:", error);
        return []; // Return empty array on failure
    }
}