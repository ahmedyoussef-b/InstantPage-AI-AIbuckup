// src/ai/providers/deepseek.ts - Version avec RAG ChromaDB
import { ChromaClient } from 'chromadb';

const chromaClient = new ChromaClient({ path: process.env.CHROMADB_URL || "http://localhost:8000" });

async function searchDocuments(query: string): Promise<string> {
  try {
    console.log(`[RAG] Recherche de documents pour: "${query}"`);
    
    const collection = await chromaClient.getCollection({ name: "DOCUMENTS_TECHNIQUES" });
    
    const results = await collection.query({
      queryTexts: [query],
      nResults: 5
    });
    
    if (results.documents && results.documents[0] && results.documents[0].length > 0) {
      const context = results.documents[0].join('\n\n');
      console.log(`[RAG] ${results.documents[0].length} documents trouvés`);
      return context;
    }
    
    console.log(`[RAG] Aucun document trouvé`);
    return "";
    
  } catch (error: any) {
    console.error('[RAG] Erreur:', error.message);
    return "";
  }
}

export async function callDeepSeek(prompt: string, options?: {
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  console.log(`[FALLBACK] Traitement de: "${prompt.substring(0, 50)}..."`);
  
  // 1. Rechercher dans ChromaDB
  const context = await searchDocuments(prompt);
  
  // 2. Analyser la question
  const lowerPrompt = prompt.toLowerCase();
  
  // 3. Utiliser le contexte si disponible
  if (context) {
    console.log(`[RAG] Utilisation du contexte pour répondre`);
    return `D'après les documents techniques:\n\n${context}\n\nCette information est extraite de la base de connaissances de la centrale.`;
  }
  
  // 4. Fallback des réponses prédéfinies
  if (lowerPrompt.includes("puissance") && (lowerPrompt.includes("turbine") || lowerPrompt.includes("ge") || lowerPrompt.includes("tg1"))) {
    return "La turbine à gaz GE Frame 9E (TG1) a une puissance nominale de 125 MW, avec une puissance maximale de 130 MW. Elle offre un rendement de 38,5% à pleine charge et fonctionne à 3000 tr/min.";
  }
  
  if (lowerPrompt.includes("température") && (lowerPrompt.includes("turbine") || lowerPrompt.includes("tg1"))) {
    return "La température d'admission de la turbine GE Frame 9E (TG1) est de 1100°C, avec une température de sortie des gaz d'environ 550°C.";
  }
  
  if (lowerPrompt.includes("rendement")) {
    return "Le rendement de la turbine GE Frame 9E (TG1) est de 38,5% en cycle simple. En cycle combiné, le rendement global peut atteindre 55-60%.";
  }
  
  if (lowerPrompt.includes("démarrage") || lowerPrompt.includes("procédure")) {
    return "Procédure de démarrage TG1: 1. Vérifier les circuits d'huile. 2. Démarrer le ventilateur de ventilation. 3. Purge de la chambre de combustion. 4. Mise en rotation par le starter. 5. Injection gaz et allumage. 6. Accélération à la vitesse nominale.";
  }
  
  if (lowerPrompt.includes("maintenance") || lowerPrompt.includes("préventive")) {
    return "Maintenance préventive TG1: Inspection visuelle quotidienne. Contrôle des filtres à air hebdomadaire. Analyse d'huile mensuelle. Inspection des injecteurs tous les 8000 heures.";
  }
  
  if (lowerPrompt.includes("alarme") || lowerPrompt.includes("température haute")) {
    return "Alarme Température Exhaust Haute: Si température des gaz > 600°C, déclenche alarme. Action recommandée: Vérifier les injecteurs, réduire la charge, contacter la maintenance.";
  }
  
  return "Je suis un assistant expert en centrales électriques. Je peux vous renseigner sur les turbines à gaz GE Frame 9E (TG1, TG2), la turbine à vapeur (TV), leurs caractéristiques techniques, leur maintenance, leurs procédures de démarrage, et leurs alarmes. N'hésitez pas à me poser des questions précises.";
}
