import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../src/constants';

const DEFAULT_ENV_API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
let customApiKey: string | null = null;
let ai: GoogleGenAI | null = null;
let currentKeyInUse: string | null = null;

export const setCustomApiKey = (key: string | null) => {
  const sanitized = key && key.trim() !== '' ? key.trim() : null;
  if (sanitized !== customApiKey) {
    customApiKey = sanitized;
    ai = null; // Reinitialize on next request
    currentKeyInUse = null;
  }
};

export const getActiveApiKey = (): string => {
  if (customApiKey) return customApiKey;
  return DEFAULT_ENV_API_KEY;
};

const getInitializedAI = (): GoogleGenAI => {
  const activeKey = getActiveApiKey();
  if (!activeKey) {
    throw new Error(
      "La API Key de Gemini no está configurada. " +
      "Por favor ingresa tu API Key en la pestaña de 'Ajustes' o configúrala en las variables de entorno."
    );
  }

  if (!ai || currentKeyInUse !== activeKey) {
    try {
      ai = new GoogleGenAI({ apiKey: activeKey });
      currentKeyInUse = activeKey;
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI with key:", error);
      throw new Error("No se pudo inicializar la API de Gemini con la clave proporcionada.");
    }
  }
  return ai;
};

const handleGeminiApiError = (error: unknown, context: string): Error => {
  console.error(`Error calling Gemini API (${context}):`, error);
  
  // Check for offline status first, as it's a very common issue on mobile.
  if (!navigator.onLine) {
    return new Error("Estás desconectado. Revisa tu conexión a internet para comunicarte con la IA.");
  }

  if (error instanceof Error) {
    // Handle specific, common network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return new Error("Error de red. No se pudo contactar con los servicios de IA. Por favor, comprueba tu conexión a internet e inténtalo de nuevo.");
    }
    
    if (error.message.includes("API key not valid")) {
      // Detect Apple devices, as they might have stricter privacy settings (like ITP in Safari)
      // that can interfere with HTTP Referrer restrictions on API keys.
      const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !(window as any).MSStream;
      let errorMessage = "La API Key de Gemini no es válida. Por favor, verifica tu configuración.";
      if (isAppleDevice) {
        errorMessage += " En dispositivos Apple, este error a menudo se debe a restricciones de 'Referente HTTP' en la clave de API (en Google Cloud Console), que pueden ser bloqueadas por la configuración de privacidad de Safari. Considera revisar o eliminar temporalmente esta restricción para diagnosticar el problema.";
      }
      return new Error(errorMessage);
    }
    if (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED")) {
      return new Error(
        "Has excedido tu cuota actual de la API de Gemini o el límite de solicitudes. " +
        "Por favor, revisa tu plan y detalles de facturación en Google AI Studio o Google Cloud Console. " +
        "Puedes encontrar más información sobre este error en: https://ai.google.dev/gemini-api/docs/rate-limits"
      );
    }
    if (error.message.includes("404") || error.message.includes("NOT_FOUND")) {
      return new Error("El modelo de IA solicitado no se encuentra disponible (404). Es posible que el servicio esté en mantenimiento o el modelo haya cambiado.");
    }
    return new Error(`Error al comunicarse con la IA (${context}): ${error.message}`);
  }
  return new Error(`Ocurrió un error desconocido al contactar la IA (${context}).`);
};


export const createChatInstance = (systemInstruction: string): Chat => {
  const initializedAI = getInitializedAI();
  
  return initializedAI.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.78, 
      topK: 40,
      topP: 0.95,
    },
  });
};

export const sendMessageToChatStream = async (chat: Chat, message: string) => {
  if (!chat) {
    throw new Error("Chat session is not initialized.");
  }
  try {
    return await chat.sendMessageStream({ message });
  } catch (error) {
    throw handleGeminiApiError(error, "sendMessageToChatStream");
  }
};

