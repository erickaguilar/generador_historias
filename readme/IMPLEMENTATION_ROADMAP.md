# Roadmap de Implementación: Visualizaciones Avanzadas

Este documento describe una ruta de trabajo por fases para implementar nuevas y potentes visualizaciones en la aplicación, como un gráfico de interacciones entre personajes y una línea de tiempo de la historia.

El objetivo es enriquecer la capacidad del usuario para analizar y comprender la estructura narrativa de sus creaciones, añadiendo valor de manera incremental.

---

## Fase 1: Nube de Palabras y Cimientos para Visualizaciones (Implementado)

Esta fase inicial, que ya está completada, sienta las bases para futuras visualizaciones más complejas.

-   **Objetivo del Usuario:** Obtener una visión rápida de los temas y palabras más recurrentes en la historia.
-   **Componentes Clave:**
    -   `src/components/StoryVisualizationModal.tsx`: El componente modal que alberga las visualizaciones.
    -   `utils/textUtils.ts`: La lógica para procesar el texto y calcular la frecuencia de las palabras, excluyendo las "stop words".
    -   **Canvas API**: Se utiliza para dibujar la nube de palabras de forma dinámica y eficiente.
-   **Estado:** ✅ **Completado**.

---

## Fase 2: Gráfico de Interacciones de Personajes

Esta fase se centra en dar vida a las relaciones y dinámicas sociales de la historia.

-   **Objetivo del Usuario:** Visualizar quiénes son los personajes centrales, quién interactúa con quién y la naturaleza de esas interacciones, permitiendo un análisis profundo de la estructura social de la narrativa.

-   **Pasos Técnicos:**

    1.  **Modificación de la IA (Gemini):**
        -   **Acción:** Actualizar el `systemInstruction` en `src/systemInstructions.ts`.
        -   **Detalle:** Se añadirá una nueva propiedad al objeto JSON de `<<ARTIFACTS>>` llamada `characterInteractions`. Se le pedirá a la IA que, además de la narrativa, extraiga las interacciones clave en un formato estructurado como: `[{ source: "Personaje A", target: "Personaje B", interaction: "habló con" }, ...]`. Se le darán instrucciones para que reconozca estas interacciones a partir del diálogo y las acciones.

    2.  **Procesamiento de Datos:**
        -   **Acción:** Adaptar el hook `src/hooks/useStoryChat.ts`.
        -   **Detalle:** El hook deberá procesar el nuevo array `characterInteractions` recibido del stream de la IA y pasarlo al estado correspondiente.

    3.  **Componente de Visualización (`CharacterGraph.tsx`):**
        -   **Acción:** Crear un nuevo componente de React.
        -   **Detalle:** Este componente recibirá la lista de interacciones. Usando SVG, representará a cada personaje como un nodo (círculo) y cada interacción como una línea (arco) que conecta dos nodos. Se puede usar un algoritmo de layout de fuerza simple (force-directed graph) para posicionar los nodos de forma orgánica, donde los personajes con más interacciones tiendan a estar en el centro.

    4.  **Integración en la UI:**
        -   **Acción:** Modificar `src/components/StoryVisualizationModal.tsx`.
        -   **Detalle:** Se añadirá un sistema de pestañas o botones dentro del modal para que el usuario pueda cambiar entre "Nube de Palabras" y "Gráfico de Personajes". El componente `CharacterGraph` se renderizará cuando su pestaña esté activa.

---

## Fase 3: Línea de Tiempo Narrativa

Esta fase se enfoca en visualizar la progresión y evolución de la trama a lo largo del tiempo.

-   **Objetivo del Usuario:** Entender cómo evolucionan los temas, el tono o la participación de los personajes a lo largo de la historia. Identificar puntos de inflexión clave y analizar el ritmo narrativo.

-   **Pasos Técnicos:**

    1.  **Modificación de la IA (Gemini):**
        -   **Acción:** Actualizar de nuevo el `systemInstruction` en `src/systemInstructions.ts`.
        -   **Detalle:** Se añadirá otra propiedad al JSON de `<<ARTIFACTS>>` llamada `timelineEvents`. Se instruirá a la IA para que segmente la historia en partes lógicas (capítulos o escenas) y, para cada una, genere un objeto con un resumen muy breve y las palabras clave principales. Formato: `[{ segment: 1, summary: "Elara encuentra el mapa", keywords: ["mapa", "misterio"] }, ...]`.

    2.  **Procesamiento de Datos:**
        -   **Acción:** Ampliar de nuevo el hook `src/hooks/useStoryChat.ts`.
        -   **Detalle:** El hook procesará el array `timelineEvents` y lo almacenará.

    3.  **Componente de Visualización (`StoryTimeline.tsx`):**
        -   **Acción:** Crear un nuevo componente de React.
        -   **Detalle:** Este componente renderizará una línea horizontal (o vertical) que representa el tiempo. Cada evento de la línea de tiempo se marcará como un punto en esta línea. Al pasar el cursor o hacer clic en un punto, se mostrará una tarjeta de información (tooltip) con el resumen y las palabras clave del segmento. El tamaño o color del punto podría representar la intensidad o importancia del evento.

    4.  **Integración en la UI:**
        -   **Acción:** Añadir una nueva pestaña a `src/components/StoryVisualizationModal.tsx`.
        -   **Detalle:** El modal de visualización ahora tendrá tres opciones: "Nube de Palabras", "Gráfico de Personajes" y "Línea de Tiempo", permitiendo un análisis multifacético de la historia generada.

---

Este enfoque por fases garantiza que cada nueva característica se construya sobre una base sólida, minimizando la complejidad y permitiendo pruebas y validación en cada etapa del desarrollo.
