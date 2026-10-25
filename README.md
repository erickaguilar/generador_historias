# Generador de Historias Interactivas con IA

Una aplicación web progresiva (PWA) moderna que utiliza la **API de Google Gemini** y modelos de generación de imágenes para crear, continuar y enriquecer historias literarias interactivas de forma colaborativa y conversacional.

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)

---

## ✨ Características Principales

- **Generación Inteligente de Relatos**: Inicia una historia desde una simple premisa. La IA, potenciada por `gemini-2.5-flash`, crea un comienzo evocador y coherente.
- **Narrativa Conversacional y Dinámica**: Guía el curso de la historia con tus propias palabras o elige entre opciones de ramificación generadas dinámicamente, giros inesperados (*"Algo Inesperado"*) o descripciones profundas (*"Profundizar Escena"*).
- **Control Creativo Total (Ajustes Avanzados)**:
  - **Estilo Narrativo**: Selección entre estilos predefinidos (Fantasía, Noir, Ciencia Ficción, etc.) o descripción personalizada.
  - **Punto de Vista (POV)**: Primera persona, tercera persona limitada u omnisciente.
  - **Tono Emocional**: Suspenso, melancolía, optimismo, terror, etc.
  - **Parámetros de Trama**: Tema central, "MacGuffin", palabras clave obligatorias o a evitar.
- **Libro de Lore (World-Building Persistente)**: Define personajes y elementos del mundo en una "biblia" integrada. La IA consulta este registro en cada generación para asegurar continuidad y coherencia a largo plazo.
- **Universo Visual con Imagen 3**:
  - **Ilustración Principal**: Genera imágenes conceptuales del clímax o último fragmento usando `imagen-3.0-generate-002`.
  - **Ilustración por Párrafo**: Genera imágenes específicas para escenas concretas.
  - **Galería Integrada**: Guarda y administra todas las ilustraciones asociadas a cada historia.
  - **Refinamiento de Imágenes**: Solicita modificaciones visuales a la IA mediante lenguaje natural.
- **Reproducción por Voz**: Escucha el relato completo o los párrafos recientes utilizando la síntesis de voz nativa del navegador.
- **Gestión Local y Modo Offline**:
  - Almacenamiento local seguro en el navegador mediante **IndexedDB** ([Dexie.js](https://dexie.org/)).
  - Sin necesidad de backend externo para persistir historias, imágenes o configuraciones.
- **Exportación Profesional a PDF**: Descarga tu libro digital maquetado, incluyendo portada e ilustraciones, mediante [jsPDF](https://github.com/parallax/jsPDF).
- **PWA (Progressive Web App)**: Instálala como app nativa en Android, iOS, Windows o macOS con soporte sin conexión.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Herramienta de Compilación**: [Vite 6](https://vitejs.dev/)
- **Modelos de IA**: [Google GenAI SDK](https://github.com/google-gemini/deprecations) (`@google/genai`) con `gemini-2.5-flash` e `imagen-3.0-generate-002`
- **Base de Datos Local**: [Dexie.js](https://dexie.org/) sobre [IndexedDB](https://developer.mozilla.org/es/docs/Web/API/IndexedDB_API)
- **Generación de PDF**: [jsPDF](https://github.com/parallax/jsPDF)
- **Plataforma de Despliegue**: Optimizado para [Vercel](https://vercel.com/)

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) (o gestor equivalente: `pnpm`, `yarn`)
- Clave de API de **Google Gemini** (gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey))

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/erickaguilar/generador_historias.git
   cd generador_historias
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   GEMINI_API_KEY=tu_clave_de_api_aqui
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. **Otros scripts disponibles:**
   ```bash
   npm run build    # Compila la aplicación para producción en /dist
   npm run preview  # Previsualiza localmente el build de producción
   ```

---

## ☁️ Despliegue en Vercel

El proyecto incluye configuración lista para desplegar en **Vercel** (`vercel.json` y `vite.config.ts` optimizados):

1. Sube tu código a GitHub.
2. Ingresa a [vercel.com](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New..."** > **"Project"** y selecciona tu repositorio `generador_historias`.
4. En la sección **Environment Variables**, añade:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `Tu clave de API de Gemini`
5. Haz clic en **"Deploy"**. En cuestión de segundos tu aplicación estará en producción.

---

## 📂 Estructura del Proyecto

```text
├── public/                 # Archivos estáticos de la PWA y app shell
│   ├── favicon.ico
│   ├── font/               # Tipografías locales
│   ├── img/                # Iconos y logotipos de la PWA
│   ├── manifest.json       # Manifiesto Web App
│   └── sw.js               # Service Worker para caché y soporte offline
├── readme/                 # Documentación técnica extendida y roadmaps
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── IMPROVEMENTS_CONTEXT_AI.md
│   └── MOBILE_UI_IMPROVEMENTS.md
├── services/               # Clientes e integraciones con APIs externas (Gemini)
│   └── geminiService.ts
├── src/
│   ├── components/         # Componentes modulares de interfaz (UI)
│   ├── hooks/              # Custom React Hooks (lógica de chat, audio, lore, etc.)
│   ├── pages/              # Vistas de la aplicación (Generador, Lore, Historial, Ajustes)
│   ├── constants.ts        # Opciones, configuraciones y constantes de prompts
│   ├── db.ts               # Esquema de IndexedDB mediante Dexie
│   ├── systemInstructions.ts # Motor de compilación de prompts de sistema dinámicos
│   └── types.ts            # Tipado de TypeScript
├── utils/                  # Utilidades auxiliares (exportación a PDF, formateo)
├── App.tsx                 # Componente raíz y enrutador de vistas
├── CHANGELOG.md            # Registro histórico de versiones
├── LICENSE                 # Licencia de código abierto MIT
├── package.json            # Metadatos del proyecto y dependencias
├── vercel.json             # Configuración de reescrituras para Vercel
└── vite.config.ts          # Configuración de compilación de Vite
```

---

## 📄 Registro de Cambios

Consulta el archivo [CHANGELOG.md](./CHANGELOG.md) para conocer las novedades y notas de cada versión.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Realiza un *Fork* del repositorio.
2. Crea tu rama para la funcionalidad: `git checkout -b feature/nueva-funcionalidad`.
3. Haz *commit* de tus cambios: `git commit -m 'feat: añadir nueva funcionalidad'`.
4. Sube la rama: `git push origin feature/nueva-funcionalidad`.
5. Abre un *Pull Request*.

---

## 📜 Licencia

Este proyecto se encuentra bajo la Licencia **MIT**. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
