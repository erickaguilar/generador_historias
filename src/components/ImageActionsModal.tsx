

import React, { useState, useEffect }  from 'react';
import { Modal } from './Modal';
import { LoadingIcon, DownloadIcon, EditIcon, CheckIcon } from './Icons';
import { Alert } from './Alert';
import { AlertType } from '../types';

interface ImageActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  onDownloadImage: () => void;
  onGenerateImagePreview: (modificationPrompt: string) => Promise<string>;
  onConfirmNewImage: (newImageUrl: string) => Promise<void>;
  isProcessingModification: boolean;
  storyTitle: string;
  isModifiable: boolean;
  imageSourceText: string;
}

export const ImageActionsModal: React.FC<ImageActionsModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onDownloadImage,
  onGenerateImagePreview,
  onConfirmNewImage,
  isProcessingModification,
  storyTitle,
  isModifiable,
  imageSourceText,
}) => {
  const [showModifySection, setShowModifySection] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState('');
  
  // Local state for the image being displayed and modified within the modal
  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync displayed image with the main one when the modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayedImageUrl(imageUrl);
      // Reset other local states
      setLocalError(null);
      setShowModifySection(false);
      setModificationPrompt('');
    }
  }, [isOpen, imageUrl]);

  const handleModificationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modificationPrompt.trim() || isProcessingModification || !isModifiable) return;

    setLocalError(null);
    try {
      const newUrl = await onGenerateImagePreview(modificationPrompt);
      setDisplayedImageUrl(newUrl);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Ocurrió un error al modificar la imagen.");
    }
  };
  
  const handleConfirmClick = async () => {
    if (!displayedImageUrl || displayedImageUrl === imageUrl || isProcessingModification) return;
    await onConfirmNewImage(displayedImageUrl);
    handleCloseModal(); // Close after confirmation
  };

  const handleCloseModal = () => {
    // Reset local state before closing
    setShowModifySection(false);
    setModificationPrompt('');
    setDisplayedImageUrl(null);
    setLocalError(null);
    onClose();
  };

  const isModified = displayedImageUrl !== imageUrl;

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title="Acciones de Imagen">
      <div className="space-y-4">
        {/* Main image display area */}
        {!isProcessingModification && displayedImageUrl && (
          <div className="mb-4 text-center">
            <img 
              src={displayedImageUrl} 
              alt={imageSourceText || `Ilustración para: ${storyTitle}`}
              className="rounded-lg shadow-lg mx-auto w-full max-w-lg object-contain border-2 border-slate-200 dark:border-slate-600"
            />
             {imageSourceText && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                    "{imageSourceText}"
                </p>
            )}
            {isModified && (
              <p className="text-xs text-amber-500 dark:text-amber-300 mt-2">
                Previsualización de imagen. Confirma para usarla en la historia.
              </p>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {isProcessingModification && (
          <div className="mb-4 flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 font-sans p-8 min-h-[256px]">
            <LoadingIcon className="w-8 h-8 mb-2 text-sky-500 dark:text-sky-400" />
            <span>Modificando imagen...</span>
          </div>
        )}

        {/* Error Display */}
        {localError && !isProcessingModification && (
          <Alert message={localError} type={AlertType.Error} onClose={() => setLocalError(null)} />
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onDownloadImage}
            disabled={!displayedImageUrl || isProcessingModification}
            className="flex items-center justify-center w-full px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="h-5 w-5 mr-2" />
            Descargar Imagen
          </button>
          <button
            type="button"
            onClick={() => setShowModifySection(prev => !prev)}
            disabled={!displayedImageUrl || isProcessingModification || !isModifiable}
            title={!isModifiable ? "Solo se puede modificar la imagen más reciente de la galería." : "Modificar esta imagen"}
            className={`flex items-center justify-center w-full px-4 py-3 text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              showModifySection ? 'bg-slate-500 hover:bg-slate-600' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <EditIcon className="h-5 w-5 mr-2" />
            {showModifySection ? 'Ocultar Modificación' : 'Modificar Imagen'}
          </button>
        </div>

        {showModifySection && isModifiable && (
          <form onSubmit={handleModificationSubmit} className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-md font-medium text-sky-700 dark:text-sky-200 mb-2">Instrucciones para Modificar:</h3>
            <textarea
              id="imageModificationPrompt"
              value={modificationPrompt}
              onChange={(e) => setModificationPrompt(e.target.value)}
              placeholder={`Ej: Cambia el color del cielo a un atardecer, añade un dragón volando a lo lejos para la historia "${storyTitle}"...`}
              rows={3}
              className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200 resize-none"
              disabled={isProcessingModification}
              aria-describedby="image-modification-hint"
            />
            <p id="image-modification-hint" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Describe los cambios que quieres aplicar. La IA también usará el texto de la historia como contexto.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isProcessingModification || !modificationPrompt.trim()}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessingModification ? (
                  <>
                    <LoadingIcon className="w-4 h-4 mr-2" />
                    Generando...
                  </>
                ) : (
                  'Generar Nueva Versión'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          onClick={handleCloseModal}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
          disabled={isProcessingModification}
        >
          Cerrar
        </button>
        {isModified && (
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isProcessingModification}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <CheckIcon className="h-5 w-5 mr-2"/>
            Confirmar y Usar Imagen
          </button>
        )}
      </div>
    </Modal>
  );
};
