

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { ICONS } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

export const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const avatar = isUser ? ICONS.userAvatar : ICONS.aiAvatar;
    const bubbleStyles = isUser
        ? 'bg-light-primary dark:bg-dark-primary text-white'
        : 'bg-light-bg-hover dark:bg-dark-bg text-light-fg dark:text-dark-fg';
    const alignment = isUser ? 'justify-end' : 'justify-start';
    const avatarOrder = isUser ? 'order-2' : 'order-1';
    const bubbleOrder = isUser ? 'order-1 mr-3' : 'order-2 ml-3';

    return (
        <div className={`flex items-start ${alignment}`}>
             <div className={`flex-shrink-0 p-1.5 rounded-full bg-light-bg-hover dark:bg-dark-bg ${avatarOrder} text-light-fg-alt dark:text-dark-fg-alt`}>
                {avatar}
            </div>
            <div className={`max-w-xs lg:max-w-md rounded-xl px-4 py-3 shadow-sm ${bubbleStyles} ${bubbleOrder}`}>
                <div className="text-sm">
                   <MarkdownRenderer content={message.content} />
                </div>
            </div>
        </div>
    );
};

const ChatPanel: React.FC<{
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    onRegenerate: () => void;
    isGenerating: boolean;
    error: string | null;
    inputValue: string;
    onInputChange: (value: string) => void;
}> = ({ messages, onSendMessage, onRegenerate, isGenerating, error, inputValue, onInputChange }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isGenerating) {
            onSendMessage(inputValue.trim());
        }
    };

    return (
        <aside className="w-full h-full bg-white/60 dark:bg-black/30 backdrop-blur-xl border-l border-black/10 dark:border-white/10 flex flex-col">
            <div className="h-12 flex-shrink-0 border-b border-black/10 dark:border-white/10 flex items-center px-4">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-light-fg dark:text-dark-fg">AI Assistant</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-6">
                {messages.map((msg, index) => {
                    const showRegenerate = msg.role === 'ai' && !isGenerating && index === messages.length - 1 && msg.content;
                    
                    return (
                        <div key={msg.id} className="group flex items-end gap-2" style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <MessageBubble message={msg} />
                            {showRegenerate && (
                                <button
                                    onClick={onRegenerate}
                                    title="Regenerate response"
                                    className="mb-2 p-1.5 rounded-full text-light-fg-alt dark:text-dark-fg-alt hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    {ICONS.regenerate}
                                </button>
                            )}
                        </div>
                    );
                })}
                {isGenerating && (
                    <div className="flex justify-start items-start">
                         <div className="flex-shrink-0 p-1.5 rounded-full bg-light-bg-hover dark:bg-dark-bg text-light-fg-alt dark:text-dark-fg-alt">
                            {ICONS.aiAvatar}
                        </div>
                        <div className="max-w-xs lg:max-w-sm rounded-xl px-4 py-3 bg-light-bg-hover dark:bg-dark-bg ml-3 shadow-sm">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-light-primary dark:bg-dark-primary rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-light-primary dark:bg-dark-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-light-primary dark:bg-dark-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                           </div>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-black/10 dark:border-white/10 bg-transparent">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Describe your app or a change..."
                        rows={3}
                        className="w-full bg-white/80 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg p-3 pr-14 resize-none text-sm outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary transition-shadow"
                        disabled={isGenerating}
                    />
                    <button type="submit" className="absolute bottom-2.5 right-2.5 p-2 rounded-md bg-light-primary dark:bg-dark-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-primary-hover dark:hover:bg-dark-primary-hover transition-all" disabled={isGenerating || !inputValue.trim()}>
                        {ICONS.send}
                    </button>
                </form>
            </div>
        </aside>
    );
};

export default ChatPanel;