



import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LoadingIcon } from './Icons';
import { Alert } from './Alert';
import { AlertType } from '../types';
import { ImageActionsModal } from './ImageActionsModal';
import { StoryGalleryModal } from './StoryGalleryModal';
import { StoryAudioPlayer, StoryAudioPlayerRef } from './StoryAudioPlayer'; 
import { addStoryToDb, GalleryImage, updateStoryInDb, dataURLToBlob } from '../db';
import { StoryVisualizationModal } from './StoryVisualizationModal';
import { 
    PlayAudioIcon, 
    ThumbUpIcon, 
    ThumbDownIcon, 
    SaveFloppyIcon, 
    CopyIcon, 
    CheckIcon, 
    PdfIcon, 
    ShareIcon,
    EllipsisVerticalIcon, 
    PhotoIcon, 
    ChartPieIcon,
    CollectionIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EditIcon
} from './Icons';

interface FullStoryDisplayProps {
  pureStoryText: string;
  storyTitle: string;
  isGeneratingTitle: boolean;
  handleCopyToClipboard: () => void;
  copied: boolean;
  handleDownloadPdf: () => void;
  isGeneratingPdf: boolean;
  handleSharePdf: () => void;
  isSharingPdf: boolean;
  DEFAULT_STORY_SECTION_TITLE: string;
  generatedImageUrl: string | null;
  loadedImageBlob: Blob | null;
  isGeneratingImage: boolean;
  imageGenerationError: string | null;
  isModifyingImage: boolean;
  onGenerateImagePreview: (modPrompt: string) => Promise<string>;
  onConfirmNewImage: (newImageUrl: string) => Promise<void>;
  lastModelMessageId: string | null; 
  lastModelMessageFeedback: 'up' | 'down' | null; 
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void; 
  storyAudioPlayerRef: React.RefObject<StoryAudioPlayerRef>;
  onOpenHistoryModal: () => void; 
  isLoadingStories: boolean;
  isProcessingTextGeneration: boolean;
  onOpenParagraphImageGenerator: (paragraphText: string) => void;
  onPlayFromParagraph: (paragraphIndex: number) => void;
  onEditParagraph: (paragraphText: string, paragraphIndex: number) => void;
  galleryImages?: GalleryImage[];
  onStorySaved: (id: number) => void;
  lastVisualSummaryForImage: string | null;
  currentStoryId: number | null;
}

