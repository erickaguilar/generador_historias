# Registro de Cambios (Changelog)

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.7.3] - 2026-10-25

### Añadido
- **Soporte "Bring Your Own Key" (BYOK)**: Nueva sección en Ajustes para que los usuarios puedan ingresar su propia clave de API de Gemini de forma segura, almacenada localmente en IndexedDB sin exponer cuotas en despliegues públicos.
- Conexión dinámica en `geminiService.ts` para alternar entre la clave del usuario o la clave por defecto de entorno.

### Eliminado
- Bloque `<script type="importmap">` obsoleto en `index.html`, unificando la resolución de dependencias exclusivamente a través de Vite.

---

## [1.7.2] - 2026-10-25

### Añadido
- Archivo `vercel.json` con reglas de reescritura para compatibilidad completa con Single Page Applications (SPA) en Vercel.
- Soporte para variables de entorno tanto `GEMINI_API_KEY` como `API_KEY` en `vite.config.ts`.
- Archivos `.env`, `.env.*` y `.env.local` incluidos en `.gitignore` para proteger credenciales.
- Archivo de licencia `LICENSE` (MIT) y `CHANGELOG.md`.

### Cambiado
- Reestructuración de assets estáticos moviéndolos a la carpeta `public/` (`favicon.ico`, `manifest.json`, `sw.js`, `/img`, `/font`) garantizando su inclusión limpia en la compilación de producción con Vite.
- Optimización de `sw.js` para precachear la shell de la aplicación de producción en lugar de archivos fuente de desarrollo.
- Actualización completa de la documentación en `README.md` con guías de despliegue en Vercel y estructura de directorios actualizada.

---

## [1.7.0] - 2025-10-15

### Añadido
- **Libro de Lore (Lore Book)**: Creación de memoria persistente para personajes y elementos del mundo, inyectada dinámicamente en las instrucciones del sistema (*system instructions*) de la IA.
- Generación de historias en streaming con extracción híbrida de artefactos estructurados (`<<ARTIFACTS>>`) para obtener simultáneamente prosa fluida, títulos sugeridos y opciones de continuación en una sola llamada.
- Acciones narrativas avanzadas: "Algo Inesperado" (*Surprise Me*), "Profundizar Escena" y reescritura a nivel de párrafo.

---

## [1.6.0] - 2025-09-02

### Añadido
- Integración con el modelo `imagen-3.0-generate-002` para ilustrar automáticamente escenas clave.
- Generación de imágenes específicas para párrafos individuales con un solo clic.
- Galería visual dedicada por historia con almacenamiento de imágenes en IndexedDB.
- Modal de edición guiada de imágenes mediante prompts de refinamiento a la IA.

---

## [1.5.0] - 2025-07-20

### Añadido
- Reproductor de audio narrativo con sintetizador de voz nativo (Web Speech API).
- Exportación profesional a PDF mediante `jsPDF`, con inclusión opcional de la portada/ilustración y cálculo automático de paginación.
- Soporte de temas Claro y Oscuro sincronizados con las preferencias del sistema y persistidos en base de datos.

---

## [1.4.0] - 2025-05-12

### Añadido
- Funcionalidad PWA (Progressive Web App):
  - Service Worker para soporte offline y almacenamiento en caché.
  - Manifiesto e iconos para diferentes densidades de pantalla.
  - Modales guía de instalación rápida para navegadores móviles y Safari (iOS).

---

## [1.0.0] - 2025-04-01

### Añadido
- Lanzamiento inicial del Generador de Historias Interactivas.
- Integración con Google Gemini API (`@google/genai`).
- Panel de configuración narrativa avanzada: estilo, tono emocional, punto de vista (POV), longitud y restricciones de palabras clave.
- Persistencia local de historias y configuraciones mediante Dexie.js (IndexedDB).
