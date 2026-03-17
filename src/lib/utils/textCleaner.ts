/**
 * Nettoie le texte pour la synthèse vocale
 * - Supprime les marqueurs Markdown
 * - Convertit les symboles en mots
 * - Normalise la ponctuation
 */
export function cleanTextForTTS(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // 1. Supprimer les blocs de code (```code```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
  
  // 2. Supprimer le code inline (`code`)
  cleaned = cleaned.replace(/`[^`]+`/g, ' ');
  
  // 3. Supprimer les liens [texte](url) - garder seulement le texte
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // 4. Supprimer les images ![alt](url)
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ');
  
  // 5. Supprimer les marqueurs de style Markdown (**, *, _, __)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); 
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');     
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  
  // 6. Supprimer les titres (#, ##, etc.)
  cleaned = cleaned.replace(/^#+\s*/gm, '');
  
  // 7. Supprimer les puces de listes (-, *, +) au début des lignes
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
  
  // 8. Supprimer les lignes de séparation (---, ***, ___)
  cleaned = cleaned.replace(/^\s*[-*_]{3,}\s*$/gm, ' ');
  
  // 9. Supprimer les caractères d'astérisques restants (souvent utilisés pour l'emphase ou listes)
  cleaned = cleaned.replace(/\*/g, ' ');
  
  // 10. Convertir les symboles courants pour une meilleure lecture
  const symbols: Record<string, string> = {
    '&': ' et ',
    '@': ' arobase ',
    '%': ' pourcent ',
    '#': ' dièse ',
    '+': ' plus ',
    '=': ' égal ',
  };
  
  for (const [symbol, word] of Object.entries(symbols)) {
    cleaned = cleaned.replace(new RegExp('\\' + symbol, 'g'), word);
  }
  
  // 11. Normaliser les espaces et retours à la ligne
  cleaned = cleaned.replace(/\n/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Version plus agressive pour les cas extrêmes
 */
export function cleanTextAggressive(text: string): string {
  return text
    .replace(/[^\w\s.,!?;:()àâéèêëîïôûùçÀÂÉÈÊËÎÏÔÛÙÇ-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
