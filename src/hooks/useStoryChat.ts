import { useState, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { createChatInstance, sendMessageToChatStream, generateContinuationChoices } from '../../services/geminiService'; 
import { getFinalSystemInstruction } from '../systemInstructions'; 
import type { ConversationMessage, ActionType, CharacterEntry, WorldElementEntry, StoryArtifacts } from '../types';
import type { StoryPOV, EmotionalToneKey, StoryLengthKey } from '../constants';
import { EMOTIONAL_TONE_OPTIONS } from '../constants';


export interface UseStoryChatProps {
  narrativeStylePrompt: string;
  storyPov: StoryPOV; 
  centralThemePrompt: string;
  macGuffinPrompt: string;
  ambiancePrompt: string;
  emotionalTone: EmotionalToneKey;
  storyLength: StoryLengthKey;
  includeKeywordsPrompt: string; 
  avoidKeywordsPrompt: string;   
  characterProfilePrompt: string; 
  includeCharacterInStory: boolean;
  loreCharacters: CharacterEntry[];
  loreWorldElements: WorldElementEntry[];
  setError: (message: string | null) => void;
  stopAudioPlayback: () => void;
  setContinuePromptState: (prompt: string) => void; 
  setRewritePromptState: (prompt: string) => void;
}

export interface UseStoryChatReturn {
  activeChat: Chat | null;
  conversation: ConversationMessage[];
  pureStoryText: string; // This will be the internal pureStoryText of the hook
  isProcessingTextGeneration: boolean;
  currentActionType: ActionType | null;
  branchingChoices: string[] | null; 
  isGeneratingChoices: boolean; 
  lastModelMessageId: string | null;
  lastModelMessageFeedback: 'up' | 'down' | null;
  streamCompletionData: { text: string; chat: Chat; artifacts: StoryArtifacts | null; actionType: ActionType } | null;
  handleStartNewStory: (promptToUse: string) => Promise<void>;
  handleContinueStory: (promptToContinueWith: string) => Promise<void>;
  handleRewriteStory: (promptToRewriteWith: string) => Promise<void>;
  handleEditParagraph: (paragraphIndex: number, instruction: string) => Promise<void>;
  handleSurpriseMeRequest: () => Promise<void>;
  handleDeepenSceneRequest: () => Promise<void>;
  clearBranchingChoices: () => void;
  handleFeedback: (messageId: string, feedback: 'up' | 'down') => void;
  primeChatWithLoadedStory: (loadedStoryContent: string) => void;
  handleGenerateChoicesForText: (text: string) => Promise<void>;
  getInternalPureStoryText: () => string;
  setBranchingChoices: (choices: string[] | null) => void;
  setIsGeneratingChoices: (isLoading: boolean) => void;
}

export const useStoryChat = ({
  narrativeStylePrompt,
  storyPov,
  centralThemePrompt,
  macGuffinPrompt,
  ambiancePrompt,
  emotionalTone,
  storyLength,
  includeKeywordsPrompt, 
  avoidKeywordsPrompt,   
  characterProfilePrompt, 
  includeCharacterInStory,
  loreCharacters,
  loreWorldElements,
  setError,
  stopAudioPlayback,
  setContinuePromptState,
  setRewritePromptState,
}: UseStoryChatProps): UseStoryChatReturn => {
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [internalPureStoryText, setInternalPureStoryText] = useState<string>(''); // Renamed for clarity
  const [isProcessingTextGeneration, setIsProcessingTextGeneration] = useState<boolean>(false);
  const [currentActionType, setCurrentActionType] = useState<ActionType>(null);
  const [streamCompletionData, setStreamCompletionData] = useState<{ text: string; chat: Chat; artifacts: StoryArtifacts | null; actionType: ActionType } | null>(null);

  const [branchingChoices, setBranchingChoices] = useState<string[] | null>([]);
  const [isGeneratingChoices, setIsGeneratingChoices] = useState<boolean>(false);

  const [lastModelMessageId, setLastModelMessageId] = useState<string | null>(null);
  const [lastModelMessageFeedback, setLastModelMessageFeedback] = useState<'up' | 'down' | null>(null);

  const getInternalPureStoryText = useCallback(() => internalPureStoryText, [internalPureStoryText]);

  useEffect(() => {
    const lastModelMsg = conversation.slice().reverse().find(msg => msg.role === 'model');
    if (lastModelMsg) {
      setLastModelMessageId(lastModelMsg.id);
      setLastModelMessageFeedback(lastModelMsg.feedback || null);
    } else {
      setLastModelMessageId(null);
      setLastModelMessageFeedback(null);
    }
  }, [conversation]);

  const clearBranchingChoices = useCallback(() => {
    setBranchingChoices(null);
    setIsGeneratingChoices(false);
  }, []);
  
  const getChatInstance = useCallback(() => {
    const systemInstruction = getFinalSystemInstruction(
      narrativeStylePrompt, 
      includeCharacterInStory, 
      characterProfilePrompt,
      storyPov,
      centralThemePrompt,
      macGuffinPrompt,
      ambiancePrompt,
      emotionalTone,
      storyLength,
      includeKeywordsPrompt,
      avoidKeywordsPrompt,
      loreCharacters,
      loreWorldElements
    );
    return createChatInstance(systemInstruction);
  }, [
    narrativeStylePrompt, includeCharacterInStory, characterProfilePrompt, storyPov,
    centralThemePrompt, macGuffinPrompt, ambiancePrompt, emotionalTone, storyLength,
    includeKeywordsPrompt, avoidKeywordsPrompt, loreCharacters, loreWorldElements
  ]);

  const processStreamAndUpdateState = useCallback(async (
    chatInstance: Chat,
    aiInstruction: string,
    updateType: 'append' | 'replace',
    actionType: ActionType,
  ) => {
    const textBeforeUpdate = internalPureStoryText;
    
    try {
        const stream = await sendMessageToChatStream(chatInstance, aiInstruction);
        const modelMessageId = crypto.randomUUID();

        setConversation(prev => [...prev, { id: modelMessageId, role: 'model', content: '', feedback: null }]);
        
        const ARTIFACTS_SEPARATOR = '<<ARTIFACTS>>';
        let fullResponseText = '';

        for await (const chunk of stream) {
            fullResponseText += chunk.text;
            
            const separatorIndex = fullResponseText.indexOf(ARTIFACTS_SEPARATOR);
            const currentStoryContent = separatorIndex !== -1 
                ? fullResponseText.substring(0, separatorIndex) 
                : fullResponseText;
            
            const newFullText = updateType === 'append'
                ? (textBeforeUpdate ? textBeforeUpdate + '\n\n' : '') + currentStoryContent
                : currentStoryContent;
            
            setInternalPureStoryText(newFullText);
            setConversation(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, content: currentStoryContent.trim() } : msg
            ));
        }

        // Now that the stream is complete, do the final split and parse
        let finalStoryContent = fullResponseText;
        let artifactsJsonString = '';
        const finalSeparatorIndex = fullResponseText.indexOf(ARTIFACTS_SEPARATOR);

        if (finalSeparatorIndex !== -1) {
            finalStoryContent = fullResponseText.substring(0, finalSeparatorIndex);
            artifactsJsonString = fullResponseText.substring(finalSeparatorIndex + ARTIFACTS_SEPARATOR.length);
        }

        let parsedArtifacts: StoryArtifacts | null = null;
        if (artifactsJsonString.trim()) {
            try {
                const jsonStartIndex = artifactsJsonString.indexOf('{');
                const jsonEndIndex = artifactsJsonString.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    const cleanJsonString = artifactsJsonString.substring(jsonStartIndex, jsonEndIndex + 1);
                    parsedArtifacts = JSON.parse(cleanJsonString);
                } else {
                    console.error("Could not find a valid JSON object in the artifacts string.");
                }
            } catch (e) {
                console.error("Failed to parse artifacts JSON:", e, "Raw string:", artifactsJsonString);
                setError("La IA no generó los metadatos en un formato JSON válido. Por favor, intenta de nuevo.");
            }
        } else if (finalSeparatorIndex !== -1) {
             console.warn("Artifacts separator was found, but no subsequent JSON object was generated by the AI.");
        }

        const finalFullText = updateType === 'append'
            ? (textBeforeUpdate ? textBeforeUpdate + '\n\n' : '') + finalStoryContent
            : finalStoryContent;
        
        setStreamCompletionData({ text: finalFullText, chat: chatInstance, artifacts: parsedArtifacts, actionType });

    } catch(err) {
      throw err;
    }
  }, [internalPureStoryText, setError]);


  const commonStoryUpdateLogic = async (
    chatInstance: Chat,
    userDisplayContent: string, 
    aiInstruction: string, 
    actionType: ActionType
  ) => {
    stopAudioPlayback();
    setIsProcessingTextGeneration(true);
    setCurrentActionType(actionType);
    setError(null);
    clearBranchingChoices(); 

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userDisplayContent,
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      await processStreamAndUpdateState(chatInstance, aiInstruction, 'append', actionType);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Ocurrió un error desconocido durante la acción: ${actionType}.`);
      }
      console.error(`Error during action ${actionType}:`, err);
    } finally {
      setIsProcessingTextGeneration(false);
      setCurrentActionType(null);
    }
  };


  const handleStartNewStory = useCallback(async (promptToUse: string) => {
    if (!promptToUse.trim()) {
      setError("Por favor, ingresa un tema para iniciar la historia.");
      return;
    }

    stopAudioPlayback();
    setIsProcessingTextGeneration(true);
    setCurrentActionType('initial');
    setError(null);
    setConversation([]);
    setInternalPureStoryText('');
    setContinuePromptState(''); 
    setRewritePromptState('');   
    clearBranchingChoices();   
    
    try {
      const newChat = getChatInstance();
      setActiveChat(newChat);

      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Iniciar historia: ${promptToUse}`, 
      };
      setConversation([userMessage]); 

      await processStreamAndUpdateState(newChat, promptToUse, 'replace', 'initial');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error desconocido al iniciar la historia.");
      }
      setActiveChat(null); 
      setInternalPureStoryText(''); 
      console.error("Error starting new story:", err);
    } finally {
      setIsProcessingTextGeneration(false); 
      setCurrentActionType(null);
    }
  }, [
    getChatInstance, setError, stopAudioPlayback, clearBranchingChoices, 
    setContinuePromptState, setRewritePromptState, processStreamAndUpdateState
  ]);

  const ensureChatSession = useCallback((): Chat => {
    if (activeChat) return activeChat;
    const newChat = getChatInstance();
    setActiveChat(newChat);
    return newChat;
  }, [activeChat, getChatInstance]);


  const handleContinueStory = useCallback(async (promptToContinueWith: string) => {
    if (!promptToContinueWith.trim()) {
      setError("Por favor, escribe tu continuación.");
      return;
    }
    if (!internalPureStoryText.trim() && !activeChat){ // Cannot continue if no story and no chat
        setError("No hay historia activa para continuar. Inicia una nueva historia primero.");
        return;
    }
    
    const chatToUse = ensureChatSession();
    setContinuePromptState(''); 
    let finalAiInstruction = promptToContinueWith;
    if (emotionalTone !== 'default' && EMOTIONAL_TONE_OPTIONS[emotionalTone]) {
      finalAiInstruction += ` (Adicionalmente, intenta infundir un tono de "${EMOTIONAL_TONE_OPTIONS[emotionalTone]}" en este segmento.)`;
    }
    await commonStoryUpdateLogic(chatToUse, promptToContinueWith, finalAiInstruction, 'continue');
  }, [
    ensureChatSession, internalPureStoryText, setError, stopAudioPlayback, emotionalTone,
    clearBranchingChoices, setContinuePromptState, commonStoryUpdateLogic, activeChat
  ]);

  const handleRewriteStory = useCallback(async (promptToRewriteWith: string) => {
    if (!promptToRewriteWith.trim() || !internalPureStoryText.trim()) {
      setError("Escribe tus instrucciones y asegúrate que una historia esté activa y con contenido.");
      return;
    }
    
    const chatToUse = ensureChatSession();
    stopAudioPlayback();
    setIsProcessingTextGeneration(true);
    setCurrentActionType('rewrite');
    setError(null);
    clearBranchingChoices();

    const userDisplayMessage = `Solicitud de reescritura: ${promptToRewriteWith}`;
    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userDisplayMessage,
    };
    setConversation(prev => [...prev, userMessage]); 
    
    let modificationRequestToAI = `Por favor, revisa y reescribe la siguiente historia basándote en mis instrucciones. Devuelve SOLAMENTE la historia completa y modificada, sin ningún comentario introductorio, explicaciones o saludos. Asegúrate de mantener el formato de párrafos separados por doble salto de línea, tal como en la historia original.

Instrucción de reescritura: "${promptToRewriteWith}"

Historia actual a reescribir:
---
${internalPureStoryText}
---
Historia Reescrita:`;
    
    const originalStoryText = internalPureStoryText; 
    setRewritePromptState('');

    try {
      await processStreamAndUpdateState(chatToUse, modificationRequestToAI, 'replace', 'rewrite');
    } catch (err) {
      setInternalPureStoryText(originalStoryText); 
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error desconocido al reescribir la historia.");
      }
      console.error("Error rewriting story:", err);
    } finally {
      setIsProcessingTextGeneration(false);
      setCurrentActionType(null);
    }
  }, [
    ensureChatSession, internalPureStoryText, setError, stopAudioPlayback,
    clearBranchingChoices, setRewritePromptState, processStreamAndUpdateState
  ]);

  const handleEditParagraph = useCallback(async (paragraphIndex: number, instruction: string) => {
    if (!internalPureStoryText.trim() || paragraphIndex < 0) {
      setError("No hay historia o el párrafo seleccionado no es válido.");
      return;
    }
    const chatToUse = ensureChatSession();
    stopAudioPlayback();
    setIsProcessingTextGeneration(true);
    setCurrentActionType('edit_paragraph');
    setError(null);
    clearBranchingChoices();

    const userDisplayMessage = `Edición en párrafo ${paragraphIndex + 1}: ${instruction}`;
    const userMessage: ConversationMessage = { id: crypto.randomUUID(), role: 'user', content: userDisplayMessage };
    setConversation(prev => [...prev, userMessage]);

    const paragraphs = internalPureStoryText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphIndex >= paragraphs.length) {
        setError("El párrafo seleccionado ya no existe.");
        setIsProcessingTextGeneration(false);
        setCurrentActionType(null);
        return;
    }

    const paragraphToEdit = paragraphs[paragraphIndex];
    const prevParagraph = paragraphIndex > 0 ? paragraphs[paragraphIndex - 1] : '';
    const nextParagraph = paragraphIndex < paragraphs.length - 1 ? paragraphs[paragraphIndex + 1] : '';

    const editRequestToAI = `Por favor, revisa y reescribe el "Párrafo a Editar" basándote en mi "Instrucción de Edición". Devuelve SOLAMENTE el párrafo completo y modificado, sin ningún comentario introductorio. Tu respuesta debe ser solo el texto del párrafo reescrito. Asegúrate de que encaje de forma natural con el contexto proporcionado.

Contexto Anterior (si existe):
---
${prevParagraph}
---

Párrafo a Editar:
---
${paragraphToEdit}
---

Contexto Posterior (si existe):
---
${nextParagraph}
---

Instrucción de Edición: "${instruction}"

Párrafo Reescrito:`;

    try {
        const stream = await sendMessageToChatStream(chatToUse, editRequestToAI);
        const modelMessageId = crypto.randomUUID();
        setConversation(prev => [...prev, { id: modelMessageId, role: 'model', content: '', feedback: null }]);
        
        let rewrittenParagraph = '';
        for await (const chunk of stream) {
            // NOTE: This specialized request should NOT return artifacts. We only process text.
            rewrittenParagraph += chunk.text;

            const updatedParagraphs = [...paragraphs];
            updatedParagraphs[paragraphIndex] = rewrittenParagraph;
            const newFullText = updatedParagraphs.join('\n\n');
            
            setInternalPureStoryText(newFullText);
            setConversation(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, content: rewrittenParagraph.trim() } : msg
            ));
        }

        const finalParagraphs = [...paragraphs];
        finalParagraphs[paragraphIndex] = rewrittenParagraph.trim();
        const finalFullText = finalParagraphs.join('\n\n');

        // Trigger artifact generation after successful paragraph edit
        setStreamCompletionData({ text: finalFullText, chat: chatToUse, artifacts: null, actionType: 'edit_paragraph' });

    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Ocurrió un error desconocido al editar el párrafo.");
        }
    } finally {
        setIsProcessingTextGeneration(false);
        setCurrentActionType(null);
    }
  }, [ensureChatSession, internalPureStoryText, setError, stopAudioPlayback, clearBranchingChoices]);

  const handleSurpriseMeRequest = useCallback(async () => {
    if (!internalPureStoryText.trim()) {
      setError("Necesitas una historia activa para usar esta opción.");
      return;
    }
    const chatToUse = ensureChatSession();
    const userDisplayContent = "Elegí: Algo Inesperado";
    let aiInstruction = "Continúa la historia de una manera completamente inesperada y sorprendente. Introduce un giro argumental, un nuevo personaje o un evento que cambie la dinámica actual drásticamente. Sorpréndeme.";
    if (emotionalTone !== 'default' && EMOTIONAL_TONE_OPTIONS[emotionalTone]) {
      aiInstruction += ` Mientras haces eso, asegúrate que este segmento también refleje un tono de "${EMOTIONAL_TONE_OPTIONS[emotionalTone]}".`;
    }
    await commonStoryUpdateLogic(chatToUse, userDisplayContent, aiInstruction, 'surprise');
  }, [ensureChatSession, internalPureStoryText, commonStoryUpdateLogic, setError, emotionalTone]); 

  const handleDeepenSceneRequest = useCallback(async () => {
    if (!internalPureStoryText.trim()) {
      setError("Necesitas una historia activa para usar esta opción.");
      return;
    }
    const chatToUse = ensureChatSession();
    const userDisplayContent = "Elegí: Profundizar Escena";
    let aiInstruction = "Profundiza en la última escena o párrafo de la historia. No avances la trama principal de forma significativa. En lugar de eso, añade más detalles descriptivos, sensoriales (sonidos, olores, texturas), pensamientos internos o emociones de los personajes. Enriquece la atmósfera y el momento actual. Hazlo evocador y detallado.";
    if (emotionalTone !== 'default' && EMOTIONAL_TONE_OPTIONS[emotionalTone]) {
      aiInstruction += ` Mientras haces eso, asegúrate que este segmento también refleje un tono de "${EMOTIONAL_TONE_OPTIONS[emotionalTone]}".`;
    }
    await commonStoryUpdateLogic(chatToUse, userDisplayContent, aiInstruction, 'deepen');
  }, [ensureChatSession, internalPureStoryText, commonStoryUpdateLogic, setError, emotionalTone]); 

  const handleFeedback = useCallback((messageId: string, feedbackType: 'up' | 'down') => {
    setConversation(prevConversation =>
      prevConversation.map(msg => {
        if (msg.id === messageId && msg.role === 'model') {
          const newFeedback = msg.feedback === feedbackType ? null : feedbackType;
          return { ...msg, feedback: newFeedback };
        }
        return msg;
      })
    );
  }, [setConversation]);

  const primeChatWithLoadedStory = useCallback((loadedStoryContent: string) => {
    stopAudioPlayback();
    setError(null);
    setStreamCompletionData(null); 
    
    const loadedModelMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      content: loadedStoryContent,
      feedback: null,
    };

    setConversation([loadedModelMessage]);
    setInternalPureStoryText(loadedStoryContent);
    setActiveChat(null);
    clearBranchingChoices();
    
    setContinuePromptState('');
    setRewritePromptState('');
  }, [
    stopAudioPlayback, setError, clearBranchingChoices, 
    setContinuePromptState, setRewritePromptState
  ]);

  const handleGenerateChoicesForText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsGeneratingChoices(true);
    setError(null);
    try {
      const choices = await generateContinuationChoices(text);
      setBranchingChoices(choices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar opciones de continuación.');
      setBranchingChoices([]);
    } finally {
      setIsGeneratingChoices(false);
    }
  }, [setError]);

  return {
    activeChat,
    conversation,
    pureStoryText: internalPureStoryText,
    isProcessingTextGeneration,
    currentActionType,
    branchingChoices,
    isGeneratingChoices,
    lastModelMessageId,
    lastModelMessageFeedback,
    streamCompletionData,
    handleStartNewStory,
    handleContinueStory,
    handleRewriteStory,
    handleEditParagraph,
    handleSurpriseMeRequest,
    handleDeepenSceneRequest,
    clearBranchingChoices,
    handleFeedback,
    primeChatWithLoadedStory,
    handleGenerateChoicesForText,
    getInternalPureStoryText,
    setBranchingChoices,
    setIsGeneratingChoices,
  };
};
