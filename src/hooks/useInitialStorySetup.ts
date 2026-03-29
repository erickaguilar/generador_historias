

import { useState, useEffect, useCallback } from 'react';
import { StoryPOV, STATIC_PLACEHOLDER_PROMPTS, LOADING_DYNAMIC_PLACEHOLDER_MESSAGE, EmotionalToneKey, StoryLengthKey } from '../constants';
import { loadNarrativeSettingsEntry, saveNarrativeSettingsEntry } from '../db';
import type { NarrativeSettingsData, NarrativeSettingsDBEntry } from '../types';

export const useInitialStorySetup = () => {
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [narrativeStylePrompt, setNarrativeStylePrompt] = useState<string>('');
  const [storyPov, setStoryPov] = useState<StoryPOV>(StoryPOV.Default);
  const [characterProfilePrompt, setCharacterProfilePrompt] = useState<string>('');
  const [includeCharacterInStory, setIncludeCharacterInStory] = useState<boolean>(false);
  const [centralThemePrompt, setCentralThemePrompt] = useState<string>('');
  const [macGuffinPrompt, setMacGuffinPrompt] = useState<string>('');
  const [ambiancePrompt, setAmbiancePrompt] = useState<string>('');
  const [emotionalTone, setEmotionalTone] = useState<EmotionalToneKey>('default');
  const [storyLength, setStoryLength] = useState<StoryLengthKey>('default');
  const [includeKeywordsPrompt, setIncludeKeywordsPrompt] = useState<string>('');
  const [avoidKeywordsPrompt, setAvoidKeywordsPrompt] = useState<string>('');
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState<string>(LOADING_DYNAMIC_PLACEHOLDER_MESSAGE);
  const [isLoadingDynamicPlaceholder, setIsLoadingDynamicPlaceholder] = useState<boolean>(true);
  const [isInitialSettingsLoaded, setIsInitialSettingsLoaded] = useState<boolean>(false);

  // Load settings from DB on initial mount
  useEffect(() => {
    const loadSettings = async () => {
      const loadedSettings = await loadNarrativeSettingsEntry();
      if (loadedSettings) {
        setNarrativeStylePrompt(loadedSettings.narrativeStylePrompt);
        setStoryPov(loadedSettings.storyPov);
        setCharacterProfilePrompt(loadedSettings.characterProfilePrompt);
        setIncludeCharacterInStory(loadedSettings.includeCharacterInStory);
        setCentralThemePrompt(loadedSettings.centralThemePrompt);
        setMacGuffinPrompt(loadedSettings.macGuffinPrompt);
        setAmbiancePrompt(loadedSettings.ambiancePrompt);
        setEmotionalTone(loadedSettings.emotionalTone);
        setStoryLength(loadedSettings.storyLength);
        setIncludeKeywordsPrompt(loadedSettings.includeKeywordsPrompt);
        setAvoidKeywordsPrompt(loadedSettings.avoidKeywordsPrompt);
        // Theme is handled by App.tsx, so we don't set it here.
      }
      setIsInitialSettingsLoaded(true); // Mark as loaded even if null
    };
    loadSettings();
  }, []);

  // Use static placeholder
  useEffect(() => {
    setIsLoadingDynamicPlaceholder(true);
    const randomIndex = Math.floor(Math.random() * STATIC_PLACEHOLDER_PROMPTS.length);
    const selectedPrompt = STATIC_PLACEHOLDER_PROMPTS[randomIndex];
    setDynamicPlaceholder(`Ej: ${selectedPrompt}`);
    setIsLoadingDynamicPlaceholder(false);
  }, []);

  const saveNarrativeSettings = useCallback(async (settingsToSave: NarrativeSettingsData): Promise<{success: boolean; error?: string}> => {
    try {
      const existingSettings = await loadNarrativeSettingsEntry();
      const finalSettings = { ...(existingSettings || {}), ...settingsToSave };
      
      await saveNarrativeSettingsEntry(finalSettings as Omit<NarrativeSettingsDBEntry, 'id' | 'updatedAt'>);
      return { success: true };
    } catch (error) {
      console.error("Failed to save narrative settings:", error);
      return { success: false, error: error instanceof Error ? error.message : "Error desconocido al guardar." };
    }
  }, []);

  return {
    initialPrompt,
    setInitialPrompt,
    narrativeStylePrompt,
    setNarrativeStylePrompt,
    storyPov,
    setStoryPov,
    characterProfilePrompt,
    setCharacterProfilePrompt,
    includeCharacterInStory,
    setIncludeCharacterInStory,
    centralThemePrompt,
    setCentralThemePrompt,
    macGuffinPrompt,
    setMacGuffinPrompt,
    ambiancePrompt,
    setAmbiancePrompt,
    emotionalTone,
    setEmotionalTone,
    storyLength,
    setStoryLength,
    includeKeywordsPrompt,
    setIncludeKeywordsPrompt,
    avoidKeywordsPrompt,
    setAvoidKeywordsPrompt,
    dynamicPlaceholder,
    isLoadingDynamicPlaceholder,
    saveNarrativeSettings, // Expose the save function
    isInitialSettingsLoaded, // Expose loading state for settings
  };
};