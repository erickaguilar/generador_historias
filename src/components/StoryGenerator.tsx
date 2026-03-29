




import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from './Alert';
import { AlertType, StoryPdfData, StoryArtifacts } from '../types';
import { DEFAULT_STORY_SECTION_TITLE } from '../constants'; 
import type { Chat } from '@google/genai';
import type { StoryRecord, GalleryImage } from '../db';
import { addStoryToDb, updateStoryInDb, dataURLToBlob, addImageToStoryGallery } from '../db';
import { generateStoryImage } from '../../services/geminiService';


import { InitialPromptForm } from './InitialPromptForm';
import { ConversationView } from './ConversationView';
import { FullStoryDisplay } from './FullStoryDisplay';
import { FollowUpForm } from './FollowUpForm';
import { Modal } from './Modal';
import { LoadingIcon } from './Icons';
import { BranchingChoicesDisplay } from './BranchingChoicesDisplay';
import { ParagraphImageModal } from './ParagraphImageModal';
import { EditParagraphModal } from './EditParagraphModal'; // Import the new modal
import { generatePdfDocument, generatePdfAsFile } from '../../utils/pdfUtils';
import { StoryAudioPlayerRef } from './StoryAudioPlayer'; 

import type { useInitialStorySetup } from '../hooks/useInitialStorySetup';
import { useStoryChat } from '../hooks/useStoryChat';
import { useStoryArtifacts } from '../hooks/useStoryArtifacts';
import type { useLoreBook } from '../hooks/useLoreBook';


interface StoryGeneratorProps {
  storyToLoad: StoryRecord | null;
  onClearStoryToLoad: () => void;
  settingsHook: ReturnType<typeof useInitialStorySetup>;
  loreBookApi: ReturnType<typeof useLoreBook>;
  setIsGeneratorBusy: (isBusy: boolean) => void;
}

