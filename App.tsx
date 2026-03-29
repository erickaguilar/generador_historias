

import React, { useState, useEffect, useCallback } from 'react';
import { StoryGenerator } from './src/components/StoryGenerator';
import { MobileTipBanner } from './src/components/MobileTipBanner';
import { HistoryPage } from './src/pages/HistoryPage';
import { LoreBookPage } from './src/pages/LoreBookPage';
import { SettingsPage } from './src/pages/SettingsPage';
import { IosInstallPrompt } from './src/components/IosInstallPrompt';
import { Alert } from './src/components/Alert';

import { useLoreBook } from './src/hooks/useLoreBook';
import { useInitialStorySetup } from './src/hooks/useInitialStorySetup';

import { loadNarrativeSettingsEntry, saveNarrativeSettingsEntry } from './src/db';
import { AlertType, type NarrativeSettingsData } from './src/types';
import type { StoryRecord } from './src/db';
import { StoryPOV } from './src/constants';
import { LightbulbIcon, SunIcon, MoonIcon, HistoryIcon, LoreBookIcon, SettingsIcon, InstallIcon } from './src/components/Icons';


// Interfaz para el evento de instalación, ya que no es estándar en todas las bibliotecas de TS
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const App = () => {
  const appVersion = "1.7.2"; // Define la versión de la app
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [theme, setTheme] = useState<('light' | 'dark')>('dark');
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosInstallModalOpen, setIsIosInstallModalOpen] = useState(false);
  
  // View and data-loading state
  const [currentView, setCurrentView] = useState<'generator' | 'history' | 'lore' | 'settings'>('generator');
  const [storyToLoad, setStoryToLoad] = useState<StoryRecord | null>(null);
  
  // Hooks for shared state
  const loreBookApi = useLoreBook();
  const settingsHook = useInitialStorySetup();
  
  // Centralized state for alerts and saving settings
  const [alert, setAlert] = useState<{message: string, type: AlertType} | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // State to disable navigation while story is generating
  const [isGeneratorBusy, setIsGeneratorBusy] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await loadNarrativeSettingsEntry();
        if (settings?.theme) {
          setTheme(settings.theme);
        } else {
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(systemPrefersDark ? 'dark' : 'light');
        }
      } catch (e) {
        console.error("Fallo al cargar los ajustes para el tema, usando el predeterminado.", e);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(systemPrefersDark ? 'dark' : 'light');
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const saveTheme = async (newTheme: 'light' | 'dark') => {
    try {
      const existingSettings = await loadNarrativeSettingsEntry();
      const settingsPayload: NarrativeSettingsData = {
        narrativeStylePrompt: existingSettings?.narrativeStylePrompt ?? settingsHook.narrativeStylePrompt,
        storyPov: existingSettings?.storyPov ?? settingsHook.storyPov,
        characterProfilePrompt: existingSettings?.characterProfilePrompt ?? settingsHook.characterProfilePrompt,
        includeCharacterInStory: existingSettings?.includeCharacterInStory ?? settingsHook.includeCharacterInStory,
        centralThemePrompt: existingSettings?.centralThemePrompt ?? settingsHook.centralThemePrompt,
        macGuffinPrompt: existingSettings?.macGuffinPrompt ?? settingsHook.macGuffinPrompt,
        ambiancePrompt: existingSettings?.ambiancePrompt ?? settingsHook.ambiancePrompt,
        emotionalTone: existingSettings?.emotionalTone ?? settingsHook.emotionalTone,
        storyLength: existingSettings?.storyLength ?? settingsHook.storyLength,
        includeKeywordsPrompt: existingSettings?.includeKeywordsPrompt ?? settingsHook.includeKeywordsPrompt,
        avoidKeywordsPrompt: existingSettings?.avoidKeywordsPrompt ?? settingsHook.avoidKeywordsPrompt,
        theme: newTheme,
      };
      await saveNarrativeSettingsEntry(settingsPayload);
    } catch (e) {
      console.error("Fallo al guardar el ajuste del tema:", e);
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        saveTheme(newTheme);
        return newTheme;
    });
  };
  
  useEffect(() => {
    const isDeviceIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isDeviceIos);
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isAppStandalone);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const handleAppInstalled = () => { setInstallPrompt(null); };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User choice: ${outcome}`);
    setInstallPrompt(null);
  };

  const handleLoadStoryFromHistory = useCallback((story: StoryRecord) => {
    setStoryToLoad(story);
    setCurrentView('generator');
  }, []);
  
  const handleViewChange = (view: 'generator' | 'history' | 'lore' | 'settings') => {
    setCurrentView(view);
  };

  const handleApplySettings = (newSettings: NarrativeSettingsData) => {
      settingsHook.setNarrativeStylePrompt(newSettings.narrativeStylePrompt);
      settingsHook.setStoryPov(newSettings.storyPov);
      settingsHook.setCentralThemePrompt(newSettings.centralThemePrompt);
      settingsHook.setMacGuffinPrompt(newSettings.macGuffinPrompt);
      settingsHook.setAmbiancePrompt(newSettings.ambiancePrompt);
      settingsHook.setEmotionalTone(newSettings.emotionalTone);
      settingsHook.setStoryLength(newSettings.storyLength);
      settingsHook.setIncludeKeywordsPrompt(newSettings.includeKeywordsPrompt);
      settingsHook.setAvoidKeywordsPrompt(newSettings.avoidKeywordsPrompt);
      settingsHook.setCharacterProfilePrompt(newSettings.characterProfilePrompt);
      settingsHook.setIncludeCharacterInStory(newSettings.includeCharacterInStory);
  };
  
  const handleApplyAndNotify = (newSettings: NarrativeSettingsData) => {
    handleApplySettings(newSettings);
    setAlert({message: "Ajustes aplicados para la sesión actual.", type: AlertType.Info});
  };

  const handleSaveSettings = async (settingsToSave: NarrativeSettingsData) => {
      setIsSavingSettings(true);
      setAlert(null);
      handleApplySettings(settingsToSave); // Apply them immediately
      const result = await settingsHook.saveNarrativeSettings(settingsToSave);
      if (result.success) {
          setAlert({ message: "Ajustes guardados con éxito en el navegador.", type: AlertType.Success });
      } else {
          setAlert({ message: result.error || "Error al guardar ajustes.", type: AlertType.Error });
      }
      setIsSavingSettings(false);
      return result;
  };
  
  const currentNarrativeSettings: NarrativeSettingsData = {
    narrativeStylePrompt: settingsHook.narrativeStylePrompt,
    storyPov: settingsHook.storyPov,
    centralThemePrompt: settingsHook.centralThemePrompt,
    macGuffinPrompt: settingsHook.macGuffinPrompt,
    ambiancePrompt: settingsHook.ambiancePrompt,
    emotionalTone: settingsHook.emotionalTone,
    storyLength: settingsHook.storyLength,
    includeKeywordsPrompt: settingsHook.includeKeywordsPrompt,
    avoidKeywordsPrompt: settingsHook.avoidKeywordsPrompt,
    characterProfilePrompt: settingsHook.characterProfilePrompt,
    includeCharacterInStory: settingsHook.includeCharacterInStory,
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-sky-900 text-slate-800 dark:text-slate-100 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white font-sans pb-28 sm:pb-4">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      <header className="w-full max-w-3xl text-center my-6 sm:my-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-700 dark:from-sky-400 dark:to-sky-600">
          Historias Interactivas
        </h1>
        <p className="mt-3 sm:mt-4 text-lg text-slate-600 dark:text-slate-300">
          {currentView === 'generator' && 'Crea y moldea historias únicas en conversación con la IA.'}
          {currentView === 'history' && 'Revisa, edita y continúa tus aventuras guardadas.'}
          {currentView === 'lore' && 'Gestiona los personajes y elementos de tu mundo para mantener la coherencia.'}
          {currentView === 'settings' && 'Personaliza la voz de la IA y las reglas de tus historias.'}
        </p>
      </header>

      {currentView === 'generator' && <MobileTipBanner />}

      <main className="w-full max-w-3xl flex-grow flex flex-col">
        {currentView === 'generator' && (
          <StoryGenerator 
            storyToLoad={storyToLoad}
            onClearStoryToLoad={() => setStoryToLoad(null)}
            settingsHook={settingsHook}
            loreBookApi={loreBookApi}
            setIsGeneratorBusy={setIsGeneratorBusy}
          />
        )}
        {currentView === 'history' && (
          <HistoryPage onLoadStory={handleLoadStoryFromHistory} />
        )}
        {currentView === 'lore' && (
          <LoreBookPage loreBookApi={loreBookApi} />
        )}
        {currentView === 'settings' && (
          <SettingsPage 
            currentSettings={currentNarrativeSettings}
            onApplyAndNotify={handleApplyAndNotify}
            onSaveAndApplySettings={handleSaveSettings}
            isSaving={isSavingSettings}
            isInitialSettingsLoaded={settingsHook.isInitialSettingsLoaded}
          />
        )}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden sm:block w-full max-w-3xl text-center py-8 mt-12 text-slate-500 dark:text-slate-400">
        <div className="bg-slate-100/60 dark:bg-slate-800/50 backdrop-blur-lg rounded-3xl p-3 border border-slate-200/80 dark:border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* Left Buttons */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => handleViewChange('history')}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${currentView === 'history' ? 'text-sky-500 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Ver historias guardadas"
                disabled={isGeneratorBusy}
              >
                <HistoryIcon className="h-5 w-5" />
                <span className="text-xs font-medium">Historial</span>
              </button>
              <button
                onClick={() => handleViewChange('lore')}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${currentView === 'lore' ? 'text-sky-500 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Libro de Lore (World-Building)"
                disabled={!loreBookApi.isLoreBookLoaded || isGeneratorBusy}
              >
                <LoreBookIcon className="h-5 w-5" />
                <span className="text-xs font-medium">Lore</span>
              </button>
            </div>

            {/* Center "Create" Button */}
            <button
                onClick={() => handleViewChange('generator')}
                className={`mx-4 flex flex-col items-center justify-center gap-2 px-8 py-4 transition-colors duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 focus-visible:ring-sky-400/80 bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-lg ${
                    currentView === 'generator' 
                    ? 'ring-4 ring-sky-300 dark:ring-sky-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-800' 
                    : ''
                }`}
                title="Generador de Historias"
                disabled={isGeneratorBusy}
            >
                <LightbulbIcon className="h-8 w-8" />
                <span className="text-base font-bold">Crear</span>
            </button>

            {/* Right Buttons */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => handleViewChange('settings')}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${currentView === 'settings' ? 'text-sky-500 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Ajustes avanzados de narrativa"
                disabled={!settingsHook.isInitialSettingsLoaded || isGeneratorBusy}
              >
                <SettingsIcon className="h-5 w-5" />
                <span className="text-xs font-medium">Ajustes</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex flex-col items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
                disabled={isGeneratorBusy}
              >
                {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                <span className="text-xs font-medium">Tema</span>
              </button>
              {installPrompt && !isStandalone && (
                <button
                  onClick={handleInstallClick}
                  className="flex flex-col items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Instalar aplicación"
                  aria-label="Instalar aplicación en tu dispositivo"
                  disabled={isGeneratorBusy}
                >
                  <InstallIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">Instalar</span>
                </button>
              )}
              {isIos && !installPrompt && !isStandalone && (
                <button
                  onClick={() => setIsIosInstallModalOpen(true)}
                  className="flex flex-col items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-sky-500 dark:text-slate-300 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Instalar en iOS"
                  disabled={isGeneratorBusy}
                >
                  <InstallIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">Instalar</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs space-y-1 mt-8">
          <p>&copy; {new Date().getFullYear()} Generador de Historias IA. Creado con Gemini.</p>
          <p>Versión {appVersion}</p>
        </div>
      </footer>
      
      {/* Mobile Footer Area - with space for the floating nav bar */}
      <footer className="sm:hidden w-full max-w-3xl text-center mt-auto text-slate-500 dark:text-slate-400">
         <div className="text-xs space-y-1">
          <p>&copy; {new Date().getFullYear()} Generador de Historias IA. Creado con Gemini.</p>
          <p>Versión {appVersion}</p>
        </div>
      </footer>

      {/* Custom Mobile Bottom Nav Bar */}
      <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-sm h-16 bg-slate-100/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-300/80 dark:border-slate-700/60 shadow-xl z-40">
          <div className="flex items-center justify-around h-full">
              <button onClick={() => handleViewChange('history')} className={`flex flex-col items-center justify-center w-1/5 gap-1.5 py-2 transition-colors rounded-lg focus:outline-none ${currentView === 'history' ? 'text-sky-500 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isGeneratorBusy} title="Historial">
                  <HistoryIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">Historial</span>
              </button>
              <button onClick={() => handleViewChange('lore')} className={`flex flex-col items-center justify-center w-1/5 gap-1.5 py-2 transition-colors rounded-lg focus:outline-none ${currentView === 'lore' ? 'text-sky-500 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`} title="Libro de Lore" disabled={!loreBookApi.isLoreBookLoaded || isGeneratorBusy}>
                  <LoreBookIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">Lore</span>
              </button>
              
              <button onClick={() => handleViewChange('generator')} className={`flex flex-col items-center justify-center w-1/5 gap-1.5 py-2 transition-colors rounded-lg focus:outline-none ${currentView === 'generator' ? 'text-sky-500 dark:text-sky-400 font-semibold' : 'text-slate-600 dark:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isGeneratorBusy} title="Generador de Historias">
                  <LightbulbIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">Crear</span>
              </button>

              <button onClick={() => handleViewChange('settings')} className={`flex flex-col items-center justify-center w-1/5 gap-1.5 py-2 transition-colors rounded-lg focus:outline-none ${currentView === 'settings' ? 'text-sky-500 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`} title="Ajustes" disabled={!settingsHook.isInitialSettingsLoaded || isGeneratorBusy}>
                  <SettingsIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">Ajustes</span>
              </button>
              
              {/* Dynamic 5th Slot */}
              <div className="flex flex-col items-center justify-center w-1/5 gap-1.5 py-2">
                   {(installPrompt && !isStandalone) ? (
                      <button onClick={handleInstallClick} className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isGeneratorBusy} title="Instalar aplicación">
                          <InstallIcon className="h-5 w-5" />
                          <span className="text-xs font-medium">Instalar</span>
                      </button>
                  ) : (isIos && !installPrompt && !isStandalone) ? (
                      <button onClick={() => setIsIosInstallModalOpen(true)} className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isGeneratorBusy} title="Instalar en iOS">
                          <InstallIcon className="h-5 w-5" />
                          <span className="text-xs font-medium">Instalar</span>
                      </button>
                  ) : (
                      <button onClick={toggleTheme} className="flex flex-col items-center justify-center w-full h-full gap-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isGeneratorBusy} title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}>
                          {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                          <span className="text-xs font-medium">Tema</span>
                      </button>
                  )}
              </div>
          </div>
      </div>
      
      <IosInstallPrompt isOpen={isIosInstallModalOpen} onClose={() => setIsIosInstallModalOpen(false)} />
    </div>
  );
};

export default App;