export const FullStoryDisplay: React.FC<FullStoryDisplayProps> = ({
  pureStoryText,
  storyTitle,
  isGeneratingTitle,
  handleCopyToClipboard,
  copied,
  handleDownloadPdf,
  isGeneratingPdf,
  handleSharePdf,
  isSharingPdf,
  DEFAULT_STORY_SECTION_TITLE,
  generatedImageUrl,
  loadedImageBlob,
  isGeneratingImage,
  imageGenerationError,
  isModifyingImage,
  onGenerateImagePreview,
  onConfirmNewImage,
  lastModelMessageId,
  lastModelMessageFeedback,
  onFeedback,
  storyAudioPlayerRef,
  onOpenHistoryModal, 
  isLoadingStories,
  isProcessingTextGeneration,
  onOpenParagraphImageGenerator,
  onPlayFromParagraph,
  onEditParagraph,
  galleryImages,
  onStorySaved,
  lastVisualSummaryForImage,
  currentStoryId,
}) => {
  const isTitleReadyForInteraction = storyTitle && storyTitle !== DEFAULT_STORY_SECTION_TITLE && storyTitle !== "Generando título...";
  
  const [isAudioActuallyPlaying, setIsAudioActuallyPlaying] = useState<boolean>(false);
  const [isSavingStory, setIsSavingStory] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<{message: string, type: AlertType} | null>(null);
  
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isVisualizationModalOpen, setIsVisualizationModalOpen] = useState(false);
  
  const criticalOperationInProgress = isGeneratingPdf || isSharingPdf || isGeneratingTitle || isGeneratingImage || isAudioActuallyPlaying || isModifyingImage || isSavingStory || isLoadingStories || isProcessingTextGeneration;
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  
  const audioPlayerDisabled = criticalOperationInProgress || copied || !isTitleReadyForInteraction || !pureStoryText.trim();
  let audioPlayerDisabledReason = "Escuchar historia";
  if (!isTitleReadyForInteraction) audioPlayerDisabledReason = "El título debe generarse primero.";
  else if (!pureStoryText.trim()) audioPlayerDisabledReason = "No hay historia para reproducir.";
  else if (criticalOperationInProgress && !isAudioActuallyPlaying) audioPlayerDisabledReason = "Otra operación en curso.";
  else if (copied) audioPlayerDisabledReason = "Copiado recientemente.";

  const [isImageErrorVisible, setIsImageErrorVisible] = useState<boolean>(true);
  const [isImageActionsModalOpen, setIsImageActionsModalOpen] = useState<boolean>(false);
  
  // Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const displayGallery = useMemo(() => galleryImages || [], [galleryImages]);
  const imageUrls = useMemo(() => {
    return displayGallery.map(img => (img.imageBlob ? URL.createObjectURL(img.imageBlob) : ''));
  }, [displayGallery]);

  const MIN_SWIPE_DISTANCE = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (imageUrls.length <= 1) return;
    setTouchEndX(null); // Clear end on new start
    setTouchStartX(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (touchStartX === null || touchEndX === null) {
        setTouchStartX(null);
        setTouchEndX(null);
        return;
    };

    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) > MIN_SWIPE_DISTANCE) {
        if (distance > 0) { // Swipe Left
            handleNextImage();
        } else { // Swipe Right
            handlePrevImage();
        }
    }
    
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    if (displayGallery.length > 0) {
      setCurrentImageIndex(displayGallery.length - 1);
    }
  }, [displayGallery]);

  useEffect(() => {
    return () => {
      imageUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imageUrls]);

  const handlePrevImage = () => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : prev));
  const handleNextImage = () => setCurrentImageIndex(prev => (prev < displayGallery.length - 1 ? prev + 1 : prev));

  const handleDownloadCurrentImage = () => {
    const currentUrl = imageUrls[currentImageIndex];
    if (!currentUrl) return;
    const link = document.createElement('a');
    link.href = currentUrl;
    const safeTitle = storyTitle.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 50) || 'historia_imagen';
    link.download = `${safeTitle}_ilustracion_${currentImageIndex + 1}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsImageActionsModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuAction = (action: () => void) => {
    action();
    setIsActionsMenuOpen(false);
  };

  useEffect(() => {
    if (imageGenerationError) {
      setIsImageErrorVisible(true);
    } else {
      setIsImageErrorVisible(false);
    }
  }, [imageGenerationError]);

  const handleCloseImageError = () => {
    setIsImageErrorVisible(false);
  };

  const handleFeedbackClick = (feedbackType: 'up' | 'down') => {
    if (lastModelMessageId && !criticalOperationInProgress && !copied) {
      onFeedback(lastModelMessageId, feedbackType);
    }
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read blob as Data URL.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  };

  const handleSaveStory = async () => {
    if (!pureStoryText || !isTitleReadyForInteraction) {
      setSaveFeedback({ message: "No hay historia o título válido para guardar.", type: AlertType.Error });
      return;
    }
    setIsSavingStory(true);
    setSaveFeedback(null);

    let imageForDbSave: string | null = null;
    if (generatedImageUrl) {
        if (generatedImageUrl.startsWith('blob:') && loadedImageBlob) {
            try {
                imageForDbSave = await blobToDataURL(loadedImageBlob);
            } catch (e) {
                console.error("Error converting blob to dataURL for saving:", e);
                setSaveFeedback({ message: "Error al preparar imagen para guardar.", type: AlertType.Error });
                setIsSavingStory(false);
                return;
            }
        } else if (!generatedImageUrl.startsWith('blob:')) {
            imageForDbSave = generatedImageUrl;
        }
    }

    try {
      if (currentStoryId) { // Story exists, so we update it
        const imageBlobForUpdate = imageForDbSave ? await dataURLToBlob(imageForDbSave) : null;
        
        await updateStoryInDb(currentStoryId, {
          title: storyTitle,
          content: pureStoryText,
          generatedImageBlob: imageBlobForUpdate,
          galleryImages: displayGallery,
        });
        setSaveFeedback({ message: "¡Historia actualizada con éxito!", type: AlertType.Success });
        onStorySaved(currentStoryId); // This can trigger a refresh of the history list
      } else { // It's a new story
        const newStoryId = await addStoryToDb({
          title: storyTitle,
          content: pureStoryText,
          generatedImageUrl: imageForDbSave,
          imageSourceText: lastVisualSummaryForImage,
        });
        if (newStoryId) {
          onStorySaved(newStoryId); // This will set the currentStoryId in the parent
          setSaveFeedback({ message: "¡Historia guardada localmente con éxito!", type: AlertType.Success });
        } else {
          throw new Error("No se pudo obtener un ID para la historia guardada.");
        }
      }
    } catch (error) {
      console.error("Error saving/updating story to DB:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al guardar la historia.";
      setSaveFeedback({ message: `Error al guardar: ${errorMessage}`, type: AlertType.Error });
    } finally {
      setIsSavingStory(false);
    }
  };

  const storyTextForDisplay = pureStoryText;

  let swipeOffset = 0;
  if (isSwiping && touchStartX && touchEndX) {
    swipeOffset = touchEndX - touchStartX;
  }
  const imageStyle: React.CSSProperties = {
    transform: `translateX(${swipeOffset}px)`,
    transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
    cursor: imageUrls.length > 1 ? 'grab' : 'pointer',
  };
  if (isSwiping) {
      imageStyle.cursor = 'grabbing';
  }

  return (
    <div className="my-6 p-4 sm:p-6 bg-white dark:bg-slate-700 rounded-lg shadow-inner">
      {saveFeedback && (
        <Alert message={saveFeedback.message} type={saveFeedback.type} onClose={() => setSaveFeedback(null)} />
      )}
      
      {/* --- Main Action Bar --- */}
      <div className="flex justify-end items-center gap-2 mb-4">
        {/* Primary Actions (Always Visible) */}
        <StoryAudioPlayer
            ref={storyAudioPlayerRef}
            pureStoryText={pureStoryText}
            storyTitle={storyTitle}
            onPlaybackStateChange={setIsAudioActuallyPlaying}
            disabled={audioPlayerDisabled}
            disabledReason={audioPlayerDisabledReason}
        />
        
        {/* Save/Update Button */}
        <button
            type="button"
            onClick={handleSaveStory}
            disabled={!isTitleReadyForInteraction || !pureStoryText.trim() || criticalOperationInProgress}
            className="p-2 text-slate-600 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-300 disabled:text-slate-400 dark:disabled:text-slate-500 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 flex flex-col items-center text-xs w-16 h-16 justify-center"
            title={!isTitleReadyForInteraction ? "El título debe generarse primero." : (currentStoryId ? "Actualizar historia en el navegador" : "Guardar historia en el navegador")}
          >
            {isSavingStory ? <LoadingIcon className="w-5 h-5" /> : <SaveFloppyIcon className="h-5 w-5" />}
            <span className="mt-1">{currentStoryId ? 'Actualizar' : 'Guardar'}</span>
        </button>

        {/* Secondary Actions (Dropdown Menu) */}
        <div className="relative" ref={menuRef}>
          <button
            id="menu-button"
            type="button"
            onClick={() => setIsActionsMenuOpen(prev => !prev)}
            disabled={criticalOperationInProgress}
            className="p-2 text-slate-600 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-300 disabled:text-slate-400 dark:disabled:text-slate-500 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 flex flex-col items-center text-xs w-16 h-16 justify-center"
            aria-label="Más acciones"
            title="Más acciones"
            aria-haspopup="true"
            aria-expanded={isActionsMenuOpen}
          >
            <EllipsisVerticalIcon />
            <span className="mt-1">Acciones</span>
          </button>

          {isActionsMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
            >
              <div className="py-1" role="none">
                {/* Copy */}
                <button
                  onClick={() => handleMenuAction(handleCopyToClipboard)}
                  disabled={copied || !isTitleReadyForInteraction || criticalOperationInProgress}
                  className="w-full text-left flex items-center px-3 py-3 text-sm rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                  role="menuitem"
                  title={!isTitleReadyForInteraction ? "El título de la historia debe generarse primero." : "Copiar historia al portapapeles"}
                >
                  {copied ? <CheckIcon className="w-4 h-4 mr-3" /> : <CopyIcon className="w-4 h-4 mr-3" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar historia'}</span>
                </button>
                {/* Share */}
                {canShare && (
                  <button
                    onClick={() => handleMenuAction(handleSharePdf)}
                    disabled={!isTitleReadyForInteraction || isSharingPdf || isGeneratingPdf}
                    className="w-full text-left flex items-center px-3 py-3 text-sm rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    role="menuitem"
                    title={!isTitleReadyForInteraction ? "El título debe generarse primero." : "Compartir historia como PDF"}
                  >
                    {isSharingPdf ? <LoadingIcon className="w-4 h-4 mr-3" /> : <ShareIcon className="w-4 h-4 mr-3" />}
                    <span>Compartir PDF</span>
                  </button>
                )}
                {/* PDF */}
                <button
                  onClick={() => handleMenuAction(handleDownloadPdf)}
                  disabled={!isTitleReadyForInteraction || isSharingPdf || isGeneratingPdf}
                  className="w-full text-left flex items-center px-3 py-3 text-sm rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                  role="menuitem"
                  title={!isTitleReadyForInteraction ? "El título debe generarse primero." : "Descargar historia como PDF"}
                >
                  {isGeneratingPdf ? <LoadingIcon className="w-4 h-4 mr-3" /> : <PdfIcon className="w-4 h-4 mr-3" />}
                  <span>Descargar PDF</span>
                </button>
                
                {/* Visualization */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" role="separator"></div>
                <button
                    onClick={() => handleMenuAction(() => setIsVisualizationModalOpen(true))}
                    disabled={!isTitleReadyForInteraction || !pureStoryText.trim() || criticalOperationInProgress}
                    className="w-full text-left flex items-center px-3 py-3 text-sm rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    role="menuitem"
                    title={!isTitleReadyForInteraction || !pureStoryText.trim() ? "La historia debe tener contenido para ser visualizada." : "Visualizar palabras clave de la historia"}
                >
                    <ChartPieIcon className="w-4 h-4 mr-3" />
                    <span>Visualizar Historia</span>
                </button>

                {/* Feedback Buttons MOVED here */}
                {lastModelMessageId && (
                  <>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" role="separator"></div>
                    <button
                      onClick={() => handleMenuAction(() => handleFeedbackClick('up'))}
                      disabled={criticalOperationInProgress || copied || !lastModelMessageId}
                      className={`w-full text-left flex items-center px-3 py-3 text-sm rounded-md transition-colors duration-150 ${
                        lastModelMessageFeedback === 'up' 
                          ? 'bg-sky-500 text-white hover:bg-sky-600' 
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
                      }`}
                      role="menuitem"
                      aria-pressed={lastModelMessageFeedback === 'up'}
                      title="Marcar esta respuesta como buena"
                    >
                      <ThumbUpIcon className="w-4 h-4 mr-3" />
                      <span>Buena respuesta</span>
                    </button>
                    <button
                      onClick={() => handleMenuAction(() => handleFeedbackClick('down'))}
                      disabled={criticalOperationInProgress || copied || !lastModelMessageId}
                      className={`w-full text-left flex items-center px-3 py-3 text-sm rounded-md transition-colors duration-150 ${
                        lastModelMessageFeedback === 'down' 
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
                      }`}
                      role="menuitem"
                      aria-pressed={lastModelMessageFeedback === 'down'}
                      title="Marcar esta respuesta como mejorable"
                    >
                      <ThumbDownIcon className="w-4 h-4 mr-3" />
                      <span>Respuesta mejorable</span>
                    </button>
                  </>
                )}

                {/* Image Actions Section */}
                {displayGallery && displayGallery.length > 0 && (
                  <>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" role="separator"></div>
                    <button 
                        onClick={() => handleMenuAction(() => setIsGalleryModalOpen(true))} 
                        className="w-full text-left flex items-center px-3 py-3 text-sm rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" 
                        role="menuitem" 
                        title="Ver galería de la historia"
                    >
                        <CollectionIcon className="w-4 h-4 mr-3" />
                        <span>Ver Galería</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* --- End Action Bar --- */}

      <h3 
        className="text-xl sm:text-2xl font-semibold text-sky-600 dark:text-sky-300 text-center mb-4 font-sans" 
        title={storyTitle === DEFAULT_STORY_SECTION_TITLE || storyTitle === "Generando título..." ? "" : storyTitle}
      >
        {isGeneratingTitle ? (
          <span className="flex items-center justify-center">
            <LoadingIcon className="w-5 h-5 mr-2 text-sky-500 dark:text-sky-300" />
            Generando título...
          </span>
        ) : (
          storyTitle
        )}
      </h3>

      {(isGeneratingImage || isModifyingImage || (imageGenerationError && isImageErrorVisible) || imageUrls.length > 0) && (
        <div className="my-4 relative">
          {(isGeneratingImage || isModifyingImage) && (
            <div className="flex flex-col items-center text-slate-600 dark:text-slate-300 font-sans min-h-[256px] justify-center">
              <LoadingIcon className="w-8 h-8 mb-2 text-sky-500 dark:text-sky-400" />
              <span>{isModifyingImage ? 'Modificando imagen...' : 'Generando imagen ilustrativa...'}</span>
            </div>
          )}
          {imageGenerationError && isImageErrorVisible && !isGeneratingImage && !isModifyingImage && (
            <Alert 
              message={imageGenerationError} 
              type={AlertType.Error} 
              onClose={handleCloseImageError}
            />
          )}
          {imageUrls.length > 0 && !isGeneratingImage && !isModifyingImage && (
            <div className="relative group w-full max-w-md sm:max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => {
                  if (touchStartX !== null && touchEndX !== null && Math.abs(touchStartX - touchEndX) > 10) {
                      return;
                  }
                  setIsImageActionsModalOpen(true);
                }}
                className="block w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-sky-400/70 overflow-hidden"
                title="Abrir acciones de imagen"
                aria-label="Abrir acciones de imagen"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={imageUrls[currentImageIndex]}
                  alt={displayGallery[currentImageIndex]?.sourceText || `Ilustración para la historia: ${storyTitle}`}
                  className="rounded-lg shadow-xl w-full aspect-auto object-contain border-2 border-slate-200 dark:border-slate-600 group-hover:shadow-2xl"
                  style={imageStyle}
                  draggable="false"
                />
              </button>

              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    disabled={currentImageIndex === 0}
                    className="absolute top-1/2 left-2 -translate-y-1/2 bg-slate-800/60 hover:bg-slate-800/90 text-white p-2 rounded-full transition-opacity disabled:opacity-30 disabled:cursor-not-allowed opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    disabled={currentImageIndex === imageUrls.length - 1}
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-slate-800/60 hover:bg-slate-800/90 text-white p-2 rounded-full transition-opacity disabled:opacity-30 disabled:cursor-not-allowed opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/60 text-white text-xs font-semibold rounded-full px-2.5 py-1 pointer-events-none">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div
        className="story-text-content whitespace-pre-wrap prose dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed hyphens-none font-sans"
        aria-live="polite" 
      >
        {storyTextForDisplay
          .split(/\n\s*\n/) 
          .map(p => p.trim()) 
          .filter(p => p.length > 0) 
          .map((paragraphText, index) => (
            <div key={index} className="relative group my-2">
              <p>
                {paragraphText}
              </p>
              <div className="absolute top-2 right-2 flex flex-row gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                <button
                    onClick={() => onEditParagraph(paragraphText, index)}
                    disabled={criticalOperationInProgress}
                    className="p-2 text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 rounded-full transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-sky-500 dark:hover:text-sky-300 disabled:opacity-0 disabled:cursor-not-allowed"
                    title="Editar este párrafo"
                    aria-label="Editar este párrafo"
                >
                    <EditIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={() => onOpenParagraphImageGenerator(paragraphText)}
                    disabled={criticalOperationInProgress}
                    className="p-2 text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 rounded-full transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-sky-500 dark:hover:text-sky-300 disabled:opacity-0 disabled:cursor-not-allowed"
                    title="Generar imagen para este párrafo"
                    aria-label="Generar imagen para este párrafo"
                >
                    <PhotoIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={() => onPlayFromParagraph(index)}
                    disabled={criticalOperationInProgress}
                    className="p-2 text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 rounded-full transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-sky-500 dark:hover:text-sky-300 disabled:opacity-0 disabled:cursor-not-allowed"
                    title="Reproducir audio desde este párrafo"
                    aria-label="Reproducir audio desde este párrafo"
                >
                    <PlayAudioIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
        ))}
        {isProcessingTextGeneration && <span className="streaming-cursor"></span>}
      </div>
      
      {imageUrls.length > 0 && (
        <ImageActionsModal
          isOpen={isImageActionsModalOpen}
          onClose={() => setIsImageActionsModalOpen(false)}
          imageUrl={imageUrls[currentImageIndex]}
          imageSourceText={displayGallery[currentImageIndex]?.sourceText || ''}
          onDownloadImage={handleDownloadCurrentImage}
          onGenerateImagePreview={onGenerateImagePreview}
          onConfirmNewImage={onConfirmNewImage}
          isProcessingModification={isModifyingImage}
          storyTitle={storyTitle}
          isModifiable={currentImageIndex === displayGallery.length - 1}
        />
      )}

      {galleryImages && (
        <StoryGalleryModal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          images={galleryImages}
          title={storyTitle}
        />
      )}

      <StoryVisualizationModal
        isOpen={isVisualizationModalOpen}
        onClose={() => setIsVisualizationModalOpen(false)}
        storyText={pureStoryText}
        title={storyTitle}
      />
    </div>
  );
};
