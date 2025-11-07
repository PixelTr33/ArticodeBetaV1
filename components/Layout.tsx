

import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import EditorPanel from './EditorPanel';
import ChatPanel from './ChatPanel';
import BottomPanel, { AppError } from './BottomPanel';
import MobileNav from './MobileNav';
import AgentView from './AgentView';
import DesignStudio from './DesignStudio';
import CollaborationModal from './CollaborationModal';
import WelcomeModal from './WelcomeModal';
import { GeneratedFile, ChatMessage, AIModel, ProjectTemplate, Project, Collaborator, ChatSession, AppMode, ProjectLanguage, CanvasElement } from '../types';
import { generateCode, generateSuggestions, generateChatName, generateCodeNonStream } from '../services/geminiService';
import { downloadProjectAsZip } from '../services/zipService';
import { useSupabase } from '../contexts/SupabaseContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { parseFileCommands } from '../services/fileParser';
import { Session, User } from '@supabase/supabase-js';

// Resizing constraints
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH_PERCENT = 0.4; // 40% of window width
const MIN_CHAT_PANEL_WIDTH = 320;
const MAX_CHAT_PANEL_WIDTH_PERCENT = 0.5; // 50% of window width
const MIN_BOTTOM_PANEL_HEIGHT = 40;
const MAX_BOTTOM_PANEL_HEIGHT_PERCENT = 0.8; // 80% of window height

export type MobileView = 'sidebar' | 'editor' | 'chat' | 'terminal';
export type BottomPanelView = 'problems' | 'terminal';

const ModeSwitcher: React.FC = () => {
    const { appMode, setAppMode } = useAppContext();
    const { theme } = useContext(ThemeContext);

    const getContainerStyle = () => {
        return theme === 'light'
            ? 'bg-white/60 backdrop-blur-md border border-black/10 rounded-lg'
            : 'bg-black/30 backdrop-blur-md border border-white/10 rounded-lg';
    };

    const buttonStyle = (isActive: boolean) => {
        const baseStyle = 'px-4 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200';
        
        const activeStyle = theme === 'light'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-white/90 text-black';
        
        const inactiveStyle = theme === 'light'
                ? 'text-gray-700 hover:text-black'
                : 'text-gray-300 hover:text-white';

        return `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`;
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className={`flex items-center p-0.5 transition-all duration-300 ${getContainerStyle()}`}>
                <button onClick={() => setAppMode('agent')} className={buttonStyle(appMode === 'agent')}>Agent</button>
                <button onClick={() => setAppMode('platform')} className={buttonStyle(appMode === 'platform')}>Platform</button>
                <button onClick={() => setAppMode('design')} className={buttonStyle(appMode === 'design')}>Design</button>
            </div>
        </div>
    );
};


