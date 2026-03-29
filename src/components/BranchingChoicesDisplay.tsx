



import React, { useState } from 'react';
import { LoadingIcon, SurpriseIcon, DeepenIcon, EditIcon, ModifyStoryIcon } from './Icons';
import type { ActionType } from '../types';

interface BranchingChoicesDisplayProps {
  choices: string[] | null;
  isLoadingChoices: boolean;
  onChoiceSelected: (choice: string) => void;
  isContentLoading: boolean;
  isProcessingTextGeneration: boolean;
  currentActionType: ActionType | null; 
  hasStoryText: boolean;
  customContinuePrompt: string;
  setCustomContinuePrompt: (value: string) => void;
  handleCustomContinueSubmit: () => void;
  isLoadingCustomContinue: boolean;
  rewritePrompt: string;
  setRewritePrompt: (value: string) => void;
  handleRewriteSubmit: () => void;
  isLoadingRewrite: boolean;
  onSurpriseMe: () => void;
  onDeepenScene: () => void;
}

export const BranchingChoicesDisplay: React.FC<BranchingChoicesDisplayProps> = ({
  choices,
  isLoadingChoices,
  onChoiceSelected,
  isContentLoading,
  isProcessingTextGeneration,
  currentActionType,
  hasStoryText,
  customContinuePrompt,
  setCustomContinuePrompt,
  handleCustomContinueSubmit,
  isLoadingCustomContinue,
  rewritePrompt,
  setRewritePrompt,
  handleRewriteSubmit,
  isLoadingRewrite,
  onSurpriseMe,
  onDeepenScene,
}) => {
  const [showRewriteForm, setShowRewriteForm] = useState(false);
  const [showContinueForm, setShowContinueForm] = useState(false);

  const shouldDisplayChoicesSection = hasStoryText && !isContentLoading && !isProcessingTextGeneration;
  const anyInteractionInProgress = isProcessingTextGeneration || isLoadingChoices || isLoadingCustomContinue || isLoadingRewrite;

  const handleInlineContinueFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (customContinuePrompt.trim()) {
      handleCustomContinueSubmit();
      setShowContinueForm(false);
    }
  };

  const handleInlineRewriteFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (rewritePrompt.trim()) {
      handleRewriteSubmit();
      setShowRewriteForm(false);
    }
  };
  
  const isSurpriseActionLoading = isProcessingTextGeneration && currentActionType === 'surprise';
  const isDeepenActionLoading = isProcessingTextGeneration && currentActionType === 'deepen';

  if (!shouldDisplayChoicesSection) {
    return null;
  }

  if (isLoadingChoices && !isProcessingTextGeneration) {
    return (
      <div className="my-4 p-4 bg-white dark:bg-slate-700 rounded-lg shadow-md flex items-center justify-center" aria-live="polite" role="status">
        <LoadingIcon className="w-5 h-5 mr-2 text-sky-500 dark:text-sky-300" />
        <span className="text-sm text-slate-600 dark:text-slate-300">Generando opciones de continuación...</span>
      </div>
    );
  }

  if (!isLoadingChoices || (choices && choices.length > 0)) {
    return (
      <div className="my-4 p-4 bg-white dark:bg-slate-700 rounded-lg shadow-md">
        <div className="mb-3">
          <h3 className="text-md text-center font-semibold text-sky-600 dark:text-sky-300">¿Cómo quieres continuar?</h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          {choices && choices.map((choice, index) => (
            <button
              key={`choice-${index}`}
              onClick={() => onChoiceSelected(choice)}
              className="flex-grow bg-sky-700 hover:bg-sky-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
              title={choice}
              disabled={anyInteractionInProgress}
            >
              {choice}
            </button>
          ))}
          <button
            key="surprise-me"
            onClick={onSurpriseMe}
            className="flex-grow bg-purple-600 hover:bg-purple-500 text-white text-sm py-2 px-3 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 flex items-center justify-center gap-2"
            disabled={anyInteractionInProgress}
            title="Continuar la historia con un giro inesperado."
          >
            {isSurpriseActionLoading ? (
              <>
                <LoadingIcon className="h-4 w-4" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <SurpriseIcon className="h-4 w-4" />
                Algo Inesperado
              </>
            )}
          </button>
          <button
            key="deepen-scene"
            onClick={onDeepenScene}
            className="flex-grow bg-teal-600 hover:bg-teal-500 text-white text-sm py-2 px-3 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 flex items-center justify-center gap-2"
            disabled={anyInteractionInProgress}
            title="Añadir más detalle y atmósfera a la escena actual."
          >
            {isDeepenActionLoading ? (
               <>
                <LoadingIcon className="h-4 w-4" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <DeepenIcon className="h-4 w-4" />
                Profundizar Escena
              </>
            )}
          </button>
          <button
            key="custom-continue"
            onClick={() => {
                setShowContinueForm(prev => !prev);
                if (showRewriteForm) setShowRewriteForm(false);
            }}
            className={`flex-grow bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-2 px-3 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 flex items-center justify-center gap-2 ${showContinueForm ? 'ring-2 ring-emerald-300' : ''}`}
            disabled={anyInteractionInProgress}
            title="Escribir tu propia continuación para la historia."
          >
            <EditIcon className="h-4 w-4" />
            Escribir Continuación
          </button>
          <button
            key="custom-rewrite"
            onClick={() => {
                setShowRewriteForm(prev => !prev);
                if (showContinueForm) setShowContinueForm(false);
            }}
            className={`flex-grow bg-amber-600 hover:bg-amber-500 text-white text-sm py-2 px-3 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 flex items-center justify-center gap-2 ${showRewriteForm ? 'ring-2 ring-amber-300' : ''}`}
            disabled={anyInteractionInProgress}
            title="Reescribir toda la historia con tus instrucciones."
          >
            <ModifyStoryIcon className="h-4 w-4" />
            Reescribir Historia
          </button>
        </div>
        
        {showContinueForm && (
          <form onSubmit={handleInlineContinueFormSubmit} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
            <div className="mb-3">
              <label htmlFor="customContinuePromptInline" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
                Indica cómo seguir la trama:
              </label>
              <textarea
                id="customContinuePromptInline"
                value={customContinuePrompt}
                onChange={(e) => setCustomContinuePrompt(e.target.value)}
                placeholder="Ej: El personaje principal decide investigar el misterioso sonido..."
                rows={4}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200 resize-none"
                disabled={isLoadingCustomContinue}
                aria-describedby="custom-continue-prompt-helper-inline"
                autoFocus
              />
              <p id="custom-continue-prompt-helper-inline" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Escribe cómo quieres que la historia progrese.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button type="button" onClick={() => setShowContinueForm(false)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors" disabled={isLoadingCustomContinue}>Cancelar</button>
              <button type="submit" disabled={isLoadingCustomContinue || !customContinuePrompt.trim()} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoadingCustomContinue ? (<><LoadingIcon className="w-4 h-4 mr-2" />Enviando...</>) : ('Enviar Continuación')}
              </button>
            </div>
          </form>
        )}

        {showRewriteForm && (
          <form onSubmit={handleInlineRewriteFormSubmit} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
            <div className="mb-3">
              <label htmlFor="customRewritePromptInline" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
                Indica cómo reescribir la historia:
              </label>
              <textarea
                id="customRewritePromptInline"
                value={rewritePrompt}
                onChange={(e) => setRewritePrompt(e.target.value)}
                placeholder="Ej: Cambia al protagonista por una guerrera elfa y haz que la historia suceda en un bosque encantado."
                rows={4}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200 resize-none"
                disabled={isLoadingRewrite}
                aria-describedby="custom-rewrite-prompt-helper-inline"
                autoFocus
              />
              <p id="custom-rewrite-prompt-helper-inline" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Da instrucciones para cambiar aspectos de la historia. La IA intentará reescribir todo el relato.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button type="button" onClick={() => setShowRewriteForm(false)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors" disabled={isLoadingRewrite}>Cancelar</button>
              <button type="submit" disabled={isLoadingRewrite || !rewritePrompt.trim()} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                {isLoadingRewrite ? (<><LoadingIcon className="w-4 h-4 mr-2" />Aplicando...</>) : ('Aplicar Reescritura')}
              </button>
            </div>
          </form>
        )}

      </div>
    );
  }

  return null;
};