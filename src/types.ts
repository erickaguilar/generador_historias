
export enum AlertType {
  Error = 'error',
  Success = 'success',
  Info = 'info',
}

export interface StoryPdfData {
  pureStoryText: string;
  storyTitle: string;
  generatedImageUrl: string | null;
  defaultTitle: string; 
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  feedback?: 'up' | 'down' | null; // Nuevo campo para retroalimentación
}

export type ActionType = 'initial' | 'continue' | 'rewrite' | 'surprise' | 'deepen' | 'edit_paragraph' | null;

// Used for passing settings data between hooks and components
export interface NarrativeSettingsData {
  narrativeStylePrompt: string;
  storyPov: import('./constants').StoryPOV;
  characterProfilePrompt: string;
  includeCharacterInStory: boolean;
  centralThemePrompt: string;
  macGuffinPrompt: string;
  ambiancePrompt: string;
  emotionalTone: import('./constants').EmotionalToneKey;
  storyLength: import('./constants').StoryLengthKey;
  includeKeywordsPrompt: string;
  avoidKeywordsPrompt: string;
  theme?: 'light' | 'dark';
}

// Specific structure for IndexedDB entry, including DB-specific fields
export interface NarrativeSettingsDBEntry extends NarrativeSettingsData {
  id: number; // Fixed ID for the settings entry
  updatedAt: Date;
}

// --- UPDATED: Lore Book Types ---

export type WorldElementType = 'Lugar' | 'Objeto' | 'Concepto' | 'Facción' | 'Criatura' | 'Otro';
export const WORLD_ELEMENT_TYPES: WorldElementType[] = ['Lugar', 'Objeto', 'Concepto', 'Facción', 'Criatura', 'Otro'];

export interface CharacterEntry {
  id: string; // Using crypto.randomUUID()
  name: string;
  role: string;
  appearance: string;
  personality: string;
  backstory: string;
}

export interface WorldElementEntry {
  id: string; // Using crypto.randomUUID()
  name: string;
  type: WorldElementType;
  description: string;
}

export interface LoreBookData {
  characters: CharacterEntry[];
  worldElements: WorldElementEntry[];
}

// Specific structure for IndexedDB entry for LoreBook
export interface LoreBookDBEntry extends LoreBookData {
  id: number; // Fixed ID for the lore book entry
  updatedAt: Date;
}

// --- NEW: Story Artifacts Type ---
export interface StoryArtifacts {
    title: string;
    imagePrompt: string;
    choices: string[];
}