export const StoryGenerator: React.FC<StoryGeneratorProps> = ({
  storyToLoad,
  onClearStoryToLoad,
  settingsHook,
  loreBookApi,
  setIsGeneratorBusy,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [currentPureStoryText, setPureStoryText] = useState<string>('');
  const [continuePrompt, setContinuePrompt] = useState<string>(''); 
  const [rewritePrompt, setRewritePrompt] = useState<string>(''); 

  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState<boolean>(false);
  
  const [isParagraphImageModalOpen, setIsParagraphImageModalOpen] = useState<boolean>(false);
  const [paragraphForImage, setParagraphForImage] = useState<string | null>(null);
  const [paragraphImageUrl, setParagraphImageUrl] = useState<string | null>(null);
  const [isGeneratingParagraphImage, setIsGeneratingParagraphImage] = useState<boolean>(false);
  const [paragraphImageError, setParagraphImageError] = useState<string | null>(null);

  const [isEditParagraphModalOpen, setIsEditParagraphModalOpen] = useState(false);
  const [paragraphToEdit, setParagraphToEdit] = useState<{ text: string, index: number } | null>(null);

  const [currentStoryId, setCurrentStoryId] = useState<number | null>(null);
  const [currentGalleryImages, setCurrentGalleryImages] = useState<GalleryImage[]>([]);
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);

  const {
    initialPrompt, setInitialPrompt,
    narrativeStylePrompt, storyPov, centralThemePrompt, macGuffinPrompt, ambiancePrompt,
    emotionalTone, storyLength, includeKeywordsPrompt, avoidKeywordsPrompt,
    characterProfilePrompt, includeCharacterInStory, dynamicPlaceholder, isLoadingDynamicPlaceholder,
  } = settingsHook;

  const storyAudioPlayerRef = useRef<StoryAudioPlayerRef | null>(null);
  
  const stopAudioPlayback = useCallback(() => {
    storyAudioPlayerRef.current?.stopPlayback();
  }, []);

  const chatHookApi = useStoryChat({
    narrativeStylePrompt, storyPov, centralThemePrompt, macGuffinPrompt, ambiancePrompt,
    emotionalTone, storyLength, includeKeywordsPrompt, avoidKeywordsPrompt,
    characterProfilePrompt, includeCharacterInStory,
    loreCharacters: loreBookApi.characters,
    loreWorldElements: loreBookApi.worldElements,
    setError,
    stopAudioPlayback: stopAudioPlayback,
    setContinuePromptState: setContinuePrompt, 
    setRewritePromptState: setRewritePrompt,
  });

  const storyArtifactsApi = useStoryArtifacts({ 
    pureStoryText: currentPureStoryText,
    setError, 
    DEFAULT_STORY_SECTION_TITLE 
  });
  
  const handleLocalLoadStory = useCallback(async (storyToLoad: StoryRecord) => {
    stopAudioPlayback();
    setError(null);
    setSuccessMessage(null);
  
    chatHookApi.primeChatWithLoadedStory(storyToLoad.content);
    setPureStoryText(storyToLoad.content); 
    setCurrentStoryId(storyToLoad.id ?? null);
    setCurrentGalleryImages(storyToLoad.galleryImages || []);
    storyArtifactsApi.setLoadedArtifacts(storyToLoad.title, storyToLoad.generatedImageBlob);
  
    await chatHookApi.handleGenerateChoicesForText(storyToLoad.content);

    setInitialPrompt(''); 
    setContinuePrompt(''); 
    setRewritePrompt('');
  }, [stopAudioPlayback, chatHookApi, storyArtifactsApi, setInitialPrompt]);

  useEffect(() => {
    if (storyToLoad) {
      handleLocalLoadStory(storyToLoad);
      onClearStoryToLoad(); // Consume the loaded story
    }
  }, [storyToLoad, onClearStoryToLoad, handleLocalLoadStory]);


  const isLoadingInitialStory = chatHookApi.isProcessingTextGeneration && chatHookApi.currentActionType === 'initial';

  // Effect to handle stream completion from chat hook
  useEffect(() => {
    if (chatHookApi.streamCompletionData) {
        const { text, chat, artifacts, actionType } = chatHookApi.streamCompletionData;
        
        const handleArtifacts = async (artifactsData: StoryArtifacts | null, storyText: string, activeChat: Chat | null) => {
            const shouldUpdateTitleAndImage = actionType === 'initial' 
                                            || actionType === 'rewrite'
                                            || actionType === 'edit_paragraph' 
                                            || !storyArtifactsApi.storyTitle 
                                            || storyArtifactsApi.storyTitle === DEFAULT_STORY_SECTION_TITLE;

            if (artifactsData) {
                if (shouldUpdateTitleAndImage) {
                    storyArtifactsApi.setStoryTitle(artifactsData.title);
                }
                
                chatHookApi.setBranchingChoices(artifactsData.choices);
                chatHookApi.setIsGeneratingChoices(false);
                
                if (shouldUpdateTitleAndImage) {
                    await storyArtifactsApi.generateImageFromPrompt(artifactsData.imagePrompt, artifactsData.title);
                }
            } else if (storyText.trim()) {
                chatHookApi.setIsGeneratingChoices(true);
                const choices = await storyArtifactsApi.fetchArtifacts(storyText, activeChat);
                chatHookApi.setBranchingChoices(choices);
                chatHookApi.setIsGeneratingChoices(false);
            }
        };

        handleArtifacts(artifacts, text, chat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHookApi.streamCompletionData]);

  useEffect(() => {
    const addInitialImageToGallery = async () => {
      if (storyArtifactsApi.generatedImageUrl && !currentStoryId && currentGalleryImages.length === 0 && storyArtifactsApi.lastVisualSummaryForImage) {
        try {
          const blob = await dataURLToBlob(storyArtifactsApi.generatedImageUrl);
          const newGalleryImage: GalleryImage = {
            imageBlob: blob,
            sourceText: storyArtifactsApi.lastVisualSummaryForImage,
          };
          setCurrentGalleryImages([newGalleryImage]);
        } catch (e) {
          console.error("Error adding initial image to gallery state:", e);
          setError("Error al procesar la imagen inicial para la galería.");
        }
      }
    };
    addInitialImageToGallery();
  }, [storyArtifactsApi.generatedImageUrl, currentStoryId, storyArtifactsApi.lastVisualSummaryForImage, currentGalleryImages.length, setError]);


  useEffect(() => {
    const chatPureStoryText = chatHookApi.getInternalPureStoryText();
    if (chatPureStoryText !== currentPureStoryText) {
      setPureStoryText(chatPureStoryText);
    }
  }, [chatHookApi, currentPureStoryText]);

  
  const { 
    storyTitle, isGeneratingTitle, generatedImageUrl, loadedImageBlob,
    isGeneratingImage, imageGenerationError, isModifyingImage, 
    generateModifiedImage, setLoadedArtifacts,
  } = storyArtifactsApi;
  
  const handleStartNewStoryWrapper = async (promptToUse: string) => {
    setCurrentStoryId(null);
    setCurrentGalleryImages([]);
    storyArtifactsApi.resetStoryArtifacts();
    await chatHookApi.handleStartNewStory(promptToUse);
  };

  const onStorySaved = useCallback((id: number) => {
    setCurrentStoryId(id);
    // Don't need to fetch stories here, HistoryPage does that.
  }, []);
  
  const handleCopyToClipboard = useCallback(() => {
    if (!currentPureStoryText) return; 
    navigator.clipboard.writeText(currentPureStoryText.replace(/\\n\\n/g, '\\n')) 
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy text:", err);
        setError("Error al copiar el texto al portapapeles.");
      });
  }, [currentPureStoryText]);

  const handleDownloadPdf = useCallback(async () => {
    if (!currentPureStoryText) { 
      setError("No hay contenido de historia para generar el PDF.");
      return;
    }
    stopAudioPlayback();

    setIsGeneratingPdf(true);
    setError(null); 
    setSuccessMessage(null);

    let imageForPdf: string | null = null;
    if (generatedImageUrl) { 
      if (generatedImageUrl.startsWith('blob:') && loadedImageBlob) {
          try {
              const reader = new FileReader();
              imageForPdf = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(loadedImageBlob);
              });
          } catch (e) {
              console.error("Error converting blob to dataURL for PDF:", e);
              setError("Error al preparar imagen para PDF.");
              setIsGeneratingPdf(false);
              return;
          }
      } else if (!generatedImageUrl.startsWith('blob:')) {
          imageForPdf = generatedImageUrl;
      }
    }

    try {
      const pdfData: StoryPdfData = {
        pureStoryText: currentPureStoryText, 
        storyTitle: storyTitle,
        generatedImageUrl: imageForPdf,
        defaultTitle: DEFAULT_STORY_SECTION_TITLE,
      };
      await generatePdfDocument(pdfData);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      if (err instanceof Error) {
        setError(`Error al generar PDF: ${err.message}`);
      } else {
        setError("Error desconocido al generar PDF.");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [currentPureStoryText, storyTitle, generatedImageUrl, loadedImageBlob, stopAudioPlayback]);

  const handleSharePdf = useCallback(async () => {
    if (!currentPureStoryText) {
      setError("No hay contenido de historia para compartir.");
      return;
    }
    if (typeof navigator.share === "undefined" || typeof navigator.canShare === "undefined") {
      setError("La API para compartir no está disponible en este navegador.");
      return;
    }
  
    setIsSharingPdf(true);
    setError(null);
    stopAudioPlayback();
  
    let imageForPdf: string | null = null;
    if (generatedImageUrl && generatedImageUrl.startsWith('blob:') && loadedImageBlob) {
      try {
        const reader = new FileReader();
        imageForPdf = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(loadedImageBlob);
        });
      } catch (e) {
        console.error("Error converting blob to dataURL for PDF:", e);
        setError("Error al preparar imagen para compartir.");
        setIsSharingPdf(false);
        return;
      }
    } else if (generatedImageUrl && !generatedImageUrl.startsWith('blob:')) {
      imageForPdf = generatedImageUrl;
    }
  
    try {
      const pdfData: StoryPdfData = {
        pureStoryText: currentPureStoryText,
        storyTitle: storyTitle,
        generatedImageUrl: imageForPdf,
        defaultTitle: DEFAULT_STORY_SECTION_TITLE,
      };
  
      const pdfFile = await generatePdfAsFile(pdfData);
  
      if (pdfFile && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: storyTitle,
          text: `Echa un vistazo a esta historia que creé: "${storyTitle}"`,
        });
        setSuccessMessage("¡Historia compartida con éxito!");
      } else if (pdfFile) {
        setError("Este navegador no soporta compartir archivos PDF.");
      } else {
        setError("No se pudo generar el archivo PDF para compartir.");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(`Error al compartir PDF: ${err.message}`);
        console.error("Failed to share PDF:", err);
      }
    } finally {
      setIsSharingPdf(false);
    }
  }, [currentPureStoryText, storyTitle, generatedImageUrl, loadedImageBlob, stopAudioPlayback, setSuccessMessage, setError]);

  const handleGenerateImagePreview = useCallback(async (modificationPrompt: string): Promise<string> => {
    return await generateModifiedImage(modificationPrompt);
  }, [generateModifiedImage]);

  const handleConfirmNewImage = useCallback(async (newImageUrl: string) => {
    if (!newImageUrl) return;
    try {
        const blob = await dataURLToBlob(newImageUrl);
        setLoadedArtifacts(storyTitle, blob);

        if (currentStoryId) {
            const sourceText = storyArtifactsApi.lastVisualSummaryForImage || `Imagen principal modificada a las ${new Date().toLocaleTimeString()}`;
            await addImageToStoryGallery(currentStoryId, { imageBlob: blob, sourceText });
            setCurrentGalleryImages(prev => [...prev, { imageBlob: blob, sourceText }]);
        }
        
        setSuccessMessage("Imagen de la historia actualizada con éxito.");
    } catch (e) {
        console.error("Error al procesar la nueva imagen:", e);
        setError("No se pudo actualizar la imagen de la historia.");
    }
  }, [storyTitle, setLoadedArtifacts, setSuccessMessage, setError, currentStoryId, storyArtifactsApi.lastVisualSummaryForImage]);

  const handleOpenParagraphImageModal = useCallback((paragraphText: string) => {
    if (isGeneratingParagraphImage) return;
    setParagraphForImage(paragraphText);
    setParagraphImageUrl(null); // Clear previous image
    setParagraphImageError(null); // Clear previous error
    setIsParagraphImageModalOpen(true);
  }, [isGeneratingParagraphImage]);
  
  const handleGenerateImageFromModal = useCallback(async (baseText: string, additionalPrompt: string) => {
      if (!storyTitle) {
        setParagraphImageError("Se necesita un título de historia para generar una imagen.");
        return;
      }
  
      setIsGeneratingParagraphImage(true);
      setParagraphImageUrl(null);
      setParagraphImageError(null);
      setError(null);
      setSuccessMessage(null);
  
      try {
          let imagePrompt = `Ilustración detallada estilo arte digital para la historia titulada "${storyTitle}". La ilustración debe representar fielmente la siguiente escena o concepto: "${baseText}".`;
          if (additionalPrompt.trim()) {
              imagePrompt += ` Instrucciones adicionales del usuario: "${additionalPrompt.trim()}".`;
          }
          imagePrompt += " Presta atención a los personajes, el entorno y la atmósfera descritos. Estilo artístico que complemente la narrativa.";
          
          const imageUrl = await generateStoryImage(imagePrompt);
          setParagraphImageUrl(imageUrl);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error desconocido al generar la imagen para el párrafo.";
          setParagraphImageError(errorMessage);
      } finally {
          setIsGeneratingParagraphImage(false);
      }
  }, [storyTitle]);

  const handlePlayFromParagraph = useCallback((paragraphIndex: number) => {
    if (!currentPureStoryText) return;

    const paragraphs = currentPureStoryText
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    if (paragraphIndex >= paragraphs.length) {
        console.error("Invalid paragraph index for audio playback");
        return;
    }

    const textToPlay = paragraphs.slice(paragraphIndex).join('\n\n');

    storyAudioPlayerRef.current?.playFragment(textToPlay);
  }, [currentPureStoryText]);

  const handleCloseParagraphImageModal = useCallback(() => {
      setIsParagraphImageModalOpen(false);
  }, []);

  const handleSetParagraphImageAsMain = useCallback(async () => {
    if (!paragraphImageUrl || !paragraphForImage) return;
    setSuccessMessage(null);
    setError(null);
    try {
        const blob = await dataURLToBlob(paragraphImageUrl);
        setLoadedArtifacts(storyTitle, blob);

        const newGalleryImage: GalleryImage = { imageBlob: blob, sourceText: paragraphForImage };
        if (!currentGalleryImages.some(img => img.sourceText === newGalleryImage.sourceText)) {
            setCurrentGalleryImages(prev => [...prev, newGalleryImage]);
        }
        
        setSuccessMessage("Imagen principal establecida. Guarda la historia para preservar todos los cambios.");
        handleCloseParagraphImageModal();
    } catch (e) {
        console.error("Error al procesar la nueva imagen principal:", e);
        setError("No se pudo establecer la imagen principal de la historia.");
    }
  }, [paragraphImageUrl, paragraphForImage, storyTitle, setLoadedArtifacts, handleCloseParagraphImageModal, currentGalleryImages]);
  
  const handleSaveParagraphImageToGallery = useCallback(async (imageUrl: string, sourceText: string) => {
    if (!currentStoryId) {
      setError("Debes guardar la historia principal antes de añadir imágenes a la galería.");
      return;
    }
    if (!imageUrl || !sourceText) return;
    
    setIsSavingToGallery(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const blob = await dataURLToBlob(imageUrl);
      const newGalleryImage: GalleryImage = { imageBlob: blob, sourceText: sourceText };
      await addImageToStoryGallery(currentStoryId, newGalleryImage);
      setCurrentGalleryImages(prev => [...prev, newGalleryImage]);
      setSuccessMessage("Imagen guardada en la galería de la historia.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "No se pudo guardar la imagen en la galería.";
      setError(message);
    } finally {
      setIsSavingToGallery(false);
    }
  }, [currentStoryId]);

  const handleOpenEditParagraphModal = useCallback((paragraphText: string, index: number) => {
    setParagraphToEdit({ text: paragraphText, index });
    setIsEditParagraphModalOpen(true);
  }, []);

  const handleConfirmEditParagraph = useCallback(async (instruction: string) => {
    if (!paragraphToEdit) return;
    setIsEditParagraphModalOpen(false);
    await chatHookApi.handleEditParagraph(paragraphToEdit.index, instruction);
    setParagraphToEdit(null);
  }, [paragraphToEdit, chatHookApi]);
  
  const isContentLoading = isLoadingInitialStory ||
                           (currentPureStoryText.trim() !== '' &&
                           (storyArtifactsApi.isFetchingMetadata || isGeneratingImage || isModifyingImage || chatHookApi.isProcessingTextGeneration));

  useEffect(() => {
    setIsGeneratorBusy(isContentLoading);
  }, [isContentLoading, setIsGeneratorBusy]);
  
  let loadingMessage = "Cargando...";
  let subLoadingMessage = "Esto puede tomar unos momentos.";

  if (chatHookApi.isProcessingTextGeneration) {
    if (chatHookApi.currentActionType === 'initial') {
      loadingMessage = "Generando tu historia inicial...";
      subLoadingMessage = "Estamos creando el primer borrador. Los artefactos se generarán después.";
    } else if (chatHookApi.currentActionType === 'continue' || chatHookApi.currentActionType === 'surprise' || chatHookApi.currentActionType === 'deepen') {
      loadingMessage = "Continuando la historia...";
      subLoadingMessage = "Actualizando el relato. El título, la imagen y las opciones se revisarán.";
    } else if (chatHookApi.currentActionType === 'rewrite') {
      loadingMessage = "Reescribiendo la historia...";
      subLoadingMessage = "La IA está procesando los cambios en todo el relato.";
    } else if (chatHookApi.currentActionType === 'edit_paragraph') {
      loadingMessage = "Editando párrafo...";
      subLoadingMessage = "Aplicando tus cambios al fragmento seleccionado.";
    }
  } else if (currentPureStoryText.trim() !== '') {
    if (storyArtifactsApi.isFetchingMetadata) {
        loadingMessage = "Generando artefactos de la historia...";
        subLoadingMessage = "Creando título, opciones y preparando la ilustración...";
    } else if (isGeneratingImage) {
        loadingMessage = "Creando imagen ilustrativa...";
    } else if (isModifyingImage) {
        loadingMessage = "Modificando imagen...";
        subLoadingMessage = "Aplicando cambios a la ilustración.";
    }
  }
  
  const handleBranchChoiceSelection = (choice: string) => {
    chatHookApi.handleContinueStory(choice); 
  };

  const handleModalContinueSubmit = () => {
    if (continuePrompt.trim()) {
      chatHookApi.handleContinueStory(continuePrompt);
    }
  };

  const handleRewriteSubmit = () => {
    if (rewritePrompt.trim()) {
      chatHookApi.handleRewriteStory(rewritePrompt);
    }
  };

  const isPersistentError = (errorMessage: string | null): boolean => {
    if (!errorMessage) return false;
    const lowerCaseMessage = errorMessage.toLowerCase();
    return (
        lowerCaseMessage.includes('api key') ||
        lowerCaseMessage.includes('api key de gemini no es válida') ||
        lowerCaseMessage.includes('conexión a internet') ||
        lowerCaseMessage.includes('desconectado') ||
        lowerCaseMessage.includes('error de red') ||
        lowerCaseMessage.includes('cuota') ||
        lowerCaseMessage.includes('resource_exhausted')
    );
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col">
      <InitialPromptForm
        initialPrompt={initialPrompt}
        setInitialPrompt={setInitialPrompt}
        handleStartNewStory={handleStartNewStoryWrapper}
        isLoading={isLoadingInitialStory} 
        dynamicPlaceholder={dynamicPlaceholder}
        isLoadingDynamicPlaceholder={isLoadingDynamicPlaceholder}
        activeChat={chatHookApi.activeChat}
      />

      {error && !isContentLoading && ( 
        <Alert 
          message={error} 
          type={AlertType.Error} 
          onClose={() => setError(null)}
          persistent={isPersistentError(error)}
        />
      )}
      {successMessage && !isContentLoading && (
        <Alert message={successMessage} type={AlertType.Success} onClose={() => setSuccessMessage(null)} />
      )}
      
      {isContentLoading && (
        <div className="my-6 p-4 sm:p-6 bg-white dark:bg-slate-700 rounded-lg shadow-inner flex flex-col items-center justify-center min-h-[200px]" role="status" aria-live="polite">
          <LoadingIcon className="w-12 h-12 text-sky-500 dark:text-sky-400" />
          <p className="text-xl text-slate-700 dark:text-slate-200 text-center">{loadingMessage}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">{subLoadingMessage}</p>
        </div>
      )}
      
      {!isContentLoading && currentPureStoryText.trim() !== '' && (
        <FullStoryDisplay
          pureStoryText={currentPureStoryText}
          storyTitle={storyTitle}
          isGeneratingTitle={isGeneratingTitle} 
          handleCopyToClipboard={handleCopyToClipboard}
          copied={copied}
          handleDownloadPdf={handleDownloadPdf}
          isGeneratingPdf={isGeneratingPdf}
          handleSharePdf={handleSharePdf}
          isSharingPdf={isSharingPdf}
          DEFAULT_STORY_SECTION_TITLE={DEFAULT_STORY_SECTION_TITLE}
          generatedImageUrl={generatedImageUrl}
          loadedImageBlob={loadedImageBlob}
          isGeneratingImage={isGeneratingImage} 
          imageGenerationError={imageGenerationError}
          isModifyingImage={isModifyingImage}          
          onGenerateImagePreview={handleGenerateImagePreview}
          onConfirmNewImage={handleConfirmNewImage}
          lastModelMessageId={chatHookApi.lastModelMessageId}
          lastModelMessageFeedback={chatHookApi.lastModelMessageFeedback}
          onFeedback={chatHookApi.handleFeedback}
          storyAudioPlayerRef={storyAudioPlayerRef}
          onOpenHistoryModal={() => { /* No-op, handled by App.tsx */ }}
          isLoadingStories={false} // Handled by HistoryPage
          isProcessingTextGeneration={chatHookApi.isProcessingTextGeneration}
          onOpenParagraphImageGenerator={handleOpenParagraphImageModal}
          onPlayFromParagraph={handlePlayFromParagraph}
          onEditParagraph={handleOpenEditParagraphModal}
          galleryImages={currentGalleryImages}
          onStorySaved={onStorySaved}
          lastVisualSummaryForImage={storyArtifactsApi.lastVisualSummaryForImage}
          currentStoryId={currentStoryId}
        />
      )}

      <BranchingChoicesDisplay
        choices={chatHookApi.branchingChoices}
        isLoadingChoices={chatHookApi.isGeneratingChoices}
        onChoiceSelected={handleBranchChoiceSelection}
        isContentLoading={isContentLoading}
        isProcessingTextGeneration={chatHookApi.isProcessingTextGeneration}
        currentActionType={chatHookApi.currentActionType}
        hasStoryText={currentPureStoryText.trim() !== ''}
        customContinuePrompt={continuePrompt}
        setCustomContinuePrompt={setContinuePrompt}
        handleCustomContinueSubmit={handleModalContinueSubmit}
        isLoadingCustomContinue={chatHookApi.isProcessingTextGeneration && chatHookApi.currentActionType === 'continue'}
        rewritePrompt={rewritePrompt}
        setRewritePrompt={setRewritePrompt}
        handleRewriteSubmit={handleRewriteSubmit}
        isLoadingRewrite={chatHookApi.isProcessingTextGeneration && chatHookApi.currentActionType === 'rewrite'}
        onSurpriseMe={chatHookApi.handleSurpriseMeRequest}
        onDeepenScene={chatHookApi.handleDeepenSceneRequest}
      />
      
      {(chatHookApi.activeChat && !isContentLoading) || (chatHookApi.activeChat && isContentLoading && !isLoadingInitialStory && currentPureStoryText.trim() !== '') ? (
        <FollowUpForm
          onOpenConversationModal={() => setIsConversationModalOpen(true)}
          isLoading={isContentLoading || chatHookApi.isProcessingTextGeneration} 
        />
      ) : null}


      <Modal 
        isOpen={isConversationModalOpen} 
        onClose={() => setIsConversationModalOpen(false)}
        title="Historial de la conversación"
      >
        <ConversationView
          conversation={chatHookApi.conversation} 
          isLoading={chatHookApi.isProcessingTextGeneration}
        />
      </Modal>

       <ParagraphImageModal
        isOpen={isParagraphImageModalOpen}
        onClose={handleCloseParagraphImageModal}
        isGenerating={isGeneratingParagraphImage}
        imageUrl={paragraphImageUrl}
        error={paragraphImageError}
        sourceText={paragraphForImage}
        storyTitle={storyTitle}
        onGenerateImage={handleGenerateImageFromModal}
        onSetAsMain={handleSetParagraphImageAsMain}
        onSaveToGallery={handleSaveParagraphImageToGallery}
        isSavingToGallery={isSavingToGallery}
        isSavableToGallery={!!currentStoryId}
      />

      <EditParagraphModal
        isOpen={isEditParagraphModalOpen}
        onClose={() => setIsEditParagraphModalOpen(false)}
        originalText={paragraphToEdit?.text || ''}
        onConfirm={handleConfirmEditParagraph}
        isSaving={chatHookApi.isProcessingTextGeneration && chatHookApi.currentActionType === 'edit_paragraph'}
      />
    </div>
  );
};
