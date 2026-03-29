

import React from 'react';
import type { Chat } from '@google/genai';
import { LoadingIcon } from './Icons';

interface InitialPromptFormProps {
  initialPrompt: string;
  setInitialPrompt: (value: string) => void;
  handleStartNewStory: (promptToUse: string) => void;
  isLoading: boolean;
  dynamicPlaceholder: string;
  isLoadingDynamicPlaceholder: boolean;
  activeChat: Chat | null;
}

export const InitialPromptForm: React.FC<InitialPromptFormProps> = ({
  initialPrompt,
  setInitialPrompt,
  handleStartNewStory,
  isLoading,
  dynamicPlaceholder,
  isLoadingDynamicPlaceholder,
  activeChat,
}) => {

  const isPlaceholderValidAndNotEmpty = 
    dynamicPlaceholder && 
    dynamicPlaceholder !== "Cargando ejemplo creativo..." && 
    !dynamicPlaceholder.startsWith("Ej: Cargando");

  const canSubmit = initialPrompt.trim() !== '' || isPlaceholderValidAndNotEmpty;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading || !canSubmit) return;

    let promptForStory = initialPrompt.trim();

    if (!promptForStory && isPlaceholderValidAndNotEmpty) {
      const exampleText = dynamicPlaceholder.startsWith("Ej: ") 
        ? dynamicPlaceholder.substring(4).trim() 
        : dynamicPlaceholder.trim();
      
      if (exampleText) {
        setInitialPrompt(exampleText); 
        promptForStory = exampleText;
      }
    }
    
    if (promptForStory) {
      handleStartNewStory(promptForStory);
    }
  };

  const buttonText = activeChat 
    ? 'Empezar Nueva Historia (descarta actual)' 
    : 'Generar Historia';

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col mb-2">
          
          <div className="text-center mb-4">
            <h2 className="text-center sm:text-3xl font-semibold text-sky-500 dark:text-sky-300">
              Inicia tu Historia
            </h2>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="initialPrompt"
            value={initialPrompt}
            onChange={(e) => setInitialPrompt(e.target.value)}
            placeholder={isLoadingDynamicPlaceholder ? "Cargando ejemplo creativo..." : dynamicPlaceholder}
            rows={3}
            className="w-full p-3 pr-10 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200 resize-none shadow-sm placeholder-slate-500 dark:placeholder-slate-400"
            disabled={isLoading}
            aria-label="Tema inicial de la historia"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className="w-full mt-3 bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-600 hover:to-sky-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <LoadingIcon className="w-5 h-5 mr-2" />
              <span>Generando...</span>
            </>
          ) : (
            buttonText
          )}
        </button>
      </form>
    </>
  );
};
