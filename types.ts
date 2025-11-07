import { User } from '@supabase/supabase-js';

export interface GeneratedFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface ChatMessage {
  id:string;
  role: 'user' | 'ai';
  content: string;
  modifiedFiles?: string[];
  thinking?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  model: AIModel;
  status?: 'active' | 'archived';
}

export type Theme = 'light' | 'dark';

export enum AIModel {
  GEMINI = 'gemini-2.5-pro',
  FLASH = 'gemini-2.5-flash',
  GPT4 = 'gpt-4-omni',
  CLAUDE3 = 'claude-3-opus',
}

export enum ProjectTemplate {
  REACT_SPA = 'React SPA',
  VITE_REACT = 'Vite + React',
  NEXTJS_STARTER = 'Next.js Starter',
}

export enum ProjectLanguage {
  REACT = 'React',
  HTML_CSS_JS = 'HTML, CSS, JS',
  REACT_NATIVE_EXPO = 'React Native (Expo)',
  XAMARIN = 'Xamarin',
  CSHARP = 'C# Desktop',
}

export interface Project {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
}

export interface Collaborator {
    project_id: string;
    user_id: string;
    profile: {
        id: string;
        full_name: string | null;
    };
}

export interface ProjectInvite {
    id: string;
    code: string;
    is_active: boolean;
}


export type AppMode = 'platform' | 'agent' | 'design';

export type CanvasElementType = 
  | 'button' | 'input' | 'card' | 'image' | 'text' 
  | 'frame' | 'slider' 
  | 'rectangle' | 'circle' | 'triangle'
  | 'textarea' | 'checkbox' | 'radio' | 'toggle' | 'dropdown'
  | 'avatar' | 'progressbar' | 'divider';

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    text?: string;
    placeholder?: string;
    label?: string;
    checked?: boolean;
    progress?: number;
  };
  style: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    opacity?: number;
    fontFamily?: string;
  };
}