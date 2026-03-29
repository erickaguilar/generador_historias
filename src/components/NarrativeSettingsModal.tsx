

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LoadingIcon } from './Icons';
import { Alert } from './Alert';
import { PREDEFINED_NARRATIVE_STYLES, NARRATIVE_STYLE_PROMPTS_MAP, StoryPOV, PREDEFINED_STORY_POVS, EMOTIONAL_TONE_OPTIONS, EmotionalToneKey, STORY_LENGTH_OPTIONS, StoryLengthKey } from '../constants';
import { AlertType, NarrativeSettingsData } from '../types';

interface NarrativeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: NarrativeSettingsData;
  onApplySettings: (settings: NarrativeSettingsData) => void;
  onSaveAndApplySettings: (settings: NarrativeSettingsData) => Promise<{success: boolean; error?: string}>;
  isSaving: boolean; // Renamed from isSavingSettings for clarity as prop
  saveFeedback: {message: string, type: AlertType} | null; // Renamed from settingsSaveFeedback
  clearSaveFeedback: () => void;
  isInitialSettingsLoaded: boolean;
}

export const NarrativeSettingsModal: React.FC<NarrativeSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onApplySettings,
  onSaveAndApplySettings,
  isSaving,
  saveFeedback,
  clearSaveFeedback,
  isInitialSettingsLoaded,
}) => {
  // Temporary state for modal inputs
  const [tempNarrativeStylePrompt, setTempNarrativeStylePrompt] = useState<string>('');
  const [tempPredefinedNarrativeStyleKey, setTempPredefinedNarrativeStyleKey] = useState<string>('default');
  const [tempStoryPov, setTempStoryPov] = useState<StoryPOV>(StoryPOV.Default);
  const [tempCentralThemePrompt, setTempCentralThemePrompt] = useState<string>('');
  const [tempMacGuffinPrompt, setTempMacGuffinPrompt] = useState<string>('');
  const [tempAmbiancePrompt, setTempAmbiancePrompt] = useState<string>('');
  const [tempEmotionalTone, setTempEmotionalTone] = useState<EmotionalToneKey>('default');
  const [tempStoryLength, setTempStoryLength] = useState<StoryLengthKey>('default');
  const [tempIncludeKeywordsPrompt, setTempIncludeKeywordsPrompt] = useState<string>('');
  const [tempAvoidKeywordsPrompt, setTempAvoidKeywordsPrompt] = useState<string>('');
  const [tempCharacterProfilePrompt, setTempCharacterProfilePrompt] = useState<string>('');
  const [tempIncludeCharacterInStory, setTempIncludeCharacterInStory] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && isInitialSettingsLoaded) {
      setTempNarrativeStylePrompt(currentSettings.narrativeStylePrompt);
      setTempCharacterProfilePrompt(currentSettings.characterProfilePrompt);
      setTempIncludeCharacterInStory(currentSettings.includeCharacterInStory);
      setTempStoryPov(currentSettings.storyPov);
      setTempCentralThemePrompt(currentSettings.centralThemePrompt);
      setTempMacGuffinPrompt(currentSettings.macGuffinPrompt);
      setTempAmbiancePrompt(currentSettings.ambiancePrompt);
      setTempEmotionalTone(currentSettings.emotionalTone);
      setTempStoryLength(currentSettings.storyLength);
      setTempIncludeKeywordsPrompt(currentSettings.includeKeywordsPrompt);
      setTempAvoidKeywordsPrompt(currentSettings.avoidKeywordsPrompt);
      clearSaveFeedback(); // Clear feedback when modal opens with new/current settings

      let matchedKey = 'custom';
      if (!currentSettings.narrativeStylePrompt) { 
        matchedKey = 'default';
      } else {
        for (const [key, promptText] of Object.entries(NARRATIVE_STYLE_PROMPTS_MAP)) {
          if (promptText === currentSettings.narrativeStylePrompt) {
            matchedKey = key;
            break;
          }
        }
      }
      setTempPredefinedNarrativeStyleKey(matchedKey);
    }
  }, [isOpen, isInitialSettingsLoaded, currentSettings, clearSaveFeedback]);

  const handlePredefinedStyleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newKey = event.target.value;
    setTempPredefinedNarrativeStyleKey(newKey);
    if (newKey === 'custom') {
      // Keep existing custom text or clear: setTempNarrativeStylePrompt("");
    } else if (newKey === 'default') {
      setTempNarrativeStylePrompt(""); // Default implies no specific prompt string for style
    } else {
      setTempNarrativeStylePrompt(NARRATIVE_STYLE_PROMPTS_MAP[newKey] || "");
    }
  };

  const constructSettingsFromTempState = (): NarrativeSettingsData => {
    let finalNarrativeStylePrompt = '';
    if (tempPredefinedNarrativeStyleKey === 'custom') {
      finalNarrativeStylePrompt = tempNarrativeStylePrompt;
    } else if (tempPredefinedNarrativeStyleKey === 'default') {
      finalNarrativeStylePrompt = '';
    } else {
      finalNarrativeStylePrompt = tempNarrativeStylePrompt; 
    }
    return {
      narrativeStylePrompt: finalNarrativeStylePrompt,
      storyPov: tempStoryPov,
      centralThemePrompt: tempCentralThemePrompt,
      macGuffinPrompt: tempMacGuffinPrompt,
      ambiancePrompt: tempAmbiancePrompt,
      emotionalTone: tempEmotionalTone,
      storyLength: tempStoryLength,
      includeKeywordsPrompt: tempIncludeKeywordsPrompt,
      avoidKeywordsPrompt: tempAvoidKeywordsPrompt,
      characterProfilePrompt: tempCharacterProfilePrompt,
      includeCharacterInStory: tempIncludeCharacterInStory,
    };
  };

  const handleApplyClick = () => {
    clearSaveFeedback();
    const newSettings = constructSettingsFromTempState();
    onApplySettings(newSettings);
    // onClose(); // Parent handles closing after applying
  };

  const handleSaveClick = async () => {
    // clearSaveFeedback(); // Parent clears feedback when operation starts
    const settingsToSave = constructSettingsFromTempState();
    await onSaveAndApplySettings(settingsToSave);
    // Parent handles feedback and loading state. Modal just shows it.
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => { clearSaveFeedback(); onClose();}}
      title="Ajustes Avanzados de Narrativa"
    >
      <div className="space-y-4">
        {/* Narrative Style */}
        <div>
          <label htmlFor="narrativeStyleSelect" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Estilo Narrativo
          </label>
          <select
            id="narrativeStyleSelect"
            value={tempPredefinedNarrativeStyleKey}
            onChange={handlePredefinedStyleChange}
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.entries(PREDEFINED_NARRATIVE_STYLES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
        {tempPredefinedNarrativeStyleKey === 'custom' && (
          <div>
            <label htmlFor="customNarrativeStyle" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mt-2 mb-1">
              Describe tu estilo narrativo personalizado:
            </label>
            <textarea
              id="customNarrativeStyle"
              value={tempNarrativeStylePrompt}
              onChange={(e) => setTempNarrativeStylePrompt(e.target.value)}
              rows={3}
              placeholder="Ej: Una narración oscura y poética, con mucho simbolismo..."
              disabled={isSaving}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 resize-none"
            />
          </div>
        )}

        {/* Story POV */}
        <div>
          <label htmlFor="storyPovSelect" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Punto de Vista (POV)
          </label>
          <select
            id="storyPovSelect"
            value={tempStoryPov}
            onChange={(e) => setTempStoryPov(e.target.value as StoryPOV)}
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.entries(PREDEFINED_STORY_POVS).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
        
        {/* Character Profile */}
        <div>
          <label htmlFor="characterProfile" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Perfil del Personaje Principal/Recurrente (Opcional)
          </label>
          <textarea
            id="characterProfile"
            value={tempCharacterProfilePrompt}
            onChange={(e) => setTempCharacterProfilePrompt(e.target.value)}
            rows={3}
            placeholder="Ej: Elara, una joven hechicera con cabello plateado y una cicatriz en forma de luna en la mejilla, es curiosa pero impulsiva..."
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 resize-none"
          />
          <div className="mt-2 flex items-center">
            <input
              id="includeCharacterInStory"
              type="checkbox"
              checked={tempIncludeCharacterInStory}
              onChange={(e) => setTempIncludeCharacterInStory(e.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
            />
            <label htmlFor="includeCharacterInStory" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
              Incluir este personaje en la historia (si se describe)
            </label>
          </div>
        </div>

        {/* Central Theme */}
        <div>
          <label htmlFor="centralThemePrompt" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Tema Central o Conflicto Principal (Opcional)
          </label>
          <textarea
            id="centralThemePrompt"
            value={tempCentralThemePrompt}
            onChange={(e) => setTempCentralThemePrompt(e.target.value)}
            rows={2}
            placeholder="Ej: La lucha entre el destino y el libre albedrío; la búsqueda de un artefacto perdido..."
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 resize-none"
          />
        </div>

        {/* MacGuffin */}
        <div>
          <label htmlFor="macGuffinPrompt" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Elemento Clave / "MacGuffin" (Opcional)
          </label>
          <input
            id="macGuffinPrompt"
            type="text"
            value={tempMacGuffinPrompt}
            onChange={(e) => setTempMacGuffinPrompt(e.target.value)}
            placeholder="Ej: El Orbe de Eldoria; un mapa estelar secreto..."
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Ambiance */}
        <div>
          <label htmlFor="ambiancePrompt" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Ambientación / Detalles del Entorno (Opcional)
          </label>
          <textarea
            id="ambiancePrompt"
            value={tempAmbiancePrompt}
            onChange={(e) => setTempAmbiancePrompt(e.target.value)}
            rows={2}
            placeholder="Ej: Una ciudad futurista cubierta de neón bajo una lluvia perpetua; un bosque antiguo y silencioso..."
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 resize-none"
          />
        </div>

        {/* Emotional Tone */}
        <div>
          <label htmlFor="emotionalToneSelect" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Tono Emocional Global
          </label>
          <select
            id="emotionalToneSelect"
            value={tempEmotionalTone}
            onChange={(e) => setTempEmotionalTone(e.target.value as EmotionalToneKey)}
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.entries(EMOTIONAL_TONE_OPTIONS).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        {/* Story Length */}
        <div>
          <label htmlFor="storyLengthSelect" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Longitud y Detalle de Respuesta de IA
          </label>
          <select
            id="storyLengthSelect"
            value={tempStoryLength}
            onChange={(e) => setTempStoryLength(e.target.value as StoryLengthKey)}
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.entries(STORY_LENGTH_OPTIONS).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        {/* Include Keywords */}
        <div>
          <label htmlFor="includeKeywordsPrompt" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Temas/Palabras Clave a Incluir (Opcional)
          </label>
          <input
            id="includeKeywordsPrompt"
            type="text"
            value={tempIncludeKeywordsPrompt}
            onChange={(e) => setTempIncludeKeywordsPrompt(e.target.value)}
            placeholder="Ej: dragones, profecías, viajes en el tiempo"
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Avoid Keywords */}
        <div>
          <label htmlFor="avoidKeywordsPrompt" className="block text-sm font-medium text-sky-700 dark:text-sky-200 mb-1">
            Temas/Palabras Clave a Evitar (Opcional)
          </label>
          <input
            id="avoidKeywordsPrompt"
            type="text"
            value={tempAvoidKeywordsPrompt}
            onChange={(e) => setTempAvoidKeywordsPrompt(e.target.value)}
            placeholder="Ej: violencia gráfica, tecnología moderna"
            disabled={isSaving}
            className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>

      {saveFeedback && (
        <div className="mt-4">
            <Alert message={saveFeedback.message} type={saveFeedback.type} onClose={clearSaveFeedback} />
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          onClick={() => { clearSaveFeedback(); onClose();}}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleApplyClick}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors"
          disabled={isSaving}
        >
          Aplicar
        </button>
          <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving || !isInitialSettingsLoaded}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSaving ? (
              <>
                <LoadingIcon className="w-4 h-4 mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar y Aplicar'
          )}
        </button>
      </div>
    </Modal>
  );
};
