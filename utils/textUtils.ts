
const SPANISH_STOP_WORDS = new Set([
  // Articles
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  // Prepositions
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 
  'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'so', 
  'sobre', 'tras', 'versus', 'vía',
  // Conjunctions
  'y', 'e', 'ni', 'que', 'o', 'u', 'pero', 'mas', 'sino', 'aunque', 'si',
  // Pronouns
  'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la', 'los', 'las',
  'yo', 'tú', 'él', 'ella', 'ello', 'nosotros', 'nosotras', 'vosotros', 'vosotras',
  'ellos', 'ellas', 'usted', 'ustedes', 'mi', 'tu', 'su', 'mis', 'tus', 'sus',
  'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya',
  'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro',
  'vuestra', 'vuestros', 'vuestras', 'al', 'del',
  // Verbs (common forms)
  'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
  'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer',
  'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'poder', 'sentir',
  'es', 'son', 'fue', 'era', 'eran', 'fueron', 'ha', 'han', 'habia', 'habían', 'hecho',
  'tiene', 'tienen', 'tenía', 'tenían', 'hizo', 'hicieron', 'dice', 'dicen',
  'va', 'van', 'fue', 'fueron', 've', 'ven', 'vio', 'vieron', 'puede', 'pueden',
  // Adverbs & others
  'más', 'muy', 'mucho', 'ya', 'todo', 'todos', 'toda', 'todas', 'también', 'así', 'no', 'sí', 'si', 'solo', 'sólo',
  'cuando', 'como', 'donde', 'porque', 'mientras', 'entonces', 'su', 'sus', 'qué', 'quién',
  'fue', 'había'
]);

export const calculateWordFrequency = (text: string): Map<string, number> => {
  const frequencies = new Map<string, number>();
  if (!text) return frequencies;

  const words = text
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .match(/[\wáéíóúüñ]+/g); // Match words including accents and ñ

  if (!words) return frequencies;

  for (const word of words) {
    if (word.length > 2 && !SPANISH_STOP_WORDS.has(word)) {
      const count = frequencies.get(word) || 0;
      frequencies.set(word, count + 1);
    }
  }

  return frequencies;
};