const Layout: React.FC<{ session: Session }> = ({ session }) => {
    const { appMode, setAppMode, projectLanguage, setProjectLanguage } = useAppContext();
    const { theme, setTheme } = useContext(ThemeContext);
    const { supabase } = useSupabase();
    const { fontSize, showThinking, extendedThinking, showSuggestions } = useSettings();
    const [project, setProject] = useState<Project | null>(null);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [files, setFiles] = useState<GeneratedFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<AppError[]>([]);
    const [chatInput, setChatInput] = useState('');
    
    // State for multiple chat sessions
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // New state for Terminal and Mobile UI
    const [terminalHistory, setTerminalHistory] = useState<{type: 'command' | 'output', content: string}[]>([]);
    const [isTerminalBusy, setIsTerminalBusy] = useState(false);
    const [mobileView, setMobileView] = useState<MobileView>('editor');
    const [bottomPanelView, setBottomPanelView] = useState<BottomPanelView>('problems');
    const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
    const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);


    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [chatPanelWidth, setChatPanelWidth] = useState(480);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(280);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isResizingSidebar = useRef(false);
    const isResizingChatPanel = useRef(false);
    const isResizingBottomPanel = useRef(false);
    
    const activeChat = chatSessions.find(c => c.id === activeChatId);
    
    // Show welcome modal once
    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenWelcomeModal_v1');
        if (!hasSeen) {
            setShowWelcomeModal(true);
        }
    }, []);

    const handleCloseWelcomeModal = () => {
        localStorage.setItem('hasSeenWelcomeModal_v1', 'true');
        setShowWelcomeModal(false);
    };

    const fetchActiveProjectData = useCallback(async () => {
        if (!supabase || !session.user) return;

        try {
            // Step 1: Get all project_ids the user is a collaborator on.
            const { data: collaboratorEntries, error: collaboratorError } = await supabase
                .from('collaborators')
                .select('project_id')
                .eq('user_id', session.user.id);

            if (collaboratorError) throw collaboratorError;

            if (!collaboratorEntries || collaboratorEntries.length === 0) {
                setProject(null);
                setCollaborators([]);
                return;
            }

            const projectIds = collaboratorEntries.map(c => c.project_id);

            // Step 2: Find the most recent project, selecting specific columns to avoid recursion.
            const { data: mostRecentProject, error: projectError } = await supabase
                .from('projects')
                .select('id, name, owner_id, created_at') // Explicitly select columns
                .in('id', projectIds)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); 

            if (projectError) throw projectError;
            if (!mostRecentProject) {
                setProject(null);
                setCollaborators([]);
                return;
            }

            setProject(mostRecentProject);

            // Step 3: Fetch collaborators, selecting specific columns to avoid recursion.
            const { data: collaboratorDetails, error: collaboratorsError } = await supabase
                .from('collaborators')
                .select('project_id, user_id, profile:profiles(id, full_name)') // Corrected Query
                .eq('project_id', mostRecentProject.id);

            if (collaboratorsError) throw collaboratorsError;

            if (collaboratorDetails) {
                 const collabs: Collaborator[] = collaboratorDetails.map((c: any) => ({
                    project_id: c.project_id,
                    user_id: c.user_id,
                    profile: c.profile,
                })).filter(c => c.profile); // Ensure profile exists
                setCollaborators(collabs);
            } else {
                setCollaborators([]);
            }

        } catch (err: any) {
            console.error("Error fetching project data:", err.message);
            // Reset state on error to avoid inconsistent UI
            setProject(null);
            setCollaborators([]);
        }
    }, [supabase, session]);

    // This useEffect now manages fetching all project-related data.
    useEffect(() => {
        fetchActiveProjectData();
    }, [fetchActiveProjectData]);


    // Initialize first chat session
    useEffect(() => {
        if (chatSessions.length === 0) {
            const newId = `chat_${Date.now()}`;
            setChatSessions([{
                id: newId,
                name: "New Chat",
                messages: [],
                model: AIModel.FLASH,
                status: 'active',
            }]);
            setActiveChatId(newId);
        }
    }, [chatSessions]);

    // Resizing Logic
    const handleMouseDown = (panel: 'sidebar' | 'chat' | 'bottom') => (e: React.MouseEvent) => {
        e.preventDefault();
        document.body.style.cursor = panel === 'bottom' ? 'row-resize' : 'col-resize';
        document.body.style.userSelect = 'none';

        if (panel === 'sidebar') isResizingSidebar.current = true;
        if (panel === 'chat') isResizingChatPanel.current = true;
        if (panel === 'bottom') isResizingBottomPanel.current = true;
    };

    const handleMouseUp = useCallback(() => {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        isResizingSidebar.current = false;
        isResizingChatPanel.current = false;
        isResizingBottomPanel.current = false;
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizingSidebar.current) {
            const newWidth = e.clientX;
            const maxWidth = window.innerWidth * MAX_SIDEBAR_WIDTH_PERCENT;
            setSidebarWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(newWidth, maxWidth)));
        }
        if (isResizingChatPanel.current) {
            const newWidth = window.innerWidth - e.clientX;
            const maxWidth = window.innerWidth * MAX_CHAT_PANEL_WIDTH_PERCENT;
            setChatPanelWidth(Math.max(MIN_CHAT_PANEL_WIDTH, Math.min(newWidth, maxWidth)));
        }
        if (isResizingBottomPanel.current) {
            const newHeight = window.innerHeight - e.clientY;
            const maxHeight = window.innerHeight * MAX_BOTTOM_PANEL_HEIGHT_PERCENT;
            setBottomPanelHeight(Math.max(MIN_BOTTOM_PANEL_HEIGHT, Math.min(newHeight, maxHeight)));
        }
    }, []);
    
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const updateFiles = (newFiles: GeneratedFile[]): GeneratedFile[] => {
      // FIX: Explicitly type the Map to ensure correct type inference for `filesMap.values()`.
      const filesMap = new Map<string, GeneratedFile>(files.map(f => [f.id, f]));
      newFiles.forEach(newFile => {
        filesMap.set(newFile.id, newFile);
      });
      
      const updatedFiles = Array.from(filesMap.values());
      setFiles(updatedFiles);

      if (newFiles.length > 0 && !activeFileId) {
          const entryFile = newFiles.find(f => f.name.includes('index.html') || f.name.includes('App.tsx')) || newFiles[0];
          setActiveFileId(entryFile.id);
      }
      return updatedFiles;
    }
    
    const handleNewChat = () => {
        const newId = `chat_${Date.now()}`;
        const newChat: ChatSession = {
            id: newId,
            name: "New Chat",
            messages: [],
            model: AIModel.FLASH,
            status: 'active',
        };
        setChatSessions(prev => [...prev, newChat]);
        setActiveChatId(newId);
        setPromptSuggestions([]);
        setFiles([]);
        setActiveFileId(null);
    };

    const handleDeleteChat = (idToDelete: string) => {
        setChatSessions(prev => {
            const remaining = prev.filter(c => c.id !== idToDelete);
            if (activeChatId === idToDelete) {
                const nextActive = remaining.find(c => c.status === 'active') || null;
                if (nextActive) {
                    setActiveChatId(nextActive.id);
                } else if (remaining.length > 0) {
                     setActiveChatId(remaining[0].id);
                } else {
                    handleNewChat();
                    return [];
                }
            }
            return remaining;
        });
    };

    const handleRenameChat = (chatId: string, newName: string) => {
        if (!newName.trim()) return;
        setChatSessions(prev => prev.map(chat =>
            chat.id === chatId ? { ...chat, name: newName.trim() } : chat
        ));
    };

    const handleArchiveChat = (chatId: string) => {
        setChatSessions(prev => prev.map(chat =>
            chat.id === chatId ? { ...chat, status: 'archived' } : chat
        ));
         if (activeChatId === chatId) {
            const nextActive = chatSessions.find(c => c.id !== chatId && c.status === 'active');
            if (nextActive) {
                setActiveChatId(nextActive.id);
            } else {
                handleNewChat();
            }
        }
    };

    const handleSignOut = async () => {
        if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) console.error("Error signing out:", error);
        }
    }

    const handleSendMessage = useCallback(async (message: string, options?: { isRegeneration?: boolean }) => {
        if (!message.trim() || !activeChat) return;
        
        const isRegeneration = options?.isRegeneration ?? false;

        setIsGenerating(true);
        setError(null);
        if (showSuggestions) setPromptSuggestions([]);
        
        const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
        
        const aiPlaceholderMessage: ChatMessage = { 
            id: (Date.now() + 1).toString(), 
            role: 'ai', 
            content: '',
            thinking: showThinking ? '' : undefined, // Only initialize if we're showing it
        };

        const isFirstMessage = activeChat.messages.length === 0;

        setChatSessions(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                let newMessages = [...chat.messages];
                if (isRegeneration) {
                    // Replace the last AI message with the placeholder
                    if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'ai') {
                        newMessages.pop();
                    }
                } else {
                    newMessages.push(userMessage);
                }
                newMessages.push(aiPlaceholderMessage);
                return { ...chat, messages: newMessages };
            }
            return chat;
        }));
        
        if (!isRegeneration) {
            setChatInput('');
             if (isFirstMessage) {
                generateChatName(message).then(name => {
                    setChatSessions(prev => prev.map(chat => 
                        chat.id === activeChatId ? { ...chat, name } : chat
                    ));
                });
            }
        }
        
        try {
            const stream = generateCode(message, files, activeFileId, activeChat.model, extendedThinking, projectLanguage);
            let fullResponseText = '';
            let thinkingContent = '';
            let codeContent = '';

            for await (const chunk of stream) {
                fullResponseText += chunk;

                if (showThinking) {
                    const thinkingMatch = fullResponseText.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/);
                    if (thinkingMatch) {
                        thinkingContent = thinkingMatch[1];
                        
                        setChatSessions(prev => prev.map(chat => {
                            if (chat.id === activeChatId) {
                                const newMessages = [...chat.messages];
                                const lastMsg = newMessages[newMessages.length - 1];
                                if (lastMsg && lastMsg.role === 'ai') {
                                    lastMsg.thinking = thinkingContent;
                                }
                                return { ...chat, messages: newMessages };
                            }
                            return chat;
                        }));
                    }
                }
            }
            
            // Once stream is done, parse the full response
            const thinkingEndMatch = fullResponseText.match(/<\/thinking>/);
            if (thinkingEndMatch) {
                 codeContent = fullResponseText.substring(thinkingEndMatch.index + '</thinking>'.length);
            } else {
                codeContent = fullResponseText;
            }


            const { newFiles, chatResponse } = parseFileCommands(codeContent);
            const modifiedFileNames = newFiles.map(f => f.name);
            const updatedFilesList = updateFiles(newFiles);
            
            let finalAiMessageContent = chatResponse.trim();
            if (newFiles.length > 0 && !finalAiMessageContent) {
                finalAiMessageContent = "I've updated the project files as requested.";
            }
            
            let finalChatHistory: ChatMessage[] = [];
            setChatSessions(prev => prev.map(chat => {
                if (chat.id === activeChatId) {
                    const newMessages = [...chat.messages];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === 'ai') {
                        lastMsg.content = finalAiMessageContent;
                        lastMsg.modifiedFiles = modifiedFileNames.length > 0 ? modifiedFileNames : undefined;
                        // Final thinking state, in case it was missed in stream
                        lastMsg.thinking = thinkingContent.replace(/<\/thinking>[\s\S]*/, '');
                    }
                    finalChatHistory = newMessages;
                    return { ...chat, messages: newMessages };
                }
                return chat;
            }));

            if (showSuggestions && (newFiles.length > 0 || finalAiMessageContent)) {
                 try {
                    const suggestions = await generateSuggestions(updatedFilesList, finalChatHistory);
                    setPromptSuggestions(suggestions);
                } catch (suggestionError) {
                    console.error("Failed to generate suggestions:", suggestionError);
                    setPromptSuggestions([]);
                }
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            const aiErrorMessage: ChatMessage = { id: (Date.now() + 2).toString(), role: 'ai', content: `Error: ${errorMessage}` };
             setChatSessions(prev => prev.map(chat => {
                if (chat.id === activeChatId) {
                     const newMessages = chat.messages.filter(m => m.id !== aiPlaceholderMessage.id);
                     return { ...chat, messages: [...newMessages, aiErrorMessage] };
                }
                return chat;
            }));
        } finally {
            setIsGenerating(false);
        }
    }, [files, activeFileId, activeChat, activeChatId, extendedThinking, showThinking, showSuggestions, projectLanguage]);

    const handleRegenerate = useCallback(() => {
        if (!activeChat || isGenerating) return;
        
        const lastUserMessage = activeChat.messages.slice().reverse().find(m => m.role === 'user');
        if (lastUserMessage) {
            handleSendMessage(lastUserMessage.content, { isRegeneration: true });
        }
    }, [activeChat, isGenerating, handleSendMessage]);

    const handleTerminalCommand = useCallback(async (command: string) => {
        if (!command.trim()) return;
        setIsTerminalBusy(true);
        setTerminalHistory(prev => [...prev, { type: 'command', content: command }]);
        
        const prompt = `A user ran the following command in the integrated terminal: \`${command}\`. Your task is to act as the terminal. First, if the command modifies the file system (e.g., \`npm install\`, \`mkdir\`, \`touch\`), generate the necessary \`[WriteFile]\` commands. Second, provide a realistic, plain-text output that the terminal would show. Do not add any conversational text outside of the terminal output.`

        try {
            const { newFiles, chatResponse } = await generateCodeNonStream(prompt, files, activeFileId, AIModel.FLASH, projectLanguage);
            updateFiles(newFiles);
            if (chatResponse) {
                setTerminalHistory(prev => [...prev, { type: 'output', content: chatResponse }]);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setTerminalHistory(prev => [...prev, { type: 'output', content: `Error: ${errorMessage}` }]);
        } finally {
            setIsTerminalBusy(false);
        }
    }, [files, activeFileId, projectLanguage]);
    
    const handleFileContentChange = (fileId: string, newContent: string) => {
        setFiles(prevFiles => prevFiles.map(file =>
            file.id === fileId ? { ...file, content: newContent } : file
        ));
    };

    const handleDownload = () => {
        if (files.length > 0) {
            downloadProjectAsZip(files, project?.name || 'gemini-project');
        }
    };
    
    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };

    const handleFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles) return;

        const readPromises = Array.from(uploadedFiles).map((file: File) => {
            return new Promise<GeneratedFile>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const content = reader.result as string;
                    // @ts-ignore: webkitRelativePath is non-standard but widely supported for directory uploads
                    const path = file.webkitRelativePath || file.name;
                    resolve({
                        id: path,
                        name: path,
                        content: content,
                        language: file.name.split('.').pop() || 'plaintext',
                    });
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file);
            });
        });

        Promise.all(readPromises).then(newFiles => {
            setFiles(prevFiles => {
                const filesMap = new Map(prevFiles.map(f => [f.id, f]));
                newFiles.forEach(newFile => {
                    filesMap.set(newFile.id, newFile);
                });
                return Array.from(filesMap.values());
            });

            if (newFiles.length > 0 && !activeFileId) {
                setActiveFileId(newFiles[0].id);
            }
        }).catch(error => {
            console.error("Error reading files:", error);
            setError("There was an error reading the uploaded files.");
        });
    };
    
    const handleTemplateSelect = (template: ProjectTemplate) => {
        let prompt = '';
        switch (template) {
            case ProjectTemplate.REACT_SPA:
                prompt = 'Create a simple React single-page application. Include a basic counter component with increment and decrement buttons.';
                break;
            case ProjectTemplate.VITE_REACT:
                prompt = 'Set up a new React project using Vite. Create a main App component that displays a "Hello, Vite + React!" message.';
                break;
            case ProjectTemplate.NEXTJS_STARTER:
                prompt = 'Generate a starter Next.js application. Create a homepage that welcomes the user and a separate "/about" page with some placeholder text.';
                break;
        }
        setChatInput(prompt);
        setMobileView('chat');
    };

    const handleClearProject = () => {
        if (window.confirm("Are you sure you want to clear the entire project? This will delete all files and chat history, but will not affect your saved Supabase project.")) {
            setFiles([]);
            setActiveFileId(null);
            setChatSessions([]); // This will trigger useEffect to create a new one
            setTerminalHistory([]);
            setError(null);
            setErrors([]);
            setChatInput('');
            setPromptSuggestions([]);
        }
    };
    
    const handleClearChat = (chatId: string) => {
        setChatSessions(prev => prev.map(chat => 
            chat.id === chatId ? { ...chat, messages: [] } : chat
        ));
        setPromptSuggestions([]);
    }
    
    const setModelForActiveChat = (model: AIModel) => {
        setChatSessions(prev => prev.map(chat => 
            chat.id === activeChatId ? { ...chat, model } : chat
        ));
    };

    const handleSendDesignToAi = (elements: CanvasElement[]) => {
        let prompt = "A user has created a UI design. Based on the following description, please generate the code for a React application. Use Tailwind CSS for styling. The coordinates and sizes are relative to a canvas and can be used for layout guidance. Create a single App.tsx component to render these elements.\n\n";
        prompt += "**Design Layout Description:**\n";
        elements.forEach(el => {
            prompt += `- A **${el.type}** element`;
            if (el.props.text) prompt += ` with the text "${el.props.text}"`;
            if (el.props.placeholder) prompt += ` with placeholder text "${el.props.placeholder}"`;
            if (el.props.label) prompt += ` with the label "${el.props.label}"`;
            if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'toggle') {
                prompt += el.props.checked ? ' which is **checked**' : ' which is **unchecked**';
            }
            if (el.type === 'progressbar' && el.props.progress !== undefined) {
                 prompt += ` with a progress of ${el.props.progress}%`;
            }
            prompt += ` at position (x: ${Math.round(el.x)}, y: ${Math.round(el.y)})`;
            prompt += ` with a size of (width: ${Math.round(el.width)}, height: ${Math.round(el.height)}).\n`;
            
            const styles = Object.entries(el.style)
                .filter(([, value]) => value !== undefined && value !== '' && value !== null)
                .map(([key, value]) => `  - ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}${typeof value === 'number' ? 'px' : ''}`)
                .join('\n');

            if (styles) {
                prompt += `  It should have the following styles:\n${styles}\n`;
            }
        });
        prompt += "\nPlease use your best judgement to create a clean, modern, and responsive layout based on this information. The positions are absolute for design purposes, but you should implement a responsive layout (e.g., using Flexbox or Grid) in the final code."

        setAppMode('agent');
        setChatInput(prompt);
    };

    const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; orientation: 'vertical' | 'horizontal' }> = ({ onMouseDown, orientation }) => {
        const isVertical = orientation === 'vertical';
        const classes = isVertical
            ? 'w-1.5 h-full cursor-col-resize group'
            : 'w-full h-1.5 cursor-row-resize group';

        return (
            <div onMouseDown={onMouseDown} className={`${classes} flex-shrink-0 bg-transparent`}>
                 <div className={`w-full h-full bg-light-border/0 dark:bg-dark-border/0 group-hover:bg-light-primary/50 dark:group-hover:bg-dark-primary/50 transition-colors duration-200 ${isVertical ? 'w-px' : 'h-px'} mx-auto`} />
            </div>
        );
    };

    const activeFile = files.find(f => f.id === activeFileId);
    
    const PlatformView = () => {
        const mobileContent = () => {
          switch (mobileView) {
            case 'sidebar':
              return <Sidebar files={files} activeFileId={activeFileId} onSelectFile={(id) => { setActiveFileId(id); setMobileView('editor'); }} project={project} onProjectCreated={fetchActiveProjectData} collaborators={collaborators} aiModel={activeChat?.model || AIModel.FLASH} setAiModel={setModelForActiveChat} onClearProject={handleClearProject} />;
            case 'editor':
              return <EditorPanel files={files} activeFileId={activeFileId} onSelectFile={setActiveFileId} onFileContentChange={handleFileContentChange} onTemplateSelect={handleTemplateSelect} fontSize={fontSize} />;
            case 'chat':
              return <ChatPanel messages={activeChat?.messages || []} onSendMessage={handleSendMessage} onRegenerate={handleRegenerate} isGenerating={isGenerating} error={error} inputValue={chatInput} onInputChange={setChatInput} />;
            case 'terminal':
              return <BottomPanel errors={errors} activeFile={activeFile} onFixError={() => {}} terminalHistory={terminalHistory} isTerminalBusy={isTerminalBusy} onTerminalCommand={handleTerminalCommand} activeTab='terminal' onTabChange={setBottomPanelView} />;
            default:
              return null;
          }
        };

        return (
            <>
                {/* --- DESKTOP VIEW --- */}
                <div className="hidden md:flex flex-1 overflow-hidden">
                    <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 h-full">
                        <Sidebar
                            files={files}
                            activeFileId={activeFileId}
                            onSelectFile={setActiveFileId}
                            project={project}
                            onProjectCreated={fetchActiveProjectData}
                            collaborators={collaborators}
                            aiModel={activeChat?.model || AIModel.FLASH}
                            setAiModel={setModelForActiveChat}
                            onClearProject={handleClearProject}
                        />
                    </div>
                    <Resizer onMouseDown={handleMouseDown('sidebar')} orientation="vertical" />

                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 flex flex-col min-h-0">
                            <EditorPanel 
                                files={files} 
                                activeFileId={activeFileId}
                                onSelectFile={setActiveFileId}
                                onFileContentChange={handleFileContentChange}
                                onTemplateSelect={handleTemplateSelect}
                                fontSize={fontSize}
                            />
                        </div>
                        <Resizer onMouseDown={handleMouseDown('bottom')} orientation="horizontal" />
                        <div style={{ height: `${bottomPanelHeight}px`}} className="flex-shrink-0 w-full">
                           <BottomPanel 
                             errors={errors} 
                             activeFile={activeFile} 
                             onFixError={(fileId, errorId, content) => {/* Mock fix */}} 
                             terminalHistory={terminalHistory}
                             isTerminalBusy={isTerminalBusy}
                             onTerminalCommand={handleTerminalCommand}
                             activeTab={bottomPanelView}
                             onTabChange={setBottomPanelView}
                           />
                        </div>
                    </div>

                    <Resizer onMouseDown={handleMouseDown('chat')} orientation="vertical" />
                    <div style={{ width: `${chatPanelWidth}px` }} className="flex-shrink-0 h-full">
                        <ChatPanel
                            messages={activeChat?.messages || []}
                            onSendMessage={handleSendMessage}
                            onRegenerate={handleRegenerate}
                            isGenerating={isGenerating}
                            error={error}
                            inputValue={chatInput}
                            onInputChange={setChatInput}
                        />
                    </div>
                </div>

                {/* --- MOBILE VIEW --- */}
                <div className="md:hidden flex-1 flex flex-col overflow-y-auto">
                  {mobileContent()}
                </div>
            </>
        );
    };

    const backgroundClass = appMode === 'agent' || appMode === 'design'
        ? (theme === 'dark' ? 'animated-gradient-agent' : 'animated-gradient-agent-light')
        : 'bg-[#141414]';

    return (
        <div className={`h-screen w-screen flex flex-col ${backgroundClass} text-light-fg dark:text-dark-fg select-none`}>
            {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcomeModal} />}
            {appMode === 'platform' && (
                <Header
                  onDownload={handleDownload}
                  onUpload={handleUploadClick}
                />
            )}
            <ModeSwitcher />
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFilesUpload}
              style={{ display: 'none' }}
              // @ts-ignore
              webkitdirectory="true"
              directory="true"
              multiple
            />
            {isCollaborationModalOpen && (
                <CollaborationModal
                    isOpen={isCollaborationModalOpen}
                    onClose={() => setIsCollaborationModalOpen(false)}
                    theme={theme}
                    project={project}
                    onProjectCreated={fetchActiveProjectData}
                    collaborators={collaborators}
                    sessionUser={session.user}
                />
            )}
            <main className={`flex flex-1 overflow-hidden`}>
                {appMode === 'agent' && activeChat && (
                    <AgentView 
                        files={files}
                        activeChat={activeChat}
                        chatSessions={chatSessions}
                        onSwitchChat={setActiveChatId}
                        onNewChat={handleNewChat}
                        onDeleteChat={handleDeleteChat}
                        onRenameChat={handleRenameChat}
                        onArchiveChat={handleArchiveChat}
                        onSendMessage={handleSendMessage}
                        onRegenerate={handleRegenerate}
                        isGenerating={isGenerating}
                        chatInput={chatInput}
                        onChatInputChange={setChatInput}
                        onSetModel={setModelForActiveChat}
                        projectLanguage={projectLanguage}
                        onSetProjectLanguage={setProjectLanguage}
                        suggestions={promptSuggestions}
                        onClearChat={handleClearChat}
                        theme={theme}
                        setTheme={setTheme}
                        user={session.user}
                        onSignOut={handleSignOut}
                        collaborators={collaborators}
                        onOpenCollaborationModal={() => setIsCollaborationModalOpen(true)}
                    />
                )}
                {appMode === 'platform' && <PlatformView />}
                {appMode === 'design' && <DesignStudio onSendToAi={handleSendDesignToAi} />}
            </main>
            {appMode === 'platform' && (
                <div className="md:hidden flex-shrink-0">
                    <MobileNav activeView={mobileView} setActiveView={setMobileView} />
                </div>
            )}
        </div>
    );
};

export default Layout;