


import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LoadingIcon, DownloadIcon, PhotoIcon, SaveToGalleryIcon } from './Icons';
import { Alert } from './Alert';
import { AlertType } from '../types';

interface ParagraphImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  imageUrl: string | null;
  error: string | null;
  sourceText: string | null;
  storyTitle: string;
  onGenerateImage: (sourceText: string, additionalPrompt: string) => Promise<void>;
  onSetAsMain: () => Promise<void>;
  onSaveToGallery: (imageUrl: string, sourceText: string) => Promise<void>;
  isSavingToGallery: boolean;
  isSavableToGallery: boolean;
}

export const ParagraphImageModal: React.FC<ParagraphImageModalProps> = ({
  isOpen,
  onClose,
  isGenerating,
  imageUrl,
  error,
  sourceText,
  storyTitle,
  onGenerateImage,
  onSetAsMain,
  onSaveToGallery,
  isSavingToGallery,
  isSavableToGallery,
}) => {
    const [additionalPrompt, setAdditionalPrompt] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setAdditionalPrompt('');
        }
    }, [isOpen]);
    
    const handleGenerateClick = () => {
        if (!sourceText || isGenerating) return;
        onGenerateImage(sourceText, additionalPrompt);
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        const safeTitle = storyTitle.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 50) || 'escena_historia';
        link.download = `${safeTitle}_escena.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveToGalleryClick = async () => {
        if (!imageUrl || !sourceText || !isSavableToGallery) return;
        await onSaveToGallery(imageUrl, sourceText);
    };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar Imagen para Párrafo">
      <div className="space-y-4">
        {sourceText && (
            <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                <p className="text-sm italic text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-sky-700 dark:text-sky-300">Texto de origen:</span> "{sourceText}"
                </p>
            </div>
        )}

        <div>
          <label htmlFor="additionalPrompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Instrucciones Adicionales (Opcional)
          </label>
          <textarea
            id="additionalPrompt"
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder="Ej: estilo de arte Gótico, paleta de colores fríos, personaje principal en primer plano..."
            rows={2}
            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md resize-y focus:ring-sky-500 focus:border-sky-500"
            disabled={isGenerating || isSavingToGallery}
          />
        </div>
        
        <div className="text-center mt-3">
            <button
                type="button"
                onClick={handleGenerateClick}
                className="px-4 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                disabled={!sourceText || isGenerating || isSavingToGallery}
            >
                {isGenerating ? <LoadingIcon className="h-5 w-5 mr-2" /> : <PhotoIcon className="h-5 w-5 mr-2" />}
                {isGenerating ? 'Generando...' : (imageUrl ? 'Generar de Nuevo' : 'Generar Imagen')}
            </button>
        </div>

        <div className="min-h-[150px] flex items-center justify-center bg-slate-200 dark:bg-slate-900/50 rounded-lg p-4 mt-2">
            {!imageUrl && !isGenerating && !error && (
                <p className="text-slate-500 text-center text-sm">La imagen generada aparecerá aquí.</p>
            )}
            {isGenerating && (
                <div className="flex flex-col items-center text-slate-600 dark:text-slate-300 font-sans">
                    <LoadingIcon className="w-8 h-8 mb-2 text-sky-500 dark:text-sky-400" />
                    <span>Generando imagen para la escena...</span>
                </div>
            )}
            {error && !isGenerating && (
                <Alert message={error} type={AlertType.Error} onClose={() => {}} persistent={true} />
            )}
            {imageUrl && !isGenerating && (
                <img 
                    src={imageUrl} 
                    alt={`Ilustración para un párrafo de: ${storyTitle}`}
                    className="rounded-lg shadow-xl mx-auto w-full max-w-lg object-contain"
                />
            )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
          disabled={isGenerating || isSavingToGallery}
        >
          Cerrar
        </button>
        {imageUrl && !isGenerating && (
            <>
                <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isSavingToGallery}
                >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Descargar
                </button>
                <button
                    type="button"
                    onClick={handleSaveToGalleryClick}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isSavingToGallery || !isSavableToGallery}
                    title={isSavableToGallery ? "Guardar esta imagen en la galería de la historia" : "Primero debes guardar la historia para poder añadir a su galería"}
                >
                    {isSavingToGallery ? <LoadingIcon className="h-4 w-4 mr-2" /> : <SaveToGalleryIcon className="h-4 w-4 mr-2" />}
                    Guardar en Galería
                </button>
                <button
                    type="button"
                    onClick={onSetAsMain}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isSavingToGallery}
                    title="Reemplazar la imagen principal de la historia con esta"
                >
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    Usar como Principal
                </button>
            </>
        )}
      </div>
    </Modal>
  );
};
