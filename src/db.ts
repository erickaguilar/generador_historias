

import Dexie, { type Table } from 'dexie';
import type { NarrativeSettingsDBEntry, LoreBookDBEntry, LoreBookData } from './types'; // Import the new type

export interface GalleryImage {
  imageBlob: Blob;
  sourceText: string;
}

export interface StoryRecord {
  id?: number; // Auto-incremented primary key
  title: string;
  content: string; // Corresponds to pureStoryText
  generatedImageBlob: Blob | null; // The main story image
  galleryImages?: GalleryImage[]; // New field for the gallery
  createdAt: Date;
}

export const NARRATIVE_SETTINGS_ID = 1; // Fixed ID for the single settings entry
export const LORE_BOOK_ID = 1; // Fixed ID for the single lorebook entry

// Define the database class, which is the recommended way to use Dexie with TypeScript.
class InteractiveStoryDB extends Dexie {
  stories!: Table<StoryRecord>;
  narrativeSettings!: Table<NarrativeSettingsDBEntry>;
  loreBook!: Table<LoreBookDBEntry>; // New table

  constructor() {
    super('InteractiveStoryDB');
    // Version history:
    // 1: initial, stories table.
    // 2: added narrativeSettings table.
    // 3: added loreBook table.
    // 4: added galleryImages to stories table.
    (this as Dexie).version(4).stores({
      stories: '++id, title, createdAt',
      narrativeSettings: '&id',
      loreBook: '&id',
    });
  }
}

// Create and export a singleton instance of the database.
export const db = new InteractiveStoryDB();


// Helper to convert data URL to Blob
export async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const response = await fetch(dataURL);
  if (!response.ok) {
    throw new Error(`Failed to fetch data URL: ${response.statusText}`);
  }
  return await response.blob();
}

