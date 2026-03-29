export const GEMINI_MODEL_NAME = "gemini-2.5-flash";
export const LOADING_DYNAMIC_PLACEHOLDER_MESSAGE = "Cargando ejemplo creativo...";
export const STATIC_PLACEHOLDER_PROMPTS = [
    "Un farero que descubre una ciudad submarina luminiscente.",
    "Una detective que resuelve crímenes en un mundo donde los sueños son evidencia.",
    "Un chef que puede cocinar emociones en sus platos.",
    "Un astronauta perdido en un planeta de dulces gigantes.",
    "Un bibliotecario que descubre que los libros le susurran secretos por la noche.",
    "Un niño que se hace amigo de su propia sombra, que tiene vida propia.",
    "Una florista que puede ver los recuerdos de las personas a través de las flores que tocan.",
];
export const DEFAULT_STORY_SECTION_TITLE = "Tu Historia Completa";

export const PREDEFINED_NARRATIVE_STYLES: Record<string, string> = {
  default: "Por defecto (Inmersivo y Descriptivo)",
  epic_fantasy: "Aventura Épica y Fantástica",
  sci_fi_classic: "Ciencia Ficción Clásica",
  gothic_horror: "Terror Gótico y Atmosférico",
  noir_mystery: "Misterio y Suspense (Noir)",
  light_comedy: "Comedia Ligera y Humorística",
  realistic_drama: "Drama Realista y Emotivo",
  fairy_tale: "Cuento de Hadas Tradicional",
  custom: "Personalizado (usar descripción abajo)"
};

export const NARRATIVE_STYLE_PROMPTS_MAP: Record<string, string> = {
  epic_fantasy: "Narra una aventura épica en un mundo de fantasía grandioso, con héroes valientes, magia poderosa y criaturas míticas. Enfócate en la escala, el asombro y el viaje heroico.",
  sci_fi_classic: "Adopta un estilo de ciencia ficción clásica, explorando conceptos futuristas, viajes espaciales, tecnología avanzada y sus implicaciones sociales o filosóficas. Tono reflexivo y maravillado.",
  gothic_horror: "Crea una atmósfera de terror gótico, con escenarios lúgubres, suspense palpable y elementos sobrenaturales o psicológicos. Enfócate en la ambientación, el misterio y la sensación de inquietud.",
  noir_mystery: "Estilo de misterio y suspense noir, con un detective cínico, una trama intrincada, femme fatales y una atmósfera oscura y lluviosa. Diálogos cortantes y un tono pesimista.",
  light_comedy: "Escribe con un tono de comedia ligera y humorística. Busca situaciones divertidas, diálogos ingeniosos y personajes excéntricos. El objetivo es entretener y hacer sonreír.",
  realistic_drama: "Narra un drama realista y emotivo. Concéntrate en las relaciones humanas, los conflictos internos de los personajes y las situaciones creíbles que evocan empatía.",
  fairy_tale: "Cuenta la historia como un cuento de hadas tradicional, con moralejas, personajes arquetípicos (princesas, brujas, animales que hablan) y un toque de magia y encanto.",
  // 'default' se traduce a un prompt vacío.
  // 'custom' usa el texto del textarea.
};

export enum StoryPOV {
  Default = 'default',
  FirstPerson = 'first_person',
  ThirdPersonLimited = 'third_person_limited',
  ThirdPersonOmniscient = 'third_person_omniscient',
}

export const PREDEFINED_STORY_POVS: Record<StoryPOV, string> = {
  [StoryPOV.Default]: "Por defecto (Tercera Persona Limitada)",
  [StoryPOV.FirstPerson]: "Primera Persona (Yo/Nosotros)",
  [StoryPOV.ThirdPersonLimited]: "Tercera Persona Limitada (Él/Ella/Elle - foco en un personaje)",
  [StoryPOV.ThirdPersonOmniscient]: "Tercera Persona Omnisciente (Narrador que todo lo sabe)",
};

export const STORY_POV_PROMPTS_MAP: Record<StoryPOV, string> = {
  [StoryPOV.Default]: "Narra la historia principalmente en tercera persona limitada. Sigue de cerca a un personaje principal, revelando sus pensamientos, sentimientos y percepciones. Aunque usas pronombres como 'él', 'ella' o 'elle', la perspectiva está anclada a ese único personaje en cada escena.",
  [StoryPOV.FirstPerson]: "Narra la historia en primera persona, utilizando 'Yo' o 'Nosotros'. El lector debe experimentar el mundo directamente a través de los ojos, pensamientos y sentimientos del personaje narrador.",
  [StoryPOV.ThirdPersonLimited]: "Narra la historia en tercera persona limitada. Sigue de cerca a un personaje principal, revelando sus pensamientos, sentimientos y percepciones. Aunque usas pronombres como 'él', 'ella' o 'elle', la perspectiva está anclada a ese único personaje en cada escena.",
  [StoryPOV.ThirdPersonOmniscient]: "Narra la historia en tercera persona omnisciente. Como narrador, tienes conocimiento completo de los pensamientos, sentimientos y acciones de todos los personajes. Puedes moverte libremente entre diferentes perspectivas y ofrecer información que los personajes individuales desconocen. Revela motivaciones ocultas y el panorama general de la trama.",
};

export const EMOTIONAL_TONE_OPTIONS = {
  default: "Ninguno / Por defecto",
  suspense: "Suspenso",
  melancholy: "Melancolía",
  absurd_humor: "Humor Absurdo",
  hope: "Esperanza",
  romantic_tension: "Tensión Romántica",
  eerie_mystery: "Misterio Inquietante",
  joyful_excitement: "Alegría y Emoción",
  dread_foreboding: "Temor y Presagio",
  peaceful_serenity: "Paz y Serenidad",
  intense_action: "Acción Intensa",
} as const;

export type EmotionalToneKey = keyof typeof EMOTIONAL_TONE_OPTIONS;

export const STORY_LENGTH_OPTIONS = {
  default: "Desarrollo Moderado (Por defecto)",
  brief: "Breve y al Grano",
  detailed: "Extenso y Detallado",
} as const;

export type StoryLengthKey = keyof typeof STORY_LENGTH_OPTIONS;

export const STORY_LENGTH_PROMPTS_MAP: Record<StoryLengthKey, string> = {
  default: "Genera continuaciones de longitud y detalle moderados, balanceando el avance de la trama con la descripción necesaria. Apunta a unos pocos párrafos bien desarrollados por respuesta.",
  brief: "Genera continuaciones breves y concisas. Enfócate en el avance rápido de la trama con descripciones esenciales. Apunta a uno o dos párrafos cortos y directos por respuesta.",
  detailed: "Genera continuaciones extensas y ricas en detalles. Profundiza en descripciones, pensamientos de personajes y desarrollo de la atmósfera. Apunta a múltiples párrafos largos y elaborados por respuesta.",
};