# Generador de Historias Interactivas con IA

Una aplicación web progresiva (PWA) que utiliza la **API de Google Gemini** para crear, continuar y dar forma a historias únicas y creativas de forma conversacional. Inicia con una idea y colabora con la IA para desarrollar la trama, los personajes y el mundo.

---

## ✨ Características Principales

-   **Generación Inteligente de Relatos**: Inicia una historia desde cero con una simple idea. La IA, impulsada por `gemini-2.5-flash`, crea un comienzo evocador y coherente.
-   **Narrativa Conversacional y Dinámica**: Guía el curso de la historia con tus propias palabras, o elige entre opciones de continuación, giros inesperados ("Algo Inesperado") o escenas detalladas ("Profundizar Escena") que la IA propone.
-   **Control Creativo Total (Ajustes Avanzados)**: Moldea la voz de la IA con un control granular sin precedentes:
    -   **Estilo Narrativo**: Elige entre estilos predefinidos (Fantasía, Noir, etc.) o describe tu propio estilo personalizado.
    -   **Punto de Vista (POV)**: Narra en primera, tercera persona limitada u omnisciente.
    -   **Tono Emocional**: Infunde a la historia un ambiente específico (suspenso, melancolía, alegría).
    -   **Parámetros de Trama**: Define un tema central, un "MacGuffin", palabras clave a incluir/evitar, y más.
-   **Libro de Lore (World-Building Persistente)**: ¡La clave para la coherencia! Define tus personajes, lugares y conceptos únicos en un "lore book". La IA consultará esta "biblia" en cada generación para mantener la consistencia a lo largo de historias extensas.
-   **Universo Visual**:
    -   **Ilustración Principal**: Genera una imagen única para tu historia usando `imagen-3.0-generate-002`, que captura la esencia del último capítulo.
    -   **Generación por Párrafo**: ¿Te encanta una escena? Genera una imagen específica para cualquier párrafo con un solo clic.
    -   **Galería de la Historia**: Guarda tus imágenes favoritas en una galería dedicada para cada historia.
    -   **Modificación de Imágenes**: ¿No te convence la imagen? Dale instrucciones a la IA para que la modifique.
-   **Escucha tus Creaciones**: Utiliza la síntesis de voz del navegador para reproducir la historia completa o solo los fragmentos más recientes.
-   **Gestión de Historias Offline**:
    -   **Almacenamiento Local**: Guarda tus historias (texto, imagen principal y galería completa) en tu navegador usando IndexedDB.
    -   **Carga y Edita**: Carga historias guardadas para continuarlas, o edita su título y contenido en cualquier momento.
-   **Exportación Profesional**: Descarga tu historia completa, con título e imagen principal, en un archivo PDF con formato cuidado.
-   **Experiencia PWA Moderna**: Instala la aplicación en tu escritorio o móvil para un acceso rápido, con soporte completo para funcionar sin conexión a internet.

---

## 🛠️ Tecnologías Utilizadas

-   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
-   **Inteligencia Artificial**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`) usando los modelos `gemini-2.5-flash` y `imagen-3.0-generate-002`.
-   **Base de Datos Local**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) a través de [Dexie.js](https://dexie.org/)
-   **Generación de PDF**: [jsPDF](https://github.com/parallax/jsPDF)
-   **Soporte Offline**: Service Workers (PWA)

---

## 🚀 Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### Prerrequisitos

-   [Node.js](https://nodejs.org/) (versión 18.x o superior)
-   [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
-   Una clave de API de **Google Gemini**. Puedes obtenerla en [Google AI Studio](https://ai.google.dev/pricing).

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/generador-historias-ia.git
    cd generador-historias-ia
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```

3.  **Configura tu clave de API:**
    Este proyecto requiere una clave de API de Google Gemini para funcionar. La aplicación está configurada para leer la clave desde una variable de entorno `API_KEY`. Deberás configurar esta variable en tu entorno de desarrollo. La forma de hacerlo depende de tu sistema y de la herramienta que uses para ejecutar el proyecto (por ejemplo, creando un archivo `.env` si usas un bundler como Vite o Create React App). El código fuente (`services/geminiService.ts`) te guiará con un mensaje de error si la clave no se encuentra.

4.  **Ejecuta el servidor de desarrollo:**
    La forma de ejecutar el proyecto dependerá de tu configuración local (ej. `npm run dev`).

---

## 📂 Estructura del Proyecto

El código fuente está organizado de la siguiente manera para mantener la modularidad y la escalabilidad:

```
/src
|-- /components     # Componentes de React reutilizables (UI)
|-- /constants.ts   # Constantes de la aplicación (prompts, opciones, etc.)
|-- /db.ts          # Configuración y helpers de Dexie.js para IndexedDB
|-- /hooks          # Hooks de React personalizados para encapsular lógica
|-- /services       # Comunicación con APIs externas (Gemini API)
|-- /systemInstructions.ts # Lógica para construir el prompt del sistema para la IA
|-- /types.ts       # Definiciones de tipos y interfaces de TypeScript
|-- App.tsx         # Componente principal de la aplicación
|-- index.tsx       # Punto de entrada de React
/public             # Archivos estáticos (íconos, manifest.json)
/utils              # Funciones de utilidad (ej: generación de PDF)
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si tienes una idea para una nueva característica o has encontrado un error, por favor sigue estos pasos:

1.  Haz un "Fork" del repositorio.
2.  Crea una nueva rama (`git checkout -b feature/nueva-caracteristica`).
3.  Realiza tus cambios y haz "commit" (`git commit -am 'Añade nueva característica'`).
4.  Haz "push" a la rama (`git push origin feature/nueva-caracteristica`).
5.  Crea un nuevo "Pull Request".

---

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
