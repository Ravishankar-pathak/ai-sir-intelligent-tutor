export enum AIProvider {
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  GROK = 'GROK'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isVoice?: boolean;
}

export interface AppConfig {
  provider: AIProvider;
  geminiKey: string;
  openaiKey: string;
  grokKey: string;
  userName: string;
}

export interface LessonContext {
  imageData: string | null; // Base64
  topic: string;
}

// New types for Lecture Mode
export interface LectureChunk {
  id: string;
  text: string;
  isPlayed: boolean;
}

export type TutorState = 'idle' | 'preparing' | 'teaching' | 'listening' | 'answering_doubt' | 'paused';