export enum ModeType {
  COMMENT_BOARD = 'comment_board', // Individual + Discrete
  FOLLOW_ME = 'follow_me',         // Individual + Coherent
  CROWD_CHAT = 'crowd_chat',       // Collective + Discrete
  COLLECTIVE_STORY = 'collective_story' // Collective + Coherent
}

export interface Artifact {
  id: string;
  name: string;
  imageUrl: string;
}

export interface ContentItem {
  id: string;
  artifactId: string;
  mode: ModeType;
  speaker: string;
  content: string;
  timestamp?: string;
  avatarUrl?: string; // For Crowd Chat or Follow Me
  isUser?: boolean; // To distinguish user input in the view
  contributingUsers?: string[]; // New: List of users who contributed to this content
  topic?: string; // New: Topic title for Forum mode
  transitionText?: string; // New: Transitional phrase to be spoken BEFORE this content
}

// Narrative / Chat Types
export type MessageType = 'intro_bubble' | 'guide_text' | 'user_text' | 'divider';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content?: string;
  artifact?: Artifact;
  speaker?: string;
  contributingUsers?: string[]; // New: Carry over user list to chat message
}

export interface NarrativeState {
  history: ChatMessage[];
  currentStage: number;
  isTourComplete: boolean;
}

export interface LogEntry {
  timestamp: number;
  eventType: 'mode_select' | 'page_view' | 'submission';
  details: {
    mode?: ModeType;
    durationMs?: number; // For page views
    inputType?: 'text' | 'audio';
    contentLength?: number; // Privacy-preserving logging
    blobUrl?: string;
    artifactId?: string;
  };
}