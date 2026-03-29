import { useState, useEffect, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { 
  generateStoryMetadata, 
  generateStoryImage,
} from '../../services/geminiService';

interface UseStoryArtifactsProps {
  pureStoryText: string;
  setError: (message: string | null) => void;
  DEFAULT_STORY_SECTION_TITLE: string;
}

export interface UseStoryArtifactsReturn {
  storyTitle: string;
  setStoryTitle: (title: string) => void; // Exposed setter
  isGeneratingTitle: boolean;
  generatedImageUrl: string | null;
  isGeneratingImage: boolean;
  imageGenerationError: string | null;
  resetStoryArtifacts: () => void;
  isModifyingImage: boolean;
  generateModifiedImage: (modificationInstruction: string) => Promise<string>;
  setLoadedArtifacts: (title: string, imageBlob: Blob | null) => void;
  loadedImageBlob: Blob | null;
  fetchArtifacts: (text: string, chat: Chat | null) => Promise<string[]>; // For loaded stories
  isFetchingMetadata: boolean;
  generateImageFromPrompt: (imagePrompt: string, title: string) => Promise<void>; // New function
  lastVisualSummaryForImage: string | null;
}


export const useStoryArtifacts = ({
  pureStoryText,
  setError,
  DEFAULT_STORY_SECTION_TITLE,
}: UseStoryArtifactsProps): UseStoryArtifactsReturn => {
  const [storyTitle, setStoryTitle] = useState<string>(DEFAULT_STORY_SECTION_TITLE);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loadedImageBlob, setLoadedImageBlob] = useState<Blob | null>(null); // For blob from DB
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [lastVisualSummaryForImage, setLastVisualSummaryForImage] = useState<string | null>(null);
  const [isModifyingImage, setIsModifyingImage] = useState<boolean>(false);

  const revokePreviousObjectUrl = useCallback(() => {
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImageUrl);
    }
  }, [generatedImageUrl]);
  
  const generateImageFromPrompt = useCallback(async (imagePrompt: string, title: string) => {
    if (!imagePrompt.trim()) return;

    setIsGeneratingImage(true);
    setImageGenerationError(null);
    revokePreviousObjectUrl();
    setGeneratedImageUrl(null);
    setLoadedImageBlob(null);

    try {
        const imagePromptForModel = `Ilustración detallada estilo arte digital para un libro de historias. La ilustración debe representar fielmente la siguiente escena o concepto de una historia titulada "${title}": ${imagePrompt}. Presta atención a los personajes, el entorno y la atmósfera descritos. Estilo artístico que complemente la narrativa.`;
        const imageUrl = await generateStoryImage(imagePromptForModel);
        setGeneratedImageUrl(imageUrl);
        setLastVisualSummaryForImage(imagePrompt);
    } catch (err) {
        console.error("Failed to generate story image:", err);
        const errorMessage = err instanceof Error ? err.message : "Error desconocido al generar la imagen.";
        setImageGenerationError(errorMessage);
        setError(errorMessage);
    } finally {
        setIsGeneratingImage(false);
    }
  }, [revokePreviousObjectUrl, setError]);


  const setLoadedArtifacts = useCallback((title: string, imageBlob: Blob | null) => {
    setStoryTitle(title);
    
    revokePreviousObjectUrl();

    if (imageBlob) {
      setLoadedImageBlob(imageBlob);
      setGeneratedImageUrl(URL.createObjectURL(imageBlob));
    } else {
      setLoadedImageBlob(null);
      setGeneratedImageUrl(null);
    }
    
    setIsFetchingMetadata(false);
    setIsGeneratingImage(false);
    setImageGenerationError(null);
    setIsModifyingImage(false);
  }, [revokePreviousObjectUrl]);

  const fetchArtifacts = useCallback(async (text: string, chat: Chat | null): Promise<string[]> => {
    if (!text.trim() || !chat) {
        return [];
    }

    // Phase 1: Fetch metadata (title, image prompt, choices)
    setIsFetchingMetadata(true);
    setStoryTitle("Generando título...");
    setImageGenerationError(null);
    revokePreviousObjectUrl();
    setGeneratedImageUrl(null);
    setLoadedImageBlob(null);

    let metadata;
    try {
        metadata = await generateStoryMetadata(text);
        setStoryTitle(metadata.title);
        setLastVisualSummaryForImage(metadata.imagePrompt);
    } catch (err) {
        console.error("Failed to generate story metadata:", err);
        setError(err instanceof Error ? `Error al generar metadatos: ${err.message}` : "Error desconocido al generar metadatos.");
        setStoryTitle(DEFAULT_STORY_SECTION_TITLE);
        setIsFetchingMetadata(false);
        return []; // Return empty choices on error
    } finally {
        setIsFetchingMetadata(false);
    }

    // Phase 2: Generate image using the new prompt
    if (metadata?.imagePrompt) {
        await generateImageFromPrompt(metadata.imagePrompt, metadata.title);
    }

    return metadata.choices || [];
  }, [setError, revokePreviousObjectUrl, DEFAULT_STORY_SECTION_TITLE, generateImageFromPrompt]);

  const generateModifiedImage = useCallback(async (modificationInstruction: string): Promise<string> => {
    if (!lastVisualSummaryForImage && !generatedImageUrl) { 
        throw new Error("Se necesita una imagen y un contexto previos para modificarla. Si la imagen actual no tiene un resumen asociado (ej. cargada de historial sin resumen), intenta generar una nueva primero o describe la imagen como parte de tu modificación.");
    }
    if (!storyTitle || storyTitle === DEFAULT_STORY_SECTION_TITLE || storyTitle === "Generando título...") {
      throw new Error("Se necesita un título válido para la historia para modificar la imagen.");
    }
    if (!modificationInstruction.trim()) {
      throw new Error("Por favor, describe cómo quieres modificar la imagen.");
    }

    setIsModifyingImage(true);
    setImageGenerationError(null);

    try {
      const baseSummaryContext = lastVisualSummaryForImage 
        ? `La imagen original se basó en el siguiente resumen: "${lastVisualSummaryForImage}"`
        : `La imagen original es una ilustración para la historia.`;
      
      const storyContextForModification = pureStoryText.slice(-4000);
      
      const newImagePrompt = `**Tarea**: Modificar una ilustración existente para una historia titulada "${storyTitle}".
**Instrucción del Usuario**: "${modificationInstruction}".

**Contexto de la Historia (Resumen o Inicio)**:
---
${storyContextForModification}
---

**Instrucciones para la IA**:
1.  Lee la **Instrucción del Usuario** y el **Contexto de la Historia**.
2.  Genera una **NUEVA** imagen que aplique los cambios solicitados por el usuario.
3.  La nueva imagen debe ser **coherente** con los eventos y descripciones más recientes de la historia. El contexto proporcionado es la fuente de verdad.
4.  Mantén un estilo de arte digital detallado, adecuado para una ilustración de libro.
${baseSummaryContext}.`;
      
      const imageUrl = await generateStoryImage(newImagePrompt);
      return imageUrl;
    } catch (err) {
      console.error("Failed to modify story image:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al modificar la imagen.";
      setImageGenerationError(errorMessage);
      throw err;
    } finally {
      setIsModifyingImage(false);
    }
  }, [pureStoryText, lastVisualSummaryForImage, generatedImageUrl, storyTitle, DEFAULT_STORY_SECTION_TITLE]);


  const resetStoryArtifacts = useCallback(() => {
    setStoryTitle(DEFAULT_STORY_SECTION_TITLE);
    revokePreviousObjectUrl();
    setGeneratedImageUrl(null);
    setLoadedImageBlob(null);
    setIsFetchingMetadata(false);
    setIsGeneratingImage(false); 
    setImageGenerationError(null);
    setLastVisualSummaryForImage(null);
    setIsModifyingImage(false);
  }, [DEFAULT_STORY_SECTION_TITLE, revokePreviousObjectUrl]);

  useEffect(() => {
    return () => {
      revokePreviousObjectUrl();
    };
  }, [revokePreviousObjectUrl]);


  return {
    storyTitle,
    setStoryTitle, // Expose setter
    isGeneratingTitle: isFetchingMetadata,
    isFetchingMetadata,
    generatedImageUrl,
    loadedImageBlob,
    isGeneratingImage,
    imageGenerationError,
    resetStoryArtifacts,
    isModifyingImage,
    generateModifiedImage,
    setLoadedArtifacts,
    fetchArtifacts,
    generateImageFromPrompt,
    lastVisualSummaryForImage,
  };
};