export const addStoryToDb = async (story: {
  title: string;
  content: string;
  generatedImageUrl: string | null; // Expects base64 data URL or null
  imageSourceText: string | null;
}): Promise<number | undefined> => {
  try {
    let imageBlob: Blob | null = null;
    const gallery: GalleryImage[] = [];

    if (story.generatedImageUrl) {
      try {
        imageBlob = await dataURLToBlob(story.generatedImageUrl);
        gallery.push({
            imageBlob: imageBlob,
            sourceText: story.imageSourceText || 'Imagen principal de la historia',
        });
      } catch (error) {
        console.error("Failed to convert image data URL to Blob:", error);
      }
    }

    const newStoryRecord: StoryRecord = {
      title: story.title,
      content: story.content,
      generatedImageBlob: imageBlob,
      galleryImages: gallery,
      createdAt: new Date(),
    };
    const id = await db.stories.add(newStoryRecord);
    console.log(`Story added with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Failed to add story to IndexedDB:", error);
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error("No hay suficiente espacio para guardar la historia. Por favor, libera algo de espacio en el almacenamiento de tu navegador.");
      }
      throw new Error(`Error al guardar en IndexedDB: ${error.message}`);
    }
    throw new Error("Un error desconocido ocurrió al guardar la historia.");
  }
};

export const addImageToStoryGallery = async (storyId: number, newImage: GalleryImage): Promise<void> => {
    try {
      const story = await db.stories.get(storyId);
      if (!story) {
        throw new Error(`No se encontró ninguna historia con ID: ${storyId} para añadir a la galería.`);
      }

      const currentGallery = story.galleryImages || [];
      const updatedGallery = [...currentGallery, newImage];

      const count = await db.stories.update(storyId, { galleryImages: updatedGallery });
      if (count === 0) {
        throw new Error(`No se pudo actualizar la galería para la historia con ID: ${storyId}.`);
      }
      console.log(`Imagen añadida a la galería de la historia con ID ${storyId}.`);
    } catch (error) {
      console.error(`Fallo al añadir imagen a la galería para la historia con ID ${storyId}:`, error);
      if (error instanceof Error && error.message.includes('No se encontró ninguna historia')) {
          throw error;
      }
      throw new Error("Error al actualizar la galería de la historia en la base de datos.");
    }
};

export const getAllStories = async (): Promise<StoryRecord[]> => {
  try {
    return await db.stories.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    console.error("Failed to retrieve stories from IndexedDB:", error);
    throw new Error("Error al recuperar las historias guardadas.");
  }
};

export const getStoryById = async (id: number): Promise<StoryRecord | undefined> => {
  try {
    return await db.stories.get(id);
  } catch (error) {
    console.error(`Failed to retrieve story with id ${id}:`, error);
    throw new Error("Error al recuperar la historia específica.");
  }
};

export const deleteStory = async (id: number): Promise<void> => {
  try {
    await db.stories.delete(id);
    console.log(`Story with ID ${id} deleted.`);
  } catch (error) {
    console.error(`Failed to delete story with id ${id}:`, error);
    throw new Error("Error al eliminar la historia.");
  }
};

export const updateStoryInDb = async (
  storyId: number,
  updatedData: { title: string; content: string; generatedImageBlob?: Blob | null; galleryImages?: GalleryImage[]; }
): Promise<void> => {
  try {
    const updatePayload: { [key: string]: any } = {
      title: updatedData.title,
      content: updatedData.content,
    };

    if ('generatedImageBlob' in updatedData) {
      updatePayload.generatedImageBlob = updatedData.generatedImageBlob;
    }
    if ('galleryImages' in updatedData) {
      updatePayload.galleryImages = updatedData.galleryImages;
    }
    
    const count = await db.stories.update(storyId, updatePayload);
    if (count === 0) {
      throw new Error(`No se encontró ninguna historia con ID: ${storyId} para actualizar.`);
    }
    console.log(`Historia con ID ${storyId} actualizada.`);
  } catch (error) {
    console.error(`Fallo al actualizar historia con ID ${storyId}:`, error);
    if (error instanceof Error && error.message.includes('No se encontró ninguna historia')) {
        throw error;
    }
    throw new Error("Error al actualizar la historia en la base de datos.");
  }
};


// --- Narrative Settings DB Functions ---

export const saveNarrativeSettingsEntry = async (settings: Omit<NarrativeSettingsDBEntry, 'id' | 'updatedAt'>): Promise<number | undefined> => {
  try {
    const entryToSave: NarrativeSettingsDBEntry = {
      ...settings,
      id: NARRATIVE_SETTINGS_ID,
      updatedAt: new Date(),
    };
    const id = await db.narrativeSettings.put(entryToSave);
    console.log(`Narrative settings saved/updated with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Failed to save narrative settings to IndexedDB:", error);
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error("No hay suficiente espacio para guardar la configuración de narrativa.");
      }
      throw new Error(`Error al guardar configuración de narrativa en IndexedDB: ${error.message}`);
    }
    throw new Error("Un error desconocido ocurrió al guardar la configuración de narrativa.");
  }
};

export const loadNarrativeSettingsEntry = async (): Promise<NarrativeSettingsDBEntry | null> => {
  try {
    const settings = await db.narrativeSettings.get(NARRATIVE_SETTINGS_ID);
    return settings || null;
  } catch (error) {
    console.error("Failed to retrieve narrative settings from IndexedDB:", error);
    // It's often okay to not throw here and let the app use defaults if loading fails
    return null;
  }
};


// --- Lore Book DB Functions ---

export const saveLoreBook = async (loreBookData: LoreBookData): Promise<number | undefined> => {
  try {
    const entryToSave: LoreBookDBEntry = {
      ...loreBookData,
      id: LORE_BOOK_ID,
      updatedAt: new Date(),
    };
    const id = await db.loreBook.put(entryToSave);
    console.log(`Lore book saved/updated with ID: ${id}`);
    return id;
  } catch (error) {
    console.error("Failed to save lore book to IndexedDB:", error);
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error("No hay suficiente espacio para guardar el libro de lore.");
      }
      throw new Error(`Error al guardar el libro de lore en IndexedDB: ${error.message}`);
    }
    throw new Error("Un error desconocido ocurrió al guardar el libro de lore.");
  }
};

export const loadLoreBook = async (): Promise<LoreBookDBEntry | null> => {
  try {
    const loreBook = await db.loreBook.get(LORE_BOOK_ID);
    return loreBook || null;
  } catch (error) {
    console.error("Failed to retrieve lore book from IndexedDB:", error);
    // It's often okay to not throw here and let the app use defaults if loading fails
    return null;
  }
};