export const generateStoryMetadata = async (storyContent: string): Promise<{
    title: string;
    imagePrompt: string;
    choices: string[];
}> => {
  if (!storyContent.trim()) {
    throw new Error("El contenido de la historia está vacío, no se pueden generar metadatos.");
  }
  const initializedAI = getInitializedAI();
  try {
    const prompt = `Analiza el siguiente texto de una historia y genera un objeto JSON con tres propiedades: "title", "imagePrompt" y "choices".
- "title": Un título corto, atractivo y creativo para la historia completa. Máximo 10 palabras.
- "imagePrompt": Una descripción concisa (2-3 frases) para un generador de imágenes, basada en los eventos o la atmósfera del *último* segmento de la historia. Debe ser muy visual y descriptiva.
- "choices": Un array con exactamente 3 opciones de continuación distintas, breves (máximo 15 palabras cada una) y accionables.

Historia:
---
${storyContent.slice(-4000)}
---

Devuelve únicamente el objeto JSON válido.`;

    const response = await initializedAI.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Un título corto y creativo para la historia.",
            },
            imagePrompt: {
              type: Type.STRING,
              description: "Un prompt visual y descriptivo para un generador de imágenes, basado en el último segmento de la historia.",
            },
            choices: {
              type: Type.ARRAY,
              description: "Exactamente 3 opciones breves y accionables para continuar la historia.",
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["title", "imagePrompt", "choices"],
        },
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    try {
        const parsedData = JSON.parse(jsonStr);
        if (
            parsedData &&
            typeof parsedData.title === 'string' &&
            typeof parsedData.imagePrompt === 'string' &&
            Array.isArray(parsedData.choices) &&
            parsedData.choices.every((c: unknown) => typeof c === 'string')
        ) {
            parsedData.title = parsedData.title.replace(/^["'](.*)["']$/, '$1');
            return {
                ...parsedData,
                choices: parsedData.choices.slice(0, 3)
            };
        } else {
            throw new Error("La IA no generó los metadatos en el formato esperado.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response for metadata:", e, "Raw response:", jsonStr);
        throw new Error("La IA no generó los metadatos en un formato JSON válido.");
    }

  } catch (error) {
    throw handleGeminiApiError(error, "generateStoryMetadata");
  }
};

export const generateContinuationChoices = async (storyContent: string): Promise<string[]> => {
  if (!storyContent.trim()) {
    console.warn("Story content is empty, cannot generate choices.");
    return [];
  }
  const initializedAI = getInitializedAI();
  try {
    const prompt = `Analiza el siguiente texto de una historia y genera un array de JSON con exactamente 3 opciones de continuación distintas, breves (máximo 15 palabras cada una) y accionables.

Historia:
---
${storyContent.slice(-4000)}
---

Devuelve únicamente el array JSON válido de strings.`;

    const response = await initializedAI.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Un array con exactamente 3 opciones breves y accionables para continuar la historia.",
          items: {
            type: Type.STRING,
            description: "Una opción de continuación.",
          },
        },
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    try {
        const parsedData = JSON.parse(jsonStr);
        if (Array.isArray(parsedData) && parsedData.every((c: unknown) => typeof c === 'string')) {
            return parsedData.slice(0, 3);
        } else {
            throw new Error("La IA no generó las opciones en el formato esperado.");
        }
    } catch (e) {
        console.error("Failed to parse JSON response for choices:", e, "Raw response:", jsonStr);
        throw new Error("La IA no generó las opciones en un formato JSON válido.");
    }

  } catch (error) {
    throw handleGeminiApiError(error, "generateContinuationChoices");
  }
};

export const generateStoryImage = async (imagePrompt: string): Promise<string> => {
  if (!imagePrompt.trim()) {
    throw new Error("El prompt para la imagen está vacío.");
  }
  const initializedAI = getInitializedAI();
  try {
    // Switch to gemini-2.5-flash-image via generateContent
    const response = await initializedAI.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64EncodeString: string = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64EncodeString}`;
        }
      }
    }
    
    console.error("No image generated or unexpected response format (generateStoryImage):", response);
    throw new Error("La IA no generó una imagen válida o la respuesta no tuvo el formato esperado.");

  } catch (error) {
    throw handleGeminiApiError(error, "generateStoryImage");
  }
